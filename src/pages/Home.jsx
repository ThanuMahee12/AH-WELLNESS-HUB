import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { FaFlask, FaMicroscope, FaTint, FaVial, FaHeartbeat, FaUserMd, FaChartLine, FaFileInvoice } from 'react-icons/fa'
import { motion } from 'framer-motion'

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)

  // Smooth animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  const scaleInVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Animated background elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          color: 'rgba(255,255,255,0.03)',
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
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          color: 'rgba(255,255,255,0.03)',
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
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          color: 'rgba(255,255,255,0.03)',
          zIndex: 1,
          animationDelay: '0.5s'
        }}
      >
        <FaVial />
      </motion.div>

      {/* Subtle gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />

      <Container className="py-5" style={{ position: 'relative', zIndex: 2, maxWidth: '100%', overflow: 'hidden' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          {/* Hero Section */}
          <Row className="mb-5 text-center">
            <Col>
              <motion.div variants={scaleInVariants}>
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  style={{ display: 'inline-block', marginBottom: '2rem' }}
                >
                  <FaTint style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', color: '#fff' }} />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{
                    fontSize: 'clamp(2rem, 6vw, 4.5rem)',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '1.5rem',
                    textShadow: '0 4px 20px rgba(255,255,255,0.1)',
                    letterSpacing: '-1px'
                  }}
                >
                  Blood Lab Manager
                </motion.h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '2.5rem',
                  fontWeight: '300',
                  maxWidth: '700px',
                  margin: '0 auto 2.5rem',
                  lineHeight: '1.6'
                }}>
                  Professional Point of Sale System for Modern Blood Testing Laboratories
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'inline-block' }}
                >
                  <Button
                    size="lg"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                    style={{
                      padding: 'clamp(0.8rem, 2vw, 1rem) clamp(2rem, 5vw, 3rem)',
                      fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                      fontWeight: '600',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
                      color: '#1a1a1a',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(255,255,255,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.6, 0.05, 0.01, 0.9)'
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
            <Row className="g-3 g-md-4 mt-4 mt-md-5">
              {[
                { icon: FaMicroscope, label: 'Advanced Testing', color: '#fff' },
                { icon: FaUserMd, label: 'Patient Care', color: '#fff' },
                { icon: FaHeartbeat, label: 'Health Monitoring', color: '#fff' },
                { icon: FaFileInvoice, label: 'Smart Billing', color: '#fff' }
              ].map((feature, index) => (
                <Col xs={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    whileHover={{
                      y: -10,
                      scale: 1.03,
                      boxShadow: '0 15px 40px rgba(255,255,255,0.1)',
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: 'clamp(1.5rem, 3vw, 2rem) clamp(0.8rem, 2vw, 1rem)',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.6, 0.05, 0.01, 0.9)'
                    }}
                  >
                    <feature.icon style={{
                      fontSize: 'clamp(2rem, 5vw, 3rem)',
                      color: feature.color,
                      marginBottom: '1rem',
                      filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.2))'
                    }} />
                    <p style={{
                      color: 'white',
                      fontWeight: '500',
                      margin: 0,
                      fontSize: 'clamp(0.85rem, 1.5vw, 1rem)'
                    }}>{feature.label}</p>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <Row className="mt-4 mt-md-5 text-center g-3 g-md-4">
              {[
                { value: '100%', label: 'Accurate Results' },
                { value: '24/7', label: 'System Availability' },
                { value: 'Fast', label: 'Quick Processing' }
              ].map((stat, index) => (
                <Col xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 15px 40px rgba(255,255,255,0.1)',
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '15px',
                      padding: 'clamp(1.2rem, 2vw, 1.5rem)',
                      marginBottom: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <h3 style={{
                      color: 'white',
                      fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                      fontWeight: '700',
                      margin: 0,
                      marginBottom: '0.5rem'
                    }}>{stat.value}</h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.6)',
                      margin: 0,
                      fontSize: 'clamp(0.9rem, 1.5vw, 1rem)'
                    }}>{stat.label}</p>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  )
}

export default Home
