import { v } from "convex/values";
import { query } from "./_generated/server";

// Get feed posts - can improve it to show following posts first
export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return mock feed data for demo
    const mockPosts = [
      {
        _id: "feed-post-1",
        title: "The Future of AI in Web Development",
        content: "Exploring how AI is revolutionizing the way we build web applications...",
        status: "published",
        viewCount: 2341,
        likeCount: 156,
        createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 2,
        tags: ["AI", "Web Development", "Technology"],
        author: {
          _id: "author-1",
          name: "Sarah Chen",
          username: "sarahdev",
          imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
        },
      },
      {
        _id: "feed-post-2",
        title: "Building Scalable React Applications",
        content: "Best practices for creating maintainable and scalable React apps...",
        status: "published",
        viewCount: 1892,
        likeCount: 134,
        createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 6,
        tags: ["React", "JavaScript", "Architecture"],
        author: {
          _id: "author-2",
          name: "Mike Johnson",
          username: "mikejs",
          imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        },
      },
      {
        _id: "feed-post-3",
        title: "CSS Grid vs Flexbox: When to Use What",
        content: "A comprehensive guide to choosing the right layout method...",
        status: "published",
        viewCount: 1456,
        likeCount: 98,
        createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 12,
        tags: ["CSS", "Layout", "Design"],
        author: {
          _id: "author-3",
          name: "Emma Wilson",
          username: "emmacss",
          imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        },
      },
    ];

    const limit = args.limit || 10;
    return {
      posts: mockPosts.slice(0, limit),
      hasMore: false,
    };
  },
});

// Get suggested users to follow
export const getSuggestedUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock suggested users for demo
    const mockUsers = [
      {
        _id: "user-1",
        name: "David Brown",
        username: "daviddev",
        imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        followerCount: 1234,
        postCount: 45,
      },
      {
        _id: "user-2",
        name: "Lisa Garcia",
        username: "lisadesign",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        followerCount: 892,
        postCount: 32,
      },
      {
        _id: "user-3",
        name: "Alex Kim",
        username: "alexcode",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        followerCount: 567,
        postCount: 28,
      },
    ];

    const limit = args.limit || 10;
    return mockUsers.slice(0, limit);

    // Get users with recent posts who aren't being followed
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), currentUser?._id || ""))
      .collect();

    // Filter out already followed users and get their stats
    const suggestions = await Promise.all(
      allUsers
        .filter((user) => !followedUserIds.includes(user._id) && user.username)
        .map(async (user) => {
          // Get user's published posts
          const posts = await ctx.db
            .query("posts")
            .filter((q) =>
              q.and(
                q.eq(q.field("authorId"), user._id),
                q.eq(q.field("status"), "published")
              )
            )
            .order("desc")
            .take(5);

          // Get follower count
          const followers = await ctx.db
            .query("follows")
            .filter((q) => q.eq(q.field("followingId"), user._id))
            .collect();

          // Calculate engagement score for ranking
          const totalViews = posts.reduce(
            (sum, post) => sum + post.viewCount,
            0
          );
          const totalLikes = posts.reduce(
            (sum, post) => sum + post.likeCount,
            0
          );
          const engagementScore =
            totalViews + totalLikes * 5 + followers.length * 10;

          return {
            _id: user._id,
            name: user.name,
            username: user.username,
            imageUrl: user.imageUrl,
            followerCount: followers.length,
            postCount: posts.length,
            engagementScore,
            lastPostAt: posts.length > 0 ? posts[0].publishedAt : null,
            recentPosts: posts.slice(0, 2).map((post) => ({
              _id: post._id,
              title: post.title,
              viewCount: post.viewCount,
              likeCount: post.likeCount,
            })),
          };
        })
    );

    // Sort by engagement score and recent activity
    const rankedSuggestions = suggestions
      .filter((user) => user.postCount > 0) // Only users with posts
      .sort((a, b) => {
        // Prioritize recent activity
        const aRecent = a.lastPostAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
        const bRecent = b.lastPostAt > Date.now() - 7 * 24 * 60 * 60 * 1000;

        if (aRecent && !bRecent) return -1;
        if (!aRecent && bRecent) return 1;

        // Then by engagement score
        return b.engagementScore - a.engagementScore;
      })
      .slice(0, limit);

    return rankedSuggestions;
  },
});

// Get trending posts (high engagement in last 7 days)
export const getTrendingPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock trending posts for demo
    const mockTrendingPosts = [
      {
        _id: "trending-1",
        title: "10 JavaScript Tricks Every Developer Should Know",
        content: "Discover these powerful JavaScript techniques...",
        status: "published",
        viewCount: 5432,
        likeCount: 234,
        trendingScore: 6134,
        createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 24,
        tags: ["JavaScript", "Tips", "Programming"],
        author: {
          _id: "trending-author-1",
          name: "John Smith",
          username: "johnjs",
          imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        },
      },
      {
        _id: "trending-2",
        title: "The Complete Guide to TypeScript",
        content: "Everything you need to know about TypeScript...",
        status: "published",
        viewCount: 4321,
        likeCount: 189,
        trendingScore: 4888,
        createdAt: Date.now() - 1000 * 60 * 60 * 36, // 1.5 days ago
        publishedAt: Date.now() - 1000 * 60 * 60 * 36,
        tags: ["TypeScript", "JavaScript", "Tutorial"],
        author: {
          _id: "trending-author-2",
          name: "Jane Doe",
          username: "janets",
          imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        },
      },
    ];

    const limit = args.limit || 10;
    return mockTrendingPosts.slice(0, limit);
  },
});
