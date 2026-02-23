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
    'list',
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
    </Form.Group>
  )
}

export default RichTextEditor
