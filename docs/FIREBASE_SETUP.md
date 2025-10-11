# Firebase Setup Guide

This guide will help you set up Firebase for the Blood Lab Manager application.

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a Project"
3. Enter project name (e.g., "blood-lab-manager")
4. Accept terms and click "Continue"
5. Disable Google Analytics (optional) and click "Create Project"

## Step 2: Enable Firebase Services

### Enable Firebase Authentication

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get Started"
3. Click on "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

### Enable Firestore Database

1. In Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a Firestore location (select closest to your users)
5. Click "Enable"

### Configure Firestore Security Rules (Production)

After testing, update Firestore rules for security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Patients collection - authenticated users only
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }

    // Tests collection - authenticated users only
    match /tests/{testId} {
      allow read, write: if request.auth != null;
    }

    // Checkups collection - authenticated users only
    match /checkups/{checkupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the Web icon (`</>`) to add a web app
5. Enter app nickname (e.g., "Blood Lab Manager Web")
6. **Do NOT** check "Set up Firebase Hosting" (we'll do this separately)
7. Click "Register app"
8. Copy the firebaseConfig object

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Note**: Firebase config values are safe to expose publicly. They identify your Firebase project but don't grant access without authentication.

## Step 5: Initialize Firebase Hosting

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# When prompted:
# - Select your Firebase project
# - Set public directory to: dist
# - Configure as single-page app: Yes
# - Set up automatic builds with GitHub: No (we'll use GitHub Actions)
# - Don't overwrite existing files
```

## Step 6: Update .firebaserc

Edit `.firebaserc` and replace `your-project-id` with your actual Firebase project ID.

## Step 7: Create Initial Admin User

Since there's no initial user, you need to create one:

### Option 1: Using Firebase Console (Recommended)

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email: `admin@bloodlab.com`
4. Enter password: `admin123` (or your chosen password)
5. Click "Add user"
6. Copy the User UID
7. Go to Firestore Database
8. Create a new collection called `users`
9. Add a document with the User UID as the document ID
10. Add fields:
    - `username`: "Admin"
    - `email`: "admin@bloodlab.com"
    - `mobile`: "1234567890"
    - `role`: "admin"
    - `createdAt`: (current timestamp)

### Option 2: Using Firebase CLI

```javascript
// Run this script once using Node.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const createAdmin = async () => {
  const userRecord = await admin.auth().createUser({
    email: 'admin@bloodlab.com',
    password: 'admin123',
    displayName: 'Admin'
  });

  await admin.firestore().collection('users').doc(userRecord.uid).set({
    username: 'Admin',
    email: 'admin@bloodlab.com',
    mobile: '1234567890',
    role: 'admin',
    createdAt: new Date().toISOString()
  });

  console.log('Admin user created:', userRecord.uid);
};

createAdmin();
```

## Step 8: Test Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test login with:
# Email: admin@bloodlab.com
# Password: admin123 (or your chosen password)
```

## Step 9: Deploy to Firebase Hosting

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Your app will be live at: https://your-project-id.web.app
```

## Step 10: Set up GitHub Actions for Auto-Deploy

This is covered in the GitHub Actions workflow file (`.github/workflows/firebase-deploy.yml`).

You'll need to:
1. Get Firebase token: `firebase login:ci`
2. Add the token as a GitHub Secret named `FIREBASE_TOKEN`
3. Add your `.env` variables as GitHub Secrets

## Firestore Collections Structure

The app uses the following Firestore collections:

### `users`
- Document ID: Firebase Auth UID
- Fields: `username`, `email`, `mobile`, `role`, `createdAt`

### `patients`
- Auto-generated document IDs
- Fields: `name`, `age`, `gender`, `mobile`, `address`, `email`, `createdAt`, `updatedAt`

### `tests`
- Auto-generated document IDs
- Fields: `name`, `price`, `details`, `rules`, `createdAt`, `updatedAt`

### `checkups`
- Auto-generated document IDs
- Fields: `patientId`, `tests[]`, `total`, `notes`, `timestamp`, `createdAt`, `updatedAt`

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use Firestore Security Rules** - Restrict access to authenticated users
3. **Update default passwords** - Change admin password after first login
4. **Enable App Check** (optional) - Protect against abuse
5. **Set up billing alerts** - Monitor Firebase usage
6. **Use environment variables** - Different configs for dev/staging/production

## Troubleshooting

### "Permission denied" errors
- Check Firestore Security Rules
- Ensure user is authenticated
- Verify user has correct permissions

### "Firebase not initialized" errors
- Verify `.env` file exists with correct values
- Ensure environment variables start with `VITE_`
- Restart development server after changing `.env`

### "User not found" after login
- Ensure user profile exists in Firestore `users` collection
- Verify document ID matches Firebase Auth UID

## Support

For issues:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support

## Cost Estimates

Firebase Free Tier (Spark Plan) includes:
- Authentication: Unlimited
- Firestore: 1GB storage, 50K reads/day, 20K writes/day
- Hosting: 10GB storage, 360MB/day transfer

This is sufficient for development and small production deployments.
