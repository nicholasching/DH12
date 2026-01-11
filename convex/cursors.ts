import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    userName: v.optional(v.string()),
    position: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if cursor exists
    const existing = await ctx.db
      .query("cursors")
      .withIndex("by_user_note", (q) => 
        q.eq("userId", args.userId).eq("noteId", args.noteId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        position: args.position,
        updatedAt: now,
        userName: args.userName, // Update name in case it changes
      });
    } else {
      await ctx.db.insert("cursors", {
        noteId: args.noteId,
        userId: args.userId,
        userName: args.userName,
        position: args.position,
        updatedAt: now,
      });
    }
  },
});

export const list = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Return cursors active in the last 10 seconds
    const cursors = await ctx.db
      .query("cursors")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    return cursors.filter((c) => now - c.updatedAt < 10000);
  },
});
