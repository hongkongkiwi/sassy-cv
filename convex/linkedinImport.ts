import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get LinkedIn import history for a workspace
export const getImportHistory = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q: any) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q: any) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return await ctx.db
      .query("linkedinImports")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(10);
  },
});

// Get the latest LinkedIn import for a workspace
export const getLatestImport = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q: any) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q: any) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    const imports = await ctx.db
      .query("linkedinImports")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(1);
    
    return imports[0] || null;
  },
});

// Store LinkedIn import data
export const storeImportData = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    profileData: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      headline: v.optional(v.string()),
      summary: v.optional(v.string()),
      location: v.optional(v.string()),
      industry: v.optional(v.string()),
      profileUrl: v.optional(v.string()),
    }),
    experiences: v.optional(v.array(v.object({
      title: v.string(),
      companyName: v.string(),
      companyUrl: v.optional(v.string()),
      startDate: v.object({
        month: v.optional(v.number()),
        year: v.number(),
      }),
      endDate: v.optional(v.object({
        month: v.optional(v.number()),
        year: v.number(),
      })),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
    }))),
    education: v.optional(v.array(v.object({
      schoolName: v.string(),
      degreeName: v.optional(v.string()),
      fieldOfStudy: v.optional(v.string()),
      startDate: v.optional(v.object({
        year: v.number(),
      })),
      endDate: v.optional(v.object({
        year: v.number(),
      })),
      description: v.optional(v.string()),
    }))),
    skills: v.optional(v.array(v.string())),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q: any) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q: any) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    return await ctx.db.insert("linkedinImports", {
      workspaceId: args.workspaceId,
      profileData: args.profileData,
      experiences: args.experiences,
      education: args.education,
      skills: args.skills,
      importedBy: identity.subject,
      importedAt: Date.now(),
      status: args.status,
    });
  },
});

// Apply LinkedIn import to CV data
export const applyImportToCV = mutation({
  args: { 
    workspaceId: v.id("workspaces"),
    importId: v.id("linkedinImports"),
    sections: v.object({
      contact: v.boolean(),
      experience: v.boolean(),
      education: v.boolean(),
      skills: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q: any) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q: any) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    // Get the import data
    const importData = await ctx.db.get(args.importId);
    if (!importData || importData.workspaceId !== args.workspaceId) {
      throw new Error("Import not found or unauthorized");
    }

    const results = {
      contact: false,
      experience: false,
      education: false,
      skills: false,
    };

    // Apply contact information
    if (args.sections.contact && importData.profileData) {
      const existing = await ctx.db
        .query("contactInfo")
        .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
        .first();

      const { firstName, lastName, headline, summary, location } = importData.profileData;
      const name = [firstName, lastName].filter(Boolean).join(" ");

      const now = Date.now();
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...(name && { name }),
          ...(headline && { title: headline }),
          ...(summary && { summary }),
          ...(location && { location }),
          version: existing.version + 1,
          updatedAt: now,
        });
      } else if (name || headline || summary || location) {
        await ctx.db.insert("contactInfo", {
          workspaceId: args.workspaceId,
          name: name || "Your Name",
          title: headline || "Your Title",
          email: "your@email.com",
          location: location || "Your Location",
          summary: summary || "Your professional summary",
          version: 1,
          createdBy: identity.subject,
          createdAt: now,
          updatedAt: now,
        });
      }
      results.contact = true;
    }

    // Apply experience data
    if (args.sections.experience && importData.experiences) {
      // Get existing experiences to determine the next order
      const existingExperiences = await ctx.db
        .query("experiences")
        .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
        .collect();
      
      const maxOrder = existingExperiences.length > 0 
        ? Math.max(...existingExperiences.map(e => e.order)) 
        : -1;

      const now = Date.now();
      for (let i = 0; i < importData.experiences.length; i++) {
        const exp = importData.experiences[i]!;
        const formatDate = (dateObj: any) => {
          if (!dateObj) return undefined;
          const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01';
          return `${dateObj.year}-${month}`;
        };

        await ctx.db.insert("experiences", {
          workspaceId: args.workspaceId,
          company: exp.companyName,
          position: exp.title,
          startDate: formatDate(exp.startDate) || "",
          endDate: exp.endDate ? formatDate(exp.endDate) : undefined,
          location: exp.location || "",
          description: exp.description ? [exp.description] : [""],
          order: maxOrder + i + 1,
          version: 1,
          createdBy: identity.subject,
          createdAt: now,
          updatedAt: now,
          isActive: true,
        });
      }
      results.experience = true;
    }

    // Apply education data
    if (args.sections.education && importData.education) {
      const existingEducation = await ctx.db
        .query("education")
        .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
        .collect();
      
      const maxOrder = existingEducation.length > 0 
        ? Math.max(...existingEducation.map(e => e.order)) 
        : -1;

      const now = Date.now();
      for (let i = 0; i < importData.education.length; i++) {
        const edu = importData.education[i]!;
        const formatYear = (dateObj: any) => dateObj ? String(dateObj.year) : "";

        await ctx.db.insert("education", {
          workspaceId: args.workspaceId,
          institution: edu.schoolName,
          degree: edu.degreeName || "Degree",
          field: edu.fieldOfStudy,
          startDate: formatYear(edu.startDate),
          endDate: formatYear(edu.endDate),
          location: "",
          description: edu.description,
          order: maxOrder + i + 1,
          version: 1,
          createdBy: identity.subject,
          createdAt: now,
          updatedAt: now,
          isActive: true,
        });
      }
      results.education = true;
    }

    // Apply skills data
    if (args.sections.skills && importData.skills && importData.skills.length > 0) {
      const existingSkills = await ctx.db
        .query("skills")
        .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
        .collect();
      
      const maxOrder = existingSkills.length > 0 
        ? Math.max(...existingSkills.map(s => s.order)) 
        : -1;

      const now = Date.now();
      await ctx.db.insert("skills", {
        workspaceId: args.workspaceId,
        category: "LinkedIn Skills",
        items: importData.skills,
        order: maxOrder + 1,
        version: 1,
        createdBy: identity.subject,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });
      results.skills = true;
    }

    return results;
  },
});