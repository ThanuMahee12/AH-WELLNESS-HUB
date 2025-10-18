import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { motion } from 'framer-motion'
import bloodLabLogo from '../assets/blood-lab-logo.png'

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

  const rotateVariants = {
    animate: {
      rotateY: [0, 360],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: 'linear'
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
      background: 'linear-gradient(135deg, #E8F4F8 0%, #D4EEF7 50%, #C0E8F5 100%)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
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
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.15, 0.08]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 145, 178, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />

      <Container className="py-3 py-md-5 px-3 px-md-4" style={{ position: 'relative', zIndex: 2, maxWidth: '100%', overflow: 'hidden' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem' }}
        >
          {/* Hero Section */}
          <Row className="mb-5 text-center">
            <Col>
              <motion.div variants={scaleInVariants}>
                <motion.div
                  variants={rotateVariants}
                  animate="animate"
                  style={{
                    display: 'inline-block',
                    marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <img
                    src={bloodLabLogo}
                    alt="Blood Lab Logo"
                    style={{
                      width: 'clamp(120px, 35vw, 250px)',
                      maxWidth: '250px',
                      height: 'auto',
                      filter: 'drop-shadow(0 8px 24px rgba(8, 145, 178, 0.3))'
                    }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{
                    fontSize: 'clamp(1.4rem, 5.5vw, 4rem)',
                    fontWeight: '700',
                    color: '#0E7490',
                    marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                    textShadow: '0 4px 20px rgba(8, 145, 178, 0.3)',
                    letterSpacing: 'clamp(-0.5px, -0.1vw, -1px)',
                    lineHeight: '1.2',
                    padding: '0 0.5rem'
                  }}
                >
                  AH WELLNESS HUB & ASIRI LABORATORIES
                </motion.h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p style={{
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.6rem)',
                  color: '#0E7490',
                  fontWeight: '500',
                  maxWidth: '90%',
                  margin: '0 auto',
                  marginBottom: 'clamp(2rem, 5vw, 3rem)',
                  lineHeight: '1.6',
                  padding: '0 1rem'
                }}>
                  Professional Point of Sale System for Modern Blood Testing Laboratories
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(6, 182, 212, 0.45)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ display: 'inline-block', width: '100%', maxWidth: '400px', padding: '0 1rem' }}
                >
                  <Button
                    size="lg"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                    className="w-100"
                    style={{
                      padding: 'clamp(0.9rem, 3vw, 1.3rem) clamp(2rem, 5vw, 3rem)',
                      fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
                      fontWeight: '600',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(6, 182, 212, 0.35)',
                      transition: 'all 0.3s cubic-bezier(0.6, 0.05, 0.01, 0.9)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                  </Button>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  )
}

export default Home
