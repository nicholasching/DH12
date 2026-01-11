"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export function SharedNotesList() {
  const { user } = useUser();
  const router = useRouter();
  const email = user?.emailAddresses[0]?.emailAddress;

  const sharedNotes = useQuery(
    api.notes.getShared,
    email ? { email } : "skip"
  );

  if (!user) return null;
  if (sharedNotes === undefined) return <div>Loading...</div>;
  if (sharedNotes.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-black mb-4">Shared with Me</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sharedNotes.map((note) => (
          <div 
            key={note._id}
            onClick={() => router.push(`/notes/${note._id}`)}
            className="bg-white rounded-lg border hover:shadow-md cursor-pointer p-4 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-black truncate pr-2" title={note.title}>
                {note.title}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                Shared
              </span>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>
                Shared by: <span className="font-medium text-gray-700">{note.ownerName}</span>
              </p>
              <p className="text-xs">
                Edited {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
