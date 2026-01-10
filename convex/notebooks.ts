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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notebooks", {
      userId: args.userId,
      title: args.title,
      structure: { folders: {} },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addFolder = mutation({
  args: {
    notebookId: v.id("notebooks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const notebook = await ctx.db.get(args.notebookId);
    if (!notebook) throw new Error("Notebook not found");

    const folderId = crypto.randomUUID();
    const newStructure = {
      ...notebook.structure,
      folders: {
        ...notebook.structure.folders,
        [folderId]: {
          title: args.title,
          notes: [],
        },
      },
    };

    await ctx.db.patch(args.notebookId, {
      structure: newStructure,
      updatedAt: Date.now(),
    });
    
    return folderId;
  },
});

export const addNoteToFolder = mutation({
  args: {
    notebookId: v.id("notebooks"),
    folderId: v.string(),
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const notebook = await ctx.db.get(args.notebookId);
    if (!notebook) throw new Error("Notebook not found");

    const folders = notebook.structure.folders;
    if (!folders[args.folderId]) throw new Error("Folder not found");

    const newStructure = {
      ...notebook.structure,
      folders: {
        ...folders,
        [args.folderId]: {
          ...folders[args.folderId],
          notes: [...folders[args.folderId].notes, args.noteId],
        },
      },
    };

    await ctx.db.patch(args.notebookId, {
      structure: newStructure,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    notebookId: v.id("notebooks"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { notebookId, ...updates } = args;
    await ctx.db.patch(notebookId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateFolder = mutation({
  args: {
    notebookId: v.id("notebooks"),
    folderId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const notebook = await ctx.db.get(args.notebookId);
    if (!notebook) throw new Error("Notebook not found");

    const folders = notebook.structure.folders;
    if (!folders[args.folderId]) throw new Error("Folder not found");

    const newStructure = {
      ...notebook.structure,
      folders: {
        ...folders,
        [args.folderId]: {
          ...folders[args.folderId],
          title: args.title,
        },
      },
    };

    await ctx.db.patch(args.notebookId, {
      structure: newStructure,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { notebookId: v.id("notebooks") },
  handler: async (ctx, args) => {
    // Also delete all notes in this notebook
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_notebook", (q) => q.eq("notebookId", args.notebookId))
      .collect();
    
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }
    
    await ctx.db.delete(args.notebookId);
  },
});

export const deleteFolder = mutation({
  args: {
    notebookId: v.id("notebooks"),
    folderId: v.string(),
  },
  handler: async (ctx, args) => {
    const notebook = await ctx.db.get(args.notebookId);
    if (!notebook) throw new Error("Notebook not found");

    const folders = notebook.structure.folders;
    if (!folders[args.folderId]) throw new Error("Folder not found");

    // Delete all notes in this folder
    const noteIds = folders[args.folderId].notes || [];
    for (const noteId of noteIds) {
      await ctx.db.delete(noteId);
    }

    // Remove folder from structure
    const { [args.folderId]: _, ...remainingFolders } = folders;
    const newStructure = {
      ...notebook.structure,
      folders: remainingFolders,
    };

    await ctx.db.patch(args.notebookId, {
      structure: newStructure,
      updatedAt: Date.now(),
    });
  },
});
