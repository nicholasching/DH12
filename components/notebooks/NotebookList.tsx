"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

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
  const addFolder = useMutation(api.notebooks.addFolder);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    await addFolder({ notebookId: notebook._id, title: newFolderTitle });
    setNewFolderTitle("");
    setIsAddingFolder(false);
  };

  return (
    <div className={`bg-white rounded-lg border transition-all ${isExpanded ? 'row-span-2 ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
      <div 
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={onToggle}
      >
        <h3 className="font-semibold text-lg text-black">{notebook.title}</h3>
        <span className="text-sm text-black">
          {Object.keys(notebook.structure?.folders || {}).length} folders
        </span>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-100 rounded-b-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-black">Folders</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsAddingFolder(true); }}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium border border-blue-200"
            >
              + New Folder
            </button>
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
              <button type="submit" className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Add</button>
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
  const { user } = useUser();

  const handleCreateNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const noteId = await createNote({
      notebookId,
      userId: user.id,
      title: "Untitled Note",
      content: {}, // Empty TipTap doc
    });

    await addNoteToFolder({
      notebookId,
      folderId,
      noteId,
    });

    router.push(`/notes/${noteId}`);
  };

  return (
    <div className="pl-2 border-l-2 border-gray-300">
      <div className="flex justify-between items-center group py-1">
        <span className="text-sm font-medium text-black">{folder.title}</span>
        <button 
          onClick={handleCreateNote}
          className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline font-medium"
        >
          + Note
        </button>
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

  if (!note) return <div className="text-xs text-gray-400">Loading...</div>;

  return (
    <div 
      onClick={() => router.push(`/notes/${noteId}`)}
      className="text-xs text-black hover:text-blue-700 cursor-pointer truncate py-0.5 hover:bg-gray-100 rounded px-1 -ml-1"
    >
      📄 {note.title}
    </div>
  );
}
