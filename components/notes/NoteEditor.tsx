"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Id } from "convex/values";
import { DrawingNode } from "./extensions/DrawingNode";
import { ThreadMark } from "./extensions/ThreadMark";
import { Highlight } from "./extensions/Highlight";
import { useUser } from "@clerk/nextjs";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { CodeBlockComponent } from "./extensions/CodeBlockComponent";
import { Sparkles, Mic, MicOff, Check, X, Highlighter } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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

  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onResult: (newTranscript) => {
      // Optional: Auto-update transcript display
    },
  });

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
          class: "bg-yellow-200 border-b-2 border-yellow-400 cursor-pointer",
        },
      }),
    ],
    content: initialContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
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
    
    // Open chat
    onThreadSelect?.(threadId);
  };

  const handleToggleTranscription = () => {
    if (isListening) {
      stopListening();
    } else {
      // Show transcript box immediately for instant UI feedback
      setShowTranscript(true);
      
      // Check cursor position and determine if we should insert at cursor or new line
      if (editor) {
        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;
        const cursorPos = $from.pos;
        
        // Get the parent node (paragraph/heading/etc.) and check text around cursor
        const parent = $from.parent;
        const parentStart = $from.start($from.depth);
        const parentEnd = parentStart + parent.content.size;
        const offsetInParent = cursorPos - parentStart;
        
        // Get text content of the parent node
        const parentText = parent.textContent;
        
        // Check if cursor is at document boundaries
        const isAtDocStart = cursorPos === 0;
        const isAtDocEnd = cursorPos >= state.doc.content.size;
        
        // Check characters immediately before and after cursor in the parent node
        const charBefore = offsetInParent > 0 ? parentText[offsetInParent - 1] : '';
        const charAfter = offsetInParent < parentText.length ? parentText[offsetInParent] : '';
        
        // Check if cursor is at start/end of parent node or on whitespace
        const isAtParentStart = offsetInParent === 0;
        const isAtParentEnd = offsetInParent >= parentText.length;
        const isOnWhitespace = (charBefore === '' || /\s/.test(charBefore)) && 
                               (charAfter === '' || /\s/.test(charAfter));
        
        // If cursor is on whitespace (or at boundaries), keep cursor there
        if (isOnWhitespace || isAtParentStart || isAtParentEnd || isAtDocStart || isAtDocEnd) {
          // Keep cursor where it is - transcription will be inserted here
          editor.chain().focus().run();
        } else {
          // Cursor is on text, move to a new line
          const docSize = state.doc.content.size;
          editor.chain()
            .focus()
            .setTextSelection(docSize)
            .run();
          
          // Insert a newline if there's existing content
          if (state.doc.textContent.trim().length > 0) {
            editor.chain()
              .focus()
              .insertContent('\n')
              .run();
          }
        }
      }
      
      // Start listening after UI is updated
      startListening();
    }
  };

  const handleInsertTranscript = () => {
    if (!editor || !transcript.trim()) return;
    editor.chain().focus().insertContent(transcript).run();
    resetTranscript();
    setShowTranscript(false);
  };

  return (
    <div className="w-full relative">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-white shadow-lg border rounded-lg p-1 flex items-center gap-1">
            <button
              onClick={handleCreateThread}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              <Sparkles size={14} />
              Ask AI
            </button>
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10 items-center p-2 rounded-t-lg shadow-sm w-full">
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('bold') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
              title="Bold (Cmd+B)"
            >
            <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('italic') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
              title="Italic (Cmd+I)"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('underline') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
              title="Underline (Cmd+U)"
            >
              <u>U</u>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('strike') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${editor.isActive('highlight') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
              title="Highlight (Cmd+Shift+H)"
            >
              <Highlighter size={14} />
            </button>
          </div>
          
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
               onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
               className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              H1
            </button>
            <button
               onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
               className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              H2
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              Code
            </button>
            <button
              onClick={addDrawing}
              disabled={!noteId}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors hover:bg-blue-50 text-blue-700 bg-white border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Drawing
            </button>
            <button
              onClick={handleToggleTranscription}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isListening
                  ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                  : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
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
            </button>
          </div>
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
                <button
                  onClick={handleInsertTranscript}
                  className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Insert
                </button>
              )}
              <button
                onClick={() => {
                  stopListening();
                  setShowTranscript(false);
                  resetTranscript();
                }}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>
          {speechError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
              {speechError}
            </div>
          )}
          <div className="text-sm text-gray-800 whitespace-pre-wrap min-h-[60px] max-h-[200px] overflow-y-auto">
            {transcript || (isListening ? "Listening for speech..." : "No transcript yet")}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
});

NoteEditor.displayName = "NoteEditor";
