import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { ref, set } from 'firebase/database'
import { db, rtdb } from '../config/firebase'

/**
 * Migrate userActivities from Firestore to Realtime Database
 * One-time migration — run by superadmin from Settings
 *
 * @param {Function} onProgress - Callback with { migrated, total, status }
 * @returns {Promise<{ success: boolean, count?: number, error?: string }>}
 */
export const migrateActivitiesToRTDB = async (onProgress) => {
  try {
    onProgress?.({ migrated: 0, total: 0, status: 'Reading Firestore...' })

    // 1. Read all activities from Firestore
    const q = query(collection(db, 'userActivities'), orderBy('timestamp', 'desc'))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { success: true, count: 0 }
    }

    const total = snapshot.size
    onProgress?.({ migrated: 0, total, status: `Found ${total} activities. Migrating...` })

    // 2. Write each to Realtime DB in batches
    let migrated = 0
    const batch = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      // Convert Firestore timestamp to epoch ms
      const timestamp = data.timestamp?.toMillis?.() || data.createdAt?.toMillis?.() || Date.now()

      batch[doc.id] = {
        userId: data.userId || '',
        username: data.username || '',
        userRole: data.userRole || '',
        activityType: data.activityType || '',
        description: data.description || '',
        metadata: data.metadata || {},
        timestamp,
      }
    })

    // Write all at once using set (faster than individual pushes)
    await set(ref(rtdb, 'userActivities'), batch)
    migrated = total

    onProgress?.({ migrated, total, status: 'Migration complete!' })

    return { success: true, count: migrated }
  } catch (error) {
    console.error('Migration error:', error)
    return { success: false, error: error.message }
  }
}
