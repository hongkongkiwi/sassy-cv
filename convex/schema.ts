import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    userId: v.string(), // Clerk user ID
  }),

  experiences: defineTable({
    company: v.string(),
    position: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    location: v.string(),
    description: v.array(v.string()),
    technologies: v.optional(v.array(v.string())),
    order: v.number(),
    userId: v.string(), // Clerk user ID
  }),

  education: defineTable({
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    location: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    userId: v.string(), // Clerk user ID
  }),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    url: v.optional(v.string()),
    github: v.optional(v.string()),
    order: v.number(),
    userId: v.string(), // Clerk user ID
  }),

  skills: defineTable({
    category: v.string(),
    items: v.array(v.string()),
    order: v.number(),
    userId: v.string(), // Clerk user ID
  }),

  analytics: defineTable({
    userId: v.string(), // CV owner's Clerk user ID
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
  }).index("by_user", ["userId"]).index("by_user_and_event", ["userId", "event"]),

  themes: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
      text: v.string(),
    }),
    fonts: v.object({
      heading: v.string(),
      body: v.string(),
    }),
    layout: v.string(), // "modern", "classic", "minimal", "creative"
    isActive: v.boolean(),
  }),

  userSettings: defineTable({
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
  }).index("by_user", ["userId"]),

  coverLetters: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  linkedinImports: defineTable({
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
    importedAt: v.number(),
    status: v.string(), // "success", "partial", "failed"
  }).index("by_user", ["userId"]),
});