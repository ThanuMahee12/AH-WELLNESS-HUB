import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'
import { FaPlus, FaClipboardCheck } from 'react-icons/fa'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { EnhancedCRUDTable } from '../components/crud'
import { PermissionGate } from '../components/auth/PermissionGate'

function Checkups() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const checkups = useSelector(selectAllCheckups)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const { loading: checkupsLoading, error: checkupsError } = useSelector(state => state.checkups)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)

  const loading = checkupsLoading || patientsLoading || testsLoading

  useEffect(() => {
    dispatch(fetchCheckups())
    dispatch(fetchPatients())
    dispatch(fetchTests())
  }, [dispatch])

  if (loading && checkups.length === 0) {
    return <LoadingSpinner text="Loading checkups data..." />
  }

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

  const TABLE_COLUMNS = [
    {
      key: 'billNo',
      label: 'Bill No',
      render: (value, item) => (
        <Badge
          onClick={() => handleViewDetails(item.id)}
          className="badge-clickable fs-responsive-sm"
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0891B2'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#06B6D4'}
        >
          {value || `#${item.id}`}
        </Badge>
      )
    },
    {
      key: 'patientName',
      label: 'Patient',
      render: (value) => (
        <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>{value}</strong>
      )
    },
    {
      key: 'testNames',
      label: 'Tests',
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
    {
      key: 'total',
      label: 'Total (Rs.)',
      render: (value) => (
        <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Rs. {value?.toFixed(2)}</strong>
      )
    },
    {
      key: 'timestamp',
      label: 'Date/Time',
      render: (value) => (
        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', whiteSpace: 'nowrap' }}>
          {new Date(value).toLocaleString()}
        </span>
      )
    },
  ]

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2><FaClipboardCheck className="me-2 text-secondary" />Checkups / Billing</h2>
            <PermissionGate resource="checkups" action="create">
              <Button
                onClick={() => navigate('/checkups/new')}
                className="mt-2 mt-md-0"
                disabled={patients.length === 0 || loading}
                className="btn-theme-add"
              >
                <FaPlus className="me-2" />New Checkup
              </Button>
            </PermissionGate>
          </div>
        </Col>
      </Row>

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
            columns={TABLE_COLUMNS}
            loading={loading}
            error={checkupsError}
            emptyMessage="No checkups recorded yet"
            itemsPerPage={10}
            searchFields={['billNo', 'patientName', 'testNames']}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default Checkups
