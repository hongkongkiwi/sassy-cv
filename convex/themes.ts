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
      .query("userSettings")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .first();
  },
});

// Update user settings
export const updateUserSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    selectedTheme: v.optional(v.id("themes")),
    selectedTemplate: v.optional(v.id("templates")),
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
    
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    const updates = {
      ...args,
      updatedBy: identity.subject,
      updatedAt: now,
    };

    if (existing) {
      return await ctx.db.patch(existing._id, updates);
    } else {
      return await ctx.db.insert("userSettings", updates);
    }
  },
});

// Seed default themes (run this once to populate themes)
export const seedDefaultThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const themes = [
      {
        name: "modern",
        displayName: "Modern Professional",
        description: "Clean, contemporary design with blue accents",
        category: "professional",
        colors: {
          primary: "#2563eb",
          secondary: "#7c3aed", 
          accent: "#06b6d4",
          background: "#ffffff",
          surface: "#f8fafc",
          text: {
            primary: "#1f2937",
            secondary: "#4b5563",
            muted: "#9ca3af",
          },
          border: "#e5e7eb",
        },
        typography: {
          headings: {
            family: "Inter",
            weights: [400, 500, 600, 700],
          },
          body: {
            family: "Inter",
            weights: [400, 500],
          },
          sizes: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
        },
        layout: {
          type: "modern",
          spacing: {
            section: "2rem",
            element: "1rem",
            container: "1.5rem",
          },
          borderRadius: "0.5rem",
          shadows: true,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "classic",
        displayName: "Classic Executive",
        description: "Traditional, formal design with elegant typography",
        category: "professional",
        colors: {
          primary: "#1f2937",
          secondary: "#4b5563",
          accent: "#059669",
          background: "#ffffff",
          surface: "#f9fafb",
          text: {
            primary: "#111827",
            secondary: "#374151",
            muted: "#6b7280",
          },
          border: "#d1d5db",
        },
        typography: {
          headings: {
            family: "Georgia",
            weights: [400, 700],
          },
          body: {
            family: "Georgia",
            weights: [400],
          },
          sizes: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
        },
        layout: {
          type: "single-column",
          spacing: {
            section: "1.5rem",
            element: "0.75rem",
            container: "1rem",
          },
          borderRadius: "0.25rem",
          shadows: false,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "minimal",
        displayName: "Minimal Clean",
        description: "Simple, distraction-free design focusing on content",
        category: "professional",
        colors: {
          primary: "#374151",
          secondary: "#6b7280",
          accent: "#f59e0b",
          background: "#ffffff",
          surface: "#ffffff",
          text: {
            primary: "#1f2937",
            secondary: "#374151",
            muted: "#9ca3af",
          },
          border: "#f3f4f6",
        },
        typography: {
          headings: {
            family: "system-ui",
            weights: [400, 600],
          },
          body: {
            family: "system-ui",
            weights: [400],
          },
          sizes: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
        },
        layout: {
          type: "single-column",
          spacing: {
            section: "1.25rem",
            element: "0.5rem",
            container: "1rem",
          },
          borderRadius: "0rem",
          shadows: false,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "creative",
        displayName: "Creative Bold",
        description: "Vibrant, modern design for creative professionals",
        category: "creative",
        colors: {
          primary: "#7c3aed",
          secondary: "#ec4899",
          accent: "#06b6d4",
          background: "#ffffff",
          surface: "#fef7ff",
          text: {
            primary: "#1f2937",
            secondary: "#4b5563",
            muted: "#8b5cf6",
          },
          border: "#e879f9",
        },
        typography: {
          headings: {
            family: "Inter",
            weights: [600, 700, 800],
          },
          body: {
            family: "Inter",
            weights: [400, 500],
          },
          sizes: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
        },
        layout: {
          type: "two-column",
          spacing: {
            section: "2.5rem",
            element: "1.25rem",
            container: "2rem",
          },
          borderRadius: "0.75rem",
          shadows: true,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
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