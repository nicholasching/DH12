import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { drawingId: v.id("drawings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.drawingId);
  },
});

export const getByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drawings")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    noteId: v.id("notes"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      userId: args.userId,
      noteId: args.noteId,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    drawingId: v.id("drawings"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.drawingId, {
      data: args.data,
      updatedAt: Date.now(),
    });
  },
});
