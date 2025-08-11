import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Track analytics events
export const trackEvent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    event: v.string(),
    visitorId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    referrer: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    sessionDuration: v.optional(v.number()),
    metadata: v.optional(v.object({})),
    collaboratorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic rate limiting by visitorId to mitigate abuse
    if (args.visitorId) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recent = await ctx.db
        .query("analytics")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) =>
          q.and(
            q.eq(q.field("visitorId"), args.visitorId!),
            q.gte(q.field("timestamp"), fiveMinutesAgo)
          )
        )
        .take(50);
      if (recent.length > 30) {
        throw new Error("Rate limit exceeded");
      }
    }

    return await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get analytics overview
export const getAnalyticsOverview = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Authentication required");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canViewAnalytics && collaboration?.role !== "owner") {
      throw new Error("Access denied: Insufficient permissions to view analytics");
    }
    
    const events = await ctx.db
      .query("analytics")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const totalViews = events.filter(e => e.event === "view").length;
    const totalDownloads = events.filter(e => e.event === "download").length;
    
    const viewsToday = events.filter(e => 
      e.event === "view" && e.timestamp > now - dayMs
    ).length;
    
    const viewsThisWeek = events.filter(e => 
      e.event === "view" && e.timestamp > now - weekMs
    ).length;
    
    const viewsThisMonth = events.filter(e => 
      e.event === "view" && e.timestamp > now - monthMs
    ).length;

    const downloadsToday = events.filter(e => 
      e.event === "download" && e.timestamp > now - dayMs
    ).length;

    // Get unique visitors
    const uniqueVisitors = new Set(events.map(e => e.visitorId).filter(Boolean)).size;
    
    // Device breakdown
    const deviceBreakdown = events.reduce((acc, event) => {
      if (event.deviceType) {
        acc[event.deviceType] = (acc[event.deviceType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Country breakdown
    const countryBreakdown = events.reduce((acc, event) => {
      if (event.country) {
        acc[event.country] = (acc[event.country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 30 days, grouped by day)
    const recentActivity = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now - i * dayMs);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + dayMs;
      
      const dayViews = events.filter(e => 
        e.event === "view" && e.timestamp >= dayStart && e.timestamp < dayEnd
      ).length;
      
      recentActivity.push({
        date: day.toISOString().split('T')[0],
        views: dayViews,
      });
    }

    return {
      totalViews,
      totalDownloads,
      uniqueVisitors,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      downloadsToday,
      deviceBreakdown,
      countryBreakdown,
      recentActivity,
    };
  },
});

// Get detailed analytics
export const getDetailedAnalytics = query({
  args: { 
    workspaceId: v.id("workspaces"),
    days: v.optional(v.number()),
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Authentication required");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canViewAnalytics && collaboration?.role !== "owner") {
      throw new Error("Access denied: Insufficient permissions to view analytics");
    }
    
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let query = ctx.db
      .query("analytics")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff));

    if (args.event) {
      query = query.filter((q) => q.eq(q.field("event"), args.event));
    }

    const events = await query.collect();

    return events.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp).toISOString(),
    }));
  },
});

// Get analytics for specific time range
export const getAnalyticsForRange = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Authentication required");
    }
    
    // Check workspace access
    const collaboration = await ctx.db
      .query("collaborators")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();
    
    if (!collaboration?.permissions.canViewAnalytics && collaboration?.role !== "owner") {
      throw new Error("Access denied: Insufficient permissions to view analytics");
    }
    
    const events = await ctx.db
      .query("analytics")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => 
        q.gte(q.field("timestamp"), args.startDate) &&
        q.lte(q.field("timestamp"), args.endDate)
      )
      .collect();

    return events;
  },
});