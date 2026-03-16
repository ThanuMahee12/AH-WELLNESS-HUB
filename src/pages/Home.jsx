import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'
import { motion } from 'framer-motion'
import {
  FaVial, FaFileInvoiceDollar, FaLaptopMedical, FaFlask,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaFacebook,
  FaInstagram, FaWhatsapp, FaClock, FaInfoCircle, FaTwitter,
  FaLinkedin, FaYoutube, FaTiktok, FaViber, FaArrowRight,
  FaChevronRight,
} from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'
import bloodLabLogo from '../assets/blood-lab-logo.png'

const BLOG_ICONS = [FaVial, FaFileInvoiceDollar, FaLaptopMedical, FaFlask]

const CONTACT_ICON_MAP = {
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaFacebook,
  FaInstagram, FaWhatsapp, FaClock, FaInfoCircle, FaTwitter,
  FaLinkedin, FaYoutube, FaTiktok, FaViber,
}

const toMapEmbedUrl = (input) => {
  if (!input) return ''
  const srcMatch = input.match(/src=["']([^"']+)["']/)
  if (srcMatch) return srcMatch[1]
  return input.trim()
}

const toDirectImageUrl = (url) => {
  if (!url) return ''
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
}

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)
  const { settings } = useSettings()
  const content = settings?.pages?.home?.content || {}
  const heroBadge = content.heroBadge || ''
  const heroTitle = content.heroTitle || ''
  const heroSubtitle = content.heroSubtitle || ''
  const heroImageUrl = content.heroImageUrl || ''
  const ctaText = content.ctaText || ''
  const ctaAuthText = content.ctaAuthText || ''
  const ctaLink = content.ctaLink || ''
  const ctaAuthLink = content.ctaAuthLink || ''
  const ctaVisible = content.ctaVisible !== false
  const ctaAuthVisible = content.ctaAuthVisible !== false
  const featuresBadge = content.featuresBadge || ''
  const featuresTitle = content.featuresTitle || ''
  const blogs = (content.blogs || []).filter(b => b.visible !== false)
  const aboutBadge = content.aboutBadge || ''
  const aboutTitle = content.aboutTitle || ''
  const aboutDescription = content.aboutDescription || ''
  const aboutImageUrl = content.aboutImageUrl || ''
  const aboutVisible = content.aboutVisible !== false
  const contactBadge = content.contactBadge || ''
  const contactTitle = content.contactTitle || ''
  const contactFields = (content.contactFields || []).filter(f => f.visible !== false)
  const contactDetails = contactFields.filter(f => f.type !== 'social')
  const contactSocials = contactFields.filter(f => f.type === 'social')
  const contactMapEmbedUrl = content.contactMapEmbedUrl || ''
  const contactVisible = content.contactVisible !== false
  const [heroImgLoaded, setHeroImgLoaded] = useState(false)

  const showCta = isAuthenticated ? ctaAuthVisible : ctaVisible
  const ctaBtnText = isAuthenticated ? ctaAuthText : ctaText
  const ctaBtnLink = isAuthenticated ? ctaAuthLink : ctaLink

  return (
    <div className="home-wrapper">
      {/* ===== HERO ===== */}
      <section className="home-hero-section">
        <div className="home-hero-bg" />
        <Container className="home-hero-container">
          <Row className="align-items-center g-4">
            <Col xs={12} lg={heroImageUrl ? 7 : 8} className="order-2 order-lg-1">
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} custom={0}>
                  {heroBadge && (
                    <span className="home-hero-badge">
                      <FaFlask size={10} className="me-1" />
                      {heroBadge}
                    </span>
                  )}
                </motion.div>
                <motion.h1 variants={fadeUp} custom={0.1} className="home-hero-title">
                  {heroTitle}
                </motion.h1>
                <motion.p variants={fadeUp} custom={0.2} className="home-hero-subtitle">
                  {heroSubtitle}
                </motion.p>
                {showCta && (
                  <motion.div variants={fadeUp} custom={0.3}>
                    <button
                      className="home-hero-cta"
                      onClick={() => navigate(ctaBtnLink)}
                    >
                      {ctaBtnText}
                      <FaArrowRight size={13} className="ms-2" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </Col>
            <Col xs={12} lg={heroImageUrl ? 5 : 4} className="text-center order-1 order-lg-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
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
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="home-logo-container"
                  >
                    <img src={bloodLabLogo} alt="Blood Lab Logo" className="home-logo" />
                  </motion.div>
                )}
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===== FEATURES / WHAT WE OFFER ===== */}
      {blogs.length > 0 && (
        <section className="home-features">
          <Container>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="text-center mb-4 mb-md-5">
                {featuresBadge && <span className="home-section-badge">{featuresBadge}</span>}
                {featuresTitle && <h2 className="home-section-title">{featuresTitle}</h2>}
              </motion.div>
              <Row className="g-4 justify-content-center">
                {blogs.map((blog, idx) => {
                  const Icon = BLOG_ICONS[idx % BLOG_ICONS.length]
                  return (
                    <Col key={idx} xs={12} sm={6} lg={4}>
                      <motion.div variants={fadeUp} className="home-feature-card">
                        {blog.imageUrl ? (
                          <img src={toDirectImageUrl(blog.imageUrl)} alt={blog.title} className="home-feature-card-img" />
                        ) : (
                          <div className="home-feature-icon-wrap">
                            <Icon className="home-feature-icon" />
                          </div>
                        )}
                        <h5 className="home-feature-card-title">{blog.title}</h5>
                        <p className="home-feature-card-desc">{blog.description}</p>
                      </motion.div>
                    </Col>
                  )
                })}
              </Row>
            </motion.div>
          </Container>
        </section>
      )}

      {/* ===== ABOUT ===== */}
      {aboutVisible && aboutDescription && (
        <section className="home-about">
          <Container>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="text-center mb-4 mb-md-5">
                {aboutBadge && <span className="home-section-badge">{aboutBadge}</span>}
                {aboutTitle && <h2 className="home-section-title">{aboutTitle}</h2>}
              </motion.div>
              <Row className="align-items-center g-4">
                {aboutImageUrl && (
                  <Col xs={12} md={5}>
                    <motion.div variants={fadeUp}>
                      <img src={toDirectImageUrl(aboutImageUrl)} alt="About Us" className="home-about-img" />
                    </motion.div>
                  </Col>
                )}
                <Col xs={12} md={aboutImageUrl ? 7 : 12}>
                  <motion.div variants={fadeUp}>
                    <p className="home-about-text">{aboutDescription}</p>
                  </motion.div>
                </Col>
              </Row>
            </motion.div>
          </Container>
        </section>
      )}

      {/* ===== CONTACT ===== */}
      {contactVisible && (contactFields.length > 0 || contactMapEmbedUrl) && (
        <section className="home-contact">
          <Container>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="text-center mb-4 mb-md-5">
                {contactBadge && <span className="home-section-badge">{contactBadge}</span>}
                {contactTitle && <h2 className="home-section-title">{contactTitle}</h2>}
              </motion.div>
              <Row className="g-4 align-items-stretch">
                {contactFields.length > 0 && (
                  <Col xs={12} md={contactMapEmbedUrl ? 5 : 12}>
                    <motion.div variants={fadeUp} className="home-contact-card">
                      {contactDetails.length > 0 && (
                        <div className="home-contact-details">
                          {contactDetails.map((field, idx) => {
                            const Icon = CONTACT_ICON_MAP[field.icon] || FaInfoCircle
                            return (
                              <div key={idx} className="home-contact-row">
                                <div className="home-contact-row-icon-wrap">
                                  <Icon className="home-contact-row-icon" />
                                </div>
                                <div className="home-contact-row-text">
                                  <span className="home-contact-row-label">{field.label}</span>
                                  {field.value && (
                                    field.url ? (
                                      <a href={field.url} target="_blank" rel="noopener noreferrer" className="home-contact-val-link">
                                        {field.value}
                                        <FaChevronRight size={8} className="ms-1 opacity-50" />
                                      </a>
                                    ) : (
                                      <span className="home-contact-val">{field.value}</span>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {contactSocials.length > 0 && (
                        <div className="home-contact-socials">
                          {contactSocials.map((field, idx) => {
                            const Icon = CONTACT_ICON_MAP[field.icon] || FaGlobe
                            return (
                              <a key={idx} href={field.url || '#'} target="_blank" rel="noopener noreferrer"
                                className="home-contact-social-link" title={field.label}>
                                <Icon />
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  </Col>
                )}
                {contactMapEmbedUrl && (
                  <Col xs={12} md={contactFields.length > 0 ? 7 : 12}>
                    <motion.div variants={fadeUp} className="home-contact-map-wrap">
                      <iframe
                        src={toMapEmbedUrl(contactMapEmbedUrl)}
                        title="Location Map"
                        className="home-contact-map"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </motion.div>
                  </Col>
                )}
              </Row>
            </motion.div>
          </Container>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <Container>
          <div className="home-footer-inner">
            <div className="home-footer-brand">
              <FaFlask size={16} className="me-2" />
              <span>{heroTitle.split('&')[0]?.trim()}</span>
            </div>
            <p className="home-footer-copy">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  )
}

export default Home
