"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { OverflowMenu } from "@/components/ui/OverflowMenu";

interface PagesListProps {
  notebookId: Id<"notebooks"> | null;
  folderId: string | null;
  activeNoteId: Id<"notes"> | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function PagesList({ notebookId, folderId, activeNoteId, isCollapsed, onToggleCollapse }: PagesListProps) {
  const router = useRouter();
  const { user } = useUser();
  const createNote = useMutation(api.notes.create);
  const addNoteToFolder = useMutation(api.notebooks.addNoteToFolder);
  const updateNote = useMutation(api.notes.update);
  const deleteNote = useMutation(api.notes.remove);

  const [editingNoteId, setEditingNoteId] = useState<Id<"notes"> | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editingNoteId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNoteId]);

  const handleRenamePage = async (noteId: Id<"notes">) => {
    if (!editingValue.trim()) {
      setEditingNoteId(null);
      setEditingValue("");
      return;
    }

    try {
      await updateNote({ noteId, title: editingValue.trim() });
    } catch (error) {
      console.error("Failed to rename page:", error);
    }
    setEditingNoteId(null);
    setEditingValue("");
  };

  const handleDeletePage = async (noteId: Id<"notes">) => {
    try {
      await deleteNote({ noteId });
      // If this was the active note, navigate away
      if (noteId === activeNoteId) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  if (!notebookId || !folderId) {
    return (
      <div className={`${isCollapsed ? 'w-12' : 'w-full'} bg-white border-r border-gray-300 h-full flex items-center justify-center transition-all duration-200`}>
        {!isCollapsed && (
          <div className="text-sm text-gray-500 text-center px-4">
            Select a folder to view pages
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-12' : 'w-full'} bg-white border-r border-gray-300 h-full flex flex-col transition-all duration-200 relative`}>
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        aria-label={isCollapsed ? "Expand pages list" : "Collapse pages list"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-gray-700" />
        ) : (
          <ChevronLeft size={14} className="text-gray-700" />
        )}
      </button>

      {!isCollapsed && (
        <>
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
                  <PageItem 
                    key={noteId} 
                    noteId={noteId} 
                    isActive={noteId === activeNoteId}
                    isEditing={editingNoteId === noteId}
                    editingValue={editingValue}
                    onStartEdit={(noteId, title) => {
                      setEditingNoteId(noteId);
                      setEditingValue(title);
                    }}
                    onEditChange={setEditingValue}
                    onEditSubmit={handleRenamePage}
                    onEditCancel={() => {
                      setEditingNoteId(null);
                      setEditingValue("");
                    }}
                    onDelete={handleDeletePage}
                    editInputRef={editInputRef}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PageItem({ 
  noteId, 
  isActive, 
  isEditing,
  editingValue,
  onStartEdit,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDelete,
  editInputRef
}: { 
  noteId: Id<"notes">; 
  isActive: boolean;
  isEditing: boolean;
  editingValue: string;
  onStartEdit: (noteId: Id<"notes">, title: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: (noteId: Id<"notes">) => void;
  onEditCancel: () => void;
  onDelete: (noteId: Id<"notes">) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
}) {
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
      onClick={() => !isEditing && router.push(`/notes/${noteId}`)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit(noteId, note.title);
      }}
      className={`
        px-4 py-2 rounded cursor-pointer transition-colors group flex items-center gap-2
        ${isActive ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-100"}
      `}
    >
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onEditSubmit(noteId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit(noteId);
            if (e.key === 'Escape') onEditCancel();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm bg-white border border-blue-500 rounded px-2 py-1 text-black"
        />
      ) : (
        <>
          <div className="flex-1 text-sm truncate">{note.title}</div>
          <OverflowMenu
            onDelete={() => onDelete(noteId)}
            className="ml-auto"
          />
        </>
      )}
    </div>
  );
}

