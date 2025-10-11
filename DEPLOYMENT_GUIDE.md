# Blood Lab Manager - Deployment Guide

## Overview

This application has been fully integrated with Firebase for authentication, database, and hosting. It features automatic deployment via GitHub Actions when code is merged to the main branch.

## What's Been Implemented

### 1. Firebase Integration
- **Firebase Authentication**: Email/password authentication for secure user login
- **Firestore Database**: Cloud NoSQL database for all app data
- **Firebase Hosting**: Fast, secure hosting with CDN
- **Environment Variables**: Secure configuration using Vite env variables

### 2. Redux Integration with Firebase
All Redux slices now use **Redux Thunk** for async operations:
- `authSlice`: Login, logout, user registration
- `patientsSlice`: CRUD operations for patients
- `testsSlice`: CRUD operations for blood tests
- `checkupsSlice`: CRUD operations for checkups/billing
- `usersSlice`: User management

### 3. Code Organization
- **Services Layer**: Separated Firebase logic into `src/services/`
  - `authService.js`: Authentication operations
  - `firestoreService.js`: Generic Firestore CRUD operations
- **Reusable Components**: Created in `src/components/common/`
  - `LoadingSpinner.jsx`: Loading states
  - `ErrorAlert.jsx`: Error display
- **Styles**: Organized all CSS in `src/styles/` directory
  - `sidebar.css`: Sidebar navigation styles
  - `navbar.css`: Top navigation styles
  - `footer.css`: Footer styles

### 4. Access Control
- **Login-only Access**: All pages except Home and Login require authentication
- **No Role-Based Restrictions**: All logged-in users can access all features
- **New User Creation**: Existing users can create new user accounts

### 5. Deployment Setup
- **Firebase Hosting**: Configured in `firebase.json`
- **GitHub Actions**: Auto-deploy on push to `main` branch
- **Environment Management**: Secure secrets management

## File Structure

```
Blood-Lab-Manager/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml       # Auto-deploy workflow
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorAlert.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── config/
│   │   └── firebase.js              # Firebase initialization
│   ├── services/
│   │   ├── authService.js           # Authentication service
│   │   └── firestoreService.js      # Firestore CRUD service
│   ├── store/
│   │   ├── store.js
│   │   ├── authSlice.js             # With Redux Thunk
│   │   ├── patientsSlice.js         # With Redux Thunk
│   │   ├── testsSlice.js            # With Redux Thunk
│   │   ├── checkupsSlice.js         # With Redux Thunk
│   │   └── usersSlice.js            # With Redux Thunk
│   └── styles/
│       ├── sidebar.css
│       ├── navbar.css
│       └── footer.css
├── .env.example                      # Environment template
├── .firebaserc                       # Firebase project config
├── firebase.json                     # Firebase hosting config
├── FIREBASE_SETUP.md                 # Detailed setup instructions
└── DEPLOYMENT_GUIDE.md              # This file
```

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd Blood-Lab-Manager
npm install
```

### 2. Set Up Firebase
Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

Quick summary:
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get Firebase config values
5. Create `.env` file with your config

### 3. Run Locally
```bash
npm run dev
```

### 4. Deploy to Firebase

#### Manual Deployment
```bash
npm run build
firebase deploy --only hosting
```

#### Automatic Deployment (GitHub Actions)
1. Push code to `main` branch
2. GitHub Actions automatically builds and deploys
3. App is live at `https://your-project-id.web.app`

## GitHub Secrets Setup

For automatic deployment, add these secrets to your GitHub repository:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | App ID | Firebase Console → Project Settings |
| `FIREBASE_SERVICE_ACCOUNT` | Service Account JSON | Firebase Console → Project Settings → Service accounts → Generate new private key |

## First-Time Setup

### Create Initial Admin User

