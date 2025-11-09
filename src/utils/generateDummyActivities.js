import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Generate dummy activity data for testing
 * This script creates sample activities for the past 90 days
 */

const DUMMY_USERS = [
  { uid: 'user1', username: 'thanumahee', role: 'superadmin' },
  { uid: 'user2', username: 'john_doe', role: 'maintainer' },
  { uid: 'user3', username: 'jane_smith', role: 'editor' },
  { uid: 'user4', username: 'mike_wilson', role: 'user' },
]

const ACTIVITY_TYPES = [
  'login',
  'logout',
  'test_create',
  'test_update',
  'test_delete',
  'patient_create',
  'patient_update',
  'checkup_create',
  'medicine_create',
  'user_request_create',
]

const ACTIVITY_DESCRIPTIONS = {
  login: 'Logged in',
  logout: 'Logged out',
  test_create: ['Created test: PCR Test', 'Created test: Blood Sugar', 'Created test: CBC Test', 'Created test: Lipid Profile'],
  test_update: ['Updated test: PCR Test', 'Updated test: Blood Sugar', 'Updated test: Hemoglobin'],
  test_delete: ['Deleted test: PCR Test', 'Deleted test: Urine Test', 'Deleted test: X-Ray'],
  patient_create: ['Created patient: John Smith', 'Created patient: Mary Johnson', 'Created patient: Robert Brown'],
  patient_update: ['Updated patient: John Smith', 'Updated patient: Mary Johnson'],
  checkup_create: ['Created checkup for patient: John Smith', 'Created checkup for patient: Mary Johnson'],
  medicine_create: ['Created medicine: Aspirin', 'Created medicine: Paracetamol'],
  user_request_create: ['Requested new user: new_editor'],
}

/**
 * Generate random activity for a user on a specific date
 */
const generateActivity = (user, date, activityType) => {
  const descriptions = ACTIVITY_DESCRIPTIONS[activityType]
  const description = Array.isArray(descriptions)
    ? descriptions[Math.floor(Math.random() * descriptions.length)]
    : descriptions

  // Build metadata object, only including defined values
  const metadata = {}

  if (activityType.includes('test') && description.includes(': ')) {
    metadata.testName = description.split(': ')[1]
  }

  if (activityType.includes('patient') && description.includes(': ')) {
    metadata.patientName = description.split(': ')[1]
  }

  if (activityType.includes('checkup') && description.includes(': ')) {
    metadata.patientName = description.split(': ')[1]
  }

  if (activityType.includes('medicine') && description.includes(': ')) {
    metadata.medicineName = description.split(': ')[1]
  }

  if (activityType.includes('user') && description.includes(': ')) {
    metadata.username = description.split(': ')[1]
  }

  return {
    userId: user.uid,
    username: user.username,
    userRole: user.role,
    activityType: activityType,
    description: description,
    metadata: metadata,
    timestamp: Timestamp.fromDate(date),
    createdAt: Timestamp.fromDate(date),
  }
}

/**
 * Generate activities for the past N days
 */
export const generateDummyActivities = async (daysBack = 90) => {
  try {
    console.log(`Generating dummy activities for the past ${daysBack} days...`)

    const activities = []
    const today = new Date()

    // Generate activities for each day
    for (let dayOffset = 0; dayOffset < daysBack; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)

      // Each user performs 1-5 random activities per day
      DUMMY_USERS.forEach(user => {
        const numActivities = Math.floor(Math.random() * 5) + 1

        for (let i = 0; i < numActivities; i++) {
          // Random activity type
          const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)]

          // Random time during the day
          const randomHour = Math.floor(Math.random() * 12) + 8 // 8 AM to 8 PM
          const randomMinute = Math.floor(Math.random() * 60)
          const activityDate = new Date(date)
          activityDate.setHours(randomHour, randomMinute, 0, 0)

          activities.push(generateActivity(user, activityDate, activityType))
        }
      })
    }

    console.log(`Generated ${activities.length} dummy activities`)
    console.log('Adding to Firestore...')

    // Add activities to Firestore
    let count = 0
    for (const activity of activities) {
      await addDoc(collection(db, 'userActivities'), activity)
      count++
      if (count % 50 === 0) {
        console.log(`Added ${count}/${activities.length} activities...`)
      }
    }

    console.log(`✅ Successfully added ${activities.length} dummy activities!`)
    return { success: true, count: activities.length }

  } catch (error) {
    console.error('Error generating dummy activities:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Quick function to generate activities for testing
 * Call this from browser console: window.generateTestActivities()
 */
if (typeof window !== 'undefined') {
  window.generateTestActivities = async () => {
    const result = await generateDummyActivities(90)
    if (result.success) {
      alert(`Successfully created ${result.count} dummy activities!`)
    } else {
      alert(`Error: ${result.error}`)
    }
  }
}
