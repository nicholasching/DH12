import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

export const CodeBlockComponent = ({ node, updateAttributes, extension }: any) => {
  return (
    <NodeViewWrapper className="code-block relative group my-6 rounded-md overflow-hidden bg-[#0d1117] border border-gray-700 shadow-sm">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          contentEditable={false}
          defaultValue={node.attrs.language || 'null'}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="rounded bg-gray-800 text-xs text-gray-300 py-1 px-2 border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="null">auto</option>
          <option disabled>—</option>
          {extension.options.lowlight.listLanguages().map((lang: string, index: number) => (
            <option key={index} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <pre className="m-0 p-4 overflow-x-auto">
        <NodeViewContent as="code" className="font-mono text-sm" />
      </pre>
    </NodeViewWrapper>
  )
}
