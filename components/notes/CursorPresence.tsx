"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Editor } from "@tiptap/react";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState, useMemo } from "react";

const COLORS = [
  "#EF4444", // red-500
  "#F97316", // orange-500
  "#F59E0B", // amber-500
  "#84CC16", // lime-500
  "#10B981", // emerald-500
  "#06B6D4", // cyan-500
  "#3B82F6", // blue-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#F43F5E", // rose-500
];

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface CursorPresenceProps {
  editor: Editor | null;
  noteId: Id<"notes">;
}

export function CursorPresence({ editor, noteId }: CursorPresenceProps) {
  const { user } = useUser();
  const updateCursor = useMutation(api.cursors.update);
  const cursors = useQuery(api.cursors.list, { noteId });
  const [tick, setTick] = useState(0);

  // Debounce helper
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedUpdate = useMemo(() => {
    if (!user || !editor) return () => {};
    
    return debounce(() => {
      if (!editor || !user) return;
      const { from, to } = editor.state.selection;
      updateCursor({
        noteId,
        userId: user.id,
        userName: user.fullName || user.username || "Anonymous",
        position: { from, to },
      });
    }, 100); // 100ms throttle
  }, [user, editor, noteId, updateCursor]);

  // Heartbeat / Selection update
  useEffect(() => {
    if (!editor || !user) return;

    const handleUpdate = () => {
      debouncedUpdate();
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('focus', handleUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('focus', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, user, debouncedUpdate]);

  // Force re-render on editor scroll/layout changes
  useEffect(() => {
    if (!editor) return;
    
    // We can't easily listen to "scroll" on the editor view directly via API, 
    // but transactions usually accompany relevant changes.
    // Also, we can listen to window scroll?
    // The editor scroll container needs a listener.
    // Tiptap doesn't expose a clean scroll event.
    // We'll rely on React state updates for now and maybe a fast interval for smooth movement?
    // Or simpler: listen to transaction.
    
    const update = () => setTick(t => t + 1);
    editor.on('transaction', update);
    
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor || !cursors) return null;

  return (
    <>
      {cursors.map((cursor) => {
        if (cursor.userId === user?.id) return null;
        
        const pos = cursor.position?.from;
        if (pos === undefined || pos === null) return null;
        
        // Safety check bounds
        if (pos > editor.state.doc.content.size) return null;

        // Get coordinates
        // coordsAtPos returns coordinates relative to the viewport
        let coords;
        try {
          coords = editor.view.coordsAtPos(pos);
        } catch (e) {
          return null;
        }

        const color = getUserColor(cursor.userId);

        return (
          <div
            key={cursor.userId}
            className="fixed pointer-events-none z-50 transition-all duration-75 ease-out"
            style={{
              top: coords.top,
              left: coords.left,
              height: coords.bottom - coords.top,
              width: "2px",
              backgroundColor: color,
            }}
          >
            {/* Name tag */}
            <div 
              className="absolute top-0 left-0 -mt-5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm"
              style={{ backgroundColor: color }}
            >
              {cursor.userName}
            </div>
          </div>
        );
      })}
    </>
  );
}
