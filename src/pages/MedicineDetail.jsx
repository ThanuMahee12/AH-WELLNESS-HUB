import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap'
import { FaPills, FaArrowLeft, FaTimes } from 'react-icons/fa'
import { selectAllMedicines, addMedicine, updateMedicine, deleteMedicine, fetchMedicines } from '../store/medicinesSlice'
import { useForm } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'
import FormField from '../components/ui/FormField'
import RichTextEditor from '../components/ui/RichTextEditor'

const INITIAL_FORM = {
  code: '',
  name: '',
  brand: '',
  dosage: [],
  unit: '',
  description: '',
  details: '',
};

// Normalize dosage from Firebase (could be string or array)
const normalizeDosage = (dosage) => {
  if (Array.isArray(dosage)) return dosage
  if (typeof dosage === 'string' && dosage.trim()) {
    return dosage.split(',').map(d => d.trim()).filter(Boolean)
  }
  return []
}

// Multi-tag input for dosage values (comma-triggered)
const DosageInput = ({ values: rawValues, onChange, disabled }) => {
  const values = normalizeDosage(rawValues)
  const [input, setInput] = useState('')

  const addDosage = (text) => {
    const trimmed = text.trim()
    if (!trimmed || values.includes(trimmed)) return
    onChange([...values, trimmed])
  }

  const removeDosage = (index) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleChange = (e) => {
    const val = e.target.value
    if (val.includes(',')) {
      const parts = val.split(',')
      parts.forEach((part, i) => {
        if (i < parts.length - 1) addDosage(part)
      })
      setInput(parts[parts.length - 1])
    } else {
      setInput(val)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) {
        addDosage(input)
        setInput('')
      }
    }
    if (e.key === 'Backspace' && !input && values.length > 0) {
      removeDosage(values.length - 1)
    }
  }

  const handleBlur = () => {
    if (input.trim()) {
      addDosage(input)
      setInput('')
    }
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        Dosage <span className="text-danger ms-1">*</span>
      </Form.Label>
      <div
        className={`dosage-tag-input${disabled ? ' disabled' : ''}`}
        onClick={(e) => {
          const inp = e.currentTarget.querySelector('input')
          if (inp) inp.focus()
        }}
      >
        {values.map((dosage, index) => (
          <span key={index} className="dosage-tag">
            {dosage}
            {!disabled && (
              <FaTimes
                className="dosage-tag-remove"
                onClick={(e) => { e.stopPropagation(); removeDosage(index) }}
              />
            )}
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={values.length === 0 ? 'Type dosage, press comma (e.g. 10ml, 20ml)' : ''}
          disabled={disabled}
          className="dosage-tag-text-input"
        />
      </div>

    </Form.Group>
  )
}

function MedicineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const medicines = useSelector(selectAllMedicines)
  const { loading } = useSelector(state => state.medicines)
  const { success, error: showError } = useNotification()
  const { checkPermission } = usePermission()

  const isNew = id === 'new'
  const medicine = isNew ? null : medicines.find(m => m.id === id)

  const validate = useCallback((data) => {
    const errors = {}
    // Only check code uniqueness if code was changed from original
    const codeChanged = isNew || data.code?.toLowerCase() !== medicine?.code?.toLowerCase()
    if (codeChanged) {
      const codeExists = medicines.find(m =>
        m.code?.toLowerCase() === data.code?.toLowerCase() &&
        m.id !== id
      )
      if (codeExists) {
        errors.code = `Medicine code "${data.code}" already exists. Please use a unique code.`
      }
    }
    const dosageList = normalizeDosage(data.dosage)
    if (dosageList.length === 0) {
      errors.dosage = 'At least one dosage is required.'
    }
    return errors
  }, [medicines, id, isNew, medicine?.code])

  const handleFormSubmit = useCallback(async (formData) => {
    const dataToSubmit = {
      ...formData,
      dosage: normalizeDosage(formData.dosage),
    }

    try {
      if (isNew) {
        const result = await dispatch(addMedicine(dataToSubmit))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to add medicine')
        }
        success('Medicine added successfully!')
        navigate(`/medicines/${result.payload.id}`, { replace: true })
      } else {
        const result = await dispatch(updateMedicine({ id, ...dataToSubmit }))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to update medicine')
        }
        success('Medicine updated successfully!')
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
      throw err
    }
  }, [isNew, id, dispatch, navigate, success, showError])

  const form = useForm(INITIAL_FORM, handleFormSubmit, validate)

  // Load medicine data into form when editing
  useEffect(() => {
    if (medicine) {
      form.resetTo({
        code: medicine.code || '',
        name: medicine.name || '',
        brand: medicine.brand || '',
        dosage: normalizeDosage(medicine.dosage),
        unit: medicine.unit || '',
        description: medicine.description || '',
        details: medicine.details || '',
      })
    }
  }, [medicine?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch medicines if store is empty
  useEffect(() => {
    if (medicines.length === 0) {
      dispatch(fetchMedicines())
    }
  }, [dispatch, medicines.length])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return
    try {
      const result = await dispatch(deleteMedicine(id))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || 'Failed to delete medicine')
      }
      success('Medicine deleted successfully!')
      navigate('/medicines')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  // Not found
  if (!isNew && !medicine && medicines.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Medicine not found</h4>
            <Button
              onClick={() => navigate('/medicines')}
              className="btn-theme"
            >
              <FaArrowLeft className="me-2" />
              Back to Medicines
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('medicines', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('medicines', 'delete')
  const isDisabled = form.isSubmitting || loading || !canEdit

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaPills className="me-2 text-theme" />
            {isNew ? 'Add New Medicine' : 'Medicine Details'}
          </h2>
        </Col>
      </Row>

      <Row>
        <Col>
          <EntityForm
            title={isNew ? 'New Medicine Information' : `Edit Medicine: ${medicine?.name || ''}`}
            formData={form.formData}
            formErrors={form.errors}
            onFormChange={form.handleChange}
            onSubmit={form.handleSubmit}
            onCancel={() => navigate('/medicines')}
            onDelete={canDelete ? handleDelete : undefined}
            loading={form.isSubmitting || loading}
            isEditing={!isNew}
          >
            <Row className="g-3">
              {/* Code */}
              <Col xs={12} md={6}>
                <FormField
                  label="Medicine Code"
                  name="code"
                  type="text"
                  value={form.formData.code || ''}
                  onChange={form.handleChange}
                  error={form.errors.code}
                  required
                  placeholder="e.g., MED001"
                  disabled={isDisabled}
                />
              </Col>
              {/* Name */}
              <Col xs={12} md={6}>
                <FormField
                  label="Medicine Name"
                  name="name"
                  type="text"
                  value={form.formData.name || ''}
                  onChange={form.handleChange}
                  error={form.errors.name}
                  required
                  disabled={isDisabled}
                />
              </Col>
              {/* Brand */}
              <Col xs={12} md={6}>
                <FormField
                  label="Brand"
                  name="brand"
                  type="text"
                  value={form.formData.brand || ''}
                  onChange={form.handleChange}
                  error={form.errors.brand}
                  required
                  disabled={isDisabled}
                />
              </Col>
              {/* Unit */}
              <Col xs={12} md={6}>
                <FormField
                  label="Unit"
                  name="unit"
                  type="text"
                  value={form.formData.unit || ''}
                  onChange={form.handleChange}
                  error={form.errors.unit}
                  required
                  placeholder="e.g., tablets, capsules, ml"
                  disabled={isDisabled}
                />
              </Col>
              {/* Dosage - Multi-tag input */}
              <Col xs={12}>
                <DosageInput
                  values={form.formData.dosage || []}
                  onChange={(newDosages) => form.setFieldValue('dosage', newDosages)}
                  disabled={isDisabled}
                />
                {form.errors.dosage && (
                  <div className="text-danger" style={{ fontSize: '0.875rem', marginTop: '-0.5rem' }}>
                    {form.errors.dosage}
                  </div>
                )}
              </Col>
              {/* Description */}
              <Col xs={12}>
                <FormField
                  label="Description"
                  name="description"
                  type="textarea"
                  value={form.formData.description || ''}
                  onChange={form.handleChange}
                  error={form.errors.description}
                  rows={2}
                  disabled={isDisabled}
                />
              </Col>
              {/* Details - Rich text */}
              <Col xs={12}>
                <RichTextEditor
                  label="Details (Meta - Not shown in table)"
                  value={form.formData.details || ''}
                  onChange={(value) => form.handleChange({ target: { name: 'details', value } })}
                  error={form.errors.details}
                  placeholder="Additional details..."
                  height="150px"
                  id="details"
                />
              </Col>
            </Row>
          </EntityForm>
        </Col>
      </Row>
    </Container>
  )
}

export default MedicineDetail
