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
    noteId: v.optional(v.id("notes")),
    qrCode: v.string(),
    tldrawData: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      userId: args.userId,
      noteId: args.noteId,
      qrCode: args.qrCode,
      tldrawData: args.tldrawData,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    drawingId: v.id("drawings"),
    tldrawData: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.drawingId, {
      tldrawData: args.tldrawData,
      updatedAt: Date.now(),
    });
  },
});
