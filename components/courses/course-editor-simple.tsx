'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'

interface CourseEditorSimpleProps {
  data?: any
  onChange?: (data: any) => void
  placeholder?: string
}

export interface CourseEditorSimpleRef {
  save: () => Promise<any>
  clear: () => void
}

const CourseEditorSimple = forwardRef<CourseEditorSimpleRef, CourseEditorSimpleProps>(
  ({ data, onChange, placeholder = 'Start creating your course content...' }, ref) => {
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
          holder: 'course-editorjs-simple',
          data: data || {},
          onReady: () => {
            setIsReady(true)
            console.log('Simple Course Editor ready')
          },
          onChange: async () => {
            if (onChange && editorRef.current) {
              const outputData = await editorRef.current.save()
              onChange(outputData)
            }
          },
          placeholder: placeholder,
          tools: {
            header: Header,
            paragraph: Paragraph,
            list: List
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
          id="course-editorjs-simple"
          className="min-h-[400px] p-4 border border-gray-200 rounded-lg"
        />
        {isReady && (
          <div className="mt-2 text-xs text-green-600">
            ✓ Simple Course Editor loaded successfully - Try clicking + button for tools
          </div>
        )}
      </div>
    )
  }
)

CourseEditorSimple.displayName = 'CourseEditorSimple'

export default CourseEditorSimple
export { CourseEditorSimple }