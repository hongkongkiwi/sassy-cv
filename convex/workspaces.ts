import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateSecretToken, hashPassword, verifyPassword } from "./privacy";

// Create a new workspace
export const createWorkspace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    privacyLevel: v.optional(v.string()),
    password: v.optional(v.string()),
    allowSearchEngines: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const now = Date.now();
    const privacyLevel = args.privacyLevel || 'public';
    
    // Validate privacy level
    if (!['public', 'secret_link', 'password', 'private'].includes(privacyLevel)) {
      throw new Error('Invalid privacy level');
    }
    
    // Check if slug is already taken
    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existingWorkspace) {
      throw new Error("Workspace slug already exists");
    }
    
    // Prepare privacy settings
    const privacy: any = {
      level: privacyLevel,
      allowSearchEngines: args.allowSearchEngines ?? (privacyLevel === 'public'),
    };
    
    if (privacyLevel === 'secret_link') {
      privacy.secretToken = generateSecretToken();
    }
    
    if (privacyLevel === 'password') {
      if (!args.password) {
        throw new Error('Password is required for password-protected privacy level');
      }
      privacy.password = hashPassword(args.password);
    }
    
    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      slug: args.slug,
      privacy,
      settings: {
        allowCollaboratorSuggestions: true,
        requireApprovalForChanges: true,
        notificationsEnabled: true,
      },
      createdAt: now,
      updatedAt: now,
    });
    
    // Add owner as collaborator with full permissions
    await ctx.db.insert("collaborators", {
      workspaceId,
      userId,
      role: "owner",
      permissions: {
        canEdit: true,
        canSuggestChanges: true,
        canViewAnalytics: true,
        canInviteOthers: true,
        canManageSettings: true,
      },
      invitedBy: userId,
      invitedAt: now,
      acceptedAt: now,
      status: "accepted",
    });
    
    return { 
      workspaceId, 
      slug: args.slug,
      secretToken: privacy.secretToken // Return secret token if generated
    };
  },
});

// Get user's workspaces (owned or collaborated)
export const getUserWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    
    const userId = identity.subject;
    
    // Get all collaborations for this user
    const collaborations = await ctx.db
      .query("collaborators")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    
    // Get workspace details
    const workspaces = await Promise.all(
      collaborations.map(async (collab) => {
        const workspace = await ctx.db.get(collab.workspaceId);
        return {
          ...workspace,
          role: collab.role,
          permissions: collab.permissions,
        };
      })
    );
    
    return workspaces.filter(Boolean);
  },
});

// Get workspace by slug (basic info only, access control handled separately)
export const getWorkspaceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!workspace) return null;
    
    const identity = await ctx.auth.getUserIdentity();
    let collaboration = null;
    
    // Get user's collaboration if authenticated
    if (identity?.tokenIdentifier) {
      collaboration = await ctx.db
        .query("collaborators")
        .withIndex("by_workspace_user", (q) => 
          q.eq("workspaceId", workspace._id).eq("userId", identity.subject)
        )
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .first();
    }
    
    // Return workspace info with privacy settings (but hide sensitive data)
    return {
      ...workspace,
      privacy: {
        level: workspace.privacy.level,
        allowSearchEngines: workspace.privacy.allowSearchEngines,
        // Don't return secretToken or password hash
      },
      role: collaboration?.role || "viewer",
      permissions: collaboration?.permissions || {
        canEdit: false,
        canSuggestChanges: false,
        canViewAnalytics: false,
        canInviteOthers: false,
        canManageSettings: false,
      },
    };
  },
});

