import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Contact Info queries and mutations
export const getContactInfo = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactInfo")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

export const upsertContactInfo = mutation({
  args: {
    userId: v.string(),
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
    const existing = await ctx.db
      .query("contactInfo")
      .filter((q) => q.eq(q.field("userId"), args.userId))
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
      return await ctx.db.insert("contactInfo", args);
    }
  },
});

// Experience queries and mutations
export const getExperiences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("experiences")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

export const addExperience = mutation({
  args: {
    userId: v.string(),
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
    return await ctx.db.insert("experiences", args);
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
    return await ctx.db.patch(id, updates);
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("experiences") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Skills queries and mutations
export const getSkills = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("asc")
      .collect();
  },
});

export const addSkill = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("skills", args);
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
    return await ctx.db.patch(id, updates);
  },
});

export const deleteSkill = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Projects queries and mutations
export const getProjects = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("asc")
      .collect();
  },
});

export const addProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", args);
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
    return await ctx.db.patch(id, updates);
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Education queries and mutations
export const getEducation = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("education")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

export const addEducation = mutation({
  args: {
    userId: v.string(),
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
    return await ctx.db.insert("education", args);
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
    return await ctx.db.patch(id, updates);
  },
});

export const deleteEducation = mutation({
  args: { id: v.id("education") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Get all CV data for a user
export const getAllCVData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [contactInfo, experiences, skills, projects, education] = await Promise.all([
      ctx.db.query("contactInfo").filter((q) => q.eq(q.field("userId"), args.userId)).first(),
      ctx.db.query("experiences").filter((q) => q.eq(q.field("userId"), args.userId)).order("desc").collect(),
      ctx.db.query("skills").filter((q) => q.eq(q.field("userId"), args.userId)).order("asc").collect(),
      ctx.db.query("projects").filter((q) => q.eq(q.field("userId"), args.userId)).order("asc").collect(),
      ctx.db.query("education").filter((q) => q.eq(q.field("userId"), args.userId)).order("desc").collect(),
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