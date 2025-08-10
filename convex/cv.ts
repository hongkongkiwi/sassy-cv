import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Contact Info queries and mutations
export const getContactInfo = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    return await ctx.db
      .query("contactInfo")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

export const upsertContactInfo = mutation({
  args: {
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
    const userId = identity.subject;
    const existing = await ctx.db
      .query("contactInfo")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        name: args.name,
        title: args.title,
        email: args.email,
        phone: args.phone,
        location: args.location,
        linkedin: args.linkedin,
        github: args.github,
        website: args.website,
        summary: args.summary,
      });
    } else {
      return await ctx.db.insert("contactInfo", { ...args, userId });
    }
  },
});

// Experience queries and mutations
export const getExperiences = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    return await ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const addExperience = mutation({
  args: {
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
    return await ctx.db.insert("experiences", { ...args, userId: identity.subject });
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("experiences"),
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
    const { id, ...updates } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    // Optional: verify ownership before patching
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.patch(id, updates);
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("experiences") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.delete(args.id);
  },
});

// Skills queries and mutations
export const getSkills = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    return await ctx.db
      .query("skills")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("asc")
      .collect();
  },
});

export const addSkill = mutation({
  args: {
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    return await ctx.db.insert("skills", { ...args, userId: identity.subject });
  },
});

export const updateSkill = mutation({
  args: {
    id: v.id("skills"),
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.patch(id, updates);
  },
});

export const deleteSkill = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.delete(args.id);
  },
});

// Projects queries and mutations
export const getProjects = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("asc")
      .collect();
  },
});

export const addProject = mutation({
  args: {
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
    return await ctx.db.insert("projects", { ...args, userId: identity.subject });
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.patch(id, updates);
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.delete(args.id);
  },
});

// Education queries and mutations
export const getEducation = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    return await ctx.db
      .query("education")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const addEducation = mutation({
  args: {
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
    return await ctx.db.insert("education", { ...args, userId: identity.subject });
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("education"),
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
    const { id, ...updates } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.patch(id, updates);
  },
});

export const deleteEducation = mutation({
  args: { id: v.id("education") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Forbidden");
    return await ctx.db.delete(args.id);
  },
});

// Get all CV data for a user
export const getAllCVData = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      return { contactInfo: null, experiences: [], skills: [], projects: [], education: [] };
    }
    const userId = identity.subject;
    const [contactInfo, experiences, skills, projects, education] = await Promise.all([
      ctx.db.query("contactInfo").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").collect(),
      ctx.db.query("skills").withIndex("by_user", (q) => q.eq("userId", userId)).order("asc").collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).order("asc").collect(),
      ctx.db.query("education").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").collect(),
    ]);

    return {
      contactInfo,
      experiences,
      skills,
      projects,
      education,
    };
  },
});