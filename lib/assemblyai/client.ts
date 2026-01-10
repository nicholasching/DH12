import { AssemblyAI } from "assemblyai";

const apiKey = process.env.ASSEMBLYAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing ASSEMBLYAI_API_KEY environment variable");
}

export const assemblyai = new AssemblyAI({
  apiKey: apiKey,
});

export type TranscriptionStatus = "processing" | "completed" | "error";

export interface TranscriptionResult {
  id: string;
  status: TranscriptionStatus;
  transcript?: string;
  error?: string;
}
