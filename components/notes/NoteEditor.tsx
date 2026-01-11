"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from "react";
import { isEqual } from "lodash";
import { Id } from "@/convex/_generated/dataModel";
import { DrawingNode } from "./extensions/DrawingNode";
import { ThreadMark } from "./extensions/ThreadMark";
import { Highlight } from "./extensions/Highlight";
import { useUser } from "@clerk/nextjs";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { CodeBlockComponent } from "./extensions/CodeBlockComponent";
import { Sparkles, Mic, MicOff, Check, X, Highlighter } from "lucide-react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Button } from "../ui/button";
import { CursorPresence } from "./CursorPresence";
import { debounce } from "lodash";

const lowlight = createLowlight(common);

export interface NoteEditorHandle {
  removeThreadMark: (threadId: string) => void;
}

interface NoteEditorProps {
  initialContent: any;
  noteId?: Id<"notes">;
  onChange?: (content: any) => void;
  onThreadSelect?: (threadId: Id<"threads">) => void;
  editable?: boolean;
}

export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(({
  initialContent,
  noteId,
  onChange,
  onThreadSelect,
  editable = true,
}, ref) => {
  const { user } = useUser();
  const createThread = useMutation(api.threads.create);
  const [showTranscript, setShowTranscript] = useState(false);

  // Debounce the onChange callback to reduce server load/conflicts
  const debouncedOnChange = useCallback(
    debounce((content: any) => {
      onChange?.(content);
    }, 1000), // 1 second debounce
    [onChange]
  );

  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const formatTranscript = useAction(api.ai.formatTranscript);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedTranscript, setFormattedTranscript] = useState<string | null>(null);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
      DrawingNode,
      Highlight.configure({
        HTMLAttributes: {
          class: 'highlight',
        },
      }),
      ThreadMark.configure({
        HTMLAttributes: {
          class: "bg-purple-200 border-b-2 border-purple-400 cursor-pointer",
        },
      }),
    ],
    content: initialContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getJSON());
    },
    // Add click handler to detect thread clicks
    editorProps: {
      attributes: {
        class: "prose prose-lg prose-neutral max-w-none focus:outline-none min-h-[500px] prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900",
      },
      handleClick: (view, pos, event) => {
        const { state } = view;
        // Check active marks at position
        const target = event.target as HTMLElement;
        const threadId = target.getAttribute('data-thread-id');
        if (threadId) {
          onThreadSelect?.(threadId as Id<"threads">);
          return true;
        }
        return false;
      },
    },
  });

  // Sync with server updates
  useEffect(() => {
    if (!editor || !initialContent) return;

    // We only update if the content is different to avoid cursor jumping on local updates
    // and infinite loops if initialContent matches what we just typed.
    const currentContent = editor.getJSON();
    if (!isEqual(currentContent, initialContent)) {
       // Save cursor position
       const { from, to } = editor.state.selection;
       
       // Update content
       editor.commands.setContent(initialContent);
       
       // Restore cursor position if possible
       const newSize = editor.state.doc.content.size;
       if (from <= newSize && to <= newSize) {
         editor.commands.setTextSelection({ from, to });
       }
    }
  }, [initialContent, editor]);

  const handleFormatTranscript = useCallback(async (): Promise<string | null> => {
    if (!transcript.trim() || isFormatting) return null;
    
    setIsFormatting(true);
    try {
      // Get the last paragraph as context
      const previousText = editor?.state.doc.textBetween(
        Math.max(0, (editor?.state.selection.from || 0) - 500),
        editor?.state.selection.from || 0,
        " "
      ) || "";

      const formatted = await formatTranscript({
        transcript,
        previousTranscript: previousText,
      });

      if (formatted) {
        setFormattedTranscript(formatted);
        return formatted;
      } else {
        setFormattedTranscript(null);
        return null;
      }
    } catch (err) {
      console.error("Failed to format transcript:", err);
      setFormattedTranscript(null);
      return null;
    } finally {
      setIsFormatting(false);
    }
  }, [editor, transcript, formatTranscript, isFormatting]);

  const handleInsertTranscript = useCallback(() => {
    if (!editor) return;
    
    // Stop listening if currently active
    if (isListening) {
      stopListening();
    }
    
    // Insert formatted transcript if available, otherwise raw transcript
    const textToInsert = formattedTranscript || transcript;
    
    if (textToInsert.trim()) {
      editor.chain().focus().insertContent(textToInsert + " ").run();
      resetTranscript();
      setFormattedTranscript(null);
      setShowTranscript(false);
    }
  }, [editor, formattedTranscript, transcript, resetTranscript, isListening, stopListening]);

  // Hotkey handler for Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (showTranscript && (transcript || isListening) && e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (isListening) {
          stopListening();
        }
        // Format first, then insert when complete
        if (transcript.trim()) {
          const formatted = await handleFormatTranscript();
          // Insert the formatted text (or raw if formatting failed)
          if (formatted && editor) {
            editor.chain().focus().insertContent(formatted + " ").run();
            resetTranscript();
            setFormattedTranscript(null);
            setShowTranscript(false);
          } else if (editor) {
            editor.chain().focus().insertContent(transcript + " ").run();
            resetTranscript();
            setFormattedTranscript(null);
            setShowTranscript(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTranscript, transcript, isListening, stopListening, handleFormatTranscript, editor, resetTranscript]);

  useImperativeHandle(ref, () => ({
    removeThreadMark: (threadId: string) => {
      if (!editor) return;
      
      // Iterate through the document to find marks with this threadId
      editor.state.doc.descendants((node, pos) => {
        const hasMark = node.marks.find(
          m => m.type.name === 'thread' && m.attrs.threadId === threadId
        );
        
        if (hasMark) {
          // Remove mark
          editor.chain()
            .setTextSelection({ from: pos, to: pos + node.nodeSize })
            .unsetThread()
            .run();
        }
      });
    }
  }));

  const addDrawing = () => {
    if (editor && noteId) {
      editor.chain().focus().insertContent({
        type: 'drawingBlock',
        attrs: { noteId: noteId } 
      }).run();
    }
  };

  const handleCreateThread = async () => {
    if (!editor || !noteId || !user) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const selectionText = editor.state.doc.textBetween(from, to, " ");
    
    // Create thread in DB
    const threadId = await createThread({
      noteId,
      userId: user.id,
      selectionText,
    });

    // Apply mark
    editor.chain().focus().setThread({ threadId }).run();
    
    // Immediately save the content with the thread mark (bypass debounce)
    // This ensures the thread mark is persisted even if the page reloads quickly
    const contentWithThread = editor.getJSON();
    onChange?.(contentWithThread);
    // Also flush the debounced function to ensure consistency
    debouncedOnChange.flush();
    
    // Open chat
    onThreadSelect?.(threadId);
  };

  const handleToggleTranscription = async () => {
    if (isListening) {
      stopListening();
      // If there's transcript, format it (but don't insert)
      if (transcript.trim()) {
        // Small delay to ensure stopListening completes
        setTimeout(() => {
          handleFormatTranscript();
        }, 100);
      }
    } else {
      setFormattedTranscript(null);
      setShowTranscript(true);
      startListening();
    }
  };

  return (
    <div className="w-full relative">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-white shadow-lg border rounded-lg p-1 flex items-center gap-1">
            <Button
              onClick={handleCreateThread}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 px-2 py-1 rounded transition-colors"
            >
              <Sparkles size={14} />
              Ask AI
            </Button>
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10 items-center justify-center p-2 shadow-sm" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('bold') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
              title="Bold (Cmd+B)"
            >
              <strong>B</strong>
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('italic') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
              title="Italic (Cmd+I)"
            >
              <em>I</em>
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('underline') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
              title="Underline (Cmd+U)"
            >
              <u>U</u>
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('strike') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
              title="Strikethrough"
            >
              <s>S</s> 
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${editor.isActive('highlight') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
              title="Highlight (Cmd+Shift+H)"
            >
              <Highlighter size={14} />
            </Button>
          </div>
          
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <Button
               onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
               className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
               variant="secondary"
               title="Heading 1"
            >
              H1
            </Button>
            <Button
               onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
               className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
               variant="secondary"
               title="Heading 2"
            >
              H2
            </Button>
          </div>

            <Button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
            >
              Code
            </Button>
            <Button
              onClick={addDrawing}
              disabled={!noteId}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
            >
              + Drawing
            </Button>
            <Button
              onClick={handleToggleTranscription}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${isListening ? 'bg-gray-900 text-gray-100 hover:bg-gray-200 hover:text-gray-900' : 'bg-white text-gray-900 hover:bg-gray-200 border border-gray-200 focus:bg-gray-900 focus:text-gray-100'}`}
              variant="secondary"
            >
              {isListening ? (
                <>
                  <MicOff size={14} />
                  Stop
                </>
              ) : (
                <>
                  <Mic size={14} />
                  Transcribe
                </>
              )}
            </Button>
        </div>
      )}

      {showTranscript && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-900">Live Transcription</h4>
            <div className="flex items-center gap-2">
              {isListening && (
                <span className="flex items-center gap-1 text-xs text-blue-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Listening...
                </span>
              )}
              {transcript && (
                <Button
                  onClick={handleInsertTranscript}
                  disabled={isFormatting}
                  className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isFormatting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-black">Formatting...</span>
                    </>
                  ) : (
                    <>
                      <div className="text-black">
                        <Check size={12} />
                      </div>
                      <div className="text-black">
                        Insert
                      </div>
                      
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => {
                  stopListening();
                  setShowTranscript(false);
                  resetTranscript();
                  setFormattedTranscript(null);
                }}
                className="px-2 py-1 text-xs font-medium text-black bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <div className="text-black">
                  <X size={12} />
                </div>
                <div className="text-black">
                  Close
                </div>

                
              </Button>
            </div>
          </div>
          {speechError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
              {speechError}
            </div>
          )}
          <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[60px] max-h-[200px] overflow-y-auto">
            {formattedTranscript || transcript || (isListening ? "Listening for speech..." : "No transcript yet")}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
      {editor && noteId && <CursorPresence editor={editor} noteId={noteId} />}
    </div>
  );
});

NoteEditor.displayName = "NoteEditor";
