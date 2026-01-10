import { Id } from "convex/server";

export interface Notebook {
  _id: Id<"notebooks">;
  _creationTime: number;
  userId: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateNotebookInput {
  title: string;
  description?: string;
}

export interface UpdateNotebookInput {
  title?: string;
  description?: string;
}
