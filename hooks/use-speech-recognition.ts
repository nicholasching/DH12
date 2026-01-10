"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      onResult?.(newTranscript);
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

      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults, lang, onResult, onError]);

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
