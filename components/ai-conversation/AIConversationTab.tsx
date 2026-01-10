"use client";

import { useAIConversation } from "@/hooks/use-ai-conversation";
import { Id } from "convex/values";
import { useState } from "react";

interface AIConversationTabProps {
  conversationId?: Id<"conversations">;
  parentContext?: {
    noteId?: Id<"notes">;
    transcriptionId?: Id<"transcriptions">;
    selectionText?: string;
  };
}

export function AIConversationTab({
  conversationId,
  parentContext,
}: AIConversationTabProps) {
  const { messages, isLoading, error, sendMessage } = useAIConversation(
    conversationId
  );
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">AI Conversation</h3>
        {parentContext?.selectionText && (
          <p className="text-sm text-gray-600 mt-2">
            Context: {parentContext.selectionText}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center">
            Start a conversation by asking a question
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">Thinking...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!conversationId || isLoading}
          />
          <button
            type="submit"
            disabled={!conversationId || isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
