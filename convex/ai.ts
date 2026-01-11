"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  // Warn but don't fail at build time
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.string(), // "user" | "model"
        content: v.string(),
      })
    ),
    context: v.optional(v.string()), // Selected text
    documentContext: v.optional(v.string()), // Full document text
  },
  handler: async (ctx, args) => {
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Construct the prompt with context
    let systemPrompt = "You are a helpful AI assistant for students taking notes. Answer the student's question concisely and accurately.\n\n" +
      "Use the provided Document Context and Specific Selection to tailor your answer to the student's specific material.\n" +
      "However, if the context does not contain the answer, you MUST use your own general knowledge to answer the question comprehensively. " +
      "Do NOT refuse to answer just because the information is missing from the notes.";
    
    if (args.documentContext) {
      systemPrompt += `\n\nDocument Context:\n${args.documentContext}`;
    }
    
    if (args.context) {
      systemPrompt += `\n\nSpecific Selection:\n${args.context}`;
    }

    // Convert messages to Gemini format
    const history = args.messages.slice(0, -1).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = args.messages[args.messages.length - 1];

    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: "Understood. I will help you with your notes based on the context provided." }],
          },
          ...history
        ],
      });

      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();
    
      return text;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gemini Error: ${error.message || "Unknown error"}`);
    }
  },
});

export const formatTranscript = action({
  args: {
    transcript: v.string(),
    previousTranscript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a helpful assistant that formats transcribed speech.
    Correct punctuation, capitalization, and grammar.
    Do not change the meaning.
    Do not add conversational filler.
    Return ONLY the formatted text.
    
    Context (previous sentence): "${args.previousTranscript || ''}"
    Current text to format: "${args.transcript}"`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini Format Error:", error);
      // Fallback to original text if AI fails
      return args.transcript; 
    }
  },
});
