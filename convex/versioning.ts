import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new version for any entity
export const createVersion = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    changeType: v.string(),
    previousData: v.optional(v.any()),
    currentData: v.optional(v.any()),
    commitMessage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    // Get workspace settings to check if approval is required
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    
    // Determine if this change needs approval
    const needsApproval = workspace.settings.requireApprovalForChanges && 
                         collaboration.role !== "owner" && 
                         !collaboration.permissions.canEdit;
    
    // Get next version number
    const lastVersion = await ctx.db
      .query("versions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .first();
    
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    
    // Create version
    const versionId = await ctx.db.insert("versions", {
      workspaceId: args.workspaceId,
      versionNumber,
      entityType: args.entityType,
      entityId: args.entityId,
      changeType: args.changeType,
      previousData: args.previousData,
      currentData: args.currentData,
      createdBy: userId,
      createdAt: Date.now(),
      isApproved: !needsApproval,
      approvedBy: needsApproval ? undefined : userId,
      approvedAt: needsApproval ? undefined : Date.now(),
      commitMessage: args.commitMessage,
      tags: args.tags,
    });
    
    return { 
      versionId, 
      versionNumber, 
      needsApproval 
    };
  },
});

// Get version history for workspace or specific entity
export const getVersionHistory = query({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    limit: v.optional(v.number()),
    approvedOnly: v.optional(v.boolean()),
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
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    // Build query
    let query = ctx.db
      .query("versions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc");
    
    // Filter by entity if specified
    if (args.entityType && args.entityId) {
      query = ctx.db
        .query("versions")
        .withIndex("by_entity", (q) => 
          q.eq("workspaceId", args.workspaceId)
           .eq("entityType", args.entityType!)
           .eq("entityId", args.entityId!)
        )
        .order("desc");
    } else if (args.entityType) {
      query = query.filter((q) => q.eq(q.field("entityType"), args.entityType!));
    }
    
    // Filter by approval status if specified
    if (args.approvedOnly) {
      query = query.filter((q) => q.eq(q.field("isApproved"), true));
    }
    
    // Apply limit
    const versions = await query.take(args.limit || 50);
    
    return versions;
  },
});

// Get specific version
export const getVersion = query({
  args: { versionId: v.id("versions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const version = await ctx.db.get(args.versionId);
    
    if (!version) throw new Error("Version not found");
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", version.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return version;
  },
});

// Approve a version (owner/editor only)
export const approveVersion = mutation({
  args: { versionId: v.id("versions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const version = await ctx.db.get(args.versionId);
    
    if (!version) throw new Error("Version not found");
    
    // Check permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", version.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration || (!collaboration.permissions.canEdit && collaboration.role !== "owner")) {
      throw new Error("Insufficient permissions to approve versions");
    }
    
    if (version.isApproved) {
      throw new Error("Version is already approved");
    }
    
    // Approve version
    await ctx.db.patch(args.versionId, {
      isApproved: true,
      approvedBy: userId,
      approvedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Revert to a specific version
export const revertToVersion = mutation({
  args: {
    versionId: v.id("versions"),
    commitMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    const version = await ctx.db.get(args.versionId);
    
    if (!version) throw new Error("Version not found");
    
    // Check permissions
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", version.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration || (!collaboration.permissions.canEdit && collaboration.role !== "owner")) {
      throw new Error("Insufficient permissions to revert versions");
    }
    
    if (!version.isApproved) {
      throw new Error("Cannot revert to unapproved version");
    }
    
    // Get current data for the entity
    let currentData = null;
    
    if (version.entityType === "contactInfo") {
      currentData = await ctx.db
        .query("contactInfo")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", version.workspaceId))
        .first();
    } else if (version.entityType === "experience" && version.entityId) {
      currentData = await ctx.db
        .query("experiences")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", version.workspaceId))
        .filter((q) => q.eq(q.field("_id"), version.entityId))
        .first();
    }
    // Add more entity types as needed
    
    // Create revert version
    const revertVersionId = await ctx.db.insert("versions", {
      workspaceId: version.workspaceId,
      versionNumber: (await getNextVersionNumber(ctx, version.workspaceId)),
      entityType: version.entityType,
      entityId: version.entityId,
      changeType: "revert",
      previousData: currentData,
      currentData: version.currentData,
      createdBy: userId,
      createdAt: Date.now(),
      isApproved: true,
      approvedBy: userId,
      approvedAt: Date.now(),
      commitMessage: args.commitMessage || `Revert to version ${version.versionNumber}`,
      tags: ["revert"],
    });
    
    return { 
      success: true, 
      revertVersionId,
      revertedToVersion: version.versionNumber 
    };
  },
});

// Compare two versions
export const compareVersions = query({
  args: {
    versionId1: v.id("versions"),
    versionId2: v.id("versions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Unauthorized");
    
    const userId = identity.subject;
    
    const [version1, version2] = await Promise.all([
      ctx.db.get(args.versionId1),
      ctx.db.get(args.versionId2),
    ]);
    
    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }
    
    if (version1.workspaceId !== version2.workspaceId) {
      throw new Error("Versions must be from the same workspace");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", version1.workspaceId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration) {
      throw new Error("Access denied");
    }
    
    return {
      version1,
      version2,
      diff: {
        // TODO: Implement proper diff algorithm
        changes: "Diff algorithm not implemented yet",
      },
    };
  },
});

// Helper function to get next version number
async function getNextVersionNumber(ctx: any, workspaceId: string): Promise<number> {
  const lastVersion = await ctx.db
    .query("versions")
    .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
    .order("desc")
    .first();
  
  return (lastVersion?.versionNumber || 0) + 1;
}