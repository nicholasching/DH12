"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

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
  const isRestartingRef = useRef<boolean>(false);
  const shouldStopRef = useRef<boolean>(false);

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
    
    // Optimize for faster response - reduce silence detection time
    // Note: maxAlternatives doesn't significantly help with speed, but we keep settings minimal

    recognition.onstart = () => {
      // State already set in startListening for instant feedback
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Ignore results if we've explicitly stopped
      if (shouldStopRef.current) {
        return;
      }

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
      // If we explicitly want to stop, don't auto-restart
      if (shouldStopRef.current) {
        shouldStopRef.current = false;
        setIsListening(false);
        return;
      }
      
      // If we're restarting, don't update state - the restart will handle it
      if (!isRestartingRef.current) {
        setIsListening(false);
      } else {
        // Reset the restarting flag after end event
        isRestartingRef.current = false;
      }
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

    // Reset flags for new session
    shouldStopRef.current = false;
    isRestartingRef.current = false;

    // Reset transcript when starting fresh
    if (!isListening) {
      finalTranscriptRef.current = "";
      setTranscript("");
      setError(null);
    }

    // Set listening state immediately for instant UI feedback
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started or error - handle more efficiently
      if (recognitionRef.current) {
        try {
          isRestartingRef.current = true;
          recognitionRef.current.stop();
          // Use minimal delay - single requestAnimationFrame is typically ~16ms
          requestAnimationFrame(() => {
            try {
              isRestartingRef.current = false;
              recognitionRef.current?.start();
            } catch (restartErr) {
              isRestartingRef.current = false;
              setIsListening(false);
              setError("Failed to start speech recognition. Please try again.");
            }
          });
        } catch (stopErr) {
          isRestartingRef.current = false;
          setIsListening(false);
          setError("Failed to restart speech recognition. Please try again.");
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    // Mark that we want to stop (prevents auto-restart in continuous mode)
    shouldStopRef.current = true;
    isRestartingRef.current = false;
    
    try {
      // Use abort() for immediate stop, or stop() if abort isn't available
      if (typeof recognitionRef.current.abort === 'function') {
        recognitionRef.current.abort();
      } else {
        recognitionRef.current.stop();
      }
      // Update state immediately for instant UI feedback
      setIsListening(false);
    } catch (err) {
      // Even if stop fails, update state
      setIsListening(false);
      shouldStopRef.current = false;
    }
  }, []);

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
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
