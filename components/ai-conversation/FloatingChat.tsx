"use client";

import Draggable from "react-draggable";
import { useState, useEffect, useRef } from "react";
import { Id } from "convex/values";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Send, MessageSquare } from "lucide-react";

interface FloatingChatProps {
  threadId: Id<"threads">;
  noteId: Id<"notes">; // For context
  onClose: () => void;
}

export function FloatingChat({ threadId, noteId, onClose }: FloatingChatProps) {
  const thread = useQuery(api.threads.get, { threadId });
  const note = useQuery(api.notes.get, { noteId });
  const addMessage = useMutation(api.threads.addMessage);
  const chatAction = useAction(api.ai.chat);
  
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = input;
    setInput("");
    setIsGenerating(true);

    try {
      // 1. Add user message
      await addMessage({
        threadId,
        role: "user",
        content: userMessage,
      });

      // 2. Call AI
      // We need chat history. We can construct it from thread.messages + new message.
      // But state update might be slow. We can just pass what we have + new.
      const previousMessages = thread?.messages || [];
      const messagesForAI = [
        ...previousMessages,
        { role: "user", content: userMessage, timestamp: Date.now() } // Optimistic
      ];

      const aiResponse = await chatAction({
        messages: messagesForAI.map(m => ({ role: m.role, content: m.content })),
        context: thread?.selectionText,
        documentContext: note?.content ? JSON.stringify(note.content) : undefined, // Rudimentary content stringify
      });

      // 3. Add AI message
      await addMessage({
        threadId,
        role: "assistant",
        content: aiResponse,
      });

    } catch (err) {
      console.error("AI Chat error:", err);
      // Optional: Add error message to chat
    } finally {
      setIsGenerating(false);
    }
  };

  if (!thread) return null;

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[600px] h-[500px] top-20 right-20">
        {/* Header */}
        <div className="handle p-3 bg-blue-50 border-b flex items-center justify-between cursor-move rounded-t-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
            <MessageSquare size={16} />
            <span>AI Thread</span>
          </div>
          <button 
            onClick={onClose}
            className="text-blue-900 hover:bg-blue-100 rounded p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Preview */}
        {thread.selectionText && (
          <div className="p-3 bg-gray-50 border-b text-xs text-gray-600 italic border-l-4 border-l-blue-200 m-2 rounded">
            "{thread.selectionText.substring(0, 100)}{thread.selectionText.length > 100 ? "..." : ""}"
          </div>
        )}

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {thread.messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-4">
              Ask a question about the selected text.
            </div>
          )}
          
          {thread.messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-500 flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask follow-up..."
              className="flex-1 text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </Draggable>
  );
}
