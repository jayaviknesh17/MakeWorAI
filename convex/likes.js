import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Toggle like on a post
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // For demo purposes, return random like state
    const isLiked = Math.random() > 0.5;
    return { liked: isLiked };
  },
});

// Check if user has liked a post
export const hasUserLiked = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Return random like status for demo
    return Math.random() > 0.5;
  },
});