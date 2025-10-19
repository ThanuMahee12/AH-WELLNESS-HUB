import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button, Table, Badge, Collapse } from 'react-bootstrap'
import { FaArrowLeft, FaUserInjured, FaMale, FaFemale, FaUser, FaWeight, FaRulerVertical, FaChevronDown, FaChevronRight } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { selectAllPatients } from '../store/patientsSlice'
import { selectAllCheckups } from '../store/checkupsSlice'
import { selectAllTests } from '../store/testsSlice'

function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patients = useSelector(selectAllPatients)
  const checkups = useSelector(selectAllCheckups)
  const tests = useSelector(selectAllTests)

  const [patient, setPatient] = useState(null)
  const [patientCheckups, setPatientCheckups] = useState([])
  const [chartData, setChartData] = useState([])
  const [expandedRows, setExpandedRows] = useState({})

  useEffect(() => {
    // Find the patient
    const foundPatient = patients.find(p => p.id === id)
    setPatient(foundPatient)

    // Get all checkups for this patient
    const checkupsForPatient = checkups
      .filter(c => c.patientId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    setPatientCheckups(checkupsForPatient)

    // Prepare chart data (reverse order for chronological display)
    const data = checkupsForPatient
      .filter(c => c.weight || c.height)
      .reverse()
      .map(c => ({
        date: new Date(c.timestamp).toLocaleDateString(),
        weight: c.weight ? parseFloat(c.weight) : null,
        height: c.height ? parseFloat(c.height) : null,
        timestamp: c.timestamp
      }))

    setChartData(data)
  }, [id, patients, checkups])

  if (!patient) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Card>
          <Card.Body className="text-center py-5">
            <h4>Patient not found</h4>
            <Button
              onClick={() => navigate('/patients')}
              style={{
                backgroundColor: '#06B6D4',
                border: 'none',
                color: 'white'
              }}
            >
              <FaArrowLeft className="me-2" />
              Back to Patients
            </Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const getGenderIcon = () => {
    if (patient.gender === 'Male') return <FaMale style={{ color: '#0891B2' }} size={24} />
    if (patient.gender === 'Female') return <FaFemale style={{ color: '#06B6D4' }} size={24} />
    return <FaUser style={{ color: '#0aa2c0' }} size={24} />
  }

  const toggleRow = (checkupId) => {
    setExpandedRows(prev => ({
      ...prev,
      [checkupId]: !prev[checkupId]
    }))
  }

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Button
            onClick={() => navigate('/patients')}
            size="sm"
            className="mb-3"
            style={{
              backgroundColor: 'transparent',
              border: '2px solid #0891B2',
              color: '#0891B2'
            }}
          >
            <FaArrowLeft className="me-2" />
            Back to Patients
          </Button>
          <h2>
            <FaUserInjured className="me-2" style={{ color: '#0891B2' }} />
            Patient Details
          </h2>
        </Col>
      </Row>

      {/* Patient Details and Graph Section */}
      <Row className="mb-4">
        {/* Personal Details */}
        <Col xs={12} lg={4} className="mb-3 mb-lg-0">
          <Card className="h-100 shadow-sm">
            <Card.Header style={{ backgroundColor: '#06B6D4', color: 'white' }}>
              <h5 className="mb-0">Personal Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                {getGenderIcon()}
                <h4 className="mb-0 ms-3">{patient.name}</h4>
              </div>

              <div className="mb-2">
                <strong>Age:</strong> {patient.age} years
              </div>
              <div className="mb-2">
                <strong>Gender:</strong> {patient.gender}
              </div>
              <div className="mb-2">
                <strong>Mobile:</strong> {patient.mobile}
              </div>
              {patient.email && (
                <div className="mb-2">
                  <strong>Email:</strong> {patient.email}
                </div>
              )}
              <div className="mb-2">
                <strong>Address:</strong> {patient.address}
              </div>

              <hr />

              <div className="mb-2">
                <strong>Total Checkups:</strong>{' '}
                <Badge style={{ backgroundColor: '#06B6D4', color: 'white' }}>
                  {patientCheckups.length}
                </Badge>
              </div>

              {chartData.length > 0 && (
                <>
                  <div className="mb-2">
                    <FaWeight className="me-2" style={{ color: '#0891B2' }} />
                    <strong>Latest Weight:</strong> {chartData[chartData.length - 1].weight || 'N/A'} kg
                  </div>
                  <div className="mb-2">
                    <FaRulerVertical className="me-2" style={{ color: '#06B6D4' }} />
                    <strong>Latest Height:</strong> {chartData[chartData.length - 1].height || 'N/A'} cm
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Height/Weight Graph */}
        <Col xs={12} lg={8}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#06B6D4', color: 'white' }}>
              <h5 className="mb-0">Height & Weight Tracking</h5>
            </Card.Header>
            <Card.Body>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Height (cm)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke="#0891B2"
                      strokeWidth={2}
                      dot={{ fill: '#0891B2', r: 4 }}
                      name="Weight (kg)"
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="height"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={{ fill: '#06B6D4', r: 4 }}
                      name="Height (cm)"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted">
                  <FaWeight size={48} className="mb-3" style={{ color: '#cbd5e1' }} />
                  <p>No height/weight data recorded yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Checkup History Section */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#06B6D4', color: 'white' }}>
              <h5 className="mb-0">Checkup History</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {patientCheckups.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No checkups recorded yet
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 table-mobile-responsive">
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                      <tr>
                        <th style={{ width: '5%' }}></th>
                        <th style={{ width: '20%' }}>Date</th>
                        <th style={{ width: '15%' }}>Tests Count</th>
                        <th style={{ width: '60%' }}>General Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientCheckups.map((checkup) => {
                        const isExpanded = expandedRows[checkup.id]
                        return (
                          <>
                            {/* Main Row - Clickable */}
                            <tr
                              key={checkup.id}
                              onClick={() => toggleRow(checkup.id)}
                              style={{
                                cursor: 'pointer',
                                backgroundColor: isExpanded ? '#f0f9ff' : 'transparent'
                              }}
                            >
                              <td data-label="" className="text-center">
                                {isExpanded ? (
                                  <FaChevronDown style={{ color: '#0891B2' }} />
                                ) : (
                                  <FaChevronRight style={{ color: '#94a3b8' }} />
                                )}
                              </td>
                              <td data-label="Date">
                                <strong style={{ color: '#0891B2' }}>
                                  {new Date(checkup.timestamp).toLocaleDateString()}
                                </strong>
                                <br />
                                <small className="text-muted">
                                  {new Date(checkup.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </td>
                              <td data-label="Tests">
                                <Badge
                                  style={{
                                    backgroundColor: '#0891B2',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    padding: '0.4rem 0.8rem'
                                  }}
                                >
                                  {checkup.tests.length} test{checkup.tests.length !== 1 ? 's' : ''}
                                </Badge>
                              </td>
                              <td data-label="Notes">
                                {checkup.notes ? (
                                  <div style={{ fontSize: '0.9rem' }}>{checkup.notes}</div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            </tr>

                            {/* Expanded Row - Tests Table */}
                            <tr>
                              <td colSpan="4" style={{ padding: 0, border: 'none' }}>
                                <Collapse in={isExpanded}>
                                  <div>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 1rem' }}>
                                      <Table
                                        size="sm"
                                        className="mb-0 table-mobile-responsive"
                                        style={{ backgroundColor: 'white' }}
                                      >
                                        <thead style={{ backgroundColor: '#e0f2fe' }}>
                                          <tr>
                                            <th style={{ width: '40%' }}>Test Name</th>
                                            <th style={{ width: '60%' }}>Notes</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {checkup.tests.map((testItem) => {
                                            const test = tests.find(t => t.id === testItem.testId)

                                            return test ? (
                                              <tr key={testItem.testId}>
                                                <td data-label="Test Name">
                                                  <strong style={{ color: '#0891B2' }}>
                                                    {test.name}
                                                  </strong>
                                                </td>
                                                <td data-label="Notes">
                                                  {testItem.notes ? (
                                                    <div style={{ fontSize: '0.85rem' }}>{testItem.notes}</div>
                                                  ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                      No specific notes for this test
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ) : null
                                          })}
                                        </tbody>
                                      </Table>
                                    </div>
                                  </div>
                                </Collapse>
                              </td>
                            </tr>
                          </>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default PatientDetail
