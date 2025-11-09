const SESSION_TIMEOUT = 60 * 60 * 1000 // 1 hour in milliseconds

class SessionTimeoutService {
  constructor() {
    this.timeoutId = null
    this.lastActivityTime = Date.now()
    this.isActive = false
    this.onTimeoutCallback = null
    this.userRole = null
  }

  // Initialize session timeout monitoring
  start(userRole, onTimeoutCallback) {
    this.userRole = userRole
    this.onTimeoutCallback = onTimeoutCallback

    // Don't apply timeout for superadmin
    if (userRole === 'superadmin') {
      console.log('Session timeout disabled for superadmin')
      return
    }

    this.isActive = true
    this.lastActivityTime = Date.now()
    this.resetTimeout()
    this.addActivityListeners()
  }

  // Stop session timeout monitoring
  stop() {
    this.isActive = false
    this.clearTimeout()
    this.removeActivityListeners()
    this.userRole = null
    this.onTimeoutCallback = null
  }

  // Reset the timeout timer
  resetTimeout() {
    this.clearTimeout()

    // Don't set timeout for superadmin
    if (this.userRole === 'superadmin' || !this.isActive) {
      return
    }

    this.timeoutId = setTimeout(() => {
      this.handleTimeout()
    }, SESSION_TIMEOUT)
  }

  // Clear the current timeout
  clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  // Handle session timeout
  handleTimeout() {
    console.log('Session timeout: User will be logged out')
    if (this.onTimeoutCallback && this.isActive) {
      this.onTimeoutCallback()
    }
    this.stop()
  }

  // Handle user activity
  handleActivity = () => {
    if (!this.isActive || this.userRole === 'superadmin') {
      return
    }

    const now = Date.now()
    const timeSinceLastActivity = now - this.lastActivityTime

    // Only reset if significant time has passed (avoid too frequent resets)
    if (timeSinceLastActivity > 1000) { // 1 second threshold
      this.lastActivityTime = now
      this.resetTimeout()
    }
  }

  // Add event listeners for user activity
  addActivityListeners() {
    // Listen for various user activities
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    events.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true })
    })
  }

  // Remove event listeners
  removeActivityListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    events.forEach(event => {
      window.removeEventListener(event, this.handleActivity)
    })
  }

  // Get remaining time until timeout
  getRemainingTime() {
    if (!this.isActive || this.userRole === 'superadmin') {
      return null
    }

    const elapsed = Date.now() - this.lastActivityTime
    const remaining = SESSION_TIMEOUT - elapsed
    return Math.max(0, remaining)
  }

  // Check if session is about to expire (within 5 minutes)
  isAboutToExpire() {
    if (!this.isActive || this.userRole === 'superadmin') {
      return false
    }

    const remaining = this.getRemainingTime()
    return remaining !== null && remaining < 5 * 60 * 1000 // 5 minutes
  }
}

// Export singleton instance
export const sessionTimeoutService = new SessionTimeoutService()
