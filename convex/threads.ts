import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});

export const listByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    noteId: v.id("notes"),
    selectionText: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      userId: args.userId,
      noteId: args.noteId,
      selectionText: args.selectionText,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    threadId: v.id("threads"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");
    
    await ctx.db.patch(args.threadId, {
      messages: [
        ...thread.messages,
        {
          role: args.role,
          content: args.content,
          timestamp: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.threadId);
  },
});
