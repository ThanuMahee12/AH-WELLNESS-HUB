import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, Form, Row, Col, Button, Table, Modal } from 'react-bootstrap'
import {
  FaPlus, FaTrash, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe,
  FaFacebook, FaInstagram, FaWhatsapp, FaTwitter, FaLinkedin,
  FaYoutube, FaTiktok, FaViber, FaClock, FaInfoCircle,
} from 'react-icons/fa'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import FormField from '../../components/ui/FormField'

/** Extract src URL from a full <iframe> tag, or return as-is if already a URL */
const extractMapSrc = (input) => {
  if (!input) return ''
  const srcMatch = input.match(/src=["']([^"']+)["']/)
  if (srcMatch) return srcMatch[1]
  return input.trim()
}

const EMPTY_FEATURE = { title: '', description: '', imageUrl: '', visible: true }
const EMPTY_CONTACT_FIELD = { type: 'detail', label: '', icon: 'FaPhone', value: '', url: '', visible: true }

const FEATURE_FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, colSize: 12, placeholder: 'Feature title' },
  { name: 'imageUrl', label: 'Image URL', type: 'text', required: false, colSize: 12, placeholder: 'Paste Google Drive or image URL (optional)' },
  { name: 'description', label: 'Description', type: 'textarea', required: true, colSize: 12, placeholder: 'Short description for this feature', rows: 3 },
  { name: 'visible', label: 'Visible on Home Page', type: 'checkbox', required: false, colSize: 12 },
]

const CONTACT_ICON_MAP = {
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaFacebook,
  FaInstagram, FaWhatsapp, FaTwitter, FaLinkedin, FaYoutube,
  FaTiktok, FaViber, FaClock, FaInfoCircle,
}

const CONTACT_ICON_OPTIONS = [
  { value: 'FaPhone', label: 'Phone' },
  { value: 'FaEnvelope', label: 'Email' },
  { value: 'FaMapMarkerAlt', label: 'Location' },
  { value: 'FaGlobe', label: 'Website' },
  { value: 'FaFacebook', label: 'Facebook' },
  { value: 'FaInstagram', label: 'Instagram' },
  { value: 'FaWhatsapp', label: 'WhatsApp' },
  { value: 'FaTwitter', label: 'Twitter' },
  { value: 'FaLinkedin', label: 'LinkedIn' },
  { value: 'FaYoutube', label: 'YouTube' },
  { value: 'FaTiktok', label: 'TikTok' },
  { value: 'FaViber', label: 'Viber' },
  { value: 'FaClock', label: 'Hours' },
  { value: 'FaInfoCircle', label: 'Info' },
]

const CONTACT_TYPE_OPTIONS = [
  { value: 'detail', label: 'Detail (shows label + value)' },
  { value: 'social', label: 'Social Media (icon only)' },
]

const CONTACT_FIELD_FIELDS = [
  { name: 'type', label: 'Type', type: 'select', required: true, colSize: 6, options: CONTACT_TYPE_OPTIONS },
  { name: 'label', label: 'Label', type: 'text', required: true, colSize: 6, placeholder: 'e.g., Phone, Facebook' },
  { name: 'icon', label: 'Icon', type: 'select', required: true, colSize: 6, options: CONTACT_ICON_OPTIONS },
  { name: 'value', label: 'Display Value', type: 'text', required: true, colSize: 6, placeholder: 'e.g., +94 77 123 4567' },
  { name: 'url', label: 'Link URL (optional)', type: 'text', required: false, colSize: 12, placeholder: 'e.g., tel:+94771234567 or https://facebook.com/...' },
  { name: 'visible', label: 'Visible', type: 'checkbox', required: false, colSize: 12 },
]

