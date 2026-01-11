"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { Button } from "@/components/ui/button";

export function NotebookList() {
  const { user } = useUser();
  const router = useRouter();
  const notebooks = useQuery(
    api.notebooks.list,
    user?.id ? { userId: user.id } : "skip"
  );
  
  const [expandedNotebook, setExpandedNotebook] = useState<Id<"notebooks"> | null>(null);

  if (!user) return null;
  if (notebooks === undefined) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notebooks.length === 0 ? (
        <div className="col-span-full text-center py-12 text-black bg-white rounded-lg border border-dashed">
          No notebooks yet. Create one to get started!
        </div>
      ) : (
        notebooks.map((notebook) => (
          <NotebookCard 
            key={notebook._id} 
            notebook={notebook}
            isExpanded={expandedNotebook === notebook._id}
            onToggle={() => setExpandedNotebook(
              expandedNotebook === notebook._id ? null : notebook._id
            )}
          />
        ))
      )}
    </div>
  );
}

function NotebookCard({ notebook, isExpanded, onToggle }: { 
  notebook: any, 
  isExpanded: boolean,
  onToggle: () => void 
}) {
  const router = useRouter();
  const addFolder = useMutation(api.notebooks.addFolder);
  const updateNotebook = useMutation(api.notebooks.update);
  const deleteNotebook = useMutation(api.notebooks.remove);
  const deleteFolder = useMutation(api.notebooks.deleteFolder);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    await addFolder({ notebookId: notebook._id, title: newFolderTitle });
    setNewFolderTitle("");
    setIsAddingFolder(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingValue(notebook.title);
  };

  const handleRenameSubmit = async () => {
    if (!editingValue.trim()) {
      setIsEditing(false);
      setEditingValue("");
      return;
    }

    try {
      await updateNotebook({ notebookId: notebook._id, title: editingValue.trim() });
    } catch (error) {
      console.error("Failed to rename notebook:", error);
    }
    setIsEditing(false);
    setEditingValue("");
  };

  const handleDeleteNotebook = async () => {
    try {
      await deleteNotebook({ notebookId: notebook._id });
    } catch (error) {
      console.error("Failed to delete notebook:", error);
    }
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className={`bg-white rounded-lg border transition-all ${isExpanded ? 'row-span-2 ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
      <div 
        className="p-4 cursor-pointer flex justify-between items-center group"
        onClick={onToggle}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditingValue("");
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 font-semibold text-lg text-black bg-white border border-blue-500 rounded px-2 py-1"
          />
        ) : (
          <>
            <h3 className="font-semibold text-lg text-black">{notebook.title}</h3>
            <span className="text-sm text-black">
              {Object.keys(notebook.structure?.folders || {}).length} folders
            </span>
          </>
        )}
        {!isEditing && (
          <OverflowMenu
            onDelete={handleDeleteNotebook}
            className="ml-2"
          />
        )}
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-100 rounded-b-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-black">Folders</h4>
            <Button 
              onClick={(e) => { e.stopPropagation(); setIsAddingFolder(true); }}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              + New Folder
            </Button>
          </div>

          {isAddingFolder && (
            <form onSubmit={handleAddFolder} className="mb-3 flex gap-2">
              <input
                autoFocus
                type="text"
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                placeholder="Folder name"
                className="flex-1 text-sm px-2 py-1 border rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <Button type="submit" className="text-xs px-2 py-1">Add</Button>
            </form>
          )}

          <div className="space-y-2">
            {Object.entries(notebook.structure?.folders || {}).map(([folderId, folder]: [string, any]) => (
              <FolderItem 
                key={folderId} 
                folderId={folderId} 
                folder={folder} 
                notebookId={notebook._id}
              />
            ))}
            {Object.keys(notebook.structure?.folders || {}).length === 0 && !isAddingFolder && (
              <p className="text-sm text-black italic">No folders yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FolderItem({ folderId, folder, notebookId }: { folderId: string, folder: any, notebookId: Id<"notebooks"> }) {
  const router = useRouter();
  const createNote = useMutation(api.notes.create);
  const addNoteToFolder = useMutation(api.notebooks.addNoteToFolder);
  const updateFolder = useMutation(api.notebooks.updateFolder);
  const deleteFolder = useMutation(api.notebooks.deleteFolder);
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const noteId = await createNote({
      notebookId,
      userId: user.id,
      title: "Untitled Page",
      content: {}, // Empty TipTap doc
    });

    await addNoteToFolder({
      notebookId,
      folderId,
      noteId,
    });

    router.push(`/notes/${noteId}`);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingValue(folder.title);
  };

  const handleRenameSubmit = async () => {
    if (!editingValue.trim()) {
      setIsEditing(false);
      setEditingValue("");
      return;
    }

    try {
      await updateFolder({ notebookId, folderId, title: editingValue.trim() });
    } catch (error) {
      console.error("Failed to rename folder:", error);
    }
    setIsEditing(false);
    setEditingValue("");
  };

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder({ notebookId, folderId });
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="pl-2 border-l-2 border-gray-300">
      <div className="flex justify-between items-center group py-1" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditingValue("");
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm font-medium text-black bg-white border border-blue-500 rounded px-2 py-1"
          />
        ) : (
          <>
            <span className="text-sm font-medium text-black">{folder.title}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCreateNote}
                className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline font-medium"
              >
                + Note
              </button>
              <OverflowMenu
                onDelete={handleDeleteFolder}
              />
            </div>
          </>
        )}
      </div>
      <div className="ml-2 mt-1 space-y-1">
        {folder.notes?.map((noteId: Id<"notes">) => (
          <NoteLink key={noteId} noteId={noteId} />
        ))}
      </div>
    </div>
  );
}

function NoteLink({ noteId }: { noteId: Id<"notes"> }) {
  const note = useQuery(api.notes.get, { noteId });
  const router = useRouter();
  const updateNote = useMutation(api.notes.update);
  const deleteNote = useMutation(api.notes.remove);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note) {
      setIsEditing(true);
      setEditingValue(note.title);
    }
  };

  const handleRenameSubmit = async () => {
    if (!editingValue.trim() || !note) {
      setIsEditing(false);
      setEditingValue("");
      return;
    }

    try {
      await updateNote({ noteId, title: editingValue.trim() });
    } catch (error) {
      console.error("Failed to rename note:", error);
    }
    setIsEditing(false);
    setEditingValue("");
  };

  const handleDeleteNote = async () => {
    try {
      await deleteNote({ noteId });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  if (!note) return <div className="text-xs text-gray-400">Loading...</div>;

  return (
    <div 
      onClick={() => !isEditing && router.push(`/notes/${noteId}`)}
      onDoubleClick={handleDoubleClick}
      className="text-xs text-black hover:text-blue-700 cursor-pointer truncate py-0.5 hover:bg-gray-100 rounded px-1 -ml-1 group flex items-center gap-2"
    >
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditingValue("");
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs bg-white border border-blue-500 rounded px-2 py-1"
        />
      ) : (
        <>
          <span>📄 {note.title}</span>
          <OverflowMenu
            onDelete={handleDeleteNote}
            className="opacity-0 group-hover:opacity-100 ml-auto"
          />
        </>
      )}
    </div>
  );
}
