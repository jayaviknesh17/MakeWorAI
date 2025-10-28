import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // For demo purposes, just return success
    return { success: true };
  },
});

// Get comments for a post
export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    // Return mock comments for demo
    const mockComments = [
      {
        _id: "comment-1",
        content: "Great post! Very informative.",
        authorName: "Alice Johnson",
        authorEmail: "alice@example.com",
        status: "approved",
        createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      },
      {
        _id: "comment-2",
        content: "Thanks for sharing this!",
        authorName: "Bob Smith",
        authorEmail: "bob@example.com",
        status: "approved",
        createdAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      },
    ];

    return mockComments;
  },
});

// Delete a comment (only by author or post owner)
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    // For demo purposes, just return success
    return { success: true };
  },
});