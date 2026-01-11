"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { QRCodeGenerator } from "@/components/qr-code/QRCodeGenerator";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { DrawingBoard } from "@/components/drawing/DrawingBoard";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function DrawingBlock(props: any) {
  const { node, updateAttributes } = props;
  const drawingId = node.attrs.drawingId as Id<"drawings">;
  const noteId = node.attrs.noteId;
  const { user } = useUser();

  const createDrawing = useMutation(api.drawings.create);
  const drawing = useQuery(api.drawings.get, drawingId ? { drawingId } : "skip");
  
  const [showQR, setShowQR] = useState(false);

  const handleInitDrawing = async () => {
    if (!user || !noteId) return;
    
    const newDrawingId = await createDrawing({
      userId: user.id,
      noteId: noteId,
      data: null, // Empty initially
    });
    
    updateAttributes({ drawingId: newDrawingId });
  };

  return (
    <NodeViewWrapper className="drawing-block my-4 border rounded-lg overflow-hidden shadow-sm bg-white select-none">
       {!drawingId ? (
         <div className="p-8 text-center bg-gray-50 flex flex-col items-center justify-center h-48">
           <p className="mb-4 text-gray-500 font-medium">Add a Drawing Canvas</p>
           <Button onClick={handleInitDrawing}>
             Create Canvas
           </Button>
         </div>
       ) : (
         <div className="relative h-[500px] w-full border-2 border-transparent hover:border-blue-200 transition-colors">
            <div className="w-full h-full relative">
              <DrawingBoard 
                drawingId={drawingId} 
                onSave={() => {}} 
                onShowQR={() => setShowQR(true)}
              />
            </div>
            {showQR && (
              <div className="absolute inset-0 z-50 flex items-center justify-center">
                {/* Translucent gray overlay */}
                <div 
                  className="absolute inset-0 bg-gray-900/50"
                  onClick={() => setShowQR(false)}
                />
                {/* QR Code Modal - Centered */}
                <div className="relative bg-white rounded-lg p-5 max-w-sm mx-auto">
                  <button 
                    onClick={() => setShowQR(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10 text-sm"
                  >
                    ✕
                  </button>
                  <QRCodeGenerator drawingId={drawingId} />
                </div>
              </div>
            )}
         </div>
       )}
    </NodeViewWrapper>
  );
}
