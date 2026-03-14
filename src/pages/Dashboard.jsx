import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, ButtonGroup, Button } from 'react-bootstrap'
import { FaUserInjured, FaFlask, FaClipboardCheck, FaUsers, FaChartLine, FaCalendarAlt, FaRupeeSign, FaEye, FaFileMedical, FaWallet } from 'react-icons/fa'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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
  const monthlyRevenue = useMemo(() => getMonthlyRevenueData(checkups, selectedYear), [checkups, selectedYear])
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

      {/* Charts Section */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-theme-gradient text-white">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                <h5 className="mb-0">
                  <FaChartLine className="me-2" />
                  Checkups & Revenue Trend
                </h5>
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 w-100 w-lg-auto">
                  <ButtonGroup size="sm" className="w-100 w-sm-auto chart-btn-group">
                    <Button
                      onClick={() => setDateRange(7)}
                      className={`flex-grow-1 flex-sm-grow-0 btn-filter btn-filter-lg${dateRange === 7 ? ' active' : ''}`}
                    >
                      7d
                    </Button>
                    <Button
                      onClick={() => setDateRange(30)}
                      className={`flex-grow-1 flex-sm-grow-0 btn-filter btn-filter-lg${dateRange === 30 ? ' active' : ''}`}
                    >
                      30d
                    </Button>
                    <Button
                      onClick={() => setDateRange(60)}
                      className={`flex-grow-1 flex-sm-grow-0 btn-filter btn-filter-lg${dateRange === 60 ? ' active' : ''}`}
                    >
                      60d
                    </Button>
                    <Button
                      onClick={() => setDateRange(90)}
                      className={`flex-grow-1 flex-sm-grow-0 btn-filter btn-filter-lg${dateRange === 90 ? ' active' : ''}`}
                    >
                      90d
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {checkups.length === 0 ? (
                <div className="text-center p-5">
                  <FaChartLine size={50} className="text-muted mb-3" />
                  <p className="text-muted">No data available yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="checkups"
                      stroke="#0891B2"
                      strokeWidth={2}
                      name="Checkups"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      name="Total Revenue (Rs.)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="commission"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Commission (Rs.)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-theme-gradient text-white">
              <h5 className="mb-0">
                <FaFlask className="me-2" />
                Popular Tests
              </h5>
            </Card.Header>
            <Card.Body>
              {testDistribution.length === 0 ? (
                <div className="text-center p-5">
                  <FaFlask size={50} className="text-muted mb-3" />
                  <p className="text-muted">No tests performed yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart margin={{ top: 10, right: isMobile ? 10 : 80, bottom: 10, left: isMobile ? 10 : 80 }}>
                    <Pie
                      data={testDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={{
                        stroke: '#666',
                        strokeWidth: 1,
                        length: isMobile ? 10 : 20
                      }}
                      label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + (isMobile ? 20 : 35);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#333"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '500' }}
                          >
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      outerRadius={isMobile ? 60 : 70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Revenue and Quick Stats Row */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-theme-gradient text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaRupeeSign className="me-2" />
                  Monthly Revenue
                </h5>
                <select
                  className="form-select form-select-sm dashboard-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </Card.Header>
            <Card.Body>
              {monthlyRevenue.length === 0 ? (
                <div className="text-center p-5">
                  <FaRupeeSign size={50} className="text-muted mb-3" />
                  <p className="text-muted">No revenue data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0891B2" name="Revenue (Rs.)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-theme-gradient text-white">
              <div className="d-flex flex-column gap-2">
                <h5 className="mb-0"><FaCalendarAlt className="me-2" />Performance Stats</h5>
                <ButtonGroup size="sm" className="chart-btn-group">
                  <Button
                    onClick={() => setPerformanceRange('today')}
                    className={`btn-filter${performanceRange === 'today' ? ' active' : ''}`}
                  >
                    Today
                  </Button>
                  <Button
                    onClick={() => setPerformanceRange('yesterday')}
                    className={`btn-filter${performanceRange === 'yesterday' ? ' active' : ''}`}
                  >
                    Yesterday
                  </Button>
                  <Button
                    onClick={() => setPerformanceRange('week')}
                    className={`btn-filter${performanceRange === 'week' ? ' active' : ''}`}
                  >
                    Week
                  </Button>
                  <Button
                    onClick={() => setPerformanceRange('month')}
                    className={`btn-filter${performanceRange === 'month' ? ' active' : ''}`}
                  >
                    Month
                  </Button>
                  <Button
                    onClick={() => setPerformanceRange('year')}
                    className={`btn-filter${performanceRange === 'year' ? ' active' : ''}`}
                  >
                    Year
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Checkups Section */}
      <Row className="g-3 g-md-4">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-theme-gradient text-white">
              <h5 className="mb-0"><FaClipboardCheck className="me-2" />Recent Checkups (Last 10)</h5>
            </Card.Header>
            <Card.Body>
              {checkups.length === 0 ? (
                <div className="text-center p-5">
                  <FaClipboardCheck size={50} className="text-muted mb-3" />
                  <p className="text-muted">No checkups yet</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {checkups.slice(-10).reverse().map(checkup => {
                    const patient = patients.find(p => p.id === checkup.patientId)
                    const isToday = new Date(checkup.timestamp).toDateString() === new Date().toDateString()
                    return (
                      <div key={checkup.id} className={`list-group-item px-0 ${isToday ? 'bg-light' : ''}`}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                          <div className="flex-grow-1">
                            <div className="mb-1">
                              <strong>{patient?.name || 'Unknown'}</strong>
                              {isToday && <span className="badge bg-success ms-2">Today</span>}
                            </div>
                            <small className="text-muted">
                              <FaCalendarAlt className="me-1" />
                              {new Date(checkup.timestamp).toLocaleString('en-LK')}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="text-start text-sm-end">
                              <div className="text-success fw-bold fs-5">Rs. {checkup.total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <small className="text-muted">{checkup.tests?.length || 0} tests</small>
                            </div>
                            <Link
                              to={`/checkups/${checkup.id}`}
                              className="btn btn-sm btn-outline-primary"
                              title="View Details"
                            >
                              <FaEye />
                            </Link>
                          </div>
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
