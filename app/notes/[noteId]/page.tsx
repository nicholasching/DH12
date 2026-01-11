"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NoteEditor, NoteEditorHandle } from "@/components/notes/NoteEditor";
import { TopHeader } from "@/components/notes/TopHeader";
import { NotebookSidebar } from "@/components/notes/NotebookSidebar";
import { PagesList } from "@/components/notes/PagesList";
import { useState, useEffect, use, useRef, useMemo } from "react";
import { FloatingChat } from "@/components/ai-conversation/FloatingChat";

export default function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params) as { noteId: Id<"notes"> };
  const note = useQuery(api.notes.get, { noteId });
  const updateNote = useMutation(api.notes.update);
  
  const [title, setTitle] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<Id<"threads"> | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<Id<"notebooks"> | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isNotebookCollapsed, setIsNotebookCollapsed] = useState(false);
  const [isPagesCollapsed, setIsPagesCollapsed] = useState(false);
  const [notebookWidth, setNotebookWidth] = useState(256); // 64 * 4 = 256px default
  const [pagesWidth, setPagesWidth] = useState(320); // 80 * 4 = 320px default
  const [isResizingNotebook, setIsResizingNotebook] = useState(false);
  const [isResizingPages, setIsResizingPages] = useState(false);
  const editorRef = useRef<NoteEditorHandle>(null);

  // Get notebook to find which folder contains this note
  const notebook = useQuery(
    api.notebooks.get,
    note?.notebookId ? { notebookId: note.notebookId } : "skip"
  );

  // Find the folder that contains this note
  const currentFolderId = useMemo(() => {
    if (!notebook || !noteId) return null;
    const folders = notebook.structure?.folders || {};
    for (const [folderId, folder] of Object.entries(folders)) {
      if ((folder as any).notes?.includes(noteId)) {
        return folderId;
      }
    }
    return null;
  }, [notebook, noteId]);

  // Set selected notebook and folder when note loads
  useEffect(() => {
    if (note?.notebookId && currentFolderId) {
      setSelectedNotebookId(note.notebookId);
      setSelectedFolderId(currentFolderId);
    }
  }, [note?.notebookId, currentFolderId]);

  useEffect(() => {
    if (note?.title) {
      setTitle(note.title);
    }
  }, [note?.title]); 
  
  const handleContentChange = async (content: any) => {
    try {
      await updateNote({ noteId, content });
    } catch (e) {
      console.error("Failed to save note:", e);
    }
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

  const handleNotebookSelect = (notebookId: Id<"notebooks">) => {
    setSelectedNotebookId(notebookId);
    setSelectedFolderId(null);
  };

  const handleFolderSelect = (notebookId: Id<"notebooks">, folderId: string | null) => {
    setSelectedNotebookId(notebookId);
    setSelectedFolderId(folderId);
  };

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingNotebook) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setNotebookWidth(newWidth);
      } else if (isResizingPages) {
        const startX = notebookWidth + (isNotebookCollapsed ? 48 : 0);
        const newWidth = Math.max(200, Math.min(600, e.clientX - startX));
        setPagesWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingNotebook(false);
      setIsResizingPages(false);
    };

    if (isResizingNotebook || isResizingPages) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingNotebook, isResizingPages, notebookWidth, isNotebookCollapsed]);

  if (note === undefined) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (note === null) return <div className="h-screen flex items-center justify-center">Note not found</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white relative">
      {/* Top Header */}
      <TopHeader noteId={noteId} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Notebooks */}
        <div style={{ width: isNotebookCollapsed ? 48 : notebookWidth }} className="relative">
          <NotebookSidebar
            selectedNotebookId={selectedNotebookId}
            selectedFolderId={selectedFolderId}
            onNotebookSelect={handleNotebookSelect}
            onFolderSelect={handleFolderSelect}
            isCollapsed={isNotebookCollapsed}
            onToggleCollapse={() => setIsNotebookCollapsed(!isNotebookCollapsed)}
          />
          {!isNotebookCollapsed && (
            <div
              onMouseDown={() => setIsResizingNotebook(true)}
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20"
              style={{ cursor: 'col-resize' }}
            />
          )}
        </div>

        {/* Middle Column - Pages List */}
        <div style={{ width: isPagesCollapsed ? 48 : pagesWidth }} className="relative">
          <PagesList
            notebookId={selectedNotebookId}
            folderId={selectedFolderId}
            activeNoteId={noteId}
            isCollapsed={isPagesCollapsed}
            onToggleCollapse={() => setIsPagesCollapsed(!isPagesCollapsed)}
          />
          {!isPagesCollapsed && (
            <div
              onMouseDown={() => setIsResizingPages(true)}
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20"
              style={{ cursor: 'col-resize' }}
            />
          )}
        </div>

        {/* Right Column - Note Editor */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white min-w-0">
          <div className="border-b border-gray-300 px-4 sm:px-8 py-4 bg-white shrink-0">
            <div className="text-sm text-gray-500 mb-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full text-gray-900"
              placeholder="Untitled Page"
            />
            <div className="h-px bg-gray-300 mt-2" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto py-8 px-8 min-h-full">
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
