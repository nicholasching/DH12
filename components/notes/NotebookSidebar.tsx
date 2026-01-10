"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, BookOpen, Play, FileText, ClipboardList, Folder, Plus } from "lucide-react";

interface NotebookSidebarProps {
  selectedNotebookId: Id<"notebooks"> | null;
  selectedFolderId: string | null;
  onNotebookSelect: (notebookId: Id<"notebooks">) => void;
  onFolderSelect: (notebookId: Id<"notebooks">, folderId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function NotebookSidebar({
  selectedNotebookId,
  selectedFolderId,
  onNotebookSelect,
  onFolderSelect,
  isCollapsed,
  onToggleCollapse,
}: NotebookSidebarProps) {
  const { user } = useUser();
  const notebooks = useQuery(
    api.notebooks.list,
    user?.id ? { userId: user.id } : "skip"
  );
  const addFolder = useMutation(api.notebooks.addFolder);
  const updateNotebook = useMutation(api.notebooks.update);
  const updateFolder = useMutation(api.notebooks.updateFolder);

  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<{ type: 'notebook' | 'folder', notebookId: string, folderId?: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState<Id<"notebooks"> | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks((prev) => ({
      ...prev,
      [notebookId]: !prev[notebookId],
    }));
  };

  const handleDoubleClick = (e: React.MouseEvent, type: 'notebook' | 'folder', notebookId: string, folderId?: string, currentTitle?: string) => {
    e.stopPropagation();
    setEditingId({ type, notebookId, folderId });
    setEditingValue(currentTitle || "");
  };

  const handleRenameSubmit = async () => {
    if (!editingId || !editingValue.trim()) {
      setEditingId(null);
      return;
    }

    try {
      if (editingId.type === 'notebook') {
        await updateNotebook({ notebookId: editingId.notebookId as Id<"notebooks">, title: editingValue.trim() });
      } else if (editingId.type === 'folder' && editingId.folderId) {
        await updateFolder({ notebookId: editingId.notebookId as Id<"notebooks">, folderId: editingId.folderId, title: editingValue.trim() });
      }
    } catch (error) {
      console.error("Failed to rename:", error);
    }
    setEditingId(null);
    setEditingValue("");
  };

  const handleAddFolder = async (notebookId: Id<"notebooks">) => {
    if (!newFolderTitle.trim()) {
      setIsAddingFolder(null);
      setNewFolderTitle("");
      return;
    }

    try {
      await addFolder({ notebookId, title: newFolderTitle.trim() });
      setNewFolderTitle("");
      setIsAddingFolder(null);
    } catch (error) {
      console.error("Failed to add folder:", error);
    }
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const getFolderIcon = (folderTitle: string) => {
    const title = folderTitle.toLowerCase();
    if (title.includes("lecture")) return <BookOpen size={16} className="text-purple-600" />;
    if (title.includes("tutorial")) return <Play size={16} className="text-blue-600" />;
    if (title.includes("practice")) return <Play size={16} className="text-green-600" />;
    if (title.includes("assignment")) return <ClipboardList size={16} className="text-orange-600" />;
    return <FileText size={16} className="text-gray-600" />;
  };

  const getNotebookIcon = (index: number) => {
    const colors = ["text-purple-600", "text-orange-600"];
    const color = colors[index % colors.length];
    return <Folder size={16} className={color} />;
  };

  if (!notebooks) {
    return (
      <div className={`${isCollapsed ? 'w-12' : 'w-full'} bg-gray-100 border-r border-gray-300 h-full flex items-center justify-center transition-all duration-200`}>
        {!isCollapsed && <div className="text-sm text-gray-500">Loading...</div>}
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-12' : 'w-full'} bg-gray-100 border-r border-gray-300 h-full flex flex-col transition-all duration-200 relative`}>
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-gray-700" />
        ) : (
          <ChevronLeft size={14} className="text-gray-700" />
        )}
      </button>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2">
        {notebooks.map((notebook, index) => {
          const isExpanded = expandedNotebooks[notebook._id] ?? false;
          const isSelected = selectedNotebookId === notebook._id;
          const folders = notebook.structure?.folders || {};

          return (
            <div key={notebook._id} className="mb-2">
              <div
                className={`
                  flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors group
                  ${isSelected ? "bg-gray-200" : "hover:bg-gray-200"}
                `}
                onClick={() => {
                  toggleNotebook(notebook._id);
                  if (!isSelected) {
                    onNotebookSelect(notebook._id);
                  }
                }}
                onDoubleClick={(e) => handleDoubleClick(e, 'notebook', notebook._id, undefined, notebook.title)}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
                {getNotebookIcon(index)}
                {editingId?.type === 'notebook' && editingId.notebookId === notebook._id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit();
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingValue("");
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm font-medium text-gray-900 bg-white border border-blue-500 rounded px-2 py-1"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                    {notebook.title}
                  </span>
                )}
              </div>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {Object.entries(folders).map(([folderId, folder]: [string, any]) => {
                    const isFolderSelected =
                      selectedNotebookId === notebook._id && selectedFolderId === folderId;
                    const isEditing = editingId?.type === 'folder' && editingId.notebookId === notebook._id && editingId.folderId === folderId;

                    return (
                      <div
                        key={folderId}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors group
                          ${isFolderSelected ? "bg-gray-200" : "hover:bg-gray-200"}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFolderSelect(notebook._id, folderId);
                        }}
                        onDoubleClick={(e) => handleDoubleClick(e, 'folder', notebook._id, folderId, folder.title)}
                      >
                        {getFolderIcon(folder.title)}
                        {isEditing ? (
                          <input
                            ref={isEditing ? editInputRef : null}
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit();
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditingValue("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm text-gray-700 bg-white border border-blue-500 rounded px-2 py-1"
                          />
                        ) : (
                          <span className="flex-1 text-sm text-gray-700 truncate">
                            {folder.title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {isSelected && (
                    <div className="px-3 py-1">
                      {isAddingFolder === notebook._id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            type="text"
                            value={newFolderTitle}
                            onChange={(e) => setNewFolderTitle(e.target.value)}
                            onBlur={() => handleAddFolder(notebook._id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddFolder(notebook._id);
                              if (e.key === 'Escape') {
                                setIsAddingFolder(null);
                                setNewFolderTitle("");
                              }
                            }}
                            placeholder="Folder name"
                            className="flex-1 text-sm px-2 py-1 border border-blue-500 rounded bg-white"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingFolder(notebook._id);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-300 transition-colors w-full"
                        >
                          <Plus size={14} />
                          <span>Add Folder</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

          {notebooks.length === 0 && (
            <div className="text-sm text-gray-500 p-4 text-center">
              No notebooks yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

