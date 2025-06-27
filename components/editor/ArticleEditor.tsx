'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import EditorJS from '@editorjs/editorjs'

// Import Editor.js tools
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import Image from '@editorjs/image'
import LinkTool from '@editorjs/link'
import RawTool from '@editorjs/raw'
import Embed from '@editorjs/embed'
import Delimiter from '@editorjs/delimiter'
import Table from '@editorjs/table'
import Quote from '@editorjs/quote'
import Marker from '@editorjs/marker'
import CodeTool from '@editorjs/code'
import InlineCode from '@editorjs/inline-code'
import Underline from '@editorjs/underline'

interface ArticleEditorProps {
  data?: any
  onChange?: (data: any) => void
  placeholder?: string
}

export interface ArticleEditorRef {
  save: () => Promise<any>
  clear: () => void
}

const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(
  ({ data, onChange, placeholder = 'Start writing your article...' }, ref) => {
    const editorRef = useRef<EditorJS | null>(null)
    const [isReady, setIsReady] = useState(false)

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (editorRef.current) {
          return await editorRef.current.save()
        }
        return null
      },
      clear: () => {
        if (editorRef.current) {
          editorRef.current.clear()
        }
      }
    }))

    useEffect(() => {
      if (!editorRef.current) {
        const editor = new EditorJS({
          holder: 'editorjs',
          data: data || {},
          onReady: () => {
            setIsReady(true)
          },
          onChange: async () => {
            if (onChange && editorRef.current) {
              const outputData = await editorRef.current.save()
              onChange(outputData)
            }
          },
          placeholder: placeholder,
          tools: {
            header: {
              class: Header,
              config: {
                placeholder: 'Enter a header',
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
              }
            },
            paragraph: {
              class: Paragraph,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline', 'inlineCode'],
              config: {
                placeholder: 'Tell your story...'
              }
            },
            list: {
              class: List,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline'],
              config: {
                defaultStyle: 'unordered'
              }
            },
            image: {
              class: Image,
              config: {
                endpoints: {
                  byFile: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/articles/upload-image`,
                },
                additionalRequestHeaders: {
                  'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('access_token')}` : ''
                }
              }
            },
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/articles/fetch-url`
              }
            },
            embed: {
              class: Embed,
              config: {
                services: {
                  youtube: true,
                  coub: true,
                  codepen: true
                }
              }
            },
            // table: {
            //   class: Table,
            //   inlineToolbar: true,
            //   config: {
            //     rows: 2,
            //     cols: 3,
            //   }
            // },
            quote: {
              class: Quote,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline'],
              shortcut: 'CMD+SHIFT+O',
              config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Quote author',
              }
            },
            marker: {
              class: Marker,
              shortcut: 'CMD+SHIFT+M'
            },
            code: {
              class: CodeTool,
              config: {
                placeholder: 'Enter code'
              }
            },
            inlineCode: {
              class: InlineCode,
              shortcut: 'CMD+`'
            },
            underline: {
              class: Underline,
              shortcut: 'CMD+U'
            },
            delimiter: Delimiter,
            raw: RawTool
          }
        })

        editorRef.current = editor
      }

      return () => {
        if (editorRef.current && editorRef.current.destroy) {
          editorRef.current.destroy()
          editorRef.current = null
        }
      }
    }, [])

    return (
      <div className="w-full">
        <div
          id="editorjs"
          className="prose prose-lg max-w-none min-h-[400px] p-4 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        />
      </div>
    )
  }
)

ArticleEditor.displayName = 'ArticleEditor'

export default ArticleEditor
export { ArticleEditor }