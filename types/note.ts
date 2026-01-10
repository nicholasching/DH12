import { Id } from "convex/server";

export interface Note {
  _id: Id<"notes">;
  _creationTime: number;
  notebookId: Id<"notebooks">;
  userId: string;
  title: string;
  content: string; // JSON stringified tiptap content
  createdAt: number;
  updatedAt: number;
}

export interface CreateNoteInput {
  notebookId: Id<"notebooks">;
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}
