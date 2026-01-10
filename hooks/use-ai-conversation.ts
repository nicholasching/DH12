"use client";

import { useState, useCallback } from "react";
import { Id } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function useAIConversation(conversationId?: Id<"conversations">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { conversationId } : "skip"
  );

  const addMessage = useMutation(api.conversations.addMessage);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) {
        setError("No conversation ID provided");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Add user message
        await addMessage({
          conversationId,
          role: "user",
          content,
        });

        // TODO: Call AI API to get response
        // For now, just add a placeholder response
        await addMessage({
          conversationId,
          role: "assistant",
          content: "AI response placeholder - implement AI integration",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, addMessage]
  );

  return {
    conversation,
    messages: conversation?.messages || [],
    isLoading,
    error,
    sendMessage,
  };
}
