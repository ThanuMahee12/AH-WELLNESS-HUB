import { useSelector } from 'react-redux'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { FaUserInjured, FaFlask, FaClipboardCheck, FaUsers, FaChartLine } from 'react-icons/fa'

function Dashboard() {
  const { user } = useSelector(state => state.auth)
  const patients = useSelector(state => state.patients.patients)
  const tests = useSelector(state => state.tests.tests)
  const checkups = useSelector(state => state.checkups.checkups)
  const users = useSelector(state => state.users.users)

  const totalRevenue = checkups.reduce((sum, c) => sum + c.total, 0)

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <Card className="h-100 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 ${bgColor} me-3`}>
          <Icon className={`fs-2 ${color}`} />
        </div>
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
        </div>
      </Card.Body>
    </Card>
  )

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
            color="text-primary"
            bgColor="bg-primary bg-opacity-10"
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
            value={`₹${totalRevenue.toFixed(2)}`}
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

      <Row>
        <Col md={12} lg={6} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Recent Checkups</h5>
            </Card.Header>
            <Card.Body>
              {checkups.length === 0 ? (
                <p className="text-muted">No checkups yet</p>
              ) : (
                <div className="list-group list-group-flush">
                  {checkups.slice(-5).reverse().map(checkup => {
                    const patient = patients.find(p => p.id === checkup.patientId)
                    return (
                      <div key={checkup.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between">
                          <div>
                            <strong>#{checkup.id}</strong> - {patient?.name || 'Unknown'}
                          </div>
                          <div className="text-success fw-bold">₹{checkup.total.toFixed(2)}</div>
                        </div>
                        <small className="text-muted">
                          {new Date(checkup.timestamp).toLocaleString()}
                        </small>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} lg={6} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Checkups Today</span>
                  <strong>
                    {checkups.filter(c =>
                      new Date(c.timestamp).toDateString() === new Date().toDateString()
                    ).length}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Revenue Today</span>
                  <strong className="text-success">
                    ₹{checkups
                      .filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString())
                      .reduce((sum, c) => sum + c.total, 0)
                      .toFixed(2)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Average Bill Amount</span>
                  <strong>
                    ₹{checkups.length > 0 ? (totalRevenue / checkups.length).toFixed(2) : '0.00'}
                  </strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
