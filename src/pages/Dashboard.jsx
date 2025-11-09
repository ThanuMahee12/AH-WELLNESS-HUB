import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, ButtonGroup, Button } from 'react-bootstrap'
import { FaUserInjured, FaFlask, FaClipboardCheck, FaUsers, FaChartLine, FaCalendarAlt, FaRupeeSign, FaFilter, FaEye } from 'react-icons/fa'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchPatients, selectAllPatients } from '../store/patientsSlice'
import { fetchTests, selectAllTests } from '../store/testsSlice'
import { fetchCheckups, selectAllCheckups } from '../store/checkupsSlice'
import { fetchUsers, selectAllUsers } from '../store/usersSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'

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

  const [dateRange, setDateRange] = useState(7) // Default: Past 7 days
  const [performanceRange, setPerformanceRange] = useState('today') // today, yesterday, week, month, year

  useEffect(() => {
    dispatch(fetchPatients())
    dispatch(fetchTests())
    dispatch(fetchCheckups())
    dispatch(fetchUsers())
  }, [dispatch])

  const loading = patientsLoading || testsLoading || checkupsLoading || usersLoading

  if (loading && patients.length === 0) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  // Filter checkups by date range
  const getFilteredCheckups = () => {
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - dateRange)

    return checkups.filter(c => {
      const checkupDate = new Date(c.timestamp)
      return checkupDate >= startDate && checkupDate <= now
    })
  }

  const filteredCheckups = getFilteredCheckups()
  const totalRevenue = checkups.reduce((sum, c) => sum + (c.total || 0), 0)
  const filteredRevenue = filteredCheckups.reduce((sum, c) => sum + (c.total || 0), 0)

  // Calculate commission revenue
  const calculateCommission = (checkup) => {
    return checkup.tests?.reduce((sum, testItem) => {
      const test = tests.find(t => t.id === testItem.testId)
      if (test) {
        const testPrice = test.price || 0
        const testPercentage = test.percentage || 20
        const commission = (testPrice * testPercentage) / 100
        return sum + commission
      }
      return sum
    }, 0) || 0
  }

  const totalCommission = checkups.reduce((sum, c) => sum + calculateCommission(c), 0)
  const filteredCommission = filteredCheckups.reduce((sum, c) => sum + calculateCommission(c), 0)

  // Prepare chart data based on selected date range
  const getDateRangeData = () => {
    const data = []
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dayCheckups = checkups.filter(c => {
        const checkupDate = new Date(c.timestamp)
        return checkupDate.toDateString() === date.toDateString()
      })

      const dayRevenue = dayCheckups.reduce((sum, c) => sum + (c.total || 0), 0)
      const dayCommission = dayCheckups.reduce((sum, c) => sum + calculateCommission(c), 0)

      data.push({
        date: dateStr,
        checkups: dayCheckups.length,
        revenue: dayRevenue,
        commission: dayCommission
      })
    }
    return data
  }

  const getTestDistribution = () => {
    const testCounts = {}
    // Use all checkups, not filtered
    checkups.forEach(checkup => {
      checkup.tests?.forEach(testItem => {
        const test = tests.find(t => t.id === testItem.testId)
        if (test) {
          testCounts[test.name] = (testCounts[test.name] || 0) + 1
        }
      })
    })

    return Object.entries(testCounts).map(([name, count]) => ({
      name,
      value: count
    })).slice(0, 5)
  }

  const getMonthlyRevenue = () => {
    // Create array for all 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()

    // Initialize all months with 0 revenue
    const monthlyData = monthNames.map(month => ({
      month,
      revenue: 0
    }))

    // Fill in actual revenue data - Use all checkups, not filtered
    checkups.forEach(checkup => {
      const date = new Date(checkup.timestamp)
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()
        monthlyData[monthIndex].revenue += checkup.total || 0
      }
    })

    return monthlyData.map(data => ({
      month: data.month,
      revenue: Math.round(data.revenue)
    }))
  }

  const chartData = getDateRangeData()
  const testDistribution = getTestDistribution()
  const monthlyRevenue = getMonthlyRevenue()

  // Helper function to get date range for performance stats
  const getPerformanceCheckups = (range) => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    switch (range) {
      case 'today':
        return checkups.filter(c => new Date(c.timestamp).toDateString() === now.toDateString())

      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return checkups.filter(c => new Date(c.timestamp).toDateString() === yesterday.toDateString())

      case 'week':
        startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= startDate && checkupDate <= now
        })

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= startDate && checkupDate <= now
        })

      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= startDate && checkupDate <= now
        })

      default:
        return []
    }
  }

  // Get comparison period checkups
  const getComparisonCheckups = (range) => {
    const now = new Date()

    switch (range) {
      case 'today':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return checkups.filter(c => new Date(c.timestamp).toDateString() === yesterday.toDateString())

      case 'yesterday':
        const dayBefore = new Date()
        dayBefore.setDate(dayBefore.getDate() - 2)
        return checkups.filter(c => new Date(c.timestamp).toDateString() === dayBefore.toDateString())

      case 'week':
        const lastWeekStart = new Date()
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
        lastWeekStart.setHours(0, 0, 0, 0)
        const lastWeekEnd = new Date()
        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1)
        lastWeekEnd.setHours(23, 59, 59, 999)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= lastWeekStart && checkupDate <= lastWeekEnd
        })

      case 'month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= lastMonth && checkupDate <= lastMonthEnd
        })

      case 'year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
        return checkups.filter(c => {
          const checkupDate = new Date(c.timestamp)
          return checkupDate >= lastYear && checkupDate <= lastYearEnd
        })

      default:
        return []
    }
  }

  const performanceCheckups = getPerformanceCheckups(performanceRange)
  const comparisonCheckups = getComparisonCheckups(performanceRange)
  const performanceRevenue = performanceCheckups.reduce((sum, c) => sum + (c.total || 0), 0)
  const performanceCommission = performanceCheckups.reduce((sum, c) => sum + calculateCommission(c), 0)

  const COLORS = ['#0891B2', '#06B6D4', '#22D3EE', '#F59E0B', '#14B8A6']

  const StatCard = ({ icon, title, value, color, bgColor }) => {
    const IconComponent = icon;
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body className="d-flex align-items-center">
          <div className={`rounded-circle p-3 ${bgColor} me-3 flex-shrink-0`}>
            <IconComponent className={`fs-2 ${color}`} />
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="text-muted mb-1 text-nowrap text-truncate">{title}</h6>
            <h3 className="mb-0 text-nowrap" style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.5rem)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {value}
            </h3>
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
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                <h5 className="mb-0">
                  <FaChartLine className="me-2" />
                  Checkups & Revenue Trend
                </h5>
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
                  <ButtonGroup size="sm">
                    <Button
                      variant={dateRange === 7 ? 'light' : 'outline-light'}
                      onClick={() => setDateRange(7)}
                      style={{
                        backgroundColor: dateRange === 7 ? 'white' : 'transparent',
                        borderColor: 'white',
                        color: dateRange === 7 ? '#0891B2' : 'white',
                        fontWeight: dateRange === 7 ? '600' : 'normal'
                      }}
                    >
                      7 Days
                    </Button>
                    <Button
                      variant={dateRange === 30 ? 'light' : 'outline-light'}
                      onClick={() => setDateRange(30)}
                      style={{
                        backgroundColor: dateRange === 30 ? 'white' : 'transparent',
                        borderColor: 'white',
                        color: dateRange === 30 ? '#0891B2' : 'white',
                        fontWeight: dateRange === 30 ? '600' : 'normal'
                      }}
                    >
                      30 Days
                    </Button>
                    <Button
                      variant={dateRange === 60 ? 'light' : 'outline-light'}
                      onClick={() => setDateRange(60)}
                      style={{
                        backgroundColor: dateRange === 60 ? 'white' : 'transparent',
                        borderColor: 'white',
                        color: dateRange === 60 ? '#0891B2' : 'white',
                        fontWeight: dateRange === 60 ? '600' : 'normal'
                      }}
                    >
                      60 Days
                    </Button>
                    <Button
                      variant={dateRange === 90 ? 'light' : 'outline-light'}
                      onClick={() => setDateRange(90)}
                      style={{
                        backgroundColor: dateRange === 90 ? 'white' : 'transparent',
                        borderColor: 'white',
                        color: dateRange === 90 ? '#0891B2' : 'white',
                        fontWeight: dateRange === 90 ? '600' : 'normal'
                      }}
                    >
                      90 Days
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
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
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
                  <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                    <Pie
                      data={testDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={{
                        stroke: '#666',
                        strokeWidth: 1,
                        length: 20
                      }}
                      label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 35;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#333"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{ fontSize: '12px', fontWeight: '500' }}
                          >
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      outerRadius={70}
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
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <h5 className="mb-0">
                <FaRupeeSign className="me-2" />
                Monthly Revenue
              </h5>
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
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <div className="d-flex flex-column gap-2">
                <h5 className="mb-0"><FaCalendarAlt className="me-2" />Performance Stats</h5>
                <ButtonGroup size="sm">
                  <Button
                    variant={performanceRange === 'today' ? 'light' : 'outline-light'}
                    onClick={() => setPerformanceRange('today')}
                    style={{
                      backgroundColor: performanceRange === 'today' ? 'white' : 'transparent',
                      borderColor: 'white',
                      color: performanceRange === 'today' ? '#0891B2' : 'white',
                      fontWeight: performanceRange === 'today' ? '600' : 'normal',
                      fontSize: '0.75rem'
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant={performanceRange === 'yesterday' ? 'light' : 'outline-light'}
                    onClick={() => setPerformanceRange('yesterday')}
                    style={{
                      backgroundColor: performanceRange === 'yesterday' ? 'white' : 'transparent',
                      borderColor: 'white',
                      color: performanceRange === 'yesterday' ? '#0891B2' : 'white',
                      fontWeight: performanceRange === 'yesterday' ? '600' : 'normal',
                      fontSize: '0.75rem'
                    }}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant={performanceRange === 'week' ? 'light' : 'outline-light'}
                    onClick={() => setPerformanceRange('week')}
                    style={{
                      backgroundColor: performanceRange === 'week' ? 'white' : 'transparent',
                      borderColor: 'white',
                      color: performanceRange === 'week' ? '#0891B2' : 'white',
                      fontWeight: performanceRange === 'week' ? '600' : 'normal',
                      fontSize: '0.75rem'
                    }}
                  >
                    Week
                  </Button>
                  <Button
                    variant={performanceRange === 'month' ? 'light' : 'outline-light'}
                    onClick={() => setPerformanceRange('month')}
                    style={{
                      backgroundColor: performanceRange === 'month' ? 'white' : 'transparent',
                      borderColor: 'white',
                      color: performanceRange === 'month' ? '#0891B2' : 'white',
                      fontWeight: performanceRange === 'month' ? '600' : 'normal',
                      fontSize: '0.75rem'
                    }}
                  >
                    Month
                  </Button>
                  <Button
                    variant={performanceRange === 'year' ? 'light' : 'outline-light'}
                    onClick={() => setPerformanceRange('year')}
                    style={{
                      backgroundColor: performanceRange === 'year' ? 'white' : 'transparent',
                      borderColor: 'white',
                      color: performanceRange === 'year' ? '#0891B2' : 'white',
                      fontWeight: performanceRange === 'year' ? '600' : 'normal',
                      fontSize: '0.75rem'
                    }}
                  >
                    Year
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.95rem' }}>
                  <tbody>
                    {/* Checkups */}
                    <tr style={{ borderLeft: '4px solid #0891B2' }}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                            <FaClipboardCheck className="text-primary" size={20} />
                          </div>
                          <div>
                            <div className="text-muted small">Checkups</div>
                            <strong className="fs-5" style={{ color: '#0891B2' }}>
                              {performanceCheckups.length}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="small text-muted">
                          vs {performanceRange === 'today' ? 'Yesterday' :
                             performanceRange === 'yesterday' ? 'Day Before' :
                             performanceRange === 'week' ? 'Last Week' :
                             performanceRange === 'month' ? 'Last Month' : 'Last Year'}
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
                    <tr style={{ borderLeft: '4px solid #22c55e' }}>
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
                    <tr style={{ borderLeft: '4px solid #06B6D4' }}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                            <FaChartLine className="text-info" size={20} />
                          </div>
                          <div>
                            <div className="text-muted small">Avg. Bill Amount</div>
                            <strong className="fs-5 text-info">
                              Rs. {performanceCheckups.length > 0 ? (performanceRevenue / performanceCheckups.length).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="small text-muted">Highest Bill</div>
                        <div className="fw-bold" style={{ color: '#F59E0B' }}>
                          Rs. {performanceCheckups.length > 0 ? Math.max(...performanceCheckups.map(c => c.total || 0)).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
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
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
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
