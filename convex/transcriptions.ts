import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { transcriptionId: v.id("transcriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transcriptionId);
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("transcriptions", {
      userId: args.userId,
      sessionId: args.sessionId,
      noteId: args.noteId,
      transcript: "",
      status: "processing",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    transcriptionId: v.id("transcriptions"),
    transcript: v.optional(v.string()),
    status: v.optional(v.union(v.literal("processing"), v.literal("completed"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    const { transcriptionId, ...updates } = args;
    await ctx.db.patch(transcriptionId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
