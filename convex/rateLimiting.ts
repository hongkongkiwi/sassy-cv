import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Check and update rate limit
export const checkRateLimit = mutation({
  args: {
    identifier: v.string(),
    endpoint: v.string(),
    windowMs: v.number(),
    maxRequests: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - args.windowMs;
    const windowEnd = now + args.windowMs;
    
    // Find existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_endpoint", (q) =>
        q.eq("identifier", args.identifier).eq("endpoint", args.endpoint)
      )
      .first();
    
    if (!existing) {
      // Create new rate limit record
      await ctx.db.insert("rateLimits", {
        identifier: args.identifier,
        endpoint: args.endpoint,
        requestCount: 1,
        windowStart: now,
        windowEnd: windowEnd,
        lastRequest: now,
      });
      
      return {
        success: true,
        limit: args.maxRequests,
        remaining: args.maxRequests - 1,
        reset: windowEnd,
      };
    }
    
    // Check if current window has expired
    if (existing.windowEnd < now) {
      // Reset the window
      await ctx.db.patch(existing._id, {
        requestCount: 1,
        windowStart: now,
        windowEnd: windowEnd,
        lastRequest: now,
      });
      
      return {
        success: true,
        limit: args.maxRequests,
        remaining: args.maxRequests - 1,
        reset: windowEnd,
      };
    }
    
    // Check if rate limit exceeded
    if (existing.requestCount >= args.maxRequests) {
      return {
        success: false,
        limit: args.maxRequests,
        remaining: 0,
        reset: existing.windowEnd,
        retryAfter: Math.ceil((existing.windowEnd - now) / 1000),
      };
    }
    
    // Increment request count
    await ctx.db.patch(existing._id, {
      requestCount: existing.requestCount + 1,
      lastRequest: now,
    });
    
    return {
      success: true,
      limit: args.maxRequests,
      remaining: args.maxRequests - existing.requestCount - 1,
      reset: existing.windowEnd,
    };
  },
});

// Clean up expired rate limit records
export const cleanupExpiredRateLimits = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // Keep records for 1 hour after expiry
    
    // Find expired records
    const expiredRecords = await ctx.db
      .query("rateLimits")
      .withIndex("by_window_end", (q) => q.lt("windowEnd", oneHourAgo))
      .take(100); // Limit batch size
    
    // Delete expired records
    for (const record of expiredRecords) {
      await ctx.db.delete(record._id);
    }
    
    return { deleted: expiredRecords.length };
  },
});

// Get rate limit status for an identifier and endpoint
export const getRateLimitStatus = query({
  args: {
    identifier: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_endpoint", (q) =>
        q.eq("identifier", args.identifier).eq("endpoint", args.endpoint)
      )
      .first();
    
    if (!record) {
      return null;
    }
    
    const now = Date.now();
    
    return {
      identifier: record.identifier,
      endpoint: record.endpoint,
      requestCount: record.requestCount,
      windowStart: record.windowStart,
      windowEnd: record.windowEnd,
      lastRequest: record.lastRequest,
      isExpired: record.windowEnd < now,
    };
  },
});

// Get rate limit statistics (for monitoring)
export const getRateLimitStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Get active rate limit records
    const activeRecords = await ctx.db
      .query("rateLimits")
      .withIndex("by_window_end", (q) => q.gte("windowEnd", now))
      .collect();
    
    // Get records from the past hour
    const recentRecords = await ctx.db
      .query("rateLimits")
      .withIndex("by_window_end", (q) => q.gte("windowEnd", oneHourAgo))
      .collect();
    
    // Calculate statistics
    const totalActiveRecords = activeRecords.length;
    const totalRecentRequests = recentRecords.reduce(
      (sum, record) => sum + record.requestCount,
      0
    );
    
    // Group by endpoint
    const endpointStats = recentRecords.reduce((stats, record) => {
      if (!stats[record.endpoint]) {
        stats[record.endpoint] = {
          requests: 0,
          uniqueIdentifiers: new Set(),
        };
      }
      stats[record.endpoint]!.requests += record.requestCount;
      stats[record.endpoint]!.uniqueIdentifiers.add(record.identifier);
      return stats;
    }, {} as Record<string, { requests: number; uniqueIdentifiers: Set<string> }>);
    
    // Convert sets to counts
    const endpointStatsFormatted = Object.entries(endpointStats).map(
      ([endpoint, stats]) => ({
        endpoint,
        requests: stats.requests,
        uniqueIdentifiers: stats.uniqueIdentifiers.size,
      })
    );
    
    return {
      activeRecords: totalActiveRecords,
      recentRequests: totalRecentRequests,
      endpointStats: endpointStatsFormatted,
      timestamp: now,
    };
  },
});