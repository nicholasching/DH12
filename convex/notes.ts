import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

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

export const create = mutation({
  args: {
    notebookId: v.id("notebooks"),
    userId: v.string(),
    title: v.string(),
    content: v.any(), // TipTap JSON
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
    content: v.optional(v.any()),
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
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");

    // Remove note from folder structure
    const notebook = await ctx.db.get(note.notebookId);
    if (notebook) {
      const folders = notebook.structure.folders || {};
      for (const [folderId, folder] of Object.entries(folders)) {
        const folderData = folder as any;
        if (folderData.notes?.includes(args.noteId)) {
          const newNotes = folderData.notes.filter((id: any) => id !== args.noteId);
          const newStructure = {
            ...notebook.structure,
            folders: {
              ...folders,
              [folderId]: {
                ...folderData,
                notes: newNotes,
              },
            },
          };
          await ctx.db.patch(note.notebookId, {
            structure: newStructure,
            updatedAt: Date.now(),
          });
          break;
        }
      }
    }

    // Delete the note
    await ctx.db.delete(args.noteId);
  },
});
