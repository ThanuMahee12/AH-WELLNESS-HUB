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
    <div className="home-wrapper">
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
        className="home-orb home-orb-1"
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
        className="home-orb home-orb-2"
      />

      <Container className="py-3 py-md-5 px-3 px-md-4 home-content">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="home-hero"
        >
          {/* Hero Section */}
          <Row className="mb-5 text-center">
            <Col>
              <motion.div variants={scaleInVariants}>
                <motion.div
                  variants={rotateVariants}
                  animate="animate"
                  className="home-logo-container"
                >
                  <img
                    src={bloodLabLogo}
                    alt="Blood Lab Logo"
                    className="home-logo"
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="home-title"
                >
                  AH WELLNESS HUB & ASIRI LABORATORIES
                </motion.h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p className="home-subtitle">
                  Professional Point of Sale System for Modern Blood Testing Laboratories
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="home-btn-wrapper"
                >
                  <Button
                    size="lg"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                    className="w-100 home-btn"
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
