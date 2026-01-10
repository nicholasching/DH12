import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notebooks: defineTable({
    userId: v.string(),
    title: v.string(),
    structure: v.object({
      folders: v.any(), // Record<string, { title: string, notes: Id<"notes">[] }>
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  notes: defineTable({
    notebookId: v.id("notebooks"),
    userId: v.string(),
    title: v.string(),
    content: v.any(), // TipTap JSON content
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_notebook", ["notebookId"])
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  drawings: defineTable({
    noteId: v.id("notes"),
    userId: v.string(),
    data: v.any(), // tldraw store snapshot
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"]),

  threads: defineTable({
    noteId: v.id("notes"),
    userId: v.string(),
    selectionText: v.string(),
    messages: v.array(
      v.object({
        role: v.string(), // "user" | "assistant"
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"]),

  transcriptions: defineTable({
    noteId: v.optional(v.id("notes")),
    userId: v.string(),
    sessionId: v.string(),
    transcript: v.string(),
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("error")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
});
