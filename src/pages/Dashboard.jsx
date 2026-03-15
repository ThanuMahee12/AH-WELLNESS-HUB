import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, ButtonGroup, Button } from 'react-bootstrap'
import { FaUserInjured, FaFlask, FaClipboardCheck, FaUsers, FaChartLine, FaCalendarAlt, FaRupeeSign, FaEye, FaFileMedical, FaWallet } from 'react-icons/fa'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchUsers, selectAllUsers } from '../store/usersSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useResponsive } from '../hooks'
import {
  calculateTotalRevenue,
  calculateTotalCommission,
  calculateAverageBill,
  getHighestBill,
  filterCheckupsByDateRange,
  filterCheckupsByPerformanceRange,
  getComparisonCheckups,
  getDateRangeChartData,
  getMonthlyRevenueData,
  getTestDistribution,
  getYearOptions,
  getComparisonLabel
} from '../utils/calculations'

function Dashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const patients = useSelector(selectAllPatients)
  const tests = useSelector(selectAllTests)
  const checkups = useSelector(selectAllCheckups)
  const users = useSelector(selectAllUsers)
  const { loading: patientsLoading } = useSelector(state => state.patients)
  const { loading: testsLoading } = useSelector(state => state.tests)
  const { loading: checkupsLoading } = useSelector(state => state.checkups)
  const { loading: usersLoading } = useSelector(state => state.users)
  const { isMobile, isTablet } = useResponsive()

  const [dateRange, setDateRange] = useState(7) // Default: Past 7 days
  const [performanceRange, setPerformanceRange] = useState('today') // today, yesterday, week, month, year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Default: Current year

  useEffect(() => {
    dispatch(fetchPatients())
    dispatch(fetchTests())
    dispatch(fetchCheckups())
    dispatch(fetchUsers())
  }, [dispatch])

  const loading = patientsLoading || testsLoading || checkupsLoading || usersLoading

  // Memoized calculations using utility functions
  const totalRevenue = useMemo(() => calculateTotalRevenue(checkups), [checkups])
  const totalCommission = useMemo(() => calculateTotalCommission(checkups, tests), [checkups, tests])
  const filteredCheckups = useMemo(() => filterCheckupsByDateRange(checkups, dateRange), [checkups, dateRange])
  const chartData = useMemo(() => getDateRangeChartData(checkups, tests, dateRange), [checkups, tests, dateRange])

  const testDistribution = useMemo(() => getTestDistribution(checkups, tests), [checkups, tests])
  const monthlyRevenue = useMemo(() => getMonthlyRevenueData(checkups, tests, selectedYear), [checkups, tests, selectedYear])
  const yearOptions = useMemo(() => getYearOptions(), [])

  // Prescription count & income (commission + doctor fees)
  const totalPrescriptions = useMemo(() =>
    checkups.filter(c => c.prescriptionMedicines?.length > 0).length,
    [checkups]
  )
  const totalDoctorFees = useMemo(() =>
    checkups.reduce((sum, c) => sum + (parseFloat(c.doctorFees) || 0), 0),
    [checkups]
  )
  const totalIncome = useMemo(() => totalCommission + totalDoctorFees, [totalCommission, totalDoctorFees])

  // Performance stats using utility functions
  const performanceCheckups = useMemo(
    () => filterCheckupsByPerformanceRange(checkups, performanceRange),
    [checkups, performanceRange]
  )
  const comparisonCheckups = useMemo(
    () => getComparisonCheckups(checkups, performanceRange),
    [checkups, performanceRange]
  )
  const performanceRevenue = useMemo(
    () => calculateTotalRevenue(performanceCheckups),
    [performanceCheckups]
  )
  const performanceCommission = useMemo(
    () => calculateTotalCommission(performanceCheckups, tests),
    [performanceCheckups, tests]
  )
  const avgBillAmount = useMemo(
    () => calculateAverageBill(performanceCheckups),
    [performanceCheckups]
  )
  const highestBill = useMemo(
    () => getHighestBill(performanceCheckups),
    [performanceCheckups]
  )

  if (loading && patients.length === 0) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  const COLORS = ['#0891B2', '#06B6D4', '#22D3EE', '#F59E0B', '#14B8A6']

  const StatCard = ({ icon, title, value, color, bgColor }) => {
    const IconComponent = icon;
    return (
      <Card className="h-100 shadow-sm border-0">
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>{title}</small>
              <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 1.1rem)' }}>{value}</strong>
            </div>
            <div className={`rounded-circle ${bgColor} d-flex align-items-center justify-content-center`} style={{ width: 36, height: 36 }}>
              <IconComponent className={color} size={16} />
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col>
          <h2>Dashboard</h2>
          <p className="text-muted">Welcome back, <strong>{user?.username}</strong>!</p>
        </Col>
      </Row>

      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaUserInjured}
            title="Total Patients"
            value={patients.length}
            color="text-dark"
            bgColor="bg-secondary bg-opacity-10"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaFlask}
            title="Available Tests"
            value={tests.length}
            color="text-info"
            bgColor="bg-info bg-opacity-10"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaClipboardCheck}
            title="Total Checkups"
            value={checkups.length}
            color="text-success"
            bgColor="bg-success bg-opacity-10"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaChartLine}
            title="Total Revenue"
            value={`Rs. ${totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="text-warning"
            bgColor="bg-warning bg-opacity-10"
          />
        </Col>
      </Row>

      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaRupeeSign}
            title="Total Commission"
            value={`Rs. ${totalCommission.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="text-primary"
            bgColor="bg-primary bg-opacity-10"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaFileMedical}
            title="Total Prescriptions"
            value={totalPrescriptions}
            color="text-danger"
            bgColor="bg-danger bg-opacity-10"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaWallet}
            title="Total Income"
            value={`Rs. ${totalIncome.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="text-success"
            bgColor="bg-success bg-opacity-10"
          />
        </Col>
      </Row>

      {user?.role === 'admin' && (
        <Row className="mb-4">
          <Col xs={12} md={6} lg={3}>
            <StatCard
              icon={FaUsers}
              title="Total Users"
              value={users.length}
              color="text-secondary"
              bgColor="bg-secondary bg-opacity-10"
            />
          </Col>
        </Row>
      )}

      {/* Revenue & Income Area Chart */}
      <Row className="g-3 mb-3">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-bold text-muted">REVENUE & INCOME TREND</small>
                <ButtonGroup size="sm">
                  {[7, 30, 60, 90].map(d => (
                    <Button
                      key={d}
                      size="sm"
                      variant={dateRange === d ? 'primary' : 'outline-secondary'}
                      onClick={() => setDateRange(d)}
                      style={dateRange === d ? { backgroundColor: '#0891B2', borderColor: '#0891B2', fontSize: '0.72rem' } : { fontSize: '0.72rem' }}
                    >
                      {d}d
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
              {checkups.length === 0 ? (
                <div className="text-center py-4 text-muted"><small>No data yet</small></div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891B2" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: '0.8rem' }} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0891B2" strokeWidth={2} fill="url(#gradRevenue)" name="Revenue (Rs.)" />
                    <Area yAxisId="left" type="monotone" dataKey="income" stroke="#14B8A6" strokeWidth={2} fill="url(#gradIncome)" name="Income (Rs.)" />
                    <Line yAxisId="left" type="monotone" dataKey="commission" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Commission" />
                    <Line yAxisId="left" type="monotone" dataKey="doctorFees" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Doctor Fees" />
                    <Line yAxisId="right" type="monotone" dataKey="checkups" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Checkups" />
                    <Line yAxisId="right" type="monotone" dataKey="prescriptions" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Prescriptions" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Breakdown + Popular Tests */}
      <Row className="g-3 mb-3">
        <Col xs={12} lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-bold text-muted">MONTHLY BREAKDOWN</small>
                <select
                  className="form-select form-select-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ width: 'auto', fontSize: '0.78rem' }}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {monthlyRevenue.length === 0 ? (
                <div className="text-center py-4 text-muted"><small>No data</small></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: '0.8rem' }} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#0891B2" name="Revenue" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="commission" fill="#F59E0B" name="Commission" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="income" fill="#14B8A6" name="Income" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="checkups" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Checkups" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-2 px-3">
              <small className="fw-bold text-muted d-block mb-2">POPULAR TESTS</small>
              {testDistribution.length === 0 ? (
                <div className="text-center py-4 text-muted"><small>No tests yet</small></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 5, right: isMobile ? 5 : 60, bottom: 5, left: isMobile ? 5 : 60 }}>
                    <Pie
                      data={testDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1, length: isMobile ? 8 : 16 }}
                      label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + (isMobile ? 16 : 28);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: '500' }}
                          >
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      outerRadius={isMobile ? 55 : 65}
                      innerRadius={isMobile ? 25 : 30}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Stats + Recent Checkups */}
      <Row className="g-3 mb-3">
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="py-2 px-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="fw-bold text-muted">PERFORMANCE</small>
                <ButtonGroup size="sm">
                  {['today', 'yesterday', 'week', 'month', 'year'].map(r => (
                    <Button
                      key={r}
                      size="sm"
                      variant={performanceRange === r ? 'primary' : 'outline-secondary'}
                      onClick={() => setPerformanceRange(r)}
                      style={performanceRange === r
                        ? { backgroundColor: '#0891B2', borderColor: '#0891B2', fontSize: '0.68rem', padding: '2px 6px' }
                        : { fontSize: '0.68rem', padding: '2px 6px' }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
              <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <tbody>
                    {/* Checkups */}
                    <tr className="border-left-primary">
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                            <FaClipboardCheck className="text-primary" size={20} />
                          </div>
                          <div>
                            <div className="text-muted small">Checkups</div>
                            <strong className="fs-5 text-theme">
                              {performanceCheckups.length}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="small text-muted">
                          vs {getComparisonLabel(performanceRange)}
                        </div>
                        <div className={`badge ${performanceCheckups.length - comparisonCheckups.length >= 0 ? 'bg-success' : 'bg-danger'}`}>
                          {(() => {
                            const diff = performanceCheckups.length - comparisonCheckups.length;
                            return diff >= 0 ? `+${diff}` : diff;
                          })()}
                        </div>
                      </td>
                    </tr>

                    {/* Revenue */}
                    <tr className="border-left-success">
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3">
                            <FaRupeeSign className="text-success" size={20} />
                          </div>
                          <div>
                            <div className="text-muted small">Revenue</div>
                            <strong className="fs-5 text-success">
                              Rs. {performanceRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="small text-muted">Commission</div>
                        <div className="fw-bold text-warning">
                          Rs. {performanceCommission.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>

                    {/* Average Bill */}
                    <tr className="border-left-light">
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                            <FaChartLine className="text-info" size={20} />
                          </div>
                          <div>
                            <div className="text-muted small">Avg. Bill Amount</div>
                            <strong className="fs-5 text-info">
                              Rs. {avgBillAmount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="small text-muted">Highest Bill</div>
                        <div className="fw-bold text-theme-amber">
                          Rs. {highestBill.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Checkups */}
        <Col xs={12} lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-2 px-3">
              <small className="fw-bold text-muted d-block mb-2">RECENT CHECKUPS</small>
              {checkups.length === 0 ? (
                <div className="text-center py-3 text-muted"><small>No checkups yet</small></div>
              ) : (
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {checkups.slice(-10).reverse().map(checkup => {
                    const patient = patients.find(p => p.id === checkup.patientId)
                    const isToday = new Date(checkup.timestamp).toDateString() === new Date().toDateString()
                    return (
                      <div key={checkup.id} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: '0.82rem' }}>
                        <div>
                          <strong>{patient?.name || 'Unknown'}</strong>
                          {isToday && <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Today</span>}
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {new Date(checkup.timestamp).toLocaleString('en-LK')} &middot; {checkup.tests?.length || 0} tests
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <strong className="text-success">Rs. {checkup.total?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong>
                          <Link to={`/checkups/${checkup.id}`} className="btn btn-sm btn-outline-secondary" style={{ padding: '2px 6px' }}>
                            <FaEye size={12} />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
