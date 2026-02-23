import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, Form, Row, Col, Button, Table, Modal } from 'react-bootstrap'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import FormField from '../../components/ui/FormField'

const EMPTY_FEATURE = { title: '', description: '', imageUrl: '', visible: true }

const FEATURE_FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, colSize: 12, placeholder: 'Feature title' },
  { name: 'imageUrl', label: 'Image URL', type: 'text', required: false, colSize: 12, placeholder: 'Paste Google Drive or image URL (optional)' },
  { name: 'description', label: 'Description', type: 'textarea', required: true, colSize: 12, placeholder: 'Short description for this feature', rows: 3 },
  { name: 'visible', label: 'Visible on Home Page', type: 'checkbox', required: false, colSize: 12 },
]

function PublicPageTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const homeContent = settings?.pages?.home?.content || {}

  const [localContent, setLocalContent] = useState({})
  const [features, setFeatures] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_FEATURE })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalContent({
      heroTitle: homeContent.heroTitle || '',
      heroSubtitle: homeContent.heroSubtitle || '',
      heroImageUrl: homeContent.heroImageUrl || '',
      ctaText: homeContent.ctaText || '',
      ctaAuthText: homeContent.ctaAuthText || '',
    })
    setFeatures((homeContent.blogs || []).map(b => ({ ...b })))
  }, [homeContent.heroTitle, homeContent.heroSubtitle, homeContent.heroImageUrl, homeContent.ctaText, homeContent.ctaAuthText, homeContent.blogs])

  const handleContentBlur = async (field) => {
    if (localContent[field] === (homeContent[field] || '')) return
    try {
      await dispatch(updateSettings({
        data: { pages: { home: { content: { [field]: localContent[field] } } } },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update home content: ' + (err || 'Unknown error'))
    }
  }

  const saveFeatures = async (featuresToSave) => {
    setSaving(true)
    try {
      await dispatch(updateSettings({
        data: { pages: { home: { content: { blogs: featuresToSave } } } },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update features: ' + (err || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Modal handlers
  const handleAdd = () => {
    setEditIndex(null)
    setFormData({ ...EMPTY_FEATURE })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEdit = (idx) => {
    setEditIndex(idx)
    setFormData({ ...features[idx] })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (idx) => {
    const updated = features.filter((_, i) => i !== idx)
    setFeatures(updated)
    await saveFeatures(updated)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async () => {
    const errors = {}
    if (!formData.title?.trim()) errors.title = 'Title is required'
    if (!formData.description?.trim()) errors.description = 'Description is required'
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }

    let updated
    if (editIndex !== null) {
      updated = features.map((f, i) => i === editIndex ? { ...formData } : f)
    } else {
      updated = [...features, { ...formData }]
    }
    setFeatures(updated)
    await saveFeatures(updated)
    setShowModal(false)
  }

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  return (
    <>
      {/* Hero Section Settings */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme">
          <h5 className="mb-0 fs-responsive-md">Home Page — Hero Section</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Hero Title</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.heroTitle || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                  onBlur={() => handleContentBlur('heroTitle')}
                  placeholder="e.g., AH WELLNESS HUB"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Hero Image URL</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.heroImageUrl || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                  onBlur={() => handleContentBlur('heroImageUrl')}
                  placeholder="Paste Google Drive or image URL"
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Hero Subtitle</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={localContent.heroSubtitle || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  onBlur={() => handleContentBlur('heroSubtitle')}
                  placeholder="Short description shown below the title"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">CTA Text (Logged Out)</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.ctaText || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, ctaText: e.target.value }))}
                  onBlur={() => handleContentBlur('ctaText')}
                  placeholder="e.g., Get Started"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">CTA Text (Logged In)</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.ctaAuthText || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, ctaAuthText: e.target.value }))}
                  onBlur={() => handleContentBlur('ctaAuthText')}
                  placeholder="e.g., Go to Dashboard"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Features Table */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fs-responsive-md">Features</h5>
          <Button
            size="sm"
            variant="light"
            className="d-flex align-items-center gap-1"
            onClick={handleAdd}
          >
            <FaPlus /> Add
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {features.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No features yet. Click &quot;Add&quot; to create one.</p>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="thead-theme">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Title</th>
                    <th className="d-none d-md-table-cell">Description</th>
                    <th style={{ width: '80px' }} className="text-end"></th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <span
                          className="clickable-link text-theme fw-semibold"
                          onClick={() => handleEdit(idx)}
                        >
                          {feature.title || '(Untitled)'}
                        </span>
                        <div className="d-md-none text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                          {feature.description?.substring(0, 60)}{feature.description?.length > 60 ? '...' : ''}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell text-muted" style={{ fontSize: '0.9rem' }}>
                        {feature.description?.substring(0, 80)}{feature.description?.length > 80 ? '...' : ''}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="touch-target"
                          onClick={() => handleDelete(idx)}
                          title="Delete"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        backdrop="static"
        centered
        scrollable
        fullscreen="md-down"
        className="crud-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editIndex !== null ? 'Edit Feature' : 'Add Feature'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <Modal.Body className="modal-body-responsive" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '1rem' }}>
            <Row className="g-3">
              {FEATURE_FIELDS.map((field) => (
                <Col key={field.name} xs={12} md={field.colSize || 6}>
                  <FormField
                    label={field.label}
                    name={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={handleFormChange}
                    error={formErrors[field.name]}
                    required={field.required}
                    placeholder={field.placeholder}
                    disabled={saving}
                    rows={field.rows}
                  />
                </Col>
              ))}
            </Row>
          </Modal.Body>
          <Modal.Footer className="modal-footer-responsive d-flex justify-content-between">
            <div>
              {editIndex !== null && (
                <Button
                  variant="outline-danger"
                  disabled={saving}
                  className="d-flex align-items-center gap-1"
                  onClick={() => { handleDelete(editIndex); setShowModal(false) }}
                >
                  <FaTrash /> Delete
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editIndex !== null ? 'Update' : 'Add'}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

export default PublicPageTab
