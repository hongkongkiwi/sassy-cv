import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to check workspace access
async function checkWorkspaceAccess(ctx: any, workspaceId: string, userId: string) {
  const collaboration = await ctx.db
    .query("collaborators")
    .withIndex("by_workspace_user", (q: any) => 
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .filter((q: any) => q.eq(q.field("status"), "accepted"))
    .first();
  
  return collaboration;
}

// Get all CV data for a workspace
export const getAllCVData = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    // If no workspaceId provided, get user's first workspace
    let workspaceId = args.workspaceId;
    if (!workspaceId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.tokenIdentifier) return null;
      
      const collaboration = await ctx.db
        .query("collaborators")
        .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
        .filter((q: any) => q.eq(q.field("status"), "accepted"))
        .first();
      
      if (!collaboration) return null;
      workspaceId = collaboration.workspaceId;
    }
    
    const [contactInfo, experiences, skills, projects, education] = await Promise.all([
      ctx.db.query("contactInfo").withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId)).first(),
      ctx.db.query("experiences").withIndex("by_workspace_active", (q) => q.eq("workspaceId", workspaceId).eq("isActive", true)).collect(),
      ctx.db.query("skills").withIndex("by_workspace_active", (q) => q.eq("workspaceId", workspaceId).eq("isActive", true)).collect(),
      ctx.db.query("projects").withIndex("by_workspace_active", (q) => q.eq("workspaceId", workspaceId).eq("isActive", true)).collect(),
      ctx.db.query("education").withIndex("by_workspace_active", (q) => q.eq("workspaceId", workspaceId).eq("isActive", true)).collect(),
    ]);

    return {
      contactInfo,
      experiences: experiences.sort((a, b) => a.order - b.order),
      skills: skills.sort((a, b) => a.order - b.order),
      projects: projects.sort((a, b) => a.order - b.order),
      education: education.sort((a, b) => a.order - b.order),
    };
  },
});

// Contact Info
export const getContactInfo = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    let workspaceId = args.workspaceId;
    if (!workspaceId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.tokenIdentifier) return null;
      
      const collaboration = await ctx.db
        .query("collaborators")
        .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
        .filter((q: any) => q.eq(q.field("status"), "accepted"))
        .first();
      
      if (!collaboration) return null;
      workspaceId = collaboration.workspaceId;
    }
    
    return await ctx.db
      .query("contactInfo")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .first();
  },
});

export const upsertContactInfo = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    title: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    website: v.optional(v.string()),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const collaboration = await checkWorkspaceAccess(ctx, args.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }
    
    const existing = await ctx.db
      .query("contactInfo")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    const contactData = {
      workspaceId: args.workspaceId,
      name: args.name,
      title: args.title,
      email: args.email,
      phone: args.phone,
      location: args.location,
      linkedin: args.linkedin,
      github: args.github,
      website: args.website,
      summary: args.summary,
      createdBy: identity.subject,
      updatedAt: now,
    };

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...contactData,
        version: existing.version + 1,
      });
    } else {
      return await ctx.db.insert("contactInfo", {
        ...contactData,
        version: 1,
        createdAt: now,
      });
    }
  },
});

// Experiences
export const getExperiences = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("experiences")
      .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
      .collect();
  },
});

export const createExperience = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    company: v.string(),
    position: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    location: v.string(),
    description: v.array(v.string()),
    technologies: v.optional(v.array(v.string())),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const collaboration = await checkWorkspaceAccess(ctx, args.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    return await ctx.db.insert("experiences", {
      workspaceId: args.workspaceId,
      company: args.company,
      position: args.position,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      description: args.description,
      technologies: args.technologies,
      order: args.order,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("experiences"),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.array(v.string())),
    technologies: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Experience not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.company !== undefined) updates.company = args.company;
    if (args.position !== undefined) updates.position = args.position;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.location !== undefined) updates.location = args.location;
    if (args.description !== undefined) updates.description = args.description;
    if (args.technologies !== undefined) updates.technologies = args.technologies;
    if (args.order !== undefined) updates.order = args.order;

    return await ctx.db.patch(args.id, updates);
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("experiences") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Experience not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.patch(args.id, { 
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Skills
export const getSkills = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
      .collect();
  },
});

export const createSkill = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const collaboration = await checkWorkspaceAccess(ctx, args.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    return await ctx.db.insert("skills", {
      workspaceId: args.workspaceId,
      category: args.category,
      items: args.items,
      order: args.order,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

export const updateSkill = mutation({
  args: {
    id: v.id("skills"),
    category: v.optional(v.string()),
    items: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Skill not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.category !== undefined) updates.category = args.category;
    if (args.items !== undefined) updates.items = args.items;
    if (args.order !== undefined) updates.order = args.order;

    return await ctx.db.patch(args.id, updates);
  },
});

export const deleteSkill = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Skill not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.patch(args.id, { 
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Projects
export const getProjects = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
      .collect();
  },
});

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const collaboration = await checkWorkspaceAccess(ctx, args.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    return await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      technologies: args.technologies,
      url: args.url,
      github: args.github,
      order: args.order,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    technologies: v.optional(v.array(v.string())),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.technologies !== undefined) updates.technologies = args.technologies;
    if (args.url !== undefined) updates.url = args.url;
    if (args.github !== undefined) updates.github = args.github;
    if (args.order !== undefined) updates.order = args.order;

    return await ctx.db.patch(args.id, updates);
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.patch(args.id, { 
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Education
export const getEducation = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("education")
      .withIndex("by_workspace_active", (q: any) => q.eq("workspaceId", args.workspaceId).eq("isActive", true))
      .collect();
  },
});

export const createEducation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    location: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const collaboration = await checkWorkspaceAccess(ctx, args.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    return await ctx.db.insert("education", {
      workspaceId: args.workspaceId,
      institution: args.institution,
      degree: args.degree,
      field: args.field,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      description: args.description,
      order: args.order,
      version: 1,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("education"),
    institution: v.optional(v.string()),
    degree: v.optional(v.string()),
    field: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Education not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    const updates: any = {
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    if (args.institution !== undefined) updates.institution = args.institution;
    if (args.degree !== undefined) updates.degree = args.degree;
    if (args.field !== undefined) updates.field = args.field;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.location !== undefined) updates.location = args.location;
    if (args.description !== undefined) updates.description = args.description;
    if (args.order !== undefined) updates.order = args.order;

    return await ctx.db.patch(args.id, updates);
  },
});

export const deleteEducation = mutation({
  args: { id: v.id("education") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Education not found");
    
    const collaboration = await checkWorkspaceAccess(ctx, existing.workspaceId, identity.subject);
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.patch(args.id, { 
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});