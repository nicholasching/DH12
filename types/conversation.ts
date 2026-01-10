import { Id } from "convex/server";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  _id: Id<"conversations">;
  _creationTime: number;
  parentId?: Id<"conversations">;
  noteId?: Id<"notes">;
  transcriptionId?: Id<"transcriptions">;
  userId: string;
  selectionText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateConversationInput {
  noteId?: Id<"notes">;
  transcriptionId?: Id<"transcriptions">;
  parentId?: Id<"conversations">;
  selectionText?: string;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface AddMessageInput {
  role: "user" | "assistant";
  content: string;
}
