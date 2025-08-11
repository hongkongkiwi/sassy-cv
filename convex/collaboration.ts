import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Role definitions with default permissions
const ROLE_PERMISSIONS = {
  owner: {
    canEdit: true,
    canSuggestChanges: true,
    canViewAnalytics: true,
    canInviteOthers: true,
    canManageSettings: true,
  },
  collaborator: {
    canEdit: false,
    canSuggestChanges: true,
    canViewAnalytics: false,
    canInviteOthers: false,
    canManageSettings: false,
  },
  viewer: {
    canEdit: false,
    canSuggestChanges: false,
    canViewAnalytics: false,
    canInviteOthers: false,
    canManageSettings: false,
  },
};

// Invite a collaborator
export const inviteCollaborator = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.string(),
    customPermissions: v.optional(v.object({
      canEdit: v.boolean(),
      canSuggestChanges: v.boolean(),
      canViewAnalytics: v.boolean(),
      canInviteOthers: v.boolean(),
      canManageSettings: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check if user has permission to invite others
    const inviterCollaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!inviterCollaboration?.permissions.canInviteOthers) {
      throw new Error("Insufficient permissions to invite collaborators");
    }
    
    // Check if role is valid
    if (!["collaborator", "viewer"].includes(args.role)) {
      throw new Error("Invalid role. Only 'collaborator' and 'viewer' roles can be assigned");
    }
    
    // Check if email is already invited or is a collaborator
    const existingInvite = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("inviteEmail"), args.email))
      .first();
    
    if (existingInvite) {
      if (existingInvite.status === "pending") {
        throw new Error("Email already has a pending invitation");
      } else if (existingInvite.status === "accepted") {
        throw new Error("Email is already a collaborator");
      }
    }
    
    const now = Date.now();
    const permissions = args.customPermissions || ROLE_PERMISSIONS[args.role as keyof typeof ROLE_PERMISSIONS];
    
    // Create invitation
    const inviteId = await ctx.db.insert("collaborators", {
      workspaceId: args.workspaceId,
      userId: "", // Will be set when user accepts invitation
      role: args.role,
      permissions,
      invitedBy: userId,
      invitedAt: now,
      status: "pending",
      inviteEmail: args.email,
    });
    
    // TODO: Send email invitation
    
    return { inviteId };
  },
});

// Accept an invitation
export const acceptInvitation = mutation({
  args: { inviteId: v.id("collaborators") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const userEmail = identity.email;
    
    // Get the invitation
    const invitation = await ctx.db.get(args.inviteId);
    if (!invitation || invitation.status !== "pending") {
      throw new Error("Invalid or expired invitation");
    }
    
    // Check if the user's email matches the invitation
    if (invitation.inviteEmail !== userEmail) {
      throw new Error("Email does not match invitation");
    }
    
    // Check if user is already a collaborator in this workspace
    const existingCollaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", invitation.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (existingCollaboration) {
      throw new Error("You are already a collaborator in this workspace");
    }
    
    // Accept the invitation
    await ctx.db.patch(args.inviteId, {
      userId,
      acceptedAt: Date.now(),
      status: "accepted",
    });
    
    return { success: true, workspaceId: invitation.workspaceId };
  },
});

// Decline an invitation
export const declineInvitation = mutation({
  args: { inviteId: v.id("collaborators") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userEmail = identity.email;
    
    // Get the invitation
    const invitation = await ctx.db.get(args.inviteId);
    if (!invitation || invitation.status !== "pending") {
      throw new Error("Invalid or expired invitation");
    }
    
    // Check if the user's email matches the invitation
    if (invitation.inviteEmail !== userEmail) {
      throw new Error("Email does not match invitation");
    }
    
    // Decline the invitation
    await ctx.db.patch(args.inviteId, {
      status: "declined",
    });
    
    return { success: true };
  },
});

// Get user's pending invitations
export const getPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return [];
    
    const userEmail = identity.email;
    
    const invitations = await ctx.db
      .query("collaborators")
      .withIndex("by_invite_email", (q) => q.eq("inviteEmail", userEmail))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    // Get workspace details
    const invitationsWithWorkspace = await Promise.all(
      invitations.map(async (invitation) => {
        const workspace = await ctx.db.get(invitation.workspaceId);
        return {
          ...invitation,
          workspace,
        };
      })
    );
    
    return invitationsWithWorkspace.filter(inv => inv.workspace);
  },
});

// Get workspace collaborators
export const getWorkspaceCollaborators = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Check if user has access to this workspace
    const userCollaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!userCollaboration) {
      throw new Error("Access denied");
    }
    
    // Get all collaborators
    const collaborators = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    return collaborators;
  },
});

// Update collaborator permissions (owner only)
export const updateCollaboratorPermissions = mutation({
  args: {
    collaboratorId: v.id("collaborators"),
    role: v.optional(v.string()),
    permissions: v.optional(v.object({
      canEdit: v.boolean(),
      canSuggestChanges: v.boolean(),
      canViewAnalytics: v.boolean(),
      canInviteOthers: v.boolean(),
      canManageSettings: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Get collaborator being updated
    const collaborator = await ctx.db.get(args.collaboratorId);
    if (!collaborator) throw new Error("Collaborator not found");
    
    // Check if user is owner of the workspace
    const workspace = await ctx.db.get(collaborator.workspaceId);
    if (!workspace || workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can update collaborator permissions");
    }
    
    // Prevent changing owner permissions
    if (collaborator.role === "owner") {
      throw new Error("Cannot modify owner permissions");
    }
    
    const updates: any = {};
    
    if (args.role && args.role !== collaborator.role) {
      if (!["collaborator", "viewer"].includes(args.role)) {
        throw new Error("Invalid role");
      }
      updates.role = args.role;
      updates.permissions = ROLE_PERMISSIONS[args.role as keyof typeof ROLE_PERMISSIONS];
    }
    
    if (args.permissions) {
      updates.permissions = args.permissions;
    }
    
    await ctx.db.patch(args.collaboratorId, updates);
    
    return { success: true };
  },
});

// Remove collaborator (owner only)
export const removeCollaborator = mutation({
  args: { collaboratorId: v.id("collaborators") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Get collaborator being removed
    const collaborator = await ctx.db.get(args.collaboratorId);
    if (!collaborator) throw new Error("Collaborator not found");
    
    // Check if user is owner of the workspace
    const workspace = await ctx.db.get(collaborator.workspaceId);
    if (!workspace || workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can remove collaborators");
    }
    
    // Prevent removing owner
    if (collaborator.role === "owner") {
      throw new Error("Cannot remove workspace owner");
    }
    
    // Remove collaborator
    await ctx.db.delete(args.collaboratorId);
    
    return { success: true };
  },
});

// Leave workspace (collaborators only)
export const leaveWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    // Get user's collaboration
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("You are not a collaborator in this workspace");
    }
    
    // Prevent owner from leaving
    if (collaboration.role === "owner") {
      throw new Error("Workspace owner cannot leave. Transfer ownership or delete the workspace instead.");
    }
    
    // Remove collaboration
    await ctx.db.delete(collaboration._id);
    
    return { success: true };
  },
});