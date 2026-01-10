"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { Id } from "convex/values";
import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DrawingBoardProps {
  drawingId?: Id<"drawings">;
  onSave?: (data: string) => void;
}

export function DrawingBoard({ drawingId, onSave }: DrawingBoardProps) {
  const drawing = useQuery(api.drawings.get, drawingId ? { drawingId } : "skip");
  const updateDrawing = useMutation(api.drawings.update);
  const editorRef = useRef<any>(null);
  
  // Handle incoming updates from other devices (e.g. iPad)
  useEffect(() => {
    if (drawing?.data && editorRef.current) {
      const currentSnapshot = JSON.stringify(editorRef.current.getSnapshot());
      if (currentSnapshot !== drawing.data) {
        try {
           // We only want to load if it's significantly different or if we are in "view" mode.
           // Ideally, we'd merge.
           // For the "Sync from iPad" use case:
           // The laptop is mostly viewing what the iPad draws.
           // So we can afford to overwrite the laptop's state if the iPad is the source of truth.
           editorRef.current.loadSnapshot(JSON.parse(drawing.data));
        } catch(e) {
           console.error("Sync error", e);
        }
      }
    }
  }, [drawing?.data]);

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden bg-white">
      <Tldraw
        persistenceKey={drawingId || "default"}
        onMount={(editor) => {
          editorRef.current = editor;
          
          if (drawing?.data) {
             try {
               editor.loadSnapshot(JSON.parse(drawing.data));
             } catch (e) {
               console.error("Failed to load snapshot", e);
             }
          }
          
          const cleanup = editor.store.listen(() => {
             const snapshot = editor.getSnapshot();
             const json = JSON.stringify(snapshot);
             
             // Debounce this call in production
             if (drawingId) {
                // If onSave provided (e.g. from parent wrapper), use it
                // Otherwise update directly if we want
                if (onSave) {
                   onSave(json);
                } else {
                   // Or we can just update here if we prefer self-contained
                   updateDrawing({ drawingId, data: json }).catch(console.error);
                }
             }
          });
          
          return cleanup;
        }}
      />
    </div>
  );
}
