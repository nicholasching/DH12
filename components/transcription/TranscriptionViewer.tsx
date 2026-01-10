"use client";

import { useTranscription } from "@/hooks/use-transcription";
import { useEffect } from "react";

interface TranscriptionViewerProps {
  sessionId: string;
  audioUrl?: string;
}

export function TranscriptionViewer({
  sessionId,
  audioUrl,
}: TranscriptionViewerProps) {
  const { transcript, status, error, startTranscription, getTranscription } =
    useTranscription();

  useEffect(() => {
    if (audioUrl && status === "idle") {
      startTranscription(audioUrl, sessionId);
    }
  }, [audioUrl, sessionId, status, startTranscription]);

  return (
    <div className="w-full p-4 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Live Transcription</h3>
        <div className="text-sm text-gray-600">
          Status: <span className="font-medium">{status}</span>
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap">{transcript || "Waiting for transcription..."}</p>
      </div>
    </div>
  );
}
