'use client'

import React from 'react'

interface CourseContentRendererProps {
  content: string
  className?: string
}

export const CourseContentRenderer: React.FC<CourseContentRendererProps> = ({
  content,
  className = ''
}) => {
  if (!content) {
    return null
  }

  let parsedContent
  try {
    parsedContent = JSON.parse(content)
  } catch {
    // If parsing fails, treat as plain text
    return (
      <div className={`prose prose-lg max-w-none ${className}`}>
        <p>{content}</p>
      </div>
    )
  }

  const renderBlock = (block: any, index: number) => {
    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements
        return (
          <HeaderTag key={index} className="font-bold mb-4 mt-6">
            {block.data.text}
          </HeaderTag>
        )

      case 'paragraph':
        return (
          <p key={index} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.text }} />
        )

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
        return (
          <ListTag key={index} className={`mb-4 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'} list-inside space-y-2`}>
            {block.data.items.map((item: string, itemIndex: number) => (
              <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ListTag>
        )

      case 'image':
        return (
          <figure key={index} className="mb-6">
            <img
              src={block.data.file.url}
              alt={block.data.caption || 'Course image'}
              className="w-full rounded-lg shadow-md"
            />
            {block.data.caption && (
              <figcaption className="text-sm text-gray-600 mt-2 text-center italic">
                {block.data.caption}
              </figcaption>
            )}
          </figure>
        )

      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-blue-500 pl-6 my-6 italic bg-blue-50 py-4 rounded-r-lg">
            <p className="text-lg font-medium text-gray-900 mb-2">{block.data.text}</p>
            {block.data.caption && (
              <cite className="text-sm text-gray-600">— {block.data.caption}</cite>
            )}
          </blockquote>
        )

      case 'code':
        return (
          <pre key={index} className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-6">
            <code>{block.data.code}</code>
          </pre>
        )

      case 'table':
        return (
          <div key={index} className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <tbody className="bg-white divide-y divide-gray-200">
                {block.data.content.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="px-4 py-2 border border-gray-300 text-sm">
                        <div dangerouslySetInnerHTML={{ __html: cell }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'delimiter':
        return (
          <div key={index} className="flex justify-center my-8">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )

      case 'embed':
        return (
          <div key={index} className="mb-6">
            <div dangerouslySetInnerHTML={{ __html: block.data.embed }} />
          </div>
        )

      case 'linkTool':
        return (
          <div key={index} className="mb-6 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <a
              href={block.data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline"
            >
              {block.data.meta.image && (
                <img
                  src={block.data.meta.image.url}
                  alt=""
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold text-blue-600 mb-2">{block.data.meta.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{block.data.meta.description}</p>
              <span className="text-xs text-gray-500">{block.data.link}</span>
            </a>
          </div>
        )

      case 'raw':
        return (
          <div key={index} className="mb-6" dangerouslySetInnerHTML={{ __html: block.data.html }} />
        )

      default:
        return (
          <div key={index} className="mb-4 p-4 bg-gray-100 rounded border-l-4 border-orange-500">
            <p className="text-sm text-gray-600">Unsupported content type: {block.type}</p>
          </div>
        )
    }
  }

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {parsedContent.blocks?.map((block: any, index: number) => renderBlock(block, index))}
    </div>
  )
}