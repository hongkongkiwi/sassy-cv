import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all cover letters for a user
export const getCoverLetters = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coverLetters")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single cover letter by ID
export const getCoverLetter = query({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new cover letter
export const createCoverLetter = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("coverLetters", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      jobTitle: args.jobTitle,
      company: args.company,
      isTemplate: args.isTemplate || false,
      createdAt: now,
      updatedAt: now,
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
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Cover letter not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
    if (args.company !== undefined) updates.company = args.company;

    return await ctx.db.patch(args.id, updates);
  },
});

// Delete a cover letter
export const deleteCoverLetter = mutation({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Cover letter not found");
    }

    return await ctx.db.delete(args.id);
  },
});

// Duplicate a cover letter
export const duplicateCoverLetter = mutation({
  args: { id: v.id("coverLetters") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new Error("Cover letter not found");
    }

    const now = Date.now();
    return await ctx.db.insert("coverLetters", {
      userId: original.userId,
      title: `${original.title} (Copy)`,
      content: original.content,
      jobTitle: original.jobTitle,
      company: original.company,
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get cover letter templates
export const getTemplates = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coverLetters")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isTemplate"), true))
      .order("desc")
      .collect();
  },
});

// Create default templates
export const createDefaultTemplates = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
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
        userId: args.userId,
        title: template.title,
        content: template.content,
        isTemplate: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push(result);
    }

    return results;
  },
});