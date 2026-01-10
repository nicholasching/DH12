"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface NoteEditorProps {
  content: string;
  onChange?: (content: string) => void;
  editable?: boolean;
}

export function NoteEditor({
  content,
  onChange,
  editable = true,
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChange?.(json);
    },
  });

  useEffect(() => {
    if (editor && content) {
      try {
        const parsed = JSON.parse(content);
        editor.commands.setContent(parsed);
      } catch (error) {
        // If content is not JSON, treat it as plain text
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className="prose max-w-none p-4 border rounded-lg min-h-[400px]">
      <EditorContent editor={editor} />
    </div>
  );
}
