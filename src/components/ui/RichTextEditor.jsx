import { useEffect, useRef, useMemo } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Form } from 'react-bootstrap'

/**
 * RichTextEditor - Reusable rich text editor component using Quill
 *
 * Features:
 * - Bold, Italic, Underline, Strike
 * - Headings (H1, H2, H3)
 * - Bullet lists, Numbered lists
 * - Links
 * - Blockquotes
 * - Code blocks
 * - Text alignment
 * - Clean formatting button
 */

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  error,
  label,
  required = false,
  height = '200px',
  id
}) => {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const isUpdating = useRef(false)

  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  }), [])

  // Formats allowed in the editor
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link',
    'blockquote', 'code-block'
  ]

  // Initialize Quill only once
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules,
        formats,
        placeholder
      })

      // Handle text changes
      quillRef.current.on('text-change', () => {
        isUpdating.current = true
        const content = quillRef.current.root.innerHTML
        onChange(content === '<p><br></p>' ? '' : content)
        setTimeout(() => {
          isUpdating.current = false
        }, 0)
      })
    }

    // Cleanup function to properly destroy Quill instance
    return () => {
      if (quillRef.current) {
        const toolbar = quillRef.current.getModule('toolbar')
        if (toolbar && toolbar.container) {
          toolbar.container.remove()
        }
        quillRef.current = null
      }
    }
    // Only initialize once - no dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update editor content when value prop changes
  useEffect(() => {
    if (quillRef.current && !isUpdating.current) {
      const currentContent = quillRef.current.root.innerHTML
      if (currentContent !== value) {
        const selection = quillRef.current.getSelection()
        quillRef.current.root.innerHTML = value || ''
        if (selection) {
          quillRef.current.setSelection(selection)
        }
      }
    }
  }, [value])

  return (
    <Form.Group className="mb-3" controlId={id}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      <div className={`rich-text-editor-wrapper ${error ? 'is-invalid' : ''}`}>
        <div ref={editorRef} style={{ height: height }} />
      </div>
      {error && <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>{error}</Form.Control.Feedback>}

      <style>{`
        .rich-text-editor-wrapper {
          border-radius: 0.375rem;
          background: white;
          margin-bottom: 42px;
        }
        .rich-text-editor-wrapper.is-invalid .ql-container {
          border: 1px solid #dc3545;
        }
        .ql-toolbar.ql-snow {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border: 1px solid #dee2e6;
          background: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border: 1px solid #dee2e6;
          border-top: none;
          font-size: 1rem;
          font-family: inherit;
        }
        .ql-editor {
          min-height: ${height};
          font-size: 1rem;
        }
        .ql-editor.ql-blank::before {
          color: #6c757d;
          font-style: normal;
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .rich-text-editor-wrapper {
            margin-bottom: 1rem;
          }

          .ql-toolbar.ql-snow {
            padding: 0.5rem;
          }

          .ql-toolbar.ql-snow button {
            width: 28px;
            height: 28px;
            padding: 3px 5px;
          }

          .ql-editor {
            min-height: 120px;
            font-size: 0.95rem;
            padding: 0.75rem;
          }

          .ql-container.ql-snow {
            font-size: 0.95rem;
          }
        }

        /* Tablet responsiveness */
        @media (min-width: 768px) and (max-width: 991px) {
          .ql-editor {
            font-size: 0.98rem;
          }
        }
      `}</style>
    </Form.Group>
  )
}

export default RichTextEditor
