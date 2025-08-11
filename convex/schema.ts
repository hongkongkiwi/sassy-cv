import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Workspaces represent the top-level CV ownership
  workspaces: defineTable({
    name: v.string(), // Display name for the CV/workspace
    description: v.optional(v.string()),
    ownerId: v.string(), // Clerk user ID of the owner
    slug: v.string(), // URL-friendly identifier
    privacy: v.object({
      level: v.string(), // "public", "secret_link", "password", "private"
      secretToken: v.optional(v.string()), // For secret link access
      password: v.optional(v.string()), // Hashed password for password protection
      allowSearchEngines: v.boolean(), // SEO settings
    }),
    settings: v.object({
      allowCollaboratorSuggestions: v.boolean(),
      requireApprovalForChanges: v.boolean(),
      notificationsEnabled: v.boolean(),
      customDomain: v.optional(v.string()), // Custom domain mapping
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_secret_token", ["privacy.secretToken"]),

  // Collaborators and their permissions
  collaborators: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(), // Clerk user ID
    role: v.string(), // "owner", "collaborator", "viewer"
    permissions: v.object({
      canEdit: v.boolean(),
      canSuggestChanges: v.boolean(),
      canViewAnalytics: v.boolean(),
      canInviteOthers: v.boolean(),
      canManageSettings: v.boolean(),
    }),
    invitedBy: v.string(), // User ID who invited this collaborator
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    status: v.string(), // "pending", "accepted", "declined", "revoked"
    inviteEmail: v.optional(v.string()), // Email address for pending invites
  }).index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_invite_email", ["inviteEmail"]),

  // Version control for all CV data
  versions: defineTable({
    workspaceId: v.id("workspaces"),
    versionNumber: v.number(),
    entityType: v.string(), // "contactInfo", "experience", "skill", "project", "education"
    entityId: v.optional(v.string()), // For tracking specific items
    changeType: v.string(), // "create", "update", "delete"
    previousData: v.optional(v.any()), // Previous state
    currentData: v.optional(v.any()), // New state
    createdBy: v.string(), // User who made the change
    createdAt: v.number(),
    isApproved: v.boolean(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    commitMessage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Version tags like "major", "minor", "draft"
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_version", ["workspaceId", "versionNumber"])
    .index("by_entity", ["workspaceId", "entityType", "entityId"])
    .index("by_created_by", ["createdBy"]),

  // Change requests for collaborative editing
  changeRequests: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    entityType: v.string(), // "contactInfo", "experience", "skill", "project", "education"
    entityId: v.optional(v.string()),
    changeType: v.string(), // "create", "update", "delete"
    proposedData: v.any(), // Proposed changes
    currentData: v.optional(v.any()), // Current data for context
    requestedBy: v.string(), // User who requested the change
    requestedAt: v.number(),
    status: v.string(), // "pending", "approved", "rejected", "merged"
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewComments: v.optional(v.string()),
    mergedVersionId: v.optional(v.id("versions")), // Link to the version created when merged
  }).index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"])
    .index("by_requested_by", ["requestedBy"]),

  contactInfo: defineTable({
    name: v.string(),
    title: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    website: v.optional(v.string()),
    summary: v.string(),
    workspaceId: v.id("workspaces"), // Changed from userId to workspaceId
    version: v.number(), // Version number for tracking changes
    createdBy: v.string(), // User who created this version
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  experiences: defineTable({
    company: v.string(),
    position: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    location: v.string(),
    description: v.array(v.string()),
    technologies: v.optional(v.array(v.string())),
    order: v.number(),
    workspaceId: v.id("workspaces"),
    version: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(), // For soft deletes
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "isActive"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  education: defineTable({
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    location: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    workspaceId: v.id("workspaces"),
    version: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "isActive"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.number(),
    workspaceId: v.id("workspaces"),
    version: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "isActive"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  skills: defineTable({
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
    workspaceId: v.id("workspaces"),
    version: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "isActive"])
    .index("by_workspace_version", ["workspaceId", "version"]),

  analytics: defineTable({
    workspaceId: v.id("workspaces"), // Changed from userId to workspaceId
    event: v.string(), // "view", "download", "share", etc.
    timestamp: v.number(),
    visitorId: v.optional(v.string()), // Anonymous visitor ID
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    referrer: v.optional(v.string()),
    deviceType: v.optional(v.string()), // "desktop", "mobile", "tablet"
    sessionDuration: v.optional(v.number()),
    metadata: v.optional(v.object({})), // Additional data
    collaboratorId: v.optional(v.string()), // Track which collaborator performed the action
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_and_event", ["workspaceId", "event"])
    .index("by_collaborator", ["collaboratorId"]),

  themes: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    category: v.string(), // "professional", "creative", "academic", "technical"
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
      surface: v.string(),
      text: v.object({
        primary: v.string(),
        secondary: v.string(),
        muted: v.string(),
      }),
      border: v.string(),
    }),
    typography: v.object({
      headings: v.object({
        family: v.string(),
        weights: v.array(v.number()),
      }),
      body: v.object({
        family: v.string(),
        weights: v.array(v.number()),
      }),
      sizes: v.object({
        xs: v.string(),
        sm: v.string(),
        base: v.string(),
        lg: v.string(),
        xl: v.string(),
        "2xl": v.string(),
        "3xl": v.string(),
      }),
    }),
    layout: v.object({
      type: v.string(), // "single-column", "two-column", "sidebar", "modern"
      spacing: v.object({
        section: v.string(),
        element: v.string(),
        container: v.string(),
      }),
      borderRadius: v.string(),
      shadows: v.boolean(),
    }),
    customCSS: v.optional(v.string()),
    isBuiltIn: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    previewImage: v.optional(v.string()),
  }).index("by_category", ["category"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"]),

  // CV Templates
  templates: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    category: v.string(), // "tech", "finance", "healthcare", "creative", "academic", "executive"
    industry: v.array(v.string()), // Target industries
    experience: v.string(), // "entry", "mid", "senior", "executive"
    sections: v.array(v.object({
      type: v.string(), // "contact", "summary", "experience", "skills", etc.
      order: v.number(),
      required: v.boolean(),
      defaultContent: v.optional(v.any()),
    })),
    sampleData: v.object({
      contact: v.any(),
      summary: v.string(),
      sections: v.array(v.any()),
    }),
    themeId: v.optional(v.id("themes")),
    tags: v.array(v.string()),
    difficulty: v.string(), // "beginner", "intermediate", "advanced"
    estimatedTime: v.number(), // minutes to complete
    isBuiltIn: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    previewImage: v.optional(v.string()),
    usageCount: v.number(),
  }).index("by_category", ["category"])
    .index("by_industry", ["industry"])
    .index("by_experience", ["experience"])
    .index("by_created_by", ["createdBy"])
    .index("by_usage", ["usageCount"]),

  userSettings: defineTable({
    workspaceId: v.id("workspaces"),
    selectedTheme: v.optional(v.id("themes")),
    selectedTemplate: v.optional(v.id("templates")),
    customizations: v.optional(v.object({
      colors: v.optional(v.any()),
      fonts: v.optional(v.any()),
      layout: v.optional(v.any()),
    })),
    analyticsEnabled: v.optional(v.boolean()),
    publicViewEnabled: v.optional(v.boolean()),
    customDomain: v.optional(v.string()),
    seoSettings: v.optional(v.object({
      title: v.string(),
      description: v.string(),
      keywords: v.array(v.string()),
    })),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_theme", ["selectedTheme"]),

  coverLetters: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
    version: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
  }).index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "isActive"]),

  linkedinImports: defineTable({
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
    importedBy: v.string(), // User who performed the import
    importedAt: v.number(),
    status: v.string(), // "success", "partial", "failed"
  }).index("by_workspace", ["workspaceId"])
    .index("by_imported_by", ["importedBy"]),

  // Rate limiting storage
  rateLimits: defineTable({
    identifier: v.string(), // IP address, user ID, or other identifier
    endpoint: v.string(), // API endpoint being rate limited
    requestCount: v.number(),
    windowStart: v.number(), // Start time of the current window (timestamp)
    windowEnd: v.number(), // End time of the current window (timestamp)
    lastRequest: v.number(), // Timestamp of last request
  }).index("by_identifier_endpoint", ["identifier", "endpoint"])
    .index("by_window_end", ["windowEnd"]), // For cleanup
});