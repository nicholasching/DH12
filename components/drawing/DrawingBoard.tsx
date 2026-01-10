"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { Id } from "convex/values";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QrCode, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";

interface DrawingBoardProps {
  drawingId?: Id<"drawings">;
  onSave?: (data: string) => void;
  onShowQR?: () => void;
}

export function DrawingBoard({ drawingId, onSave, onShowQR }: DrawingBoardProps) {
  const drawing = useQuery(api.drawings.get, drawingId ? { drawingId } : "skip");
  const updateDrawing = useMutation(api.drawings.update);
  const editorRef = useRef<any>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    if (drawing?.data && editorRef.current) {
      const currentSnapshot = JSON.stringify(editorRef.current.getSnapshot());
      if (currentSnapshot !== drawing.data) {
        try {
           editorRef.current.loadSnapshot(JSON.parse(drawing.data));
        } catch(e) {
           console.error("Sync error", e);
        }
      }
    }
  }, [drawing?.data]);

  const handleZoomIn = () => {
    editorRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    editorRef.current?.zoomOut();
  };

  const handleOpenNewTab = () => {
    if (drawingId) {
      window.open(`/drawing/${drawingId}`, '_blank');
    }
  };

  return (
    <div className="relative w-full h-full border rounded-lg overflow-hidden bg-white group">
      <div 
        className={`w-full h-full ${isAltPressed ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <Tldraw
          hideUi={true}
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
            
            // Initial read-only-like mode until Ctrl is pressed?
            // Actually pointer-events-none on wrapper handles interaction blocking.
            
            const cleanup = editor.store.listen(() => {
               const snapshot = editor.getSnapshot();
               const json = JSON.stringify(snapshot);
               
               if (drawingId) {
                  if (onSave) {
                     onSave(json);
                  } else {
                     updateDrawing({ drawingId, data: json }).catch(console.error);
                  }
               }
            });
            
            return cleanup;
          }}
        />
      </div>

      {/* Controls - Always Interactive */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onShowQR}
          className="p-2 bg-white rounded shadow border hover:bg-gray-50"
          title="Show QR Code"
        >
          <QrCode size={16} />
        </button>
        <button
          onClick={handleOpenNewTab}
          className="p-2 bg-white rounded shadow border hover:bg-gray-50"
          title="Open in New Tab"
        >
          <ExternalLink size={16} />
        </button>
        <div className="flex flex-col bg-white rounded shadow border overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-50 border-b"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-50"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>
      
      {!isAltPressed && (
        <div className="absolute bottom-2 left-2 z-40 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
          Hold Alt to interact
        </div>
      )}
    </div>
  );
}
