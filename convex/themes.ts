import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all active themes
export const getThemes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("themes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get user settings
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update user settings
export const updateUserSettings = mutation({
  args: {
    userId: v.string(),
    selectedTheme: v.optional(v.string()),
    analyticsEnabled: v.optional(v.boolean()),
    publicViewEnabled: v.optional(v.boolean()),
    customDomain: v.optional(v.string()),
    seoSettings: v.optional(v.object({
      title: v.string(),
      description: v.string(),
      keywords: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, args);
    } else {
      return await ctx.db.insert("userSettings", args);
    }
  },
});

// Seed default themes (run this once to populate themes)
export const seedDefaultThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const themes = [
      {
        name: "modern",
        displayName: "Modern Professional",
        description: "Clean, contemporary design with blue accents",
        colors: {
          primary: "#2563eb",
          secondary: "#7c3aed", 
          accent: "#06b6d4",
          background: "#ffffff",
          text: "#1f2937",
        },
        fonts: {
          heading: "Inter",
          body: "Inter",
        },
        layout: "modern",
        isActive: true,
      },
      {
        name: "classic",
        displayName: "Classic Executive",
        description: "Traditional, formal design with elegant typography",
        colors: {
          primary: "#1f2937",
          secondary: "#4b5563",
          accent: "#059669",
          background: "#ffffff",
          text: "#111827",
        },
        fonts: {
          heading: "Georgia",
          body: "Georgia",
        },
        layout: "classic",
        isActive: true,
      },
      {
        name: "minimal",
        displayName: "Minimal Clean",
        description: "Simple, distraction-free design focusing on content",
        colors: {
          primary: "#374151",
          secondary: "#6b7280",
          accent: "#f59e0b",
          background: "#ffffff",
          text: "#1f2937",
        },
        fonts: {
          heading: "system-ui",
          body: "system-ui",
        },
        layout: "minimal",
        isActive: true,
      },
      {
        name: "creative",
        displayName: "Creative Bold",
        description: "Vibrant, modern design for creative professionals",
        colors: {
          primary: "#7c3aed",
          secondary: "#ec4899",
          accent: "#06b6d4",
          background: "#ffffff",
          text: "#1f2937",
        },
        fonts: {
          heading: "Inter",
          body: "Inter",
        },
        layout: "creative",
        isActive: true,
      },
    ];

    // Check if themes already exist
    const existingThemes = await ctx.db.query("themes").collect();
    if (existingThemes.length > 0) {
      return { message: "Themes already exist" };
    }

    // Insert themes
    const results = [];
    for (const theme of themes) {
      const result = await ctx.db.insert("themes", theme);
      results.push(result);
    }

    return { message: "Default themes created", count: results.length };
  },
});