import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new post
export const create = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing draft
    const existingDraft = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft")
        )
      )
      .unique();

    const now = Date.now();

    // If publishing and we have an existing draft, update it to published
    if (args.status === "published" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        status: "published",
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        publishedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // If creating a draft and we have an existing draft, update it
    if (args.status === "draft" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // Create new post (either first draft or direct publish)
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      status: args.status,
      authorId: user._id,
      tags: args.tags || [],
      category: args.category,
      featuredImage: args.featuredImage,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
      scheduledFor: args.scheduledFor,
      viewCount: 0,
      likeCount: 0,
    });

    return postId;
  },
});

// Update an existing post
export const update = mutation({
  args: {
    clerkId: v.string(),
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user owns the post
    if (post.authorId !== user._id) {
      throw new Error("Not authorized to update this post");
    }

    const now = Date.now();
    const updateData = {
      updatedAt: now,
    };

    // Add provided fields to update
    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.featuredImage !== undefined)
      updateData.featuredImage = args.featuredImage;
    if (args.scheduledFor !== undefined)
      updateData.scheduledFor = args.scheduledFor;

    // Handle status change
    if (args.status !== undefined) {
      updateData.status = args.status;

      // If publishing for the first time
      if (args.status === "published" && post.status === "draft") {
        updateData.publishedAt = now;
      }
    }

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Get user's draft (there should only be one)
export const getUserDraft = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      return null;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      return null;
    }

    const draft = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft")
        )
      )
      .unique();

    return draft;
  },
});

// Get user's posts
export const getUserPosts = query({
  args: {
    clerkId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      return [];
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id));

    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const posts = await query.order("desc").collect();

    // Add author information to each post
    return posts.map((post) => ({
      ...post,
      username: user.username,
      author: {
        _id: user._id,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
      },
    }));
  },
});

// Get a single post by ID
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    
    if (!post) {
      return null;
    }

    // Get the author information
    const author = await ctx.db.get(post.authorId);
    
    if (!author) {
      return null;
    }

    // Return the post with author username
    return {
      ...post,
      username: author.username,
    };
  },
});

// Delete a post
export const deletePost = mutation({
  args: { 
    clerkId: v.string(),
    id: v.id("posts") 
  },
  handler: async (ctx, args) => {
    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user owns the post
    if (post.authorId !== user._id) {
      throw new Error("Not authorized to delete this post");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
