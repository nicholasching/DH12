"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useDrawing } from "@/hooks/use-drawing";
import { Id } from "convex/values";
import { useEffect } from "react";

interface DrawingBoardProps {
  drawingId?: Id<"drawings">;
  onSave?: (data: string) => void;
}

export function DrawingBoard({ drawingId, onSave }: DrawingBoardProps) {
  const { tldrawData, saveDrawing } = useDrawing(drawingId);

  const handleSave = (data: string) => {
    if (drawingId) {
      saveDrawing(data);
    }
    onSave?.(data);
  };

  return (
    <div className="w-full h-full border rounded-lg">
      <Tldraw
        persistenceKey={drawingId || "default"}
        onMount={(editor) => {
          if (tldrawData) {
            try {
              const data = JSON.parse(tldrawData);
              editor.loadSnapshot(data);
            } catch (error) {
              console.error("Failed to load drawing data:", error);
            }
          }
        }}
      />
    </div>
  );
}
