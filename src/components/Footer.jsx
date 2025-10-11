import { Container, Row, Col } from 'react-bootstrap'
import { FaHeart, FaGithub, FaEnvelope, FaPhone } from 'react-icons/fa'
import '../styles/footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <Container>
        <Row className="py-4">
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="footer-title">Blood Lab Manager</h5>
            <p className="footer-text">
              Complete Point of Sale system for blood testing laboratories.
              Manage patients, tests, and billing with ease.
            </p>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/patients">Patients</a></li>
              <li><a href="/checkups">Checkups</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5 className="footer-title">Contact</h5>
            <p className="footer-text">
              <FaEnvelope className="me-2" />
              info@bloodlab.com
            </p>
            <p className="footer-text">
              <FaPhone className="me-2" />
              +91-1234567890
            </p>
            <div className="footer-social">
              <a href="#" className="social-link"><FaGithub /></a>
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="text-center pt-3 border-top border-secondary">
            <p className="footer-copyright">
              © {currentYear} Blood Lab Manager. Made with <FaHeart className="text-danger" /> for healthcare.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
