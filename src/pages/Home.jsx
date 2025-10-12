import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { FaFlask, FaMicroscope, FaTint, FaVial, FaHeartbeat, FaUserMd, FaChartLine, FaFileInvoice } from 'react-icons/fa'
import { motion } from 'framer-motion'

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: '4rem',
          color: 'rgba(255,255,255,0.1)',
          zIndex: 1
        }}
      >
        <FaMicroscope />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          fontSize: '3rem',
          color: 'rgba(255,255,255,0.1)',
          zIndex: 1,
          animationDelay: '1s'
        }}
      >
        <FaFlask />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          fontSize: '3.5rem',
          color: 'rgba(255,255,255,0.1)',
          zIndex: 1,
          animationDelay: '0.5s'
        }}
      >
        <FaVial />
      </motion.div>

      <Container className="py-5" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          {/* Hero Section */}
          <Row className="mb-5 text-center">
            <Col>
              <motion.div variants={itemVariants}>
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  style={{ display: 'inline-block', marginBottom: '2rem' }}
                >
                  <FaTint style={{ fontSize: '5rem', color: '#dc3545' }} />
                </motion.div>

                <h1 style={{
                  fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '1.5rem',
                  textShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  letterSpacing: '-1px'
                }}>
                  Blood Lab Manager
                </h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p style={{
                  fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                  color: 'rgba(255,255,255,0.95)',
                  marginBottom: '2rem',
                  fontWeight: '300',
                  maxWidth: '700px',
                  margin: '0 auto 2rem'
                }}>
                  Professional Point of Sale System for Modern Blood Testing Laboratories
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ display: 'inline-block' }}
                >
                  <Button
                    size="lg"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                    style={{
                      padding: '1rem 3rem',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      borderRadius: '50px',
                      background: 'white',
                      color: '#667eea',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                  </Button>
                </motion.div>
              </motion.div>
            </Col>
          </Row>

          {/* Feature Icons Grid */}
          <motion.div variants={itemVariants}>
            <Row className="g-4 mt-5">
              {[
                { icon: FaMicroscope, label: 'Advanced Testing', color: '#fff' },
                { icon: FaUserMd, label: 'Patient Care', color: '#fff' },
                { icon: FaHeartbeat, label: 'Health Monitoring', color: '#fff' },
                { icon: FaFileInvoice, label: 'Smart Billing', color: '#fff' }
              ].map((feature, index) => (
                <Col xs={6} md={3} key={index}>
                  <motion.div
                    whileHover={{ y: -10, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <feature.icon style={{ fontSize: '3rem', color: feature.color, marginBottom: '1rem' }} />
                    <p style={{ color: 'white', fontWeight: '500', margin: 0 }}>{feature.label}</p>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <Row className="mt-5 text-center">
              <Col md={4}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <h3 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>100%</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Accurate Results</p>
                </motion.div>
              </Col>
              <Col md={4}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <h3 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>24/7</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>System Availability</p>
                </motion.div>
              </Col>
              <Col md={4}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <h3 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>Fast</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Quick Processing</p>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}

export default Home
