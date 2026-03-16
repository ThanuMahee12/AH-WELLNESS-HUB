import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, Form, Row, Col, Button, Badge, Modal } from 'react-bootstrap'
import {
  FaPlus, FaTrash, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe,
  FaFacebook, FaInstagram, FaWhatsapp, FaTwitter, FaLinkedin,
  FaYoutube, FaTiktok, FaViber, FaClock, FaInfoCircle, FaPaperPlane,
  FaChevronDown, FaChevronUp, FaSignInAlt,
} from 'react-icons/fa'
import { ICON_MAP, ICON_OPTIONS } from '../../constants/defaultSettings'
import { updateSettings } from '../../store/settingsSlice'
import { useSettings } from '../../hooks/useSettings'
import { useNotification } from '../../context'
import { submitFeedback, getUserFeedbacks } from '../../services/feedbackService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import FormField from '../../components/ui/FormField'

/** Extract src URL from a full <iframe> tag, or return as-is if already a URL */
const extractMapSrc = (input) => {
  if (!input) return ''
  const srcMatch = input.match(/src=["']([^"']+)["']/)
  if (srcMatch) return srcMatch[1]
  return input.trim()
}

/** Convert Google Drive share URL to direct image URL */
const toDirectImageUrl = (url) => {
  if (!url) return ''
  // Google Drive file link: /file/d/FILE_ID/view or /file/d/FILE_ID/edit etc
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  // Google Drive open link: /open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`
  // Google Drive uc link: /uc?id=FILE_ID
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/)
  if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`
  return url
}

const SaveBtn = ({ onClick, saving }) => (
  <button type="button" onClick={onClick} disabled={saving}
    style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3, opacity: saving ? 0.5 : 1 }}>
    {saving ? 'Saving...' : 'Save'}
  </button>
)

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
  const { success: showSuccess, error: showError } = useNotification()

  const homeContent = settings?.pages?.home?.content || {}
  const loginContent = settings?.pages?.login?.content || {}

  const [localContent, setLocalContent] = useState({})
  const [loginLocal, setLoginLocal] = useState({ brandTitle: '', brandSubtitle: '', brandFeatures: [] })
  const [features, setFeatures] = useState([])
  const [contactFields, setContactFields] = useState([])

  // Modal state — modalType: 'feature' | 'contact'
  const [modalType, setModalType] = useState('feature')
  const [showModal, setShowModal] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_FEATURE })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [heroImgError, setHeroImgError] = useState(false)
  const [aboutImgError, setAboutImgError] = useState(false)

  // Feedback state
  const [feedbackForm, setFeedbackForm] = useState({ title: '', category: 'general', message: '' })
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbacksLoading, setFeedbacksLoading] = useState(true)
  const [feedbacksExpanded, setFeedbacksExpanded] = useState(false)

  useEffect(() => {
    setLocalContent({
      heroTitle: homeContent.heroTitle || '',
      heroSubtitle: homeContent.heroSubtitle || '',
      heroImageUrl: homeContent.heroImageUrl || '',
      ctaText: homeContent.ctaText || '',
      ctaAuthText: homeContent.ctaAuthText || '',
      ctaLink: homeContent.ctaLink || '/login',
      ctaAuthLink: homeContent.ctaAuthLink || '/dashboard',
      ctaVisible: homeContent.ctaVisible !== false,
      ctaAuthVisible: homeContent.ctaAuthVisible !== false,
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

  // Sync login branding content from settings
  useEffect(() => {
    setLoginLocal({
      brandTitle: loginContent.brandTitle || '',
      brandSubtitle: loginContent.brandSubtitle || '',
      brandFeatures: (loginContent.brandFeatures || []).map(f => ({ ...f })),
    })
  }, [loginContent.brandTitle, loginContent.brandSubtitle, loginContent.brandFeatures])

  // Reset image error state when URLs change
  useEffect(() => { setHeroImgError(false) }, [localContent.heroImageUrl])
  useEffect(() => { setAboutImgError(false) }, [localContent.aboutImageUrl])

  // Load user feedbacks
  useEffect(() => {
    if (user?.uid) {
      setFeedbacksLoading(true)
      getUserFeedbacks(user.uid)
        .then(result => { if (result.success) setFeedbacks(result.data) })
        .catch(() => {})
        .finally(() => setFeedbacksLoading(false))
    }
  }, [user?.uid])

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.title.trim() || !feedbackForm.message.trim()) {
      showError('Please fill in title and message')
      return
    }
    setFeedbackSubmitting(true)
    try {
      const result = await submitFeedback({
        title: feedbackForm.title.trim(),
        message: feedbackForm.message.trim(),
        category: feedbackForm.category,
        userId: user.uid,
        username: user.username || user.email,
        userRole: user.role,
      })
      if (result.success) {
        showSuccess('Feedback submitted successfully')
        setFeedbackForm({ title: '', category: 'general', message: '' })
        const refreshed = await getUserFeedbacks(user.uid)
        if (refreshed.success) setFeedbacks(refreshed.data)
      } else {
        showError('Failed to submit feedback')
      }
    } catch {
      showError('Failed to submit feedback')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

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

  const saveSection = async (fields) => {
    setSaving(true)
    try {
      const contentUpdates = {}
      fields.forEach(f => { contentUpdates[f] = localContent[f] })
      await dispatch(updateSettings({ data: { pages: { home: { content: contentUpdates } } }, user })).unwrap()
    } catch (err) {
      showError('Failed to save: ' + (err || 'Unknown error'))
    } finally {
      setSaving(false)
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

  const saveLoginContent = async () => {
    setSaving(true)
    try {
      await dispatch(updateSettings({
        data: { pages: { login: { content: { brandTitle: loginLocal.brandTitle, brandSubtitle: loginLocal.brandSubtitle, brandFeatures: loginLocal.brandFeatures } } } },
        user,
      })).unwrap()
    } catch (err) {
      showError('Failed to save login content: ' + (err || 'Unknown error'))
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

  // Auto-generate URL based on icon type and value
  const autoUrl = (icon, value) => {
    if (!value) return ''
    const clean = value.replace(/\s+/g, '').replace(/-/g, '')
    if (icon === 'FaWhatsapp') return `https://wa.me/${clean.replace(/^\+/, '')}`
    if (icon === 'FaPhone') return `tel:${clean}`
    if (icon === 'FaEnvelope') return `mailto:${value.trim()}`
    if (icon === 'FaFacebook') return value.startsWith('http') ? value : `https://facebook.com/${value.trim()}`
    if (icon === 'FaInstagram') return value.startsWith('http') ? value : `https://instagram.com/${value.trim()}`
    if (icon === 'FaTwitter') return value.startsWith('http') ? value : `https://twitter.com/${value.trim()}`
    if (icon === 'FaLinkedin') return value.startsWith('http') ? value : `https://linkedin.com/in/${value.trim()}`
    if (icon === 'FaYoutube') return value.startsWith('http') ? value : `https://youtube.com/@${value.trim()}`
    if (icon === 'FaTiktok') return value.startsWith('http') ? value : `https://tiktok.com/@${value.trim()}`
    return ''
  }

  const updateContactField = (idx, key, value) => {
    setContactFields(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, [key]: value }
      // Auto-generate URL when value or icon changes
      if (key === 'value' || key === 'icon') {
        const icon = key === 'icon' ? value : f.icon
        const val = key === 'value' ? value : f.value
        updated.url = autoUrl(icon, val)
        // Default label from icon if empty
        if (!updated.label) {
          const opt = CONTACT_ICON_OPTIONS.find(o => o.value === icon)
          if (opt) updated.label = opt.label
        }
      }
      return updated
    }))
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
      {/* Login Page Branding */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-1">
              <FaSignInAlt size={10} className="text-muted" />
              <small className="fw-bold text-muted">LOGIN PAGE</small>
            </div>
            <SaveBtn saving={saving} onClick={saveLoginContent} />
          </div>
          <Row className="g-2">
            <Col xs={12} md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Brand Title</Form.Label>
                <Form.Control size="sm" value={loginLocal.brandTitle} onChange={(e) => setLoginLocal(p => ({ ...p, brandTitle: e.target.value }))} placeholder="e.g., Blood Lab Manager" style={{ fontSize: '0.8rem' }} />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Brand Subtitle</Form.Label>
                <Form.Control size="sm" value={loginLocal.brandSubtitle} onChange={(e) => setLoginLocal(p => ({ ...p, brandSubtitle: e.target.value }))} placeholder="e.g., Complete POS system for labs" style={{ fontSize: '0.8rem' }} />
              </Form.Group>
            </Col>
          </Row>

          {/* Brand Features */}
          <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="fw-bold text-muted" style={{ fontSize: '0.62rem' }}>BRAND FEATURES (shown on login sidebar)</small>
              <button type="button" onClick={() => setLoginLocal(p => ({ ...p, brandFeatures: [...p.brandFeatures, { icon: 'FaFlask', text: '' }] }))}
                style={{ fontSize: '0.62rem', padding: '1px 6px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3 }}>
                <FaPlus size={7} className="me-1" />Add
              </button>
            </div>
            {loginLocal.brandFeatures.map((feat, idx) => {
              const Icon = ICON_MAP[feat.icon] || ICON_MAP.FaFlask
              return (
                <div key={idx} className="d-flex align-items-center gap-1 mb-1">
                  {/* Icon selector */}
                  <span style={{ width: 30, position: 'relative' }}>
                    <Icon size={12} style={{ color: '#0891B2' }} />
                    <Form.Select size="sm" value={feat.icon || 'FaFlask'}
                      onChange={(e) => setLoginLocal(p => ({ ...p, brandFeatures: p.brandFeatures.map((f, i) => i === idx ? { ...f, icon: e.target.value } : f) }))}
                      className="position-absolute top-0 start-0 opacity-0" style={{ width: 30, height: 24, cursor: 'pointer' }}>
                      {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Form.Select>
                  </span>
                  {/* Text */}
                  <Form.Control size="sm" value={feat.text} placeholder="Feature description"
                    onChange={(e) => setLoginLocal(p => ({ ...p, brandFeatures: p.brandFeatures.map((f, i) => i === idx ? { ...f, text: e.target.value } : f) }))}
                    style={{ fontSize: '0.75rem', flex: 1, height: 26 }} />
                  {/* Delete */}
                  <button type="button" onClick={() => setLoginLocal(p => ({ ...p, brandFeatures: p.brandFeatures.filter((_, i) => i !== idx) }))}
                    style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                    <FaTrash size={9} />
                  </button>
                </div>
              )
            })}
            {loginLocal.brandFeatures.length === 0 && (
              <div className="text-center text-muted py-1" style={{ fontSize: '0.72rem' }}>No features. Click Add to create one.</div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Hero Section */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="fw-bold text-muted">HERO SECTION</small>
            <SaveBtn saving={saving} onClick={() => saveSection(['heroTitle', 'heroSubtitle', 'heroImageUrl', 'ctaText', 'ctaAuthText', 'ctaLink', 'ctaAuthLink', 'ctaVisible', 'ctaAuthVisible'])} />
          </div>
          <Row className="g-2">
            {/* Left: fields */}
            <Col xs={12} md={localContent.heroImageUrl ? 8 : 12}>
              <Row className="g-2">
                <Col xs={12}>
                  <Form.Group className="mb-1">
                    <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Title</Form.Label>
                    <Form.Control size="sm" value={localContent.heroTitle || ''} onChange={(e) => setLocalContent(p => ({ ...p, heroTitle: e.target.value }))} onBlur={() => handleContentBlur('heroTitle')} placeholder="e.g., AH WELLNESS HUB" style={{ fontSize: '0.8rem' }} />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group className="mb-1">
                    <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Subtitle</Form.Label>
                    <Form.Control size="sm" as="textarea" rows={2} value={localContent.heroSubtitle || ''} onChange={(e) => setLocalContent(p => ({ ...p, heroSubtitle: e.target.value }))} onBlur={() => handleContentBlur('heroSubtitle')} placeholder="Description below title" style={{ fontSize: '0.8rem' }} />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group className="mb-1">
                    <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Hero Image URL</Form.Label>
                    <Form.Control size="sm" value={localContent.heroImageUrl || ''} onChange={(e) => setLocalContent(p => ({ ...p, heroImageUrl: e.target.value }))} onBlur={() => handleContentBlur('heroImageUrl')} placeholder="Google Drive or direct image URL" style={{ fontSize: '0.8rem' }} />
                    <Form.Text style={{ fontSize: '0.62rem' }} className="text-muted">Google Drive: File → Share → Copy link. Replace /view with /preview or use direct URL.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* CTA Buttons */}
              <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <small className="fw-bold text-muted d-block mb-1" style={{ fontSize: '0.62rem' }}>CTA BUTTONS</small>
                <Row className="g-2">
                  <Col xs={12} md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check type="switch" id="cta-visible" checked={localContent.ctaVisible !== false}
                        onChange={(e) => { setLocalContent(p => ({ ...p, ctaVisible: e.target.checked })); setTimeout(() => handleContentBlur('ctaVisible'), 100) }} />
                      <div style={{ flex: 1 }}>
                        <Form.Label style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 0 }}>Logged Out Text</Form.Label>
                        <Form.Control size="sm" value={localContent.ctaText || ''} onChange={(e) => setLocalContent(p => ({ ...p, ctaText: e.target.value }))} onBlur={() => handleContentBlur('ctaText')} placeholder="Get Started" style={{ fontSize: '0.78rem' }} />
                      </div>
                    </div>
                    <Form.Group className="mt-1">
                      <Form.Label style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Link (logged out)</Form.Label>
                      <Form.Control size="sm" value={localContent.ctaLink || '/login'} onChange={(e) => setLocalContent(p => ({ ...p, ctaLink: e.target.value }))} onBlur={() => handleContentBlur('ctaLink')} placeholder="/login" style={{ fontSize: '0.72rem' }} />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check type="switch" id="cta-auth-visible" checked={localContent.ctaAuthVisible !== false}
                        onChange={(e) => { setLocalContent(p => ({ ...p, ctaAuthVisible: e.target.checked })); setTimeout(() => handleContentBlur('ctaAuthVisible'), 100) }} />
                      <div style={{ flex: 1 }}>
                        <Form.Label style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 0 }}>Logged In Text</Form.Label>
                        <Form.Control size="sm" value={localContent.ctaAuthText || ''} onChange={(e) => setLocalContent(p => ({ ...p, ctaAuthText: e.target.value }))} onBlur={() => handleContentBlur('ctaAuthText')} placeholder="Go to Dashboard" style={{ fontSize: '0.78rem' }} />
                      </div>
                    </div>
                    <Form.Group className="mt-1">
                      <Form.Label style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Link (logged in)</Form.Label>
                      <Form.Control size="sm" value={localContent.ctaAuthLink || '/dashboard'} onChange={(e) => setLocalContent(p => ({ ...p, ctaAuthLink: e.target.value }))} onBlur={() => handleContentBlur('ctaAuthLink')} placeholder="/dashboard" style={{ fontSize: '0.72rem' }} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right: image preview */}
            {localContent.heroImageUrl && (
              <Col xs={12} md={4}>
                <div className="text-center">
                  <Form.Label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Preview</Form.Label>
                  <div className="rounded" style={{ border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                    {heroImgError ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem' }}>Image failed to load.<br />Check URL format.</div>
                    ) : (
                      <img src={toDirectImageUrl(localContent.heroImageUrl)} alt="Hero preview"
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                        onError={() => setHeroImgError(true)} />
                    )}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Features Section */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="fw-bold text-muted">FEATURES</small>
            <button type="button" onClick={() => openModal('feature')} style={{ fontSize: '0.68rem', padding: '1px 8px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3 }}>
              <FaPlus size={8} className="me-1" />Add
            </button>
          </div>
          {features.length === 0 ? (
            <div className="text-center text-muted py-3" style={{ fontSize: '0.78rem' }}>No features yet. Click &quot;Add&quot; to create one.</div>
          ) : (
            <div>
              {/* Header */}
              <div className="d-none d-md-flex align-items-center gap-1 py-1 px-1 mb-1" style={{ fontSize: '0.58rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ width: 24 }}>#</span>
                <span style={{ width: 28 }}>Vis</span>
                <span style={{ flex: 1 }}>Title</span>
                <span style={{ flex: 2 }}>Description</span>
                <span style={{ width: 24 }}></span>
              </div>
              {features.map((feature, idx) => (
                <div key={idx} className="d-flex flex-wrap align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.75rem' }}>
                  {/* # */}
                  <span style={{ width: 24, color: '#94a3b8', fontSize: '0.65rem' }}>{idx + 1}</span>
                  {/* Visible */}
                  <span style={{ width: 28 }}>
                    <Form.Check type="checkbox" checked={feature.visible !== false}
                      onChange={(e) => { const updated = features.map((f, i) => i === idx ? { ...f, visible: e.target.checked } : f); setFeatures(updated); saveList('blogs', updated) }} />
                  </span>
                  {/* Title */}
                  <span style={{ flex: 1, cursor: 'pointer', color: '#0891B2', fontWeight: 600 }} onClick={() => openModal('feature', idx)}>
                    {feature.title || '(Untitled)'}
                    <div className="d-md-none text-muted fw-normal mt-1" style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {feature.description?.substring(0, 60)}{feature.description?.length > 60 ? '...' : ''}
                    </div>
                  </span>
                  {/* Description (desktop) */}
                  <span className="d-none d-md-block text-muted" style={{ flex: 2, fontSize: '0.7rem' }}>
                    {feature.description?.substring(0, 80)}{feature.description?.length > 80 ? '...' : ''}
                  </span>
                  {/* Delete */}
                  <span style={{ width: 24 }}>
                    <button type="button" onClick={() => handleDelete('feature', idx)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }} aria-label="Delete">
                      <FaTrash size={9} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* About Us Section */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <small className="fw-bold text-muted">ABOUT US</small>
              <Form.Check type="switch" id="aboutVisible" label={<span style={{ fontSize: '0.68rem' }}>Visible</span>}
              checked={localContent.aboutVisible || false}
              onChange={(e) => { setLocalContent(p => ({ ...p, aboutVisible: e.target.checked })); dispatch(updateSettings({ data: { pages: { home: { content: { aboutVisible: e.target.checked } } } }, user })) }} />
            </div>
            <SaveBtn saving={saving} onClick={() => saveSection(['aboutTitle', 'aboutDescription', 'aboutImageUrl', 'aboutVisible'])} />
          </div>
          <Row className="g-2">
            <Col xs={12} md={localContent.aboutImageUrl ? 8 : 12}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Title</Form.Label>
                <Form.Control size="sm" value={localContent.aboutTitle || ''} onChange={(e) => setLocalContent(p => ({ ...p, aboutTitle: e.target.value }))} onBlur={() => handleContentBlur('aboutTitle')} placeholder="e.g., About Us" style={{ fontSize: '0.8rem' }} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Description</Form.Label>
                <Form.Control size="sm" as="textarea" rows={3} value={localContent.aboutDescription || ''} onChange={(e) => setLocalContent(p => ({ ...p, aboutDescription: e.target.value }))} onBlur={() => handleContentBlur('aboutDescription')} placeholder="Write about your organization..." style={{ fontSize: '0.8rem' }} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Image URL</Form.Label>
                <Form.Control size="sm" value={localContent.aboutImageUrl || ''} onChange={(e) => setLocalContent(p => ({ ...p, aboutImageUrl: e.target.value }))} onBlur={() => handleContentBlur('aboutImageUrl')} placeholder="Google Drive or direct image URL" style={{ fontSize: '0.8rem' }} />
              </Form.Group>
            </Col>
            {localContent.aboutImageUrl && (
              <Col xs={12} md={4}>
                <div className="text-center">
                  <Form.Label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Preview</Form.Label>
                  <div className="rounded" style={{ border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                    {aboutImgError ? (
                      <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem' }}>Image failed to load.</div>
                    ) : (
                      <img src={toDirectImageUrl(localContent.aboutImageUrl)} alt="About preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }}
                        onError={() => setAboutImgError(true)} />
                    )}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Contact Section */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <small className="fw-bold text-muted">CONTACT SECTION</small>
              <Form.Check type="switch" id="contactVisible" label={<span style={{ fontSize: '0.68rem' }}>Visible</span>}
                checked={localContent.contactVisible || false}
                onChange={(e) => { setLocalContent(p => ({ ...p, contactVisible: e.target.checked })); dispatch(updateSettings({ data: { pages: { home: { content: { contactVisible: e.target.checked } } } }, user })) }} />
            </div>
            <SaveBtn saving={saving} onClick={() => saveSection(['contactTitle', 'contactMapEmbedUrl', 'contactVisible'])} />
          </div>
          <Row className="g-2">
            <Col xs={12} md={localContent.contactMapEmbedUrl ? 6 : 12}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Section Title</Form.Label>
                <Form.Control size="sm" value={localContent.contactTitle || ''} onChange={(e) => setLocalContent(p => ({ ...p, contactTitle: e.target.value }))} placeholder="e.g., Contact Us" style={{ fontSize: '0.8rem' }} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '0.72rem', color: '#64748b' }}>Google Maps Embed</Form.Label>
                <Form.Control size="sm" as="textarea" rows={2} value={localContent.contactMapEmbedUrl || ''}
                  onChange={(e) => { setLocalContent(p => ({ ...p, contactMapEmbedUrl: extractMapSrc(e.target.value) })) }}
                  placeholder="Paste <iframe> tag or embed URL from Google Maps" style={{ fontSize: '0.75rem' }} />
                <Form.Text style={{ fontSize: '0.6rem' }} className="text-muted">Maps → Share → Embed → copy iframe code. URL auto-extracted.</Form.Text>
              </Form.Group>
            </Col>
            {localContent.contactMapEmbedUrl && (
              <Col xs={12} md={6}>
                <Form.Label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Map Preview</Form.Label>
                <div className="rounded" style={{ border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                  <iframe
                    src={localContent.contactMapEmbedUrl}
                    width="100%"
                    height="160"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Map preview"
                  />
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Contact Details */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <small className="fw-bold text-muted">CONTACT DETAILS</small>
              <SaveBtn saving={saving} onClick={saveContactFields} />
            </div>
            <button type="button" onClick={addContactField} style={{ fontSize: '0.68rem', padding: '1px 8px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3 }}>
              <FaPlus size={8} className="me-1" />Add
            </button>
          </div>

          {contactFields.length === 0 ? (
            <div className="text-center text-muted py-3" style={{ fontSize: '0.78rem' }}>No contact details yet</div>
          ) : (
            <div>
              {/* Header */}
              <div className="d-none d-md-flex align-items-center gap-1 py-1 px-1 mb-1" style={{ fontSize: '0.58rem', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ width: 28 }}>Vis</span>
                <span style={{ width: 30 }}>Icon</span>
                <span style={{ width: 55 }}>Type</span>
                <span style={{ flex: 1 }}>Value *</span>
                <span style={{ flex: 1 }}>Label</span>
                <span style={{ flex: 1 }}>URL (auto)</span>
                <span style={{ width: 24 }}></span>
              </div>

              {contactFields.map((field, idx) => {
                const Icon = CONTACT_ICON_MAP[field.icon] || FaInfoCircle
                return (
                  <div key={idx} className="d-flex flex-wrap align-items-center gap-1 py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.75rem', minWidth: 0 }}>
                    {/* Visible */}
                    <span style={{ width: 28 }}>
                      <Form.Check type="checkbox" checked={field.visible !== false}
                        onChange={(e) => { updateContactField(idx, 'visible', e.target.checked); setTimeout(saveContactFields, 100) }} />
                    </span>
                    {/* Icon */}
                    <span style={{ width: 30, position: 'relative' }}>
                      <Icon size={14} style={{ color: '#0891B2' }} />
                      <Form.Select size="sm" value={field.icon || 'FaPhone'}
                        onChange={(e) => updateContactField(idx, 'icon', e.target.value)} onBlur={saveContactFields}
                        className="position-absolute top-0 start-0 opacity-0" style={{ width: 30, height: 24, cursor: 'pointer' }}>
                        {CONTACT_ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Form.Select>
                    </span>
                    {/* Type */}
                    <span style={{ width: 55 }}>
                      <Form.Select size="sm" value={field.type || 'detail'} onChange={(e) => updateContactField(idx, 'type', e.target.value)} onBlur={saveContactFields}
                        style={{ fontSize: '0.65rem', height: 24, padding: '0 4px' }}>
                        <option value="detail">Detail</option>
                        <option value="social">Social</option>
                      </Form.Select>
                    </span>
                    {/* Value (required) */}
                    <span style={{ flex: 1 }}>
                      <Form.Control size="sm" value={field.value || ''} onChange={(e) => updateContactField(idx, 'value', e.target.value)} onBlur={saveContactFields}
                        placeholder="+94 77 123 4567" style={{ fontSize: '0.72rem', height: 24 }} />
                    </span>
                    {/* Label (optional, defaults to icon name) */}
                    <span style={{ flex: 1 }}>
                      <Form.Control size="sm" value={field.label || ''} onChange={(e) => updateContactField(idx, 'label', e.target.value)} onBlur={saveContactFields}
                        placeholder={CONTACT_ICON_OPTIONS.find(o => o.value === field.icon)?.label || 'Label'} style={{ fontSize: '0.72rem', height: 24, color: field.label ? '#334155' : '#94a3b8' }} />
                    </span>
                    {/* URL (auto-generated, editable) */}
                    <span style={{ flex: 1 }} className="d-none d-md-block">
                      <Form.Control size="sm" value={field.url || ''} onChange={(e) => updateContactField(idx, 'url', e.target.value)} onBlur={saveContactFields}
                        placeholder="auto" style={{ fontSize: '0.65rem', height: 24, color: '#94a3b8' }} />
                    </span>
                    {/* Delete */}
                    <span style={{ width: 24 }}>
                      <button type="button" onClick={() => handleDelete('contact', idx)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                        <FaTrash size={9} />
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Feedback Section */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <small className="fw-bold text-muted">FEEDBACK</small>
              <Badge bg="secondary" style={{ fontSize: '0.55rem' }}>{feedbacks.length}</Badge>
            </div>
          </div>

          {/* Submit form */}
          <div className="p-2 rounded mb-2" style={{ backgroundColor: '#f8f9fa' }}>
            <Row className="g-1">
              <Col xs={12} md={6}>
                <Form.Control size="sm" placeholder="Title *" value={feedbackForm.title}
                  onChange={(e) => setFeedbackForm(p => ({ ...p, title: e.target.value }))}
                  maxLength={100} style={{ fontSize: '0.75rem', height: 28 }} />
              </Col>
              <Col xs={12} md={3}>
                <Form.Select size="sm" value={feedbackForm.category}
                  onChange={(e) => setFeedbackForm(p => ({ ...p, category: e.target.value }))}
                  style={{ fontSize: '0.72rem', height: 28 }}>
                  <option value="general">General</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="complaint">Complaint</option>
                </Form.Select>
              </Col>
              <Col xs={12} md={3} className="d-flex align-items-center">
                <button type="button" onClick={handleFeedbackSubmit}
                  disabled={feedbackSubmitting || !feedbackForm.title.trim() || !feedbackForm.message.trim()}
                  style={{ fontSize: '0.65rem', padding: '2px 10px', backgroundColor: '#0891B2', color: '#fff', border: 'none', borderRadius: 3, opacity: (feedbackSubmitting || !feedbackForm.title.trim() || !feedbackForm.message.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                  <FaPaperPlane size={8} className="me-1" />
                  {feedbackSubmitting ? 'Sending...' : 'Submit'}
                </button>
              </Col>
              <Col xs={12}>
                <Form.Control size="sm" as="textarea" rows={2} placeholder="Describe your feedback... *"
                  value={feedbackForm.message} onChange={(e) => setFeedbackForm(p => ({ ...p, message: e.target.value }))}
                  maxLength={1000} style={{ fontSize: '0.75rem' }} />
                <Form.Text style={{ fontSize: '0.55rem' }} className="text-muted">{feedbackForm.message.length}/1000</Form.Text>
              </Col>
            </Row>
          </div>

          {/* My feedbacks list */}
          {feedbacksLoading ? (
            <div className="text-center text-muted py-2" style={{ fontSize: '0.72rem' }}>Loading...</div>
          ) : feedbacks.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-1 mb-1" style={{ cursor: 'pointer' }} onClick={() => setFeedbacksExpanded(p => !p)}>
                <small className="text-muted" style={{ fontSize: '0.62rem' }}>MY FEEDBACKS</small>
                {feedbacksExpanded ? <FaChevronUp size={8} className="text-muted" /> : <FaChevronDown size={8} className="text-muted" />}
              </div>
              {feedbacksExpanded && (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {feedbacks.map(fb => (
                    <div key={fb.id} className="py-1 px-1" style={{ borderBottom: '1px solid #f8f9fa', fontSize: '0.72rem' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-1">
                          <strong>{fb.title}</strong>
                          <Badge bg={{ bug: 'danger', feature: 'primary', improvement: 'info', complaint: 'warning', general: 'secondary' }[fb.category] || 'secondary'} style={{ fontSize: '0.55rem' }}>{fb.category}</Badge>
                          <Badge bg={{ pending: 'warning', reviewed: 'info', resolved: 'success' }[fb.status] || 'secondary'} style={{ fontSize: '0.55rem' }}>{fb.status}</Badge>
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                          {fb.timestamp ? new Date(fb.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </small>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem', whiteSpace: 'pre-wrap' }}>{fb.message}</div>
                      {fb.adminNote && (
                        <div className="mt-1 p-1 rounded" style={{ backgroundColor: '#f0f9fa', fontSize: '0.65rem' }}>
                          <strong style={{ color: '#0891B2' }}>Response:</strong> {fb.adminNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