// Verify access to workspace with provided credentials
export const verifyWorkspaceAccess = query({
  args: { 
    slug: v.string(),
    secretToken: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!workspace) {
      return { canAccess: false, reason: "Workspace not found" };
    }
    
    const identity = await ctx.auth.getUserIdentity();
    let collaboration = null;
    
    // Check if user is a collaborator
    if (identity?.tokenIdentifier) {
      collaboration = await ctx.db
        .query("collaborators")
        .withIndex("by_workspace_user", (q) => 
          q.eq("workspaceId", workspace._id).eq("userId", identity.subject)
        )
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .first();
    }
    
    // Collaborators with viewer+ permissions can always access
    if (collaboration) {
      return { 
        canAccess: true,
        isCollaborator: true,
        role: collaboration.role,
        permissions: collaboration.permissions
      };
    }
    
    // Check access based on privacy level
    switch (workspace.privacy.level) {
      case 'public':
        return { canAccess: true, isCollaborator: false };
      
      case 'secret_link':
        if (args.secretToken === workspace.privacy.secretToken) {
          return { canAccess: true, isCollaborator: false };
        }
        return { canAccess: false, reason: "Invalid or missing secret token" };
      
      case 'password':
        if (!args.password) {
          return { canAccess: false, reason: "Password required" };
        }
        if (workspace.privacy.password && verifyPassword(args.password, workspace.privacy.password)) {
          return { canAccess: true, isCollaborator: false };
        }
        return { canAccess: false, reason: "Incorrect password" };
      
      case 'private':
        return { canAccess: false, reason: "Private workspace - collaboration required" };
      
      default:
        return { canAccess: false, reason: "Invalid privacy configuration" };
    }
  },
});

// Update workspace settings
export const updateWorkspaceSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    settings: v.optional(v.object({
      allowCollaboratorSuggestions: v.boolean(),
      requireApprovalForChanges: v.boolean(),
      notificationsEnabled: v.boolean(),
      customDomain: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const { workspaceId, ...updates } = args;
    
    // Check permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canManageSettings) {
      throw new Error("Insufficient permissions");
    }
    
    // Update workspace
    await ctx.db.patch(workspaceId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update workspace privacy settings
export const updateWorkspacePrivacy = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    privacyLevel: v.string(),
    password: v.optional(v.string()),
    allowSearchEngines: v.optional(v.boolean()),
    regenerateSecretToken: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check if user is owner (only owners can change privacy settings)
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can change privacy settings");
    }
    
    // Validate privacy level
    if (!['public', 'secret_link', 'password', 'private'].includes(args.privacyLevel)) {
      throw new Error('Invalid privacy level');
    }
    
    // Prepare new privacy settings
    const privacy: any = {
      level: args.privacyLevel,
      allowSearchEngines: args.allowSearchEngines ?? (args.privacyLevel === 'public'),
    };
    
    // Handle secret token
    if (args.privacyLevel === 'secret_link') {
      if (args.regenerateSecretToken || !workspace.privacy.secretToken) {
        privacy.secretToken = generateSecretToken();
      } else {
        privacy.secretToken = workspace.privacy.secretToken;
      }
    }
    
    // Handle password
    if (args.privacyLevel === 'password') {
      if (!args.password && !workspace.privacy.password) {
        throw new Error('Password is required for password-protected privacy level');
      }
      if (args.password) {
        privacy.password = hashPassword(args.password);
      } else {
        privacy.password = workspace.privacy.password;
      }
    }
    
    // Update workspace privacy
    await ctx.db.patch(args.workspaceId, {
      privacy,
      updatedAt: Date.now(),
    });
    
    return { 
      success: true,
      secretToken: privacy.secretToken // Return new token if generated
    };
  },
});

// Get workspace privacy settings (owner only)
export const getWorkspacePrivacySettings = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check if user is owner
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can view privacy settings");
    }
    
    return {
      level: workspace.privacy.level,
      secretToken: workspace.privacy.secretToken,
      allowSearchEngines: workspace.privacy.allowSearchEngines,
      hasPassword: !!workspace.privacy.password,
    };
  },
});

// Delete workspace (owner only)
export const deleteWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check if user is owner
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can delete workspace");
    }
    
    // Delete all related data
    const [collaborators, versions, changeRequests, contactInfo, experiences, education, projects, skills, analytics, coverLetters, linkedinImports] = await Promise.all([
      ctx.db.query("collaborators").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("versions").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("changeRequests").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("contactInfo").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("experiences").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("education").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("projects").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("skills").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("analytics").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("coverLetters").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
      ctx.db.query("linkedinImports").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect(),
    ]);
    
    // Delete all related records
    const allRecords = [
      ...collaborators,
      ...versions,
      ...changeRequests,
      ...contactInfo,
      ...experiences,
      ...education,
      ...projects,
      ...skills,
      ...analytics,
      ...coverLetters,
      ...linkedinImports,
    ];
    
    await Promise.all(allRecords.map(record => ctx.db.delete(record._id)));
    
    // Finally delete the workspace
    await ctx.db.delete(args.workspaceId);
    
    return { success: true };
  },
});