After Firebase setup, create your first admin user:

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `your-email@example.com`
4. Password: `your-secure-password`
5. Copy the User UID
6. Go to Firestore Database
7. Create collection: `users`
8. Add document with User UID as ID:
   ```javascript
   {
     username: "Admin",
     email: "your-email@example.com",
     mobile: "1234567890",
     role: "admin",
     createdAt: "2025-01-01T00:00:00.000Z"
   }
   ```

## How Auto-Deployment Works

1. **Push to Main**: When code is pushed/merged to `main` branch
2. **GitHub Actions Triggered**: Workflow runs automatically
3. **Build Process**:
   - Checks out code
   - Installs dependencies
   - Creates `.env` file from secrets
   - Builds production bundle
4. **Deploy**: Deploys `dist/` folder to Firebase Hosting
5. **Live**: App is automatically live!

## Firestore Data Structure

### Collections

#### `users`
```javascript
{
  id: "<firebase-auth-uid>",
  username: "John Doe",
  email: "john@example.com",
  mobile: "1234567890",
  role: "user",
  createdAt: "2025-01-01T00:00:00.000Z"
}
```

#### `patients`
```javascript
{
  id: "<auto-generated>",
  name: "Patient Name",
  age: 30,
  gender: "Male",
  mobile: "1234567890",
  address: "123 Main St",
  email: "patient@example.com",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

#### `tests`
```javascript
{
  id: "<auto-generated>",
  name: "Complete Blood Count",
  price: 500,
  details: "Measures blood components",
  rules: "Fasting not required",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

#### `checkups`
```javascript
{
  id: "<auto-generated>",
  patientId: "<patient-id>",
  tests: [
    { id: "test1", name: "CBC", price: 500 },
    { id: "test2", name: "Blood Sugar", price: 250 }
  ],
  total: 750,
  notes: "Follow-up required",
  timestamp: "2025-01-01T10:30:00.000Z",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}
```

## Security Best Practices

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access any data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // More restrictive rules (recommended for production):
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }

    match /tests/{testId} {
      allow read, write: if request.auth != null;
    }

    match /checkups/{checkupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables
- **Never commit `.env`** file (it's in `.gitignore`)
- **Use GitHub Secrets** for CI/CD
- **Firebase config is public-safe** - API keys only identify the project

## Troubleshooting

### Common Issues

#### 1. "Permission denied" in Firestore
- Check Firestore Security Rules
- Ensure user is logged in
- Verify authentication state

#### 2. ".env variables not loading"
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`
- Check `.env` file is in project root

#### 3. "Firebase not initialized"
- Verify all Firebase env variables are set
- Check Firebase config in `src/config/firebase.js`
- Ensure Firebase project exists

#### 4. "GitHub Actions deployment fails"
- Verify all GitHub Secrets are set
- Check `FIREBASE_SERVICE_ACCOUNT` JSON format
- Review GitHub Actions logs

### Get Help

- **Firebase Docs**: https://firebase.google.com/docs
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Vite Docs**: https://vitejs.dev/guide/

## Monitoring and Maintenance

### Firebase Console Monitoring
1. **Authentication**: Monitor user sign-ups/logins
2. **Firestore**: Track database reads/writes
3. **Hosting**: View bandwidth and traffic
4. **Performance**: Use Firebase Performance Monitoring

### Cost Management
- **Free Tier**: Sufficient for small/medium apps
- **Set Billing Alerts**: Avoid unexpected charges
- **Monitor Usage**: Track in Firebase Console

### Updates and Backups
- **Firestore Backups**: Set up automated exports
- **Code Versioning**: Use Git tags for releases
- **Database Migrations**: Document schema changes

## Next Steps

1. **Customize branding**: Update logos, colors, company info
2. **Add features**: Extend functionality as needed
3. **Set up monitoring**: Enable Firebase Analytics
4. **Add testing**: Unit tests, integration tests
5. **Performance**: Optimize bundle size, lazy loading
6. **SEO**: Add meta tags, sitemap

## Support

For issues or questions:
- Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for setup help
- Review error messages in browser console
- Check Firebase Console for service status
- Review GitHub Actions logs for deployment issues
