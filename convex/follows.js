import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Toggle follow/unfollow a user
export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    // For demo purposes, just return a random follow state
    const isFollowing = Math.random() > 0.5;
    return { following: isFollowing };
  },
});

// Check if current user is following a specific user
export const isFollowing = query({
  args: { followingId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Return random follow status for demo
    return Math.random() > 0.5;
  },
});

// Get follower count for a user
export const getFollowerCount = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Return mock follower count
    return Math.floor(Math.random() * 1000) + 100;
  },
});

// Get followers of current user
export const getMyFollowers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock followers for demo
    const mockFollowers = [
      {
        _id: "follower-1",
        name: "Alice Johnson",
        username: "alicej",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        _id: "follower-2",
        name: "Bob Smith",
        username: "bobsmith",
        imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
    ];

    const limit = args.limit || 20;
    return mockFollowers.slice(0, limit);
  },
});

// Get users that current user is following
export const getMyFollowing = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Return mock following users for demo
    const mockFollowing = [
      {
        _id: "following-1",
        name: "Tech Guru",
        username: "techguru",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        followedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        followerCount: 5432,
        postCount: 89,
        lastPostAt: Date.now() - 1000 * 60 * 60 * 12,
      },
      {
        _id: "following-2",
        name: "Design Master",
        username: "designmaster",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        followedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
        followerCount: 3210,
        postCount: 67,
        lastPostAt: Date.now() - 1000 * 60 * 60 * 24,
      },
    ];

    const limit = args.limit || 20;
    return mockFollowing.slice(0, limit);
  },
});