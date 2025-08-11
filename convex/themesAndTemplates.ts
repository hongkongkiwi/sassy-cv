import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all available themes
export const getThemes = query({
  args: { 
    category: v.optional(v.string()),
    includeCustom: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let query = ctx.db.query("themes").withIndex("by_active", (q) => q.eq("isActive", true));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    let themes = await query.collect();
    
    // Filter custom themes if not requested
    if (!args.includeCustom) {
      themes = themes.filter(theme => theme.isBuiltIn);
    } else if (identity?.tokenIdentifier) {
      // Include user's custom themes
      const customThemes = await ctx.db
        .query("themes")
        .withIndex("by_created_by", (q) => q.eq("createdBy", identity.subject))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      themes = [...themes, ...customThemes];
    }
    
    return themes.sort((a, b) => {
      // Sort built-in themes first, then by name
      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  },
});

// Get all available templates
export const getTemplates = query({
  args: {
    category: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
    includeCustom: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let query = ctx.db.query("templates").filter((q) => q.eq(q.field("isActive"), true));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    if (args.experience) {
      query = query.filter((q) => q.eq(q.field("experience"), args.experience));
    }
    
    let templates = await query.collect();
    
    // Filter by industry if specified
    if (args.industry) {
      templates = templates.filter(template => 
        template.industry.some(ind => args.industry!.includes(ind))
      );
    }
    
    // Filter custom templates if not requested
    if (!args.includeCustom) {
      templates = templates.filter(template => template.isBuiltIn);
    } else if (identity?.tokenIdentifier) {
      // Include user's custom templates
      const customTemplates = await ctx.db
        .query("templates")
        .withIndex("by_created_by", (q) => q.eq("createdBy", identity.subject))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      templates = [...templates, ...customTemplates];
    }
    
    return templates.sort((a, b) => {
      // Sort by usage count (popular first), then by name
      if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
      return a.displayName.localeCompare(b.displayName);
    });
  },
});

// Get specific theme
export const getTheme = query({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.themeId);
  },
});

// Get specific template
export const getTemplate = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Apply theme to workspace
export const applyTheme = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    themeId: v.id("themes"),
    customizations: v.optional(v.object({
      colors: v.optional(v.any()),
      fonts: v.optional(v.any()),
      layout: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions to change theme");
    }
    
    // Verify theme exists
    const theme = await ctx.db.get(args.themeId);
    if (!theme || !theme.isActive) {
      throw new Error("Theme not found or inactive");
    }
    
    // Update or create user settings
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    
    const now = Date.now();
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        selectedTheme: args.themeId,
        customizations: args.customizations,
        updatedBy: userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userSettings", {
        workspaceId: args.workspaceId,
        selectedTheme: args.themeId,
        customizations: args.customizations,
        analyticsEnabled: true,
        publicViewEnabled: true,
        updatedBy: userId,
        updatedAt: now,
      });
    }
    
    return { success: true };
  },
});

// Apply template to workspace (creates CV structure)
export const applyTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    templateId: v.id("templates"),
    keepExistingData: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canEdit && collaboration?.role !== "owner") {
      throw new Error("Insufficient permissions to apply template");
    }
    
    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template || !template.isActive) {
      throw new Error("Template not found or inactive");
    }
    
    const now = Date.now();
    
    // If not keeping existing data, populate with sample data
    if (!args.keepExistingData) {
      // Create contact info if it doesn't exist
      const existingContact = await ctx.db
        .query("contactInfo")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .first();
      
      if (!existingContact && template.sampleData.contact) {
        await ctx.db.insert("contactInfo", {
          ...template.sampleData.contact,
          workspaceId: args.workspaceId,
          version: 1,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      // Populate other sections based on template
      // This would be expanded to handle all section types
    }
    
    // Apply template's theme if it has one
    if (template.themeId) {
      // Update user settings to use template's theme
      const existingSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .first();
      
      if (existingSettings) {
        await ctx.db.patch(existingSettings._id, {
          selectedTemplate: args.templateId,
          selectedTheme: template.themeId,
          updatedBy: userId,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("userSettings", {
          workspaceId: args.workspaceId,
          selectedTemplate: args.templateId,
          selectedTheme: template.themeId,
          analyticsEnabled: true,
          publicViewEnabled: true,
          updatedBy: userId,
          updatedAt: now,
        });
      }
    }
    
    // Increment template usage count
    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
      updatedAt: now,
    });
    
    return { success: true };
  },
});

// Create custom theme
export const createCustomTheme = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    category: v.string(),
    colors: v.any(),
    typography: v.any(),
    layout: v.any(),
    customCSS: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const now = Date.now();
    
    const themeId = await ctx.db.insert("themes", {
      ...args,
      isBuiltIn: false,
      isActive: true,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    
    return { themeId };
  },
});

// Get workspace theme and customizations
export const getWorkspaceTheme = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    
    const userId = identity.subject;
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) return null;
    
    // Get user settings
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    
    if (!settings?.selectedTheme) return null;
    
    // Get theme
    const theme = await ctx.db.get(settings.selectedTheme);
    
    return {
      theme,
      customizations: settings.customizations,
      template: settings.selectedTemplate ? await ctx.db.get(settings.selectedTemplate) : null,
    };
  },
});

// Initialize built-in themes (run once)
export const initializeBuiltInThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const builtInThemes = [
      {
        name: "modern-professional",
        displayName: "Modern Professional",
        description: "Clean, modern design perfect for tech and business professionals",
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
          headings: { family: "Inter", weights: [600, 700] },
          body: { family: "Inter", weights: [400, 500] },
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
          spacing: { section: "2rem", element: "1rem", container: "1.5rem" },
          borderRadius: "0.75rem",
          shadows: true,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "classic-executive",
        displayName: "Classic Executive",
        description: "Traditional and elegant design perfect for executive and corporate positions",
        category: "professional",
        colors: {
          primary: "#1f2937",
          secondary: "#4b5563",
          accent: "#dc2626",
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
          headings: { family: "Georgia", weights: [600, 700] },
          body: { family: "Times New Roman", weights: [400, 500] },
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
          spacing: { section: "1.5rem", element: "0.75rem", container: "1.25rem" },
          borderRadius: "0.5rem",
          shadows: false,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "minimal-clean",
        displayName: "Minimal Clean",
        description: "Clean, minimal design that focuses on content clarity",
        category: "professional",
        colors: {
          primary: "#000000",
          secondary: "#333333",
          accent: "#3b82f6",
          background: "#ffffff",
          surface: "#ffffff",
          text: {
            primary: "#000000",
            secondary: "#333333",
            muted: "#666666",
          },
          border: "#e5e5e5",
        },
        typography: {
          headings: { family: "Arial", weights: [600, 700] },
          body: { family: "Arial", weights: [400, 500] },
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
          spacing: { section: "2.5rem", element: "1.25rem", container: "2rem" },
          borderRadius: "0rem",
          shadows: false,
        },
        isBuiltIn: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "creative-vibrant",
        displayName: "Creative Vibrant",
        description: "Bold and creative design perfect for design and creative roles",
        category: "creative",
        colors: {
          primary: "#8b5cf6",
          secondary: "#06b6d4",
          accent: "#f59e0b",
          background: "#ffffff",
          surface: "#faf5ff",
          text: {
            primary: "#1f2937",
            secondary: "#4b5563",
            muted: "#9ca3af",
          },
          border: "#e0e7ff",
        },
        typography: {
          headings: { family: "Helvetica", weights: [600, 700] },
          body: { family: "Open Sans", weights: [400, 500] },
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
          type: "sidebar",
          spacing: { section: "2rem", element: "1rem", container: "1.5rem" },
          borderRadius: "1rem",
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
      return { message: "Themes already initialized" };
    }
    
    // Insert built-in themes
    for (const theme of builtInThemes) {
      await ctx.db.insert("themes", theme);
    }
    
    return { message: `Initialized ${builtInThemes.length} built-in themes` };
  },
});

// Initialize built-in templates (run once)
export const initializeBuiltInTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const builtInTemplates = [
      {
        name: "tech-professional",
        displayName: "Tech Professional",
        description: "Modern template designed for software engineers and tech professionals",
        category: "tech",
        industry: ["software", "tech", "engineering"],
        experience: "mid",
        sections: [
          { type: "contact", order: 1, required: true },
          { type: "summary", order: 2, required: true },
          { type: "experience", order: 3, required: true },
          { type: "skills", order: 4, required: true },
          { type: "projects", order: 5, required: false },
          { type: "education", order: 6, required: false },
        ],
        sampleData: {
          contact: {
            name: "Alex Johnson",
            title: "Senior Software Engineer",
            email: "alex.johnson@email.com",
            phone: "+1 (555) 123-4567",
            location: "San Francisco, CA",
            linkedin: "linkedin.com/in/alexjohnson",
            github: "github.com/alexjohnson",
            website: "alexjohnson.dev",
          },
          summary: "Experienced software engineer with 5+ years developing scalable web applications. Passionate about clean code, system architecture, and mentoring junior developers.",
          sections: [],
        },
        themeId: undefined, // Will be set to modern-professional theme ID after initialization
        tags: ["modern", "technical", "clean"],
        difficulty: "intermediate",
        estimatedTime: 45,
        isBuiltIn: true,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "executive-classic",
        displayName: "Executive Classic",
        description: "Traditional template for C-level executives and senior management roles",
        category: "executive",
        industry: ["finance", "consulting", "corporate"],
        experience: "executive",
        sections: [
          { type: "contact", order: 1, required: true },
          { type: "summary", order: 2, required: true },
          { type: "experience", order: 3, required: true },
          { type: "education", order: 4, required: true },
          { type: "skills", order: 5, required: false },
          { type: "projects", order: 6, required: false },
        ],
        sampleData: {
          contact: {
            name: "Victoria Sterling",
            title: "Chief Executive Officer",
            email: "v.sterling@company.com", 
            phone: "+1 (555) 987-6543",
            location: "New York, NY",
            linkedin: "linkedin.com/in/victoriaasterling",
            website: "victoriaasterling.com",
          },
          summary: "Results-driven executive with 15+ years of experience leading high-growth organizations. Proven track record of scaling companies from startup to IPO.",
          sections: [],
        },
        tags: ["executive", "traditional", "corporate"],
        difficulty: "advanced",
        estimatedTime: 60,
        isBuiltIn: true,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "creative-portfolio",
        displayName: "Creative Portfolio",
        description: "Vibrant template showcasing creative work for designers and artists",
        category: "creative",
        industry: ["design", "marketing", "media"],
        experience: "mid",
        sections: [
          { type: "contact", order: 1, required: true },
          { type: "summary", order: 2, required: true },
          { type: "projects", order: 3, required: true },
          { type: "experience", order: 4, required: true },
          { type: "skills", order: 5, required: true },
          { type: "education", order: 6, required: false },
        ],
        sampleData: {
          contact: {
            name: "Maya Chen",
            title: "UX/UI Designer",
            email: "maya.chen@design.com",
            phone: "+1 (555) 456-7890",
            location: "Los Angeles, CA",
            linkedin: "linkedin.com/in/mayachen",
            website: "mayachen.design",
          },
          summary: "Creative UX/UI designer with a passion for human-centered design. Specialized in creating intuitive digital experiences that delight users.",
          sections: [],
        },
        tags: ["creative", "portfolio", "visual"],
        difficulty: "intermediate",
        estimatedTime: 50,
        isBuiltIn: true,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "academic-researcher",
        displayName: "Academic Researcher",
        description: "Comprehensive template for academic positions and research roles",
        category: "academic",
        industry: ["education", "research", "healthcare"],
        experience: "senior",
        sections: [
          { type: "contact", order: 1, required: true },
          { type: "summary", order: 2, required: true },
          { type: "education", order: 3, required: true },
          { type: "experience", order: 4, required: true },
          { type: "projects", order: 5, required: false },
          { type: "skills", order: 6, required: false },
        ],
        sampleData: {
          contact: {
            name: "Dr. James Wilson",
            title: "Research Scientist",
            email: "j.wilson@university.edu",
            phone: "+1 (555) 234-5678",
            location: "Boston, MA",
            linkedin: "linkedin.com/in/drjameswilson",
          },
          summary: "Dedicated research scientist with expertise in machine learning and data analysis. Published 25+ papers in top-tier journals.",
          sections: [],
        },
        tags: ["academic", "research", "formal"],
        difficulty: "advanced",
        estimatedTime: 75,
        isBuiltIn: true,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];
    
    // Check if templates already exist
    const existingTemplates = await ctx.db.query("templates").collect();
    if (existingTemplates.length > 0) {
      return { message: "Templates already initialized" };
    }
    
    // Insert built-in templates
    for (const template of builtInTemplates) {
      await ctx.db.insert("templates", template);
    }
    
    return { message: `Initialized ${builtInTemplates.length} built-in templates` };
  },
});