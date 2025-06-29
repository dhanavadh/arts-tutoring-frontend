'use client'

import { useEffect, useRef, useState } from 'react'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import Paragraph from '@editorjs/paragraph'

export default function CourseEditorDebug() {
  const editorRef = useRef<EditorJS | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editorRef.current) {
      try {
        console.log('Initializing debug editor...')
        console.log('Header tool:', Header)
        console.log('Paragraph tool:', Paragraph)
        
        const editor = new EditorJS({
          holder: 'debug-editorjs',
          onReady: () => {
            console.log('Debug Editor.js is ready!')
            setIsReady(true)
          },
          onChange: () => {
            console.log('Editor content changed')
          },
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
              config: {
                placeholder: 'Start writing...'
              }
            }
          }
        })

        editorRef.current = editor
        console.log('Editor instance created:', editor)
      } catch (err: any) {
        console.error('Failed to initialize debug editor:', err)
        setError(err.message)
      }
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full p-4">
      <h3 className="text-lg font-semibold mb-4">Debug Editor</h3>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      <div
        id="debug-editorjs"
        className="min-h-[300px] p-4 border border-gray-200 rounded-lg"
      />
      {isReady && (
        <div className="mt-2 text-xs text-green-600">
          ✓ Debug Editor loaded successfully
        </div>
      )}
    </div>
  )
}