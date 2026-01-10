import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notebooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { notebookId: v.id("notebooks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.notebookId);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notebooks", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    notebookId: v.id("notebooks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { notebookId, ...updates } = args;
    await ctx.db.patch(notebookId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { notebookId: v.id("notebooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notebookId);
  },
});
