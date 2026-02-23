import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { FaFlask, FaArrowLeft } from 'react-icons/fa'
import { selectAllTests, addTest, updateTest, deleteTest, fetchTests } from '../store/testsSlice'
import { useForm, useSettings } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { usePermission } from '../components/auth/PermissionGate'

const TEST_FIELDS = [
  { name: 'code', label: 'Test Code', type: 'text', required: true, colSize: 6, placeholder: 'e.g., S108' },
  { name: 'name', label: 'Test Name', type: 'text', required: true, colSize: 6 },
  { name: 'price', label: 'Price (Rs.)', type: 'number', required: true, colSize: 6, props: { step: '0.01' } },
  { name: 'percentage', label: 'Commission (%)', type: 'number', required: true, colSize: 6, props: { step: '1', min: '0', max: '100' }, placeholder: '20' },
  { name: 'details', label: 'Test Details', type: 'textarea', required: false, colSize: 6, rows: 3 },
  { name: 'rules', label: 'Test Rules/Instructions', type: 'textarea', required: false, colSize: 6, rows: 3 },
];

const INITIAL_FORM = {
  code: '',
  name: '',
  price: '',
  percentage: '20',
  details: '',
  rules: '',
};

function TestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const tests = useSelector(selectAllTests)
  const { loading } = useSelector(state => state.tests)
  const { success, error: showError } = useNotification()
  const { checkPermission } = usePermission()
  const { filterFields } = useSettings()

  const isNew = id === 'new'
  const test = isNew ? null : tests.find(t => t.id === id)
  const visibleFields = filterFields('tests', TEST_FIELDS)

  const validate = useCallback((data) => {
    const errors = {}
    // Only check code uniqueness if code was changed from original
    const codeChanged = isNew || data.code?.toLowerCase() !== test?.code?.toLowerCase()
    if (codeChanged) {
      const codeExists = tests.find(t =>
        t.code?.toLowerCase() === data.code?.toLowerCase() &&
        t.id !== id
      )
      if (codeExists) {
        errors.code = `Test code "${data.code}" already exists. Please use a unique code.`
      }
    }
    return errors
  }, [tests, id, isNew, test?.code])

  const handleFormSubmit = useCallback(async (formData) => {
    const dataToSubmit = {
      ...formData,
      price: parseFloat(formData.price),
      percentage: parseInt(formData.percentage) || 20,
    }

    try {
      if (isNew) {
        const result = await dispatch(addTest(dataToSubmit))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to add test')
        }
        success('Test added successfully!')
        navigate(`/tests/${result.payload.id}`, { replace: true })
      } else {
        const result = await dispatch(updateTest({ id, ...dataToSubmit }))
        if (result.type.includes('rejected')) {
          throw new Error(result.payload || 'Failed to update test')
        }
        success('Test updated successfully!')
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
      throw err
    }
  }, [isNew, id, dispatch, navigate, success, showError])

  const form = useForm(INITIAL_FORM, handleFormSubmit, validate)

  // Load test data into form when editing
  useEffect(() => {
    if (test) {
      form.resetTo({
        code: test.code || '',
        name: test.name || '',
        price: test.price?.toString() || '',
        percentage: test.percentage?.toString() || '20',
        details: test.details || '',
        rules: test.rules || '',
      })
    }
  }, [test?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tests if store is empty
  useEffect(() => {
    if (tests.length === 0) {
      dispatch(fetchTests())
    }
  }, [dispatch, tests.length])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this test?')) return
    try {
      const result = await dispatch(deleteTest({ id, testName: test?.name }))
      if (result.type.includes('rejected')) {
        throw new Error(result.payload || 'Failed to delete test')
      }
      success('Test deleted successfully!')
      navigate('/tests')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  // Not found
  if (!isNew && !test && tests.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Test not found</h4>
            <Button
              onClick={() => navigate('/tests')}
              className="btn-theme"
            >
              <FaArrowLeft className="me-2" />
              Back to Tests
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('tests', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('tests', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fs-responsive-lg">
            <FaFlask className="me-2 text-theme" />
            {isNew ? 'Add New Test' : 'Test Details'}
          </h2>
        </Col>
      </Row>

      <Row>
        <Col>
          <EntityForm
            title={isNew ? 'New Test Information' : `Edit Test: ${test?.name || ''}`}
            fields={visibleFields}
            formData={form.formData}
            formErrors={form.errors}
            onFormChange={form.handleChange}
            onSubmit={form.handleSubmit}
            onCancel={() => navigate('/tests')}
            onDelete={canDelete ? handleDelete : undefined}
            loading={form.isSubmitting || loading}
            isEditing={!isNew}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default TestDetail
