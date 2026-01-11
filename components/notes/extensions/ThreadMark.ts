import { Mark, mergeAttributes } from '@tiptap/core';

export interface ThreadMarkOptions {
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    thread: {
      setThread: (attributes: { threadId: string }) => ReturnType,
      unsetThread: () => ReturnType,
    }
  }
}

export const ThreadMark = Mark.create<ThreadMarkOptions>({
  name: 'thread',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: element => element.getAttribute('data-thread-id'),
        renderHTML: attributes => {
          return {
            'data-thread-id': attributes.threadId,
            class: 'bg-purple-200 cursor-pointer border-b-2 border-purple-400 hover:bg-purple-300 transition-colors',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-thread-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setThread: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },
      unsetThread: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
});
