import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { FaFlask, FaUserMd, FaChartLine, FaFileInvoice } from 'react-icons/fa'

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)

  const FeatureCard = ({ icon: Icon, title, description }) => (
    <Card className="h-100 shadow-sm text-center">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
        <Icon className="text-primary fs-1 mb-3" />
        <h5>{title}</h5>
        <p className="text-muted">{description}</p>
      </Card.Body>
    </Card>
  )

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <Row className="mb-5">
          <Col className="text-center">
            <h1 className="display-4 fw-bold text-primary mb-3">
              <FaFlask className="me-3" />
              Blood Lab Manager
            </h1>
            <p className="lead text-muted mb-4">
              Complete Point of Sale System for Blood Testing Laboratories
            </p>
            {!isAuthenticated && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col xs={12} md={6} lg={3}>
            <FeatureCard
              icon={FaUserMd}
              title="Patient Management"
              description="Maintain comprehensive patient records with ease"
            />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <FeatureCard
              icon={FaFlask}
              title="Test Management"
              description="Manage blood test catalog with pricing and details"
            />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <FeatureCard
              icon={FaFileInvoice}
              title="Billing System"
              description="Create checkups and generate professional PDF bills"
            />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <FeatureCard
              icon={FaChartLine}
              title="Analytics"
              description="Track revenue and monitor lab performance"
            />
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="shadow">
              <Card.Body className="p-4">
                <h3 className="text-primary mb-3">Key Features</h3>
                <Row>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">✓ User authentication with role-based access</li>
                      <li className="mb-2">✓ Admin panel for tests and users management</li>
                      <li className="mb-2">✓ Patient registration and management</li>
                      <li className="mb-2">✓ Dynamic checkup creation with multiple tests</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <ul className="list-unstyled">
                      <li className="mb-2">✓ PDF bill generation for checkups</li>
                      <li className="mb-2">✓ Revenue tracking and analytics</li>
                      <li className="mb-2">✓ Fully responsive mobile and tablet friendly</li>
                      <li className="mb-2">✓ Modern blue-themed UI design</li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Home
