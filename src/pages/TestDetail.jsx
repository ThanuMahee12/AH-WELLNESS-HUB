import { useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { FaFlask } from 'react-icons/fa'
import { selectAllTests, addTest, updateTest, deleteTest, fetchTests } from '../store/testsSlice'
import { useForm, useSettings } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { Breadcrumb } from '../components/ui'
import { usePermission } from '../components/auth/PermissionGate'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'

function TestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const tests = useSelector(selectAllTests)
  const { loading } = useSelector(state => state.tests)
  const user = useSelector(state => state.auth.user)
  const { success, error: showError, confirm } = useNotification()
  const { checkPermission } = usePermission()
  const { getEntityFields, getInitialFormData } = useSettings()

  const isNew = id === 'new'
  const test = isNew ? null : tests.find(t => t.id === id)

  const visibleFields = getEntityFields('tests', {
    code: { placeholder: 'e.g., S108' },
    price: { props: { step: '0.01' } },
    percentage: { props: { step: '1', min: '0', max: '100' }, placeholder: '20' },
  })

  const INITIAL_FORM = useMemo(() =>
    getInitialFormData('tests', { percentage: '20' }),
    [getInitialFormData]
  )

  const validate = useCallback((data) => {
    const errors = {}
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
      const resetData = { ...INITIAL_FORM }
      Object.keys(resetData).forEach(key => {
        if (test[key] != null) resetData[key] = String(test[key])
      })
      form.resetTo(resetData)
    }
  }, [test?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tests if store is empty
  useEffect(() => {
    if (tests.length === 0) {
      dispatch(fetchTests())
    }
  }, [dispatch, tests.length])

  // Log test view activity
  useEffect(() => {
    if (!isNew && test && user) {
      logActivity({
        userId: user.uid,
        username: user.username || user.email,
        userRole: user.role,
        activityType: ACTIVITY_TYPES.TEST_VIEW,
        description: createActivityDescription(ACTIVITY_TYPES.TEST_VIEW, { testName: test.name }),
        metadata: { testId: id, testName: test.name }
      })
    }
  }, [test?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!(await confirm('Are you sure you want to delete this test?'))) return
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
        <Breadcrumb
          items={[{ label: 'Tests', path: '/tests' }]}
          current="Not Found"
        />
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Test not found</h4>
            <p className="text-muted">The test you're looking for doesn't exist or has been removed.</p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('tests', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('tests', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      <Breadcrumb
        items={[{ label: 'Tests', path: '/tests' }]}
        current={isNew ? 'New Test' : (test?.name || 'Test Details')}
      />

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
