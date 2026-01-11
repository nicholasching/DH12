"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = "en-US",
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  
  // Keep callbacks stable
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Accumulate final transcripts
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
      }

      // Combine accumulated final transcript with current interim results
      const newTranscript = finalTranscriptRef.current + interimTranscript;
      setTranscript(newTranscript);
      onResultRef.current?.(newTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage =
        event.error === "no-speech"
          ? "No speech detected. Please try again."
          : event.error === "audio-capture"
          ? "No microphone found. Please ensure a microphone is connected."
          : event.error === "not-allowed"
          ? "Microphone permission denied. Please allow microphone access."
          : `Speech recognition error: ${event.error}`;

      // Only update state if it's a fatal error or we're not continuously listening
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        setIsListening(false);
      }
      
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [continuous, interimResults, lang]); // Removed onResult/onError from deps

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not available");
      return;
    }

    // Reset transcript when starting fresh
    if (!isListening) {
      finalTranscriptRef.current = "";
      setTranscript("");
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started or error
      if (err instanceof Error && err.message.includes("start")) {
        // Already started, stop and restart
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
