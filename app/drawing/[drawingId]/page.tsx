"use client";

import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";
import { Id } from "convex/values";
import { useEffect, useCallback, use } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { debounce } from "lodash"; // We might need lodash or implement debounce

import { useRouter } from "next/navigation";

export default function DrawingPage({ params }: { params: Promise<{ drawingId: string }> }) {
  const { drawingId } = use(params) as { drawingId: Id<"drawings"> };
  const router = useRouter();
  
  const drawing = useQuery(api.drawings.get, { drawingId });
  const updateDrawing = useMutation(api.drawings.update);

  if (drawing === undefined) return <div className="flex h-screen items-center justify-center">Loading canvas...</div>;
  if (drawing === null) return <div className="flex h-screen items-center justify-center">Drawing not found</div>;

  return (
    <div className="w-screen h-screen overflow-hidden fixed inset-0">
      <DrawingCanvas 
        drawingId={drawingId} 
        initialData={drawing.data ? JSON.parse(drawing.data) : undefined}
        onSave={async (data) => {
          await updateDrawing({ drawingId, data: JSON.stringify(data) });
        }}
      />
      {drawing.noteId && (
        <button 
          onClick={() => router.push(`/notes/${drawing.noteId}`)}
          className="absolute top-4 right-2.5 z-[9999] px-5 py-2 bg-white rounded-lg shadow-md text-sm font-medium hover:bg-gray-50 border border-gray-200 text-black transition-colors"
        >
          ← Back to Note
        </button>
      )}
    </div>
  );
}

function DrawingCanvas({ 
  drawingId, 
  initialData, 
  onSave 
}: { 
  drawingId: string, 
  initialData: any, 
  onSave: (data: any) => void 
}) {
  
  const handleMount = (editor: any) => {
    // Load initial data
    if (initialData) {
      editor.loadSnapshot(initialData);
    }

    // Subscribe to changes
    const handleChange = () => {
      const snapshot = editor.getSnapshot();
      onSave(snapshot);
    };

    // Debounce the save to avoid spamming the server
    const debouncedSave = debounceFn(handleChange, 1000);

    const cleanup = editor.store.listen(debouncedSave);
    return () => cleanup();
  };

  return (
    <Tldraw
      persistenceKey={drawingId}
      onMount={handleMount}
    />
  );
}

// Simple debounce utility
function debounceFn(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
