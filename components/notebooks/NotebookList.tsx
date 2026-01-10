"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function NotebookList() {
  const { user } = useUser();
  const notebooks = useQuery(
    api.notebooks.list,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!user) {
    return <div>Please sign in to view notebooks</div>;
  }

  if (notebooks === undefined) {
    return <div>Loading notebooks...</div>;
  }

  return (
    <div className="space-y-2">
      {notebooks.length === 0 ? (
        <p className="text-gray-500">No notebooks yet. Create one to get started!</p>
      ) : (
        notebooks.map((notebook) => (
          <div
            key={notebook._id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <h3 className="font-semibold">{notebook.title}</h3>
            {notebook.description && (
              <p className="text-sm text-gray-600">{notebook.description}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
