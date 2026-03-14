import { ref, push, get, query, orderByChild, startAt, remove } from 'firebase/database'
import { rtdb } from '../config/firebase'

const ERROR_LOGS_REF = 'errorLogs'

/**
 * Log an error to Realtime Database
 */
export const logError = async (errorData) => {
  try {
    const log = {
      message: errorData.message || 'Unknown error',
      stack: errorData.stack || '',
      source: errorData.source || 'unknown',
      componentStack: errorData.componentStack || '',
      url: errorData.url || window.location.href,
      userId: errorData.userId || '',
      username: errorData.username || '',
      userRole: errorData.userRole || '',
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }

    await push(ref(rtdb, ERROR_LOGS_REF), log)
    return { success: true }
  } catch (error) {
    console.error('Failed to log error to RTDB:', error)
    return { success: false }
  }
}

/**
 * Get error logs with optional day filter
 */
export const getErrorLogs = async (days = 'all') => {
  try {
    let dbQuery

    if (days !== 'all') {
      const startDate = Date.now() - (days * 24 * 60 * 60 * 1000)
      dbQuery = query(ref(rtdb, ERROR_LOGS_REF), orderByChild('timestamp'), startAt(startDate))
    } else {
      dbQuery = query(ref(rtdb, ERROR_LOGS_REF), orderByChild('timestamp'))
    }

    const snapshot = await get(dbQuery)

    if (!snapshot.exists()) {
      return { success: true, data: [] }
    }

    const logs = []
    snapshot.forEach(child => {
      logs.push({ id: child.key, ...child.val() })
    })

    // Newest first
    logs.sort((a, b) => b.timestamp - a.timestamp)

    return { success: true, data: logs }
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Delete a single error log
 */
export const deleteErrorLog = async (logId) => {
  try {
    await remove(ref(rtdb, `${ERROR_LOGS_REF}/${logId}`))
    return { success: true }
  } catch (error) {
    console.error('Error deleting error log:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Clear all error logs
 */
export const clearAllErrorLogs = async () => {
  try {
    await remove(ref(rtdb, ERROR_LOGS_REF))
    return { success: true }
  } catch (error) {
    console.error('Error clearing error logs:', error)
    return { success: false, error: error.message }
  }
}
