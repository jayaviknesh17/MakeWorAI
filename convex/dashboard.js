import { v } from "convex/values";
import { query } from "./_generated/server";

// Get dashboard analytics for the authenticated user
export const getAnalytics = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      // Return default analytics for unauthenticated users
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalFollowers: 0,
        viewsGrowth: 0,
        likesGrowth: 0,
        commentsGrowth: 0,
        followersGrowth: 0,
      };
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      // Return default analytics for new users
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalFollowers: 0,
        viewsGrowth: 0,
        likesGrowth: 0,
        commentsGrowth: 0,
        followersGrowth: 0,
      };
    }

    // Get all user's posts
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .collect();

    // Get user's followers count
    const followersCount = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("followingId"), user._id))
      .collect();

    // Calculate analytics
    const totalViews = posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0);

    // Get comments count for user's posts
    const postIds = posts.map((p) => p._id);
    let totalComments = 0;

    for (const postId of postIds) {
      const comments = await ctx.db
        .query("comments")
        .filter((q) =>
          q.and(
            q.eq(q.field("postId"), postId),
            q.eq(q.field("status"), "approved")
          )
        )
        .collect();
      totalComments += comments.length;
    }

    // Calculate growth percentages (simplified - you might want to implement proper date-based calculations)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentPosts = posts.filter((p) => (p.createdAt || 0) > thirtyDaysAgo);
    const recentViews = recentPosts.reduce(
      (sum, post) => sum + (post.viewCount || 0),
      0
    );
    const recentLikes = recentPosts.reduce(
      (sum, post) => sum + (post.likeCount || 0),
      0
    );

    // Simple growth calculation (you can enhance this)
    const viewsGrowth = totalViews > 0 ? (recentViews / totalViews) * 100 : 0;
    const likesGrowth = totalLikes > 0 ? (recentLikes / totalLikes) * 100 : 0;
    const commentsGrowth = totalComments > 0 ? 15 : 0; // Placeholder
    const followersGrowth = followersCount.length > 0 ? 12 : 0; // Placeholder

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers: followersCount.length,
      viewsGrowth: Math.round(viewsGrowth * 10) / 10,
      likesGrowth: Math.round(likesGrowth * 10) / 10,
      commentsGrowth,
      followersGrowth,
    };
  },
});

// Get recent activity for the dashboard
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock activity data for demo
    const mockActivities = [
      {
        type: "like",
        user: "Sarah Chen",
        post: "Getting Started with AI",
        time: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      },
      {
        type: "comment",
        user: "Mike Johnson",
        post: "React Best Practices",
        time: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      },
      {
        type: "follow",
        user: "Emma Wilson",
        time: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      },
      {
        type: "like",
        user: "David Brown",
        post: "JavaScript Tips",
        time: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
      },
      {
        type: "comment",
        user: "Lisa Garcia",
        post: "CSS Grid Layout",
        time: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
      },
    ];

    return mockActivities.slice(0, args.limit || 10);
  },
});

// Get posts with analytics for dashboard
export const getPostsWithAnalytics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock posts data for demo
    const mockPosts = [
      {
        _id: "post1",
        title: "Getting Started with AI Development",
        status: "published",
        viewCount: 1234,
        likeCount: 89,
        commentCount: 23,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        _id: "post2",
        title: "React Best Practices for 2024",
        status: "published",
        viewCount: 892,
        likeCount: 67,
        commentCount: 15,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
      {
        _id: "post3",
        title: "Building Scalable Web Applications",
        status: "draft",
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
      },
    ];

    return mockPosts.slice(0, args.limit || 5);
  },
});

// Get daily views data for chart (last 30 days) - Assignment
export const getDailyViews = query({
  handler: async (ctx) => {
    // Generate mock daily views data for the last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Generate realistic mock data with some variation
      const baseViews = 50;
      const variation = Math.floor(Math.random() * 100) - 50; // -50 to +50
      const views = Math.max(0, baseViews + variation + (i < 7 ? 20 : 0)); // Recent days have more views
      
      days.push({
        date: dateString,
        views: views,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    return days;
  },
});
