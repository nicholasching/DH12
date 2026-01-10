"use client";

import { useState, useCallback } from "react";
import { Id } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export function useDrawing(drawingId?: Id<"drawings">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drawing = useQuery(
    api.drawings.get,
    drawingId ? { drawingId } : "skip"
  );

  const updateDrawing = useMutation(api.drawings.update);

  const saveDrawing = useCallback(
    async (tldrawData: string) => {
      if (!drawingId) {
        setError("No drawing ID provided");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await updateDrawing({
          drawingId,
          tldrawData,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save drawing");
      } finally {
        setIsLoading(false);
      }
    },
    [drawingId, updateDrawing]
  );

  return {
    drawing,
    tldrawData: drawing?.tldrawData || "",
    isLoading,
    error,
    saveDrawing,
  };
}
