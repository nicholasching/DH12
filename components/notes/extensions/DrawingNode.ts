import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DrawingBlock } from "./DrawingBlock";

export const DrawingNode = Node.create({
  name: "drawingBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      drawingId: {
        default: null,
      },
      noteId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "drawing-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingBlock);
  },
});
