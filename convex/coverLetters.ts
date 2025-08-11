import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all cover letters for a workspace
export const getCoverLetters = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return await ctx.db
      .query("coverLetters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Get a single cover letter by ID
export const getCoverLetter = query({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    const letter = await ctx.db.get(args.id);
    if (!letter) {
      throw new Error("Cover letter not found");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", letter.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return letter;
  },
});

// Create a new cover letter
export const createCoverLetter = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access and edit permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    const now = Date.now();
    return await ctx.db.insert("coverLetters", {
      workspaceId: args.workspaceId,
      title: args.title,
      content: args.content,
      jobTitle: args.jobTitle,
      company: args.company,
      isTemplate: args.isTemplate || false,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

// Update an existing cover letter
export const updateCoverLetter = mutation({
  args: {
    id: v.id("coverLetters"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Cover letter not found");
    }
    
    // Check workspace access and edit permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", existing.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
    if (args.company !== undefined) updates.company = args.company;

    return await ctx.db.patch(args.id, updates);
  },
});

// Delete a cover letter (soft delete)
export const deleteCoverLetter = mutation({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Cover letter not found");
    }
    
    // Check workspace access and edit permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", existing.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    return await ctx.db.patch(args.id, { 
      isActive: false,
      updatedAt: Date.now()
    });
  },
});

// Duplicate a cover letter
export const duplicateCoverLetter = mutation({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new Error("Cover letter not found");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", original.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    return await ctx.db.insert("coverLetters", {
      workspaceId: original.workspaceId,
      title: `${original.title} (Copy)`,
      content: original.content,
      jobTitle: original.jobTitle,
      company: original.company,
      isTemplate: false,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

// Get cover letter templates
export const getTemplates = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return await ctx.db
      .query("coverLetters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.and(
        q.eq(q.field("isTemplate"), true),
        q.eq(q.field("isActive"), true)
      ))
      .order("desc")
      .collect();
  },
});

// Create default templates
export const createDefaultTemplates = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }
    
    // Check workspace access and edit permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    const now = Date.now();
    
    const templates = [
      {
        title: "Tech Position Template",
        content: `Dear Hiring Manager,

I am writing to express my strong interest in the [POSITION] role at [COMPANY]. With [X] years of experience in software engineering and a proven track record of delivering scalable solutions, I am excited about the opportunity to contribute to your team.

In my current role as [CURRENT_TITLE], I have successfully [SPECIFIC_ACHIEVEMENT]. My expertise in [RELEVANT_TECHNOLOGIES] and experience with [RELEVANT_EXPERIENCE] make me well-suited for this position. I am particularly drawn to [COMPANY] because of [REASON_FOR_INTEREST].

I am passionate about [RELEVANT_PASSION] and am always eager to learn new technologies and methodologies. I believe my combination of technical skills, leadership experience, and collaborative approach would make me a valuable addition to your team.

Thank you for considering my application. I would welcome the opportunity to discuss how my background and enthusiasm can contribute to [COMPANY]'s continued success.

Sincerely,
[YOUR_NAME]`,
      },
      {
        title: "Leadership Role Template",
        content: `Dear [HIRING_MANAGER],

I am excited to apply for the [POSITION] position at [COMPANY]. Throughout my [X]-year career in technology leadership, I have consistently delivered results by building high-performing teams and implementing strategic technical initiatives.

As [CURRENT_TITLE], I have [MAJOR_ACCOMPLISHMENT]. My experience includes [LEADERSHIP_EXPERIENCE] and I have a strong track record of [SPECIFIC_SKILLS]. I am particularly impressed by [COMPANY]'s [SPECIFIC_COMPANY_ATTRIBUTE] and would be thrilled to contribute to your continued growth.

My leadership philosophy centers on empowering teams, fostering innovation, and maintaining a focus on both technical excellence and business outcomes. I am confident that my experience in [RELEVANT_AREA] would bring immediate value to your organization.

I would appreciate the opportunity to discuss how my leadership experience and technical background align with your needs. Thank you for your consideration.

Best regards,
[YOUR_NAME]`,
      }
    ];

    const results = [];
    for (const template of templates) {
      const result = await ctx.db.insert("coverLetters", {
        workspaceId: args.workspaceId,
        title: template.title,
        content: template.content,
        isTemplate: true,
        version: 1,
        createdBy: identity.subject,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });
      results.push(result);
    }

    return results;
  },
});