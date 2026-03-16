import { ref, push, get, query, orderByChild, startAt, equalTo } from 'firebase/database'
import { rtdb } from '../config/firebase'

/**
 * Activity Service for tracking user actions
 * Uses Firebase Realtime Database to preserve Firestore quota
 */

const ACTIVITIES_REF = 'userActivities'

// Activity Types
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',

  // Patients
  PATIENT_CREATE: 'patient_create',
  PATIENT_UPDATE: 'patient_update',
  PATIENT_DELETE: 'patient_delete',
  PATIENT_VIEW: 'patient_view',

  // Checkups
  CHECKUP_CREATE: 'checkup_create',
  CHECKUP_UPDATE: 'checkup_update',
  CHECKUP_DELETE: 'checkup_delete',
  CHECKUP_VIEW: 'checkup_view',
  CHECKUP_PDF_INVOICE: 'checkup_pdf_invoice',
  CHECKUP_PDF_PRESCRIPTION: 'checkup_pdf_prescription',

  // Tests
  TEST_CREATE: 'test_create',
  TEST_UPDATE: 'test_update',
  TEST_DELETE: 'test_delete',
  TEST_VIEW: 'test_view',

  // Medicines
  MEDICINE_CREATE: 'medicine_create',
  MEDICINE_UPDATE: 'medicine_update',
  MEDICINE_DELETE: 'medicine_delete',
  MEDICINE_VIEW: 'medicine_view',

  // Users
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_REQUEST_CREATE: 'user_request_create',
  USER_REQUEST_APPROVE: 'user_request_approve',
  USER_REQUEST_REJECT: 'user_request_reject',
  USER_PASSWORD_RESET: 'user_password_reset',

  // Patient Linking
  PATIENT_LINK: 'patient_link',
  PATIENT_UNLINK: 'patient_unlink',
  PATIENT_AUTO_LINK: 'patient_auto_link',

  // Settings
  SETTINGS_UPDATE: 'settings_update',
}

/**
 * Log user activity to Realtime Database
 */