function PublicPageTab() {
  const dispatch = useDispatch()
  const { settings, loading } = useSettings()
  const { user } = useSelector(state => state.auth)
  const { error: showError } = useNotification()

  const homeContent = settings?.pages?.home?.content || {}

  const [localContent, setLocalContent] = useState({})
  const [features, setFeatures] = useState([])
  const [contactFields, setContactFields] = useState([])

  // Modal state — modalType: 'feature' | 'contact'
  const [modalType, setModalType] = useState('feature')
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
      aboutTitle: homeContent.aboutTitle || '',
      aboutDescription: homeContent.aboutDescription || '',
      aboutImageUrl: homeContent.aboutImageUrl || '',
      aboutVisible: homeContent.aboutVisible !== false,
      contactTitle: homeContent.contactTitle || '',
      contactMapEmbedUrl: homeContent.contactMapEmbedUrl || '',
      contactVisible: homeContent.contactVisible !== false,
    })
    setFeatures((homeContent.blogs || []).map(b => ({ ...b })))
    setContactFields((homeContent.contactFields || []).map(f => ({ ...f })))
  }, [homeContent.heroTitle, homeContent.heroSubtitle, homeContent.heroImageUrl, homeContent.ctaText, homeContent.ctaAuthText, homeContent.blogs,
      homeContent.aboutTitle, homeContent.aboutDescription, homeContent.aboutImageUrl, homeContent.aboutVisible,
      homeContent.contactTitle, homeContent.contactFields, homeContent.contactMapEmbedUrl, homeContent.contactVisible])

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

  const saveList = async (key, list) => {
    setSaving(true)
    try {
      await dispatch(updateSettings({
        data: { pages: { home: { content: { [key]: list } } } },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to update: ' + (err || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Modal handlers — unified for features & contact fields
  const openModal = (type, idx = null) => {
    setModalType(type)
    setEditIndex(idx)
    if (type === 'feature') {
      setFormData(idx !== null ? { ...features[idx] } : { ...EMPTY_FEATURE })
    } else {
      setFormData(idx !== null ? { ...contactFields[idx] } : { ...EMPTY_CONTACT_FIELD })
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (type, idx) => {
    if (type === 'feature') {
      const updated = features.filter((_, i) => i !== idx)
      setFeatures(updated)
      await saveList('blogs', updated)
    } else {
      const updated = contactFields.filter((_, i) => i !== idx)
      setContactFields(updated)
      await saveList('contactFields', updated)
    }
  }

  // Inline contact field edit
  const updateContactField = (idx, key, value) => {
    setContactFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f))
  }
  const saveContactFields = async () => {
    await saveList('contactFields', contactFields)
  }
  const addContactField = () => {
    const updated = [...contactFields, { ...EMPTY_CONTACT_FIELD }]
    setContactFields(updated)
    saveList('contactFields', updated)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async () => {
    const errors = {}
    if (modalType === 'feature') {
      if (!formData.title?.trim()) errors.title = 'Title is required'
      if (!formData.description?.trim()) errors.description = 'Description is required'
    } else {
      if (!formData.label?.trim()) errors.label = 'Label is required'
      if (!formData.value?.trim()) errors.value = 'Value is required'
    }
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }

    const isFeature = modalType === 'feature'
    const list = isFeature ? features : contactFields
    const setList = isFeature ? setFeatures : setContactFields
    const key = isFeature ? 'blogs' : 'contactFields'

    let updated
    if (editIndex !== null) {
      updated = list.map((f, i) => i === editIndex ? { ...formData } : f)
    } else {
      updated = [...list, { ...formData }]
    }
    setList(updated)
    await saveList(key, updated)
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
            onClick={() => openModal('feature')}
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
                          onClick={() => openModal('feature', idx)}
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
                          onClick={() => handleDelete('feature', idx)}
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

      {/* About Us Section Settings */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fs-responsive-md">About Us Section</h5>
          <Form.Check
            type="switch"
            id="aboutVisible"
            label="Visible"
            checked={localContent.aboutVisible || false}
            onChange={(e) => {
              setLocalContent(prev => ({ ...prev, aboutVisible: e.target.checked }))
              dispatch(updateSettings({
                data: { pages: { home: { content: { aboutVisible: e.target.checked } } } },
                user,
              }))
            }}
          />
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Title</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.aboutTitle || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, aboutTitle: e.target.value }))}
                  onBlur={() => handleContentBlur('aboutTitle')}
                  placeholder="e.g., About Us"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Image URL</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.aboutImageUrl || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, aboutImageUrl: e.target.value }))}
                  onBlur={() => handleContentBlur('aboutImageUrl')}
                  placeholder="Paste Google Drive or image URL (optional)"
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={localContent.aboutDescription || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, aboutDescription: e.target.value }))}
                  onBlur={() => handleContentBlur('aboutDescription')}
                  placeholder="Write about your organization..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contact Section Settings */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fs-responsive-md">Contact Section</h5>
          <Form.Check
            type="switch"
            id="contactVisible"
            label="Visible"
            checked={localContent.contactVisible || false}
            onChange={(e) => {
              setLocalContent(prev => ({ ...prev, contactVisible: e.target.checked }))
              dispatch(updateSettings({
                data: { pages: { home: { content: { contactVisible: e.target.checked } } } },
                user,
              }))
            }}
          />
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Section Title</Form.Label>
                <Form.Control
                  type="text"
                  value={localContent.contactTitle || ''}
                  onChange={(e) => setLocalContent(prev => ({ ...prev, contactTitle: e.target.value }))}
                  onBlur={() => handleContentBlur('contactTitle')}
                  placeholder="e.g., Contact Us"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Google Maps Embed</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={localContent.contactMapEmbedUrl || ''}
                  onChange={(e) => {
                    const extracted = extractMapSrc(e.target.value)
                    setLocalContent(prev => ({ ...prev, contactMapEmbedUrl: extracted }))
                  }}
                  onBlur={() => handleContentBlur('contactMapEmbedUrl')}
                  placeholder='Paste full <iframe> tag or URL from Google Maps'
                />
                <Form.Text className="text-muted">
                  Google Maps → Share → Embed a map → Paste iframe code. URL is extracted automatically.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contact Fields — Inline Edit */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="card-header-theme d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fs-responsive-md">Contact Details</h5>
          <Button
            size="sm"
            variant="light"
            className="d-flex align-items-center gap-1"
            onClick={addContactField}
          >
            <FaPlus /> Add
          </Button>
        </Card.Header>
        <Card.Body>
          {contactFields.length === 0 ? (
            <p className="text-muted text-center py-3 mb-0">No contact details yet. Click &quot;Add&quot; to create one.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {contactFields.map((field, idx) => {
                const Icon = CONTACT_ICON_MAP[field.icon] || FaInfoCircle
                return (
                  <div key={idx} className="border rounded p-2" style={{ background: 'rgba(8,145,178,0.02)' }}>
                    <Row className="g-2 align-items-center">
                      {/* Icon dropdown — shows actual icon */}
                      <Col xs="auto">
                        <div className="position-relative">
                          <div className="d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(6,182,212,0.15))' }}>
                            <Icon style={{ fontSize: '1rem', color: 'var(--theme-primary)' }} />
                          </div>
                          <Form.Select
                            size="sm"
                            value={field.icon || 'FaPhone'}
                            onChange={(e) => updateContactField(idx, 'icon', e.target.value)}
                            onBlur={saveContactFields}
                            className="position-absolute top-0 start-0 opacity-0"
                            style={{ width: 36, height: 36, cursor: 'pointer' }}
                          >
                            {CONTACT_ICON_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </Col>
                      <Col xs={4} md={2}>
                        <Form.Select
                          size="sm"
                          value={field.type || 'detail'}
                          onChange={(e) => updateContactField(idx, 'type', e.target.value)}
                          onBlur={saveContactFields}
                        >
                          <option value="detail">Detail</option>
                          <option value="social">Social</option>
                        </Form.Select>
                      </Col>
                      <Col>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="Label"
                          value={field.label || ''}
                          onChange={(e) => updateContactField(idx, 'label', e.target.value)}
                          onBlur={saveContactFields}
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="Value"
                          value={field.value || ''}
                          onChange={(e) => updateContactField(idx, 'value', e.target.value)}
                          onBlur={saveContactFields}
                        />
                      </Col>
                      <Col className="d-none d-md-block">
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="URL (optional)"
                          value={field.url || ''}
                          onChange={(e) => updateContactField(idx, 'url', e.target.value)}
                          onBlur={saveContactFields}
                        />
                      </Col>
                      <Col xs="auto">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete('contact', idx)}
                          title="Delete"
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                    {/* URL on mobile — second row */}
                    <Row className="g-2 d-md-none mt-1">
                      <Col>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="URL (optional)"
                          value={field.url || ''}
                          onChange={(e) => updateContactField(idx, 'url', e.target.value)}
                          onBlur={saveContactFields}
                        />
                      </Col>
                    </Row>
                  </div>
                )
              })}
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
          <Modal.Title>
            {editIndex !== null ? 'Edit' : 'Add'} {modalType === 'feature' ? 'Feature' : 'Contact Detail'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <Modal.Body className="modal-body-responsive" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '1rem' }}>
            <Row className="g-3">
              {(modalType === 'feature' ? FEATURE_FIELDS : CONTACT_FIELD_FIELDS).map((field) => (
                <Col key={field.name} xs={12} md={field.colSize || 6}>
                  {field.type === 'select' && field.options ? (
                    <Form.Group>
                      <Form.Label className="fw-semibold">{field.label}{field.required && ' *'}</Form.Label>
                      <Form.Select
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleFormChange}
                        disabled={saving}
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  ) : (
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
                  )}
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
                  onClick={() => { handleDelete(modalType, editIndex); setShowModal(false) }}
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
