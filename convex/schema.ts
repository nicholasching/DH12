import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notebooks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  notes: defineTable({
    notebookId: v.id("notebooks"),
    userId: v.string(),
    title: v.string(),
    content: v.string(), // JSON stringified tiptap content
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_notebook", ["notebookId"])
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

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

  conversations: defineTable({
    parentId: v.optional(v.id("conversations")), // For threading
    noteId: v.optional(v.id("notes")),
    transcriptionId: v.optional(v.id("transcriptions")),
    userId: v.string(),
    selectionText: v.optional(v.string()), // Selected text that triggered conversation
    selectionStart: v.optional(v.number()),
    selectionEnd: v.optional(v.number()),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_note", ["noteId"])
    .index("by_transcription", ["transcriptionId"])
    .index("by_user", ["userId"]),

  drawings: defineTable({
    noteId: v.optional(v.id("notes")),
    userId: v.string(),
    qrCode: v.string(), // QR code data
    tldrawData: v.string(), // JSON stringified tldraw document
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"]),
});
