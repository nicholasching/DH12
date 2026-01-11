"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNotebookModal({ isOpen, onClose }: CreateNotebookModalProps) {
  const [title, setTitle] = useState("");
  const createNotebook = useMutation(api.notebooks.create);
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await createNotebook({
      userId: user.id,
      title: title,
    });
    
    setTitle("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Create Notebook</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notebook Title"
            className="w-full px-3 py-2 border rounded-lg mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
