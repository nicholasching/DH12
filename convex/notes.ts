import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { notebookId: v.id("notebooks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_notebook", (q) => q.eq("notebookId", args.notebookId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const create = mutation({
  args: {
    notebookId: v.id("notebooks"),
    userId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notes", {
      notebookId: args.notebookId,
      userId: args.userId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    await ctx.db.patch(noteId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
  },
});
