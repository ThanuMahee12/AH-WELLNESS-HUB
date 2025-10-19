import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { FaUserInjured, FaFlask, FaClipboardCheck, FaUsers, FaChartLine, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa'
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

  const totalRevenue = checkups.reduce((sum, c) => sum + (c.total || 0), 0)

  // Prepare chart data
  const getLast7DaysData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dayCheckups = checkups.filter(c => {
        const checkupDate = new Date(c.timestamp)
        return checkupDate.toDateString() === date.toDateString()
      })

      last7Days.push({
        date: dateStr,
        checkups: dayCheckups.length,
        revenue: dayCheckups.reduce((sum, c) => sum + (c.total || 0), 0)
      })
    }
    return last7Days
  }

  const getTestDistribution = () => {
    const testCounts = {}
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
    const months = {}
    checkups.forEach(checkup => {
      const date = new Date(checkup.timestamp)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      months[monthKey] = (months[monthKey] || 0) + (checkup.total || 0)
    })

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue)
    })).slice(-6)
  }

  const chartData = getLast7DaysData()
  const testDistribution = getTestDistribution()
  const monthlyRevenue = getMonthlyRevenue()

  const COLORS = ['#0891B2', '#06B6D4', '#22D3EE', '#F59E0B', '#14B8A6']

  const StatCard = ({ icon, title, value, color, bgColor }) => {
    const IconComponent = icon;
    return (
      <Card className="h-100 shadow-sm">
        <Card.Body className="d-flex align-items-center">
          <div className={`rounded-circle p-3 ${bgColor} me-3`}>
            <IconComponent className={`fs-2 ${color}`} />
        </div>
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
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
              <h5 className="mb-0"><FaChartLine className="me-2" />Checkups & Revenue Trend</h5>
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
                      name="Revenue (Rs.)"
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
              <h5 className="mb-0"><FaFlask className="me-2" />Popular Tests</h5>
            </Card.Header>
            <Card.Body>
              {testDistribution.length === 0 ? (
                <div className="text-center p-5">
                  <FaFlask size={50} className="text-muted mb-3" />
                  <p className="text-muted">No tests performed yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={testDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
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

      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="h-100 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <h5 className="mb-0"><FaRupeeSign className="me-2" />Monthly Revenue</h5>
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
          <Card className="h-100 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <h5 className="mb-0"><FaCalendarAlt className="me-2" />Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column h-100 justify-content-around">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Checkups Today</span>
                    <h4 className="mb-0 text-dark">
                      {checkups.filter(c =>
                        new Date(c.timestamp).toDateString() === new Date().toDateString()
                      ).length}
                    </h4>
                  </div>
                  <hr />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Revenue Today</span>
                    <h4 className="mb-0 text-success">
                      Rs. {checkups
                        .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                        .reduce((sum, c) => sum + c.total, 0)
                        .toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <hr />
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Avg. Bill Amount</span>
                    <h4 className="mb-0 text-info">
                      Rs. {checkups.length > 0 ? (totalRevenue / checkups.length).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </h4>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Checkups Section */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Header style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)' }} className="text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaCalendarAlt className="me-2" />Today's Checkups</h5>
                <span className="badge bg-light text-dark">
                  {checkups.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()).length} checkups
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              {checkups.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()).length === 0 ? (
                <div className="text-center p-5">
                  <FaClipboardCheck size={50} className="text-muted mb-3" />
                  <p className="text-muted">No checkups today</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Time</th>
                        <th>Tests</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkups
                        .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                        .reverse()
                        .map(checkup => {
                          const patient = patients.find(p => p.id === checkup.patientId)
                          return (
                            <tr key={checkup.id}>
                              <td><span className="badge bg-primary">#{checkup.id}</span></td>
                              <td><strong>{patient?.name || 'Unknown'}</strong></td>
                              <td>
                                <small className="text-muted">
                                  {new Date(checkup.timestamp).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                </small>
                              </td>
                              <td><span className="badge bg-info">{checkup.tests?.length || 0} tests</span></td>
                              <td className="text-end">
                                <strong className="text-success">Rs. {checkup.total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="4" className="text-end"><strong>Total Revenue Today:</strong></td>
                        <td className="text-end">
                          <strong className="text-success fs-5">
                            Rs. {checkups
                              .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                              .reduce((sum, c) => sum + c.total, 0)
                              .toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Checkups Section */}
      <Row className="g-3 g-md-4">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Header style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' }} className="text-white">
              <h5 className="mb-0"><FaClipboardCheck className="me-2" />Recent Checkups (Last 5)</h5>
            </Card.Header>
            <Card.Body>
              {checkups.length === 0 ? (
                <div className="text-center p-5">
                  <FaClipboardCheck size={50} className="text-muted mb-3" />
                  <p className="text-muted">No checkups yet</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {checkups.slice(-5).reverse().map(checkup => {
                    const patient = patients.find(p => p.id === checkup.patientId)
                    const isToday = new Date(checkup.timestamp).toDateString() === new Date().toDateString()
                    return (
                      <div key={checkup.id} className={`list-group-item px-0 ${isToday ? 'bg-light' : ''}`}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                          <div className="flex-grow-1">
                            <div>
                              <span className="badge bg-primary me-2">#{checkup.id}</span>
                              <strong>{patient?.name || 'Unknown'}</strong>
                              {isToday && <span className="badge bg-success ms-2">Today</span>}
                            </div>
                            <small className="text-muted">
                              <FaCalendarAlt className="me-1" />
                              {new Date(checkup.timestamp).toLocaleString('en-LK')}
                            </small>
                          </div>
                          <div className="text-start text-sm-end">
                            <div className="text-success fw-bold fs-5">Rs. {checkup.total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <small className="text-muted">{checkup.tests?.length || 0} tests</small>
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
