"use client";

import { UserButton } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShareDialog } from "./ShareDialog";
import { Id } from "@/convex/_generated/dataModel";

interface TopHeaderProps {
  noteId?: Id<"notes">;
}

export function TopHeader({ noteId }: TopHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-14 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {noteId && <ShareDialog noteId={noteId} />}

        <div className="w-8 h-8 flex items-center justify-center">
          <UserButton 
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
