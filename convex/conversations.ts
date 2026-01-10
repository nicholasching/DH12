import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const listByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .order("desc")
      .collect();
  },
});

export const listByTranscription = query({
  args: { transcriptionId: v.id("transcriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_transcription", (q) => q.eq("transcriptionId", args.transcriptionId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    noteId: v.optional(v.id("notes")),
    transcriptionId: v.optional(v.id("transcriptions")),
    parentId: v.optional(v.id("conversations")),
    selectionText: v.optional(v.string()),
    selectionStart: v.optional(v.number()),
    selectionEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      noteId: args.noteId,
      transcriptionId: args.transcriptionId,
      parentId: args.parentId,
      selectionText: args.selectionText,
      selectionStart: args.selectionStart,
      selectionEnd: args.selectionEnd,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, {
      messages: [
        ...conversation.messages,
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
