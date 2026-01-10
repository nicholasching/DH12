"use client";

import { useState, useCallback } from "react";

export interface TranscriptionState {
  transcriptionId: string | null;
  status: "idle" | "processing" | "completed" | "error";
  transcript: string;
  error: string | null;
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    transcriptionId: null,
    status: "idle",
    transcript: "",
    error: null,
  });

  const startTranscription = useCallback(async (audioUrl: string, sessionId: string) => {
    setState((prev) => ({ ...prev, status: "processing", error: null }));

    try {
      const response = await fetch("/api/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl, sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start transcription");
      }

      const data = await response.json();
      setState({
        transcriptionId: data.transcriptionId,
        status: data.status,
        transcript: data.transcript || "",
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const getTranscription = useCallback(async (transcriptionId: string) => {
    setState((prev) => ({ ...prev, status: "processing", error: null }));

    try {
      const response = await fetch(`/api/transcription?id=${transcriptionId}`);

      if (!response.ok) {
        throw new Error("Failed to get transcription");
      }

      const data = await response.json();
      setState({
        transcriptionId: data.transcriptionId,
        status: data.status,
        transcript: data.transcript || "",
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  return {
    ...state,
    startTranscription,
    getTranscription,
  };
}
