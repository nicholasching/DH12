import { Id } from "convex/server";

export type TranscriptionStatus = "processing" | "completed" | "error";

export interface Transcription {
  _id: Id<"transcriptions">;
  _creationTime: number;
  noteId?: Id<"notes">;
  userId: string;
  sessionId: string;
  transcript: string;
  status: TranscriptionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTranscriptionInput {
  sessionId: string;
  noteId?: Id<"notes">;
}
