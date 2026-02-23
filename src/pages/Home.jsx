import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { motion } from 'framer-motion'
import { FaVial, FaFileInvoiceDollar, FaLaptopMedical, FaFlask } from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'
import bloodLabLogo from '../assets/blood-lab-logo.png'

const BLOG_ICONS = [FaVial, FaFileInvoiceDollar, FaLaptopMedical, FaFlask]

/** Convert Google Drive share URLs to direct image URLs */
const toDirectImageUrl = (url) => {
  if (!url) return ''
  // Extract file ID from various Google Drive URL formats
  let fileId = null
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (fileMatch) fileId = fileMatch[1]
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) fileId = openMatch[1]
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/)
  if (ucMatch) fileId = ucMatch[1]
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
  return url
}

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const content = settings?.pages?.home?.content || {}
  const heroTitle = content.heroTitle || 'AH WELLNESS HUB & ASIRI LABORATORIES'
  const heroSubtitle = content.heroSubtitle || 'Professional Point of Sale System for Modern Blood Testing Laboratories'
  const heroImageUrl = content.heroImageUrl || ''
  const ctaText = content.ctaText || 'Get Started'
  const ctaAuthText = content.ctaAuthText || 'Go to Dashboard'
  const blogs = (content.blogs || []).filter(b => b.visible !== false)
  const [heroImgLoaded, setHeroImgLoaded] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2, ease: [0.6, 0.05, 0.01, 0.9] }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }
    }
  }

  const rotateVariants = {
    animate: {
      rotateY: [0, 360],
      transition: { duration: 20, repeat: Infinity, ease: 'linear' }
    }
  }

  const scaleInVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1, opacity: 1,
      transition: { duration: 1, ease: [0.6, 0.05, 0.01, 0.9] }
    }
  }

  return (
    <div className="home-wrapper">
      {/* Subtle gradient orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="home-orb home-orb-1"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="home-orb home-orb-2"
      />

      {/* Hero Section */}
      <Container className="py-3 py-md-5 px-3 px-md-4 home-content">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="home-hero"
        >
          <Row className="mb-3 align-items-center">
            {/* Left on desktop, Bottom on mobile */}
            <Col xs={12} lg={8} className="text-center text-lg-start mb-4 mb-lg-0 order-2 order-lg-1">
              <motion.div variants={scaleInVariants}>
                {!heroImageUrl && (
                  <motion.div variants={rotateVariants} animate="animate" className="home-logo-container d-lg-none">
                    <img src={bloodLabLogo} alt="Blood Lab Logo" className="home-logo" />
                  </motion.div>
                )}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="home-title"
                >
                  {heroTitle}
                </motion.h1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p className="home-subtitle">{heroSubtitle}</p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="home-btn-wrapper">
                  <Button
                    size="lg"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                    className="w-100 home-btn"
                  >
                    {isAuthenticated ? ctaAuthText : ctaText}
                  </Button>
                </motion.div>
              </motion.div>
            </Col>

            {/* Right on desktop, Top on mobile */}
            <Col xs={12} lg={4} className="text-center mb-4 mb-lg-0 order-1 order-lg-2">
              <motion.div variants={scaleInVariants}>
                {heroImageUrl ? (
                  <div className="home-hero-img-wrap">
                    {!heroImgLoaded && <div className="home-hero-img-placeholder" />}
                    <img
                      src={toDirectImageUrl(heroImageUrl)}
                      alt="Hero"
                      className="home-hero-img"
                      style={{ opacity: heroImgLoaded ? 1 : 0 }}
                      onLoad={() => setHeroImgLoaded(true)}
                    />
                  </div>
                ) : (
                  <motion.div variants={rotateVariants} animate="animate" className="home-logo-container d-none d-lg-inline-block">
                    <img src={bloodLabLogo} alt="Blood Lab Logo" className="home-logo" />
                  </motion.div>
                )}
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </Container>

      {/* Blogs / Cards Section */}
      {blogs.length > 0 && (
        <section className="home-blogs">
          <Container className="px-3 px-md-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="home-blogs-heading">What We Offer</h2>
            </motion.div>
            <Row className="g-4 justify-content-center">
              {blogs.map((blog, idx) => {
                const Icon = BLOG_ICONS[idx % BLOG_ICONS.length]
                return (
                  <Col key={idx} xs={12} sm={6} lg={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.15 }}
                      whileHover={{ y: -8, transition: { duration: 0.25 } }}
                      className="home-blog-card"
                    >
                      {blog.imageUrl ? (
                        <img src={toDirectImageUrl(blog.imageUrl)} alt={blog.title} className="home-blog-card-img" />
                      ) : (
                        <div className="home-blog-card-icon-wrapper">
                          <Icon className="home-blog-card-icon" />
                        </div>
                      )}
                      <h5 className="home-blog-card-title">{blog.title}</h5>
                      <p className="home-blog-card-desc">{blog.description}</p>
                    </motion.div>
                  </Col>
                )
              })}
            </Row>
          </Container>
        </section>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <Container className="text-center">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} {heroTitle.split('&')[0]?.trim() || 'AH WELLNESS HUB'}. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  )
}

export default Home
