"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { FileBrowser } from "@/components/notes/FileBrowser";
import { NoteEditor, NoteEditorHandle } from "@/components/notes/NoteEditor";
import { useState, useEffect, use, useRef } from "react";
import { FloatingChat } from "@/components/ai-conversation/FloatingChat";

export default function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params) as { noteId: Id<"notes"> };
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);
  
  const [title, setTitle] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<Id<"threads"> | null>(null);
  const editorRef = useRef<NoteEditorHandle>(null);

  useEffect(() => {
    if (note?.title) {
      setTitle(note.title);
    }
  }, [note?.title]); 
  
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

  const handleThreadDelete = (threadId: string) => {
    editorRef.current?.removeThreadMark(threadId);
  };

  if (note === undefined) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (note === null) return <div className="h-screen flex items-center justify-center">Note not found</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-white relative">
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
              ref={editorRef}
              initialContent={note.content} 
              noteId={noteId}
              onChange={handleContentChange}
              onThreadSelect={(threadId) => setActiveThreadId(threadId)}
            />
          </div>
        </div>
      </div>

      {activeThreadId && (
        <FloatingChat 
          threadId={activeThreadId}
          noteId={noteId}
          onClose={() => setActiveThreadId(null)}
          onThreadDelete={handleThreadDelete}
        />
      )}
    </div>
  );
}
