import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { FaClipboardCheck } from 'react-icons/fa'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { EnhancedCRUDTable } from '../components/crud'
import { PageHeader } from '../components/ui'
import { useSettings } from '../hooks'

function Checkups() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const { loading: checkupsLoading, error: checkupsError } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)

  const { getEntityColumns, getItemsPerPage, getSearchFields, checkPermission } = useSettings()
  const loading = checkupsLoading || patientsLoading || testsLoading

  useEffect(() => {
    dispatch(fetchCheckups())
    dispatch(fetchPatients())
    dispatch(fetchTests())
  }, [dispatch])

  const handleViewDetails = (checkupId) => {
    navigate(`/checkups/${checkupId}`)
  }

  // Enrich checkups with resolved patient name and test names for search
  const enrichedCheckups = useMemo(() => {
    return checkups.map(checkup => {
      const patient = patients.find(p => p.id === checkup.patientId)
      const testNames = checkup.tests
        .map(t => { const test = tests.find(x => x.id === t.testId); return test ? test.name : null })
        .filter(Boolean)
        .join(', ')
      return {
        ...checkup,
        patientName: patient ? patient.name : 'Unknown',
        testNames,
      }
    })
  }, [checkups, patients, tests])

  if (loading && checkups.length === 0) {
    return <LoadingSpinner text="Loading checkups data..." />
  }

  const COLUMN_RENDERERS = {
    billNo: {
      render: (value, item) => (
        <span
          onClick={() => handleViewDetails(item.id)}
          className="fs-responsive-sm"
          style={{ cursor: 'pointer', color: '#0891B2', fontWeight: 600 }}
        >
          {value || `#${item.id}`}
        </span>
      )
    },
    patientName: {
      render: (value) => (
        <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>{value}</strong>
      )
    },
    testNames: {
      render: (value) => (
        <div style={{
          maxWidth: window.innerWidth < 768 ? '150px' : '300px',
          wordWrap: 'break-word',
          fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
          lineHeight: '1.4'
        }}>
          {value || '-'}
        </div>
      )
    },
    total: {
      render: (value) => (
        <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Rs. {value?.toFixed(2)}</strong>
      )
    },
    timestamp: {
      render: (value) => (
        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', whiteSpace: 'nowrap' }}>
          {new Date(value).toLocaleString()}
        </span>
      )
    },
  }

  const visibleColumns = getEntityColumns('checkups', COLUMN_RENDERERS)

  return (
    <Container fluid className="p-3 p-md-4">
      <PageHeader
        icon={FaClipboardCheck}
        title="Checkups / Billing"
        addButtonText="New Checkup"
        onAddClick={checkPermission('checkups', 'create') && patients.length > 0 && !loading ? () => navigate('/checkups/new') : undefined}
      />

      {patients.length === 0 && !patientsLoading && (
        <Row className="mb-3">
          <Col>
            <Card className="border-warning">
              <Card.Body className="text-warning">
                Please add patients first before creating checkups
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <EnhancedCRUDTable
            data={enrichedCheckups}
            columns={visibleColumns}
            loading={loading}
            error={checkupsError}
            emptyMessage="No checkups recorded yet"
            itemsPerPage={getItemsPerPage('checkups')}
            searchFields={getSearchFields('checkups')}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default Checkups