export const logActivity = async (activityData) => {
  try {
    const activity = {
      userId: activityData.userId,
      username: activityData.username,
      userRole: activityData.userRole,
      activityType: activityData.activityType,
      description: activityData.description,
      metadata: activityData.metadata || {},
      timestamp: Date.now(),
    }

    await push(ref(rtdb, ACTIVITIES_REF), activity)
    return { success: true }
  } catch (error) {
    console.error('Error logging activity:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user activities with filters
 * @param {Object} filters - Query filters
 * @param {string} filters.userId - Filter by user ID (optional)
 * @param {string} filters.activityType - Filter by activity type (optional)
 * @param {number|string} filters.days - Number of days to fetch, or 'all' (default: 'all')
 * @param {number} filters.limit - Limit results (optional)
 */
export const getUserActivities = async (filters = {}) => {
  try {
    const {
      userId = null,
      activityType = null,
      days = 'all',
      limit: maxResults = null
    } = filters

    let dbQuery

    // If userId is provided, query by userId (non-superadmin sees only own)
    if (userId) {
      dbQuery = query(ref(rtdb, ACTIVITIES_REF), orderByChild('userId'), equalTo(userId))
    } else if (days !== 'all') {
      const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
      dbQuery = query(ref(rtdb, ACTIVITIES_REF), orderByChild('timestamp'), startAt(startDate))
    } else {
      dbQuery = query(ref(rtdb, ACTIVITIES_REF), orderByChild('timestamp'))
    }

    const snapshot = await get(dbQuery)

    if (!snapshot.exists()) {
      return { success: true, data: [] }
    }

    let activities = []
    snapshot.forEach(child => {
      activities.push({ id: child.key, ...child.val() })
    })

    // Sort descending (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp)

    // Client-side date filter when userId query was used
    if (userId && days !== 'all') {
      const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
      activities = activities.filter(a => a.timestamp >= startDate)
    }

    // Convert timestamp to Date objects for compatibility
    activities = activities.map(a => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }))

    // Client-side filters
    if (activityType) {
      activities = activities.filter(a => a.activityType === activityType)
    }
    if (maxResults) {
      activities = activities.slice(0, maxResults)
    }

    return { success: true, data: activities }
  } catch (error) {
    console.error('Error fetching activities:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Get activity statistics for dashboard
 * @param {number|string} days - Number of days to analyze, or 'all'
 */
export const getActivityStats = async (days = 'all', userId = null) => {
  try {
    const result = await getUserActivities({ days, userId })
    if (!result.success) return result

    const activities = result.data

    const userStats = {}
    const dailyStats = {}
    const typeStats = {}

    activities.forEach(activity => {
      // User stats
      if (!userStats[activity.userId]) {
        userStats[activity.userId] = {
          userId: activity.userId,
          username: activity.username,
          userRole: activity.userRole,
          totalActivities: 0,
          activities: {}
        }
      }
      userStats[activity.userId].totalActivities++

      if (!userStats[activity.userId].activities[activity.activityType]) {
        userStats[activity.userId].activities[activity.activityType] = 0
      }
      userStats[activity.userId].activities[activity.activityType]++

      // Daily stats
      const dateKey = activity.timestamp.toISOString().split('T')[0]
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {}
      }
      if (!dailyStats[dateKey][activity.userId]) {
        dailyStats[dateKey][activity.userId] = 0
      }
      dailyStats[dateKey][activity.userId]++

      // Activity type stats
      if (!typeStats[activity.activityType]) {
        typeStats[activity.activityType] = 0
      }
      typeStats[activity.activityType]++
    })

    return {
      success: true,
      data: {
        userStats: Object.values(userStats),
        dailyStats,
        typeStats,
        totalActivities: activities.length,
        dateRange: { days }
      }
    }
  } catch (error) {
    console.error('Error calculating activity stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper function to create activity description
 */
export const createActivityDescription = (activityType, metadata = {}) => {
  const descriptions = {
    login: 'Logged in',
    logout: 'Logged out',
    signup: `New account registered: ${metadata.username || 'Unknown'}`,

    patient_create: `Created patient: ${metadata.patientName || 'Unknown'}`,
    patient_update: `Updated patient: ${metadata.patientName || 'Unknown'}`,
    patient_delete: `Deleted patient: ${metadata.patientName || 'Unknown'}`,
    patient_view: `Viewed patient: ${metadata.patientName || 'Unknown'}`,

    checkup_create: `Created checkup for patient: ${metadata.patientName || 'Unknown'}`,
    checkup_update: `Updated checkup: ${metadata.billNo || metadata.checkupId || 'Unknown'}`,
    checkup_delete: `Deleted checkup: ${metadata.billNo || metadata.checkupId || 'Unknown'}`,
    checkup_view: `Viewed checkup: ${metadata.billNo || metadata.checkupId || 'Unknown'}`,
    checkup_pdf_invoice: `Generated invoice PDF for Bill #${metadata.billNo || 'Unknown'} - Patient: ${metadata.patientName || 'Unknown'}`,
    checkup_pdf_prescription: `Generated prescription PDF for Bill #${metadata.billNo || 'Unknown'} - Patient: ${metadata.patientName || 'Unknown'}`,

    test_create: `Created test: ${metadata.testName || 'Unknown'}`,
    test_update: `Updated test: ${metadata.testName || 'Unknown'}`,
    test_delete: `Deleted test: ${metadata.testName || 'Unknown'}`,
    test_view: `Viewed test: ${metadata.testName || 'Unknown'}`,

    medicine_create: `Created medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_update: `Updated medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_delete: `Deleted medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_view: `Viewed medicine: ${metadata.medicineName || 'Unknown'}`,

    user_create: `Created user: ${metadata.username || 'Unknown'}`,
    user_update: `Updated user: ${metadata.username || 'Unknown'}`,
    user_delete: `Deleted user: ${metadata.username || 'Unknown'}`,
    user_request_create: `Requested new user: ${metadata.username || 'Unknown'}`,
    user_request_approve: `Approved user request: ${metadata.username || 'Unknown'}`,
    user_request_reject: `Rejected user request: ${metadata.username || 'Unknown'}`,
    user_password_reset: `Reset password for: ${metadata.username || 'Unknown'}`,

    patient_link: `Linked patient ${metadata.patientName || 'Unknown'} to user ${metadata.username || 'Unknown'}`,
    patient_unlink: `Unlinked patient ${metadata.patientName || 'Unknown'} from user ${metadata.username || 'Unknown'}`,
    patient_auto_link: `Auto-linked ${metadata.count || 0} patient(s) by mobile to user ${metadata.username || 'Unknown'}`,

    settings_update: 'Updated application settings',
  }

  return descriptions[activityType] || `Performed action: ${activityType}`
}

export default {
  logActivity,
  getUserActivities,
  getActivityStats,
  createActivityDescription,
  ACTIVITY_TYPES,
}
