"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { useState } from "react";

interface PagesListProps {
  notebookId: Id<"notebooks"> | null;
  folderId: string | null;
  activeNoteId: Id<"notes"> | null;
}

export function PagesList({ notebookId, folderId, activeNoteId }: PagesListProps) {
  const router = useRouter();
  const { user } = useUser();
  const createNote = useMutation(api.notes.create);
  const addNoteToFolder = useMutation(api.notebooks.addNoteToFolder);

  const notebook = useQuery(
    api.notebooks.get,
    notebookId ? { notebookId } : "skip"
  );

  const folder = notebook && folderId ? notebook.structure?.folders?.[folderId] : null;
  const noteIds = folder?.notes || [];

  const handleAddPage = async () => {
    if (!notebookId || !folderId || !user) return;

    try {
      const noteId = await createNote({
        notebookId,
        userId: user.id,
        title: "Untitled Page",
        content: {},
      });

      await addNoteToFolder({
        notebookId,
        folderId,
        noteId,
      });

      router.push(`/notes/${noteId}`);
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  };

  if (!notebookId || !folderId) {
    return (
      <div className="w-80 bg-white border-r border-gray-300 h-full flex items-center justify-center">
        <div className="text-sm text-gray-500 text-center px-4">
          Select a folder to view pages
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-300 h-full flex flex-col">
      <div className="p-4 border-b border-gray-300">
        <button
          onClick={handleAddPage}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <Plus size={16} />
          <span>Add Page</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {noteIds.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 text-center">
            No pages yet. Click "Add Page" to create one.
          </div>
        ) : (
          <div className="space-y-1">
            {noteIds.map((noteId: Id<"notes">) => (
              <PageItem key={noteId} noteId={noteId} isActive={noteId === activeNoteId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageItem({ noteId, isActive }: { noteId: Id<"notes">; isActive: boolean }) {
  const router = useRouter();
  const note = useQuery(api.notes.get, { noteId });

  if (!note) {
    return (
      <div className="px-4 py-2 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/notes/${noteId}`)}
      className={`
        px-4 py-2 rounded cursor-pointer transition-colors
        ${isActive ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-100"}
      `}
    >
      <div className="text-sm truncate">{note.title}</div>
    </div>
  );
}

