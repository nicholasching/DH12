"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Id } from "convex/values";
import { DrawingNode } from "./extensions/DrawingNode";
import { ThreadMark } from "./extensions/ThreadMark";
import { useUser } from "@clerk/nextjs";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { CodeBlockComponent } from "./extensions/CodeBlockComponent";
import { Sparkles } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const createThread = useMutation(api.threads.create);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
      DrawingNode,
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
        const node = state.doc.nodeAt(pos);
        // This is tricky because marks are on ranges, not single nodes exactly like this.
        // Better way: Check active marks at position.
        // Or simpler: The Mark renders a span with data-thread-id.
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
