'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface CourseEditorProps {
  data?: any
  onChange?: (data: any) => void
  placeholder?: string
}

export interface CourseEditorRef {
  save: () => Promise<any>
  clear: () => void
}

const CourseEditor = forwardRef<CourseEditorRef, CourseEditorProps>(
  ({ data, onChange, placeholder = 'Start creating your course content...' }, ref) => {
    const editorRef = useRef<any>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)

    useEffect(() => {
      setIsClient(true)
    }, [])

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (editorRef.current) {
          try {
            const data = await editorRef.current.save()
            // Validate and clean blocks before returning
            if (data && data.blocks && Array.isArray(data.blocks)) {
              const validateBlock = (block: any) => {
                if (!block || !block.type) return null
                
                // Ensure block has required fields
                const validatedBlock = {
                  id: block.id || Math.random().toString(36).substr(2, 9),
                  type: block.type,
                  data: block.data || {}
                }

                // Special validation for image blocks
                if (block.type === 'image') {
                  if (!block.data || (!block.data.file && (!block.data.url || block.data.url === ''))) {
                    return null // Skip invalid image blocks
                  }
                }

                // Special validation for paragraph blocks
                if (block.type === 'paragraph') {
                  validatedBlock.data = {
                    text: block.data?.text || ''
                  }
                }

                return validatedBlock
              }

              return {
                ...data,
                blocks: data.blocks.map(validateBlock).filter(Boolean)
              }
            }
            return data
          } catch (error) {
            console.warn('Editor save error:', error)
            return null
          }
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
      if (!isClient) return

      const initializeEditor = async () => {
        if (editorRef.current || hasInitialized) {
          return
        }

        try {
          const EditorJSClass = (await import('@editorjs/editorjs')).default
          const HeaderTool = (await import('@editorjs/header')).default
          const ListTool = (await import('@editorjs/list')).default
          const ParagraphTool = (await import('@editorjs/paragraph')).default
          const ImageTool = (await import('@editorjs/image')).default
          const LinkToolClass = (await import('@editorjs/link')).default
          const RawToolClass = (await import('@editorjs/raw')).default
          const EmbedTool = (await import('@editorjs/embed')).default
          const DelimiterTool = (await import('@editorjs/delimiter')).default
          const QuoteTool = (await import('@editorjs/quote')).default
          const MarkerTool = (await import('@editorjs/marker')).default
          const CodeToolClass = (await import('@editorjs/code')).default
          const InlineCodeTool = (await import('@editorjs/inline-code')).default
          const UnderlineTool = (await import('@editorjs/underline')).default

          const toolsConfig = {
            header: {
              class: HeaderTool,
              config: {
                placeholder: 'Enter a header',
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
              }
            },
            paragraph: {
              class: ParagraphTool,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline', 'inlineCode'],
              config: {
                placeholder: 'Tell your story...',
                preserveBlank: true
              }
            },
            list: {
              class: ListTool,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline'],
              config: {
                defaultStyle: 'unordered'
              }
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile: async (file: File) => {
                    try {
                      // Use our API client for proper authentication
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      // Import the API client dynamically
                      const { apiClient } = await import('@/lib/api/client');
                      const response = await apiClient.upload('/courses/upload-image', formData);
                      
                      console.log('Upload response structure:', response);
                      
                      // Handle different response structures
                      const fileUrl = response.data?.file?.url || response.file?.url || response.url;
                      
                      if (!fileUrl) {
                        console.error('No URL found in response:', response);
                        throw new Error('No image URL returned from server');
                      }
                      
                      return {
                        success: 1,
                        file: {
                          url: fileUrl
                        }
                      };
                    } catch (error) {
                      console.error('Image upload failed:', error);
                      return {
                        success: 0,
                        error: error instanceof Error ? error.message : 'Image upload failed'
                      };
                    }
                  }
                }
              }
            },
            linkTool: {
              class: LinkToolClass,
              config: {
                endpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/courses/fetch-url`
              }
            },
            embed: {
              class: EmbedTool,
              config: {
                services: {
                  youtube: true,
                  coub: true,
                  codepen: true
                }
              }
            },
            quote: {
              class: QuoteTool,
              inlineToolbar: ['marker', 'link', 'bold', 'italic', 'underline'],
              shortcut: 'CMD+SHIFT+O',
              config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Quote author',
              }
            },
            marker: {
              class: MarkerTool,
              shortcut: 'CMD+SHIFT+M'
            },
            code: {
              class: CodeToolClass,
              config: {
                placeholder: 'Enter code'
              }
            },
            inlineCode: {
              class: InlineCodeTool,
              shortcut: 'CMD+`'
            },
            underline: {
              class: UnderlineTool,
              shortcut: 'CMD+U'
            },
            delimiter: DelimiterTool,
            raw: RawToolClass
          }


          // Validate and clean blocks
          const validateBlock = (block: any) => {
            if (!block || !block.type) return null
            
            // Ensure block has required fields
            const validatedBlock = {
              id: block.id || Math.random().toString(36).substr(2, 9),
              type: block.type,
              data: block.data || {}
            }

            // Special validation for image blocks
            if (block.type === 'image') {
              if (!block.data || (!block.data.file && (!block.data.url || block.data.url === ''))) {
                return null // Skip invalid image blocks
              }
            }

            // Special validation for paragraph blocks
            if (block.type === 'paragraph') {
              validatedBlock.data = {
                text: block.data?.text || ''
              }
            }

            return validatedBlock
          }

          // Ensure proper data format for Editor.js
          const editorData = data && data.blocks && Array.isArray(data.blocks) 
            ? {
                ...data,
                blocks: data.blocks.map(validateBlock).filter(Boolean)
              }
            : { blocks: [], version: '2.28.2' };

          const editor = new EditorJSClass({
            holder: 'course-editorjs',
            data: editorData,
            onReady: () => {
              setIsReady(true)
              setHasInitialized(true)
            },
            onChange: () => {
              // Debounce the onChange to prevent excessive calls
              if (onChange && editorRef.current) {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                timeoutRef.current = setTimeout(async () => {
                  try {
                    const rawData = await editorRef.current.save()
                    // Validate and clean blocks before passing to onChange
                    if (rawData && rawData.blocks && Array.isArray(rawData.blocks)) {
                      const validateBlock = (block: any) => {
                        if (!block || !block.type) return null
                        
                        const validatedBlock = {
                          id: block.id || Math.random().toString(36).substr(2, 9),
                          type: block.type,
                          data: block.data || {}
                        }

                        if (block.type === 'image') {
                          if (!block.data || (!block.data.file && (!block.data.url || block.data.url === ''))) {
                            return null
                          }
                        }

                        if (block.type === 'paragraph') {
                          validatedBlock.data = {
                            text: block.data?.text || ''
                          }
                        }

                        return validatedBlock
                      }

                      const cleanData = {
                        ...rawData,
                        blocks: rawData.blocks.map(validateBlock).filter(Boolean)
                      }
                      onChange(cleanData)
                    } else {
                      onChange(rawData)
                    }
                  } catch (error) {
                    // Silently handle save errors
                  }
                }, 500)
              }
            },
            placeholder: placeholder,
            tools: toolsConfig
          })

          editorRef.current = editor
        } catch (error) {
          console.error('Failed to initialize editor:', error)
        }
      }

      initializeEditor()

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (editorRef.current && editorRef.current.destroy) {
          try {
            editorRef.current.destroy()
          } catch (error) {
            // Silently handle destroy errors
          }
          editorRef.current = null
          setIsReady(false)
          setHasInitialized(false)
        }
      }
    }, [isClient])


    if (!isClient) {
      return (
        <div className="w-full">
          <div className="min-h-[400px] p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading editor...</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full">
        <div
          id="course-editorjs"
          className="prose prose-lg max-w-none min-h-[400px] p-4 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        />
      </div>
    )
  }
)

CourseEditor.displayName = 'CourseEditor'

export default CourseEditor
export { CourseEditor }