import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get LinkedIn import history for a user
export const getImportHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("linkedinImports")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
  },
});

// Get the latest LinkedIn import for a user
export const getLatestImport = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    const imports = await ctx.db
      .query("linkedinImports")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    
    return imports[0] || null;
  },
});

// Store LinkedIn import data
export const storeImportData = mutation({
  args: {
    userId: v.string(),
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
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.insert("linkedinImports", {
      userId: args.userId,
      profileData: args.profileData,
      experiences: args.experiences,
      education: args.education,
      skills: args.skills,
      importedAt: Date.now(),
      status: args.status,
    });
  },
});

// Apply LinkedIn import to CV data
export const applyImportToCV = mutation({
  args: { 
    userId: v.string(),
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
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    // Get the import data
    const importData = await ctx.db.get(args.importId);
    if (!importData || importData.userId !== args.userId) {
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
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      const { firstName, lastName, headline, summary, location } = importData.profileData;
      const name = [firstName, lastName].filter(Boolean).join(" ");

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...(name && { name }),
          ...(headline && { title: headline }),
          ...(summary && { summary }),
          ...(location && { location }),
        });
      } else if (name || headline || summary || location) {
        await ctx.db.insert("contactInfo", {
          userId: args.userId,
          name: name || "Your Name",
          title: headline || "Your Title",
          email: "your@email.com",
          location: location || "Your Location",
          summary: summary || "Your professional summary",
        });
      }
      results.contact = true;
    }

    // Apply experience data
    if (args.sections.experience && importData.experiences) {
      // Get existing experiences to determine the next order
      const existingExperiences = await ctx.db
        .query("experiences")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      const maxOrder = existingExperiences.length > 0 
        ? Math.max(...existingExperiences.map(e => e.order)) 
        : -1;

      for (let i = 0; i < importData.experiences.length; i++) {
        const exp = importData.experiences[i]!;
        const formatDate = (dateObj: any) => {
          if (!dateObj) return undefined;
          const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01';
          return `${dateObj.year}-${month}`;
        };

        await ctx.db.insert("experiences", {
          userId: args.userId,
          company: exp.companyName,
          position: exp.title,
          startDate: formatDate(exp.startDate) || "",
          endDate: exp.endDate ? formatDate(exp.endDate) : undefined,
          location: exp.location || "",
          description: exp.description ? [exp.description] : [""],
          order: maxOrder + i + 1,
        });
      }
      results.experience = true;
    }

    // Apply education data
    if (args.sections.education && importData.education) {
      const existingEducation = await ctx.db
        .query("education")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      const maxOrder = existingEducation.length > 0 
        ? Math.max(...existingEducation.map(e => e.order)) 
        : -1;

      for (let i = 0; i < importData.education.length; i++) {
        const edu = importData.education[i]!;
        const formatYear = (dateObj: any) => dateObj ? String(dateObj.year) : "";

        await ctx.db.insert("education", {
          userId: args.userId,
          institution: edu.schoolName,
          degree: edu.degreeName || "Degree",
          field: edu.fieldOfStudy,
          startDate: formatYear(edu.startDate),
          endDate: formatYear(edu.endDate),
          location: "",
          description: edu.description,
          order: maxOrder + i + 1,
        });
      }
      results.education = true;
    }

    // Apply skills data
    if (args.sections.skills && importData.skills && importData.skills.length > 0) {
      const existingSkills = await ctx.db
        .query("skills")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      const maxOrder = existingSkills.length > 0 
        ? Math.max(...existingSkills.map(s => s.order)) 
        : -1;

      await ctx.db.insert("skills", {
        userId: args.userId,
        category: "LinkedIn Skills",
        items: importData.skills,
        order: maxOrder + 1,
      });
      results.skills = true;
    }

    return results;
  },
});