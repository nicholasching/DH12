"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Id } from "convex/values";
import { DrawingNode } from "./extensions/DrawingNode";
import { useUser } from "@clerk/nextjs";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { CodeBlockComponent } from "./extensions/CodeBlockComponent";

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

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
        codeBlock: false, // Disable default codeBlock
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
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
        // prose-lg for larger text, darker colors
        class: "prose prose-lg prose-neutral max-w-none focus:outline-none min-h-[500px] prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900",
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
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10 items-center p-2 rounded-t-lg shadow-sm">
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
