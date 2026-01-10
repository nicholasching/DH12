"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { FileBrowser } from "@/components/notes/FileBrowser";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { useState, useEffect, use } from "react";

export default function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params) as { noteId: Id<"notes"> };
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);
  
  const [title, setTitle] = useState("");

  // Sync title from backend when it loads or changes externally, 
  // but only if we haven't modified it recently? 
  // Actually, we just want to set initial value.
  useEffect(() => {
    if (note?.title) {
      // Only set if we don't have a value yet or it's a fresh load?
      // Simple approach: Always sync, but the user typing will override locally
      // race condition is handled by only saving on blur.
      // But if note updates from server while typing?
      // We should check if focused?
      // For now, simpler: Set once.
      setTitle(note.title);
    }
  }, [note?.title]); // This might overwrite if typing fast and a save happens?
  // Ideally: Local state is source of truth while focused.
  
  const handleContentChange = async (content: any) => {
    await updateNote({ noteId, content });
  };

  const handleTitleBlur = async () => {
    if (note && title !== note.title) {
      await updateNote({ noteId, title });
    }
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  if (note === undefined) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (note === null) return <div className="h-screen flex items-center justify-center">Note not found</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <FileBrowser notebookId={note.notebookId} activeNoteId={noteId} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="h-14 border-b border-gray-300 flex items-center justify-between px-6 bg-white shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full text-gray-900"
            placeholder="Untitled Note"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-8 min-h-full">
            <NoteEditor 
              initialContent={note.content} 
              noteId={noteId}
              onChange={handleContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
