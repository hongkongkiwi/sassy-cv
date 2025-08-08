import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Track analytics events
export const trackEvent = mutation({
  args: {
    userId: v.string(),
    event: v.string(),
    visitorId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    referrer: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    sessionDuration: v.optional(v.number()),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get analytics overview
export const getAnalyticsOverview = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analytics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
    userId: v.string(),
    days: v.optional(v.number()),
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let query = ctx.db
      .query("analytics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analytics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.gte(q.field("timestamp"), args.startDate) &&
        q.lte(q.field("timestamp"), args.endDate)
      )
      .collect();

    return events;
  },
});