"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FileBrowserProps {
  notebookId: Id<"notebooks">;
  activeNoteId: Id<"notes">;
}

export function FileBrowser({ notebookId, activeNoteId }: FileBrowserProps) {
  const notebook = useQuery(api.notebooks.get, { notebookId });
  const router = useRouter();
  
  // State for expanded folders (default all open)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId]
    }));
  };

  if (!notebook) return <div className="p-4 text-sm text-gray-500">Loading structure...</div>;

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <h2 className="font-semibold truncate text-gray-900" title={notebook.title}>
          {notebook.title}
        </h2>
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-xs text-blue-600 hover:underline mt-1 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(notebook.structure?.folders || {}).map(([folderId, folder]: [string, any]) => {
          const isExpanded = expandedFolders[folderId] !== false; // Default true
          
          return (
            <div key={folderId} className="mb-1">
              <div 
                className="flex items-center px-2 py-1.5 hover:bg-gray-200 rounded cursor-pointer text-sm font-medium text-gray-800"
                onClick={() => toggleFolder(folderId)}
              >
                <span className="mr-1 w-4 text-center text-gray-500">{isExpanded ? "▼" : "▶"}</span>
                <span className="truncate">{folder.title}</span>
              </div>
              
              {isExpanded && (
                <div className="ml-4 border-l border-gray-300 pl-1 mt-1 space-y-0.5">
                  {folder.notes?.map((noteId: Id<"notes">) => (
                    <FileBrowserNoteItem 
                      key={noteId} 
                      noteId={noteId} 
                      isActive={noteId === activeNoteId}
                    />
                  ))}
                  {(!folder.notes || folder.notes.length === 0) && (
                    <div className="text-xs text-gray-500 pl-2 py-1 italic">No notes</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(notebook.structure?.folders || {}).length === 0 && (
           <div className="text-sm text-gray-500 p-4 text-center">
             No folders. Add one from the dashboard.
           </div>
        )}
      </div>
    </div>
  );
}

function FileBrowserNoteItem({ noteId, isActive }: { noteId: Id<"notes">, isActive: boolean }) {
  const note = useQuery(api.notes.get, { noteId });
  const router = useRouter();

  if (!note) return <div className="pl-6 text-xs text-gray-400 py-1">Loading...</div>;

  return (
    <div 
      onClick={() => router.push(`/notes/${noteId}`)}
      className={`
        px-2 py-1.5 text-sm rounded cursor-pointer truncate flex items-center transition-colors
        ${isActive ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"}
      `}
      title={note.title}
    >
      <span className="mr-2 opacity-75">📄</span>
      {note.title}
    </div>
  );
}
