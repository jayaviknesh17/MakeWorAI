import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if we've already stored this user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (existingUser) {
      // Update user info if it has changed
      if (existingUser.name !== args.name || existingUser.email !== args.email) {
        await ctx.db.patch(existingUser._id, {
          name: args.name,
          email: args.email,
          imageUrl: args.imageUrl,
          lastActiveAt: Date.now(),
        });
      }
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      name: args.name,
      tokenIdentifier: args.clerkId,
      email: args.email,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    return user;
  },
});

// Update username (checks availability and updates)
export const updateUsername = mutation({
  args: {
    clerkId: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.clerkId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(args.username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }

    if (args.username.length < 3 || args.username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    // Check if username is already taken (skip check if it's the same as current)
    if (args.username !== user.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();

      if (existingUser) {
        throw new Error("Username is already taken");
      }
    }

    // Update username
    await ctx.db.patch(user._id, {
      username: args.username,
      lastActiveAt: Date.now(),
    });

    return user._id;
  },
});

// Get user by username (for public profiles)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .unique();

    if (!user) {
      return null;
    }

    // Return only public fields
    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
    };
  },
});
