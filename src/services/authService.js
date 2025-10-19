import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { firebaseConfig } from '../config/firebase'

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

      if (userDoc.exists()) {
        return {
          success: true,
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userDoc.data()
          }
        }
      } else {
        return { success: false, error: 'User profile not found' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Password reset email sent!' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Register new user (called by super admin)
  register: async (userData) => {
    try {
      // Create a secondary auth instance to avoid logging out the current user
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary')
      const secondaryAuth = getAuth(secondaryApp)

      // Create the new user in the secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        userData.email,
        userData.password
      )

      // Create user profile in Firestore
      const userProfile = {
        username: userData.username,
        email: userData.email,
        mobile: userData.mobile || '',
        role: userData.role || 'user',
        createdAt: new Date().toISOString()
      }

      // Save to Firestore using the shared db instance
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile)

      // Update the display name in the secondary auth
      await updateProfile(userCredential.user, { displayName: userData.username })

      // Sign out from secondary auth and delete the secondary app
      await secondaryAuth.signOut()
      await deleteApp(secondaryApp)

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          ...userProfile
        }
      }
    } catch (error) {
      // Clean up secondary app if it exists
      try {
        if (error.secondaryApp) {
          await deleteApp(error.secondaryApp)
        }
      } catch (cleanupError) {
        console.error('Error cleaning up secondary app:', cleanupError)
      }
      return { success: false, error: error.message }
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser
  },

  // Delete user completely from Firestore
  deleteUser: async (userId) => {
    try {
      // Completely delete the user document from Firestore
      await deleteDoc(doc(db, 'users', userId))

      // Note: Firebase Authentication cannot be deleted from client-side code
      // for security reasons. It requires Firebase Admin SDK (Cloud Functions).
      //
      // IMPORTANT: The user will still exist in Firebase Authentication.
      // To fully remove them from Auth, you need to:
      // 1. Set up Firebase Cloud Functions with Admin SDK
      // 2. Or manually delete from Firebase Console: Authentication > Users
      //
      // However, deleted users won't be able to login because their Firestore
      // profile is removed, and the login function checks for profile existence.

      return {
        success: true,
        message: 'User deleted from database. Remove from Authentication via Firebase Console if needed.'
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Auth state observer
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          callback({
            uid: user.uid,
            email: user.email,
            ...userData
          })
        } else {
          // User profile doesn't exist in Firestore (deleted user)
          // Sign them out automatically
          await signOut(auth)
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}
