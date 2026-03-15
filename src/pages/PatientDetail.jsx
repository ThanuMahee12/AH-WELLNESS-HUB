import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Container, Row, Col, Card, Badge, Collapse, Form, Table } from 'react-bootstrap'
import { FaUserInjured, FaChevronDown, FaChevronRight } from 'react-icons/fa'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { selectAllPatients, addPatient, updatePatient, deletePatient, fetchPatients } from '../store/patientsSlice'
import { selectAllCheckups } from '../store/checkupsSlice'
import { selectAllTests } from '../store/testsSlice'
import { useForm, useSettings } from '../hooks'
import { useNotification } from '../context'
import { EntityForm } from '../components/crud'
import { Breadcrumb, PageHeader } from '../components/ui'
import { usePermission } from '../components/auth/PermissionGate'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'

function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const patients = useSelector(selectAllPatients)
  const checkups = useSelector(selectAllCheckups)
  const tests = useSelector(selectAllTests)
  const { loading } = useSelector(state => state.patients)
  const { success, error: showError, confirm } = useNotification()
  const { checkPermission } = usePermission()
  const { isFieldVisible, isFieldRequired, getFieldLabel, getEntityFields } = useSettings()

  const isNew = id === 'new'
  const patient = useMemo(() => patients.find(p => p.id === id), [patients, id])

  const [patientCheckups, setPatientCheckups] = useState([])
  const [healthData, setHealthData] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const [chartView, setChartView] = useState('body')

  const INITIAL_FORM = { name: '', age: '', gender: '', mobile: '', email: '', address: '' }
  const visibleFields = getEntityFields('patients')

  const handleFormSubmit = useCallback(async (dataToSubmit) => {
    try {
      if (isNew) {
        const result = await dispatch(addPatient(dataToSubmit))
        if (result.type.includes('rejected')) throw new Error(result.payload || 'Failed to add patient')
        success('Patient added successfully!')
        navigate(`/patients/${result.payload.id}`, { replace: true })
      } else {
        const result = await dispatch(updatePatient({ id, ...dataToSubmit }))
        if (result.type.includes('rejected')) throw new Error(result.payload || 'Failed to update patient')
        success('Patient updated successfully!')
      }
    } catch (err) {
      showError(err.message || 'Operation failed')
      throw err
    }
  }, [isNew, id, dispatch, navigate, success, showError])

  const form = useForm(INITIAL_FORM, handleFormSubmit)

  useEffect(() => {
    if (patient) {
      const resetData = { ...INITIAL_FORM }
      Object.keys(resetData).forEach(key => {
        if (patient[key] != null) resetData[key] = String(patient[key])
      })
      if (patient.gender) resetData.gender = patient.gender
      form.resetTo(resetData)
    }
  }, [patient?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (patients.length === 0) dispatch(fetchPatients())
  }, [dispatch, patients.length])

  useEffect(() => {
    if (!isNew && patient && user) {
      logActivity({
        userId: user.uid, username: user.username || user.email, userRole: user.role,
        activityType: ACTIVITY_TYPES.PATIENT_VIEW,
        description: createActivityDescription(ACTIVITY_TYPES.PATIENT_VIEW, { patientName: patient.name }),
      }).catch(() => {})
    }
  }, [patient?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build checkup history + health tracking data
  useEffect(() => {
    if (isNew || !id) return
    const checkupsForPatient = checkups
      .filter(c => c.patientId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    setPatientCheckups(checkupsForPatient)

    // Build comprehensive health data from all checkups
    const data = [...checkupsForPatient].reverse().map(c => {
      const date = new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const entry = { date, timestamp: c.timestamp }

      // Weight & Height
      if (c.weight) entry.weight = parseFloat(c.weight)
      if (c.height) entry.height = parseFloat(c.height)

      // General tests (BP, Pulse, Temp, SpO2, RBS, BMI)
      if (c.generalTests) {
        Object.entries(c.generalTests).forEach(([key, val]) => {
          const num = parseFloat(val)
          if (!isNaN(num)) entry[`gt_${key}`] = num
        })
      }

      // Lab results
      if (c.labResults) {
        Object.entries(c.labResults).forEach(([key, val]) => {
          const num = parseFloat(val)
          if (!isNaN(num)) entry[`lr_${key}`] = num
        })
      }

      return entry
    })
    setHealthData(data)
  }, [id, isNew, checkups])

  const handleDelete = async () => {
    if (!(await confirm('Are you sure you want to delete this patient?'))) return
    try {
      const result = await dispatch(deletePatient(id))
      if (result.type.includes('rejected')) throw new Error(result.payload || 'Failed to delete patient')
      success('Patient deleted successfully!')
      navigate('/patients')
    } catch (err) {
      showError(err.message || 'Delete failed')
    }
  }

  const toggleRow = (checkupId) => {
    setExpandedRows(prev => ({ ...prev, [checkupId]: !prev[checkupId] }))
  }

  // Detect which data keys exist across all health data
  const availableKeys = useMemo(() => {
    const keys = new Set()
    healthData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'date' && k !== 'timestamp' && d[k] != null) keys.add(k)
      })
    })
    return keys
  }, [healthData])

  const CHART_COLORS = ['#0891B2', '#14B8A6', '#F59E0B', '#ef4444', '#6366f1', '#ec4899', '#22c55e', '#f97316']

  const chartConfigs = {
    body: {
      label: 'Body',
      keys: ['weight', 'height'],
      labels: { weight: 'Weight (kg)', height: 'Height (cm)' },
    },
    vitals: {
      label: 'Vitals',
      keys: ['gt_bp', 'gt_pulse', 'gt_temp', 'gt_spo2', 'gt_rbs', 'gt_bmi'],
      labels: { gt_bp: 'BP', gt_pulse: 'Pulse', gt_temp: 'Temp', gt_spo2: 'SpO2', gt_rbs: 'RBS', gt_bmi: 'BMI' },
    },
    lipid: {
      label: 'Lipid',
      keys: ['lr_tc', 'lr_tg', 'lr_ldl', 'lr_vldl', 'lr_hdl'],
      labels: { lr_tc: 'TC', lr_tg: 'TG', lr_ldl: 'LDL', lr_vldl: 'VLDL', lr_hdl: 'HDL' },
    },
    renal: {
      label: 'Renal & Liver',
      keys: ['lr_bu', 'lr_scr', 'lr_egfr', 'lr_sgot', 'lr_sgpt', 'lr_ggt'],
      labels: { lr_bu: 'BU', lr_scr: 'SCr', lr_egfr: 'eGFR', lr_sgot: 'SGOT', lr_sgpt: 'SGPT', lr_ggt: 'GGT' },
    },
    blood: {
      label: 'Blood',
      keys: ['lr_fbs', 'lr_hb', 'lr_esr', 'lr_crp', 'lr_hba1c', 'lr_tsh', 'lr_na', 'lr_k'],
      labels: { lr_fbs: 'FBS', lr_hb: 'Hb', lr_esr: 'ESR', lr_crp: 'CRP', lr_hba1c: 'HBA1C', lr_tsh: 'TSH', lr_na: 'Na', lr_k: 'K' },
    },
    all: {
      label: 'All',
      keys: ['weight', 'height', 'gt_bp', 'gt_pulse', 'gt_temp', 'gt_spo2', 'gt_rbs', 'gt_bmi', 'lr_fbs', 'lr_tc', 'lr_tg', 'lr_ldl', 'lr_hdl', 'lr_hb', 'lr_hba1c', 'lr_tsh'],
      labels: { weight: 'Weight', height: 'Height', gt_bp: 'BP', gt_pulse: 'Pulse', gt_temp: 'Temp', gt_spo2: 'SpO2', gt_rbs: 'RBS', gt_bmi: 'BMI', lr_fbs: 'FBS', lr_tc: 'TC', lr_tg: 'TG', lr_ldl: 'LDL', lr_hdl: 'HDL', lr_hb: 'Hb', lr_hba1c: 'HBA1C', lr_tsh: 'TSH' },
    },
  }

  const activeConfig = chartConfigs[chartView]
  const visibleChartKeys = activeConfig.keys.filter(k => availableKeys.has(k))

  if (!isNew && !patient && patients.length > 0) {
    return (
      <Container fluid className="p-3 p-md-4">
        <Breadcrumb items={[{ label: 'Patients', path: '/patients' }]} current="Not Found" />
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <h6>Patient not found</h6>
            <small className="text-muted">The patient doesn't exist or has been removed.</small>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const canEdit = checkPermission('patients', isNew ? 'create' : 'edit')
  const canDelete = !isNew && checkPermission('patients', 'delete')

  return (
    <Container fluid className="p-3 p-md-4">
      <Breadcrumb
        items={[{ label: 'Patients', path: '/patients' }]}
        current={isNew ? 'New Patient' : (patient?.name || 'Patient Details')}
      />

      <PageHeader
        icon={FaUserInjured}
        title={isNew ? 'Add New Patient' : 'Patient Details'}
      />

      {/* Patient Form */}
      <Row className="mb-3">
        <Col>
          <EntityForm
            title={isNew ? 'New Patient' : 'Personal Information'}
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

      {/* Health Monitoring — only in edit mode */}
      {!isNew && patient && (
        <>
          {/* Summary Stats */}
          <Row className="g-3 mb-3">
            <Col xs={6} md={3}>
              <Card className="shadow-sm border-0">
                <Card.Body className="py-2 px-3">
                  <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Total Checkups</small>
                  <strong style={{ fontSize: '1rem' }}>{patientCheckups.length}</strong>
                </Card.Body>
              </Card>
            </Col>
            {healthData.length > 0 && healthData[healthData.length - 1].weight && (
              <Col xs={6} md={3}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="py-2 px-3">
                    <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Latest Weight</small>
                    <strong style={{ fontSize: '1rem' }}>{healthData[healthData.length - 1].weight} kg</strong>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {healthData.length > 0 && healthData[healthData.length - 1].height && (
              <Col xs={6} md={3}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="py-2 px-3">
                    <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Latest Height</small>
                    <strong style={{ fontSize: '1rem' }}>{healthData[healthData.length - 1].height} cm</strong>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {healthData.length > 0 && healthData[healthData.length - 1].gt_bp && (
              <Col xs={6} md={3}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="py-2 px-3">
                    <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Latest BP</small>
                    <strong style={{ fontSize: '1rem' }}>{healthData[healthData.length - 1].gt_bp}</strong>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {/* Health Monitoring Chart */}
          {healthData.length > 0 && (
            <Row className="mb-3">
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="fw-bold text-muted">HEALTH MONITORING</small>
                      <div className="d-flex gap-1">
                        {Object.entries(chartConfigs).map(([key, cfg]) => {
                          const hasData = cfg.keys.some(k => availableKeys.has(k))
                          if (!hasData) return null
                          return (
                            <button
                              key={key}
                              className={`btn btn-sm ${chartView === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => setChartView(key)}
                              style={{
                                fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px',
                                ...(chartView === key ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : {}),
                              }}
                            >
                              {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {visibleChartKeys.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={healthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: '0.78rem' }} />
                          <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                          {visibleChartKeys.map((key, i) => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={activeConfig.labels[key] || key}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <small>No {activeConfig.label} data recorded yet</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Checkup History */}
          <Row>
            <Col>
              <Card className="shadow-sm border-0">
                <Card.Body className="py-2 px-3">
                  <small className="fw-bold text-muted d-block mb-2">CHECKUP HISTORY ({patientCheckups.length})</small>
                </Card.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {patientCheckups.length === 0 ? (
                    <div className="text-center py-4 text-muted"><small>No checkups recorded</small></div>
                  ) : (
                    <table className="table table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ width: '30px', padding: '6px 10px' }}></th>
                          <th style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>Date</th>
                          <th style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>Tests</th>
                          <th style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>Total</th>
                          <th style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>Notes</th>
                          <th style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientCheckups.map(checkup => {
                          const isExpanded = expandedRows[checkup.id]
                          return (
                            <React.Fragment key={checkup.id}>
                              <tr onClick={() => toggleRow(checkup.id)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 10px' }}>
                                  {isExpanded ? <FaChevronDown size={10} className="text-theme" /> : <FaChevronRight size={10} style={{ color: '#cbd5e1' }} />}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <strong>{new Date(checkup.timestamp).toLocaleDateString()}</strong>
                                  <br />
                                  <small className="text-muted">{new Date(checkup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <Badge bg="light" text="dark" style={{ fontSize: '0.72rem' }}>{checkup.tests?.length || 0}</Badge>
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <strong className="text-success">Rs. {checkup.total?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong>
                                </td>
                                <td style={{ padding: '6px 10px', color: '#64748b' }}>
                                  {checkup.notes || '-'}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/checkups/${checkup.id}`) }}
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                                  <Collapse in={isExpanded}>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#f8f9fa' }}>
                                      <table className="table table-sm mb-0" style={{ fontSize: '0.78rem', backgroundColor: '#fff' }}>
                                        <thead>
                                          <tr>
                                            <th style={{ padding: '4px 8px', color: '#64748b', fontSize: '0.72rem' }}>Test Name</th>
                                            <th style={{ padding: '4px 8px', color: '#64748b', fontSize: '0.72rem' }}>Notes</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {checkup.tests?.map(testItem => {
                                            const test = tests.find(t => t.id === testItem.testId)
                                            return test ? (
                                              <tr key={testItem.testId}>
                                                <td style={{ padding: '4px 8px' }}><strong>{test.name}</strong></td>
                                                <td style={{ padding: '4px 8px', color: '#64748b' }}>{testItem.notes || '-'}</td>
                                              </tr>
                                            ) : null
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </Collapse>
                                </td>
                              </tr>
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default PatientDetail
