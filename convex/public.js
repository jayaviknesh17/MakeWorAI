import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get published posts by username (for public profile)
export const getPublishedPostsByUsername = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      return {
        posts: [],
        hasMore: false,
        nextCursor: null,
      };
    }

    const limit = args.limit || 10;

    // Build the query for published posts by this user
    let query = ctx.db
      .query("posts")
      .withIndex("by_author_status", (q) => 
        q.eq("authorId", user._id).eq("status", "published")
      )
      .order("desc");

    // Handle pagination
    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("_id"), args.cursor));
    }

    const posts = await query.take(limit + 1);
    const hasMore = posts.length > limit;
    const finalPosts = hasMore ? posts.slice(0, limit) : posts;

    // Add author information to each post
    const postsWithAuthor = finalPosts.map((post) => ({
      ...post,
      author: {
        _id: user._id,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
      },
    }));

    return {
      posts: postsWithAuthor,
      hasMore,
      nextCursor: hasMore ? finalPosts[finalPosts.length - 1]._id : null,
    };
  },
});

// Get a single published post by username and post ID
export const getPublishedPost = query({
  args: {
    username: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the post by ID
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      return null;
    }

    // Get the author information
    const author = await ctx.db.get(post.authorId);
    
    if (!author) {
      return null;
    }

    // Verify the post belongs to the user with the given username
    if (author.username !== args.username) {
      return null;
    }

    // Only return published posts
    if (post.status !== "published") {
      return null;
    }

    // Return the post with author information
    return {
      ...post,
      author: {
        _id: author._id,
        name: author.name,
        username: author.username,
        imageUrl: author.imageUrl,
      },
    };
  },
});

// Increment view count for a post
export const incrementViewCount = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Increment the view count
    await ctx.db.patch(args.postId, {
      viewCount: (post.viewCount || 0) + 1,
    });

    return { success: true };
  },
});
