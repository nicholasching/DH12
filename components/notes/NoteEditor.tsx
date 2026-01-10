"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Id } from "convex/values";
import { DrawingNode } from "./extensions/DrawingNode";
import { useUser } from "@clerk/nextjs";

interface NoteEditorProps {
  initialContent: any;
  noteId?: Id<"notes">;
  onChange?: (content: any) => void;
  onThreadSelect?: (threadId: Id<"threads">) => void;
  editable?: boolean;
}

export function NoteEditor({
  initialContent,
  noteId,
  onChange,
  onThreadSelect,
  editable = true,
}: NoteEditorProps) {
  const { user } = useUser();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "bg-gray-800 text-gray-100 p-4 rounded-md font-mono text-sm my-4",
          },
        },
      }),
      DrawingNode,
    ],
    content: initialContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[500px]",
      },
    },
  });

  const addDrawing = () => {
    if (editor && noteId) {
      editor.chain().focus().insertContent({
        type: 'drawingBlock',
        attrs: { noteId: noteId } 
      }).run();
    }
  };

  return (
    <div className="w-full">
      {editor && (
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10 items-center p-2 rounded-t-lg">
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('bold') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('italic') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('strike') ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
            >
              S
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
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
