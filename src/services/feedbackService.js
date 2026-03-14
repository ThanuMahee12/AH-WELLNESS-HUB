import { ref, push, get, query, orderByChild, update, remove } from 'firebase/database'
import { rtdb } from '../config/firebase'

const FEEDBACKS_REF = 'feedbacks'

/**
 * Submit feedback to Realtime Database
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const feedback = {
      title: feedbackData.title || '',
      message: feedbackData.message || '',
      category: feedbackData.category || 'general',
      userId: feedbackData.userId || '',
      username: feedbackData.username || '',
      userRole: feedbackData.userRole || '',
      status: 'pending',
      timestamp: Date.now(),
    }

    await push(ref(rtdb, FEEDBACKS_REF), feedback)
    return { success: true }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all feedbacks
 */
export const getFeedbacks = async () => {
  try {
    const dbQuery = query(ref(rtdb, FEEDBACKS_REF), orderByChild('timestamp'))
    const snapshot = await get(dbQuery)

    if (!snapshot.exists()) {
      return { success: true, data: [] }
    }

    const feedbacks = []
    snapshot.forEach(child => {
      feedbacks.push({ id: child.key, ...child.val() })
    })

    // Newest first
    feedbacks.sort((a, b) => b.timestamp - a.timestamp)

    return { success: true, data: feedbacks }
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Get feedbacks by user ID
 */
export const getUserFeedbacks = async (userId) => {
  try {
    const result = await getFeedbacks()
    if (!result.success) return result
    return {
      success: true,
      data: result.data.filter(f => f.userId === userId),
    }
  } catch (error) {
    console.error('Error fetching user feedbacks:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Update feedback status (superadmin)
 */
export const updateFeedbackStatus = async (feedbackId, status, adminNote = '') => {
  try {
    const updates = {
      status,
      adminNote,
      resolvedAt: status === 'resolved' ? Date.now() : null,
    }
    await update(ref(rtdb, `${FEEDBACKS_REF}/${feedbackId}`), updates)
    return { success: true }
  } catch (error) {
    console.error('Error updating feedback:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a feedback
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    await remove(ref(rtdb, `${FEEDBACKS_REF}/${feedbackId}`))
    return { success: true }
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return { success: false, error: error.message }
  }
}
