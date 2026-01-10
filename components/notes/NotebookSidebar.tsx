"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "convex/values";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, ChevronDown, ChevronRight, BookOpen, Play, FileText, ClipboardList, Folder } from "lucide-react";

interface NotebookSidebarProps {
  selectedNotebookId: Id<"notebooks"> | null;
  selectedFolderId: string | null;
  onNotebookSelect: (notebookId: Id<"notebooks">) => void;
  onFolderSelect: (notebookId: Id<"notebooks">, folderId: string) => void;
}

export function NotebookSidebar({
  selectedNotebookId,
  selectedFolderId,
  onNotebookSelect,
  onFolderSelect,
}: NotebookSidebarProps) {
  const { user } = useUser();
  const notebooks = useQuery(
    api.notebooks.list,
    user?.id ? { userId: user.id } : "skip"
  );

  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks((prev) => ({
      ...prev,
      [notebookId]: !prev[notebookId],
    }));
  };

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
      <div className="w-64 bg-gray-100 border-r border-gray-300 h-full flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 h-full flex flex-col">
      <div className="p-4 border-b border-gray-300 flex items-center gap-2">
        <Menu size={20} className="text-gray-700" />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {notebooks.map((notebook, index) => {
          const isExpanded = expandedNotebooks[notebook._id] ?? false;
          const isSelected = selectedNotebookId === notebook._id;
          const folders = notebook.structure?.folders || {};

          return (
            <div key={notebook._id} className="mb-2">
              <div
                className={`
                  flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors
                  ${isSelected ? "bg-gray-200" : "hover:bg-gray-200"}
                `}
                onClick={() => {
                  toggleNotebook(notebook._id);
                  if (!isSelected) {
                    onNotebookSelect(notebook._id);
                  }
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
                {getNotebookIcon(index)}
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                  {notebook.title}
                </span>
              </div>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {Object.entries(folders).map(([folderId, folder]: [string, any]) => {
                    const isFolderSelected =
                      selectedNotebookId === notebook._id && selectedFolderId === folderId;

                    return (
                      <div
                        key={folderId}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors
                          ${isFolderSelected ? "bg-gray-200" : "hover:bg-gray-200"}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFolderSelect(notebook._id, folderId);
                        }}
                      >
                        {getFolderIcon(folder.title)}
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {folder.title}
                        </span>
                      </div>
                    );
                  })}
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
    </div>
  );
}

