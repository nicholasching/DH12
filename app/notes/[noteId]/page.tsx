"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { FileBrowser } from "@/components/notes/FileBrowser";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { useState, useEffect, use } from "react";
import { AIConversationTab } from "@/components/ai-conversation/AIConversationTab";

export default function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params) as { noteId: Id<"notes"> };
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);
  
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<Id<"threads"> | undefined>(undefined);

  const handleContentChange = async (content: any) => {
    await updateNote({ noteId, content });
  };

  const handleTitleChange = async (title: string) => {
    await updateNote({ noteId, title });
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
            value={note.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full text-gray-900"
            placeholder="Untitled Note"
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors font-medium ${showRightPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
            >
              {showRightPanel ? "Hide AI Panel" : "Show AI Panel"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-8 min-h-full">
            <NoteEditor 
              initialContent={note.content} 
              noteId={noteId}
              onChange={handleContentChange}
              onThreadSelect={(threadId) => {
                setActiveThreadId(threadId);
                setShowRightPanel(true);
              }}
            />
          </div>
        </div>
      </div>

      {showRightPanel && (
        <div className="w-80 border-l bg-white h-full flex flex-col shrink-0">
          <AIConversationTab 
             conversationId={activeThreadId as any} 
             parentContext={{ noteId }}
          />
        </div>
      )}
    </div>
  );
}
