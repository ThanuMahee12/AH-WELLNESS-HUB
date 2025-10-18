# Blood Lab Manager 🧪

A complete Point of Sale (POS) system for blood testing laboratories with Firebase backend and automatic deployment. Features patient management, blood test catalog, billing/checkups, user management, and professional PDF invoice generation.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.9.0-purple)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-blueviolet)

## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - Firebase email/password authentication
- 👥 **Patient Management** - Complete CRUD operations
- 🧬 **Blood Tests Catalog** - Manage test types, prices, and rules
- 📋 **Checkup/Billing** - Create bills with multiple tests
- 📄 **PDF Generation** - Professional invoice generation
- 👤 **User Management** - Create and manage staff users
- 📊 **Dashboard** - Analytics and statistics
- 🎨 **Responsive Design** - Works on all devices

### Technical Features
- ☁️ **Cloud Database** - Firestore for real-time data
- 🚀 **Auto-Deployment** - GitHub Actions to Firebase Hosting
- 📦 **Redux Thunk** - Async state management
- 🔄 **Real-time Updates** - Live data synchronization
- 🛡️ **Secure** - Firebase Authentication & Firestore Rules
- 📱 **Mobile-First** - Bootstrap responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account (free tier works)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Blood-Lab-Manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase** (Detailed guide: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
   - Create Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get configuration values

4. **Configure environment**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Firebase config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

5. **Create initial admin user**
   - Follow instructions in [docs/FIRST_USER_SETUP.md](./docs/FIRST_USER_SETUP.md)

6. **Run development server**
```bash
npm run dev
```

7. **Open in browser**
```
http://localhost:5173
```

## 📚 Documentation

All documentation is in the [docs](./docs/) folder:

| Document | Description |
|----------|-------------|
| [Firebase Setup](./docs/FIREBASE_SETUP.md) | Complete Firebase setup guide |
| [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) | Deployment overview and guide |
| [GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md) | CI/CD auto-deployment setup |
| [GitHub Secrets Setup](./docs/GITHUB_SECRETS_SETUP.md) | **⚠️ Required: Set up GitHub Secrets** |
| [First User Setup](./docs/FIRST_USER_SETUP.md) | Create your initial admin user |
| [Version Guide](./docs/VERSION_GUIDE.md) | Version management and releases |
| [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [Remaining Updates](./docs/REMAINING_UPDATES.md) | Pending updates and improvements |
| [Claude.md](./CLAUDE.md) | Project structure and conventions |

## 🏗️ Project Structure

```
Blood-Lab-Manager/
├── src/
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   ├── Navbar.jsx           # Top navigation
│   │   ├── Sidebar.jsx          # Side navigation
│   │   ├── Footer.jsx           # Footer component
│   │   └── ProtectedRoute.jsx  # Route authentication
│   ├── config/
│   │   └── firebase.js          # Firebase initialization
│   ├── pages/                   # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Patients.jsx
│   │   ├── Tests.jsx
│   │   ├── Checkups.jsx
│   │   └── Users.jsx
│   ├── services/                # Business logic
│   │   ├── authService.js       # Authentication operations
│   │   └── firestoreService.js  # Database operations
│   ├── store/                   # Redux state
│   │   ├── store.js
│   │   ├── authSlice.js
│   │   ├── patientsSlice.js
│   │   ├── testsSlice.js
│   │   ├── checkupsSlice.js
│   │   └── usersSlice.js
│   ├── styles/                  # CSS files
│   │   ├── sidebar.css
│   │   ├── navbar.css
│   │   └── footer.css
│   ├── utils/
│   │   └── pdfGenerator.js      # PDF invoice generation
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # Entry point
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml  # Auto-deployment workflow
├── firebase.json                # Firebase hosting config
├── .firebaserc                  # Firebase project config
└── .env.example                 # Environment template
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19.1.1 |
| **Build Tool** | Vite 7.1.7 |
| **State Management** | Redux Toolkit 2.9.0 |
| **Routing** | React Router DOM 7.9.4 |
| **UI Framework** | React Bootstrap 2.10.10 + Bootstrap 5.3.8 |
| **Icons** | React Icons 5.5.0 |
| **PDF** | jsPDF 3.0.3 + jspdf-autotable 5.0.2 |
| **Backend** | Firebase 12.4.0 (Auth + Firestore) |
| **Hosting** | Firebase Hosting |
| **CI/CD** | GitHub Actions |

## 🔑 Key Technologies Explained

### Firebase
- **Authentication**: Secure user login with email/password
- **Firestore**: NoSQL cloud database for all app data
- **Hosting**: Fast, secure web hosting with global CDN

### Redux Toolkit
- **Slices**: Modular state management
- **Thunks**: Async operations (API calls)
- **Immer**: Immutable state updates made easy

### React Bootstrap
- **Components**: Pre-built UI components
- **Responsive**: Mobile-first grid system
- **Theming**: Consistent design system

## 📱 Screenshots

### Login
Secure authentication with Firebase

### Dashboard
Analytics and key metrics at a glance

### Patients
Complete patient management system

### Checkups/Billing
Create bills, generate PDF invoices

## 🚀 Deployment

### Manual Deployment
```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Automatic Deployment (GitHub Actions)
1. **⚠️ IMPORTANT:** Set up GitHub Secrets first (see [docs/GITHUB_SECRETS_SETUP.md](./docs/GITHUB_SECRETS_SETUP.md))
2. Push to `main` branch
3. Automatically builds and deploys!

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# 🚀 Deploys automatically!
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 🔒 Security

### Firebase Config
- API keys in `.env` are **safe to expose publicly**
- They identify your Firebase project only
- Security comes from Firestore Rules and Authentication

### Firestore Security Rules
Update in Firebase Console for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Best Practices
- ✅ `.env` is in `.gitignore` (never commit it)
- ✅ Use GitHub Secrets for CI/CD
- ✅ Rotate Firebase service accounts periodically
- ✅ Enable Firebase App Check for production
- ✅ Monitor usage in Firebase Console

## 📊 Data Models

### User
```javascript
{
  uid: "firebase-auth-uid",
  username: "John Doe",
  email: "john@example.com",
  mobile: "1234567890",
  role: "user",
  createdAt: "2025-01-11T..."
}
```

### Patient
```javascript
{
  id: "auto-id",
  name: "Patient Name",
  age: 30,
  gender: "Male",
  mobile: "1234567890",
  address: "123 Main St",
  email: "patient@example.com"
}
```

### Blood Test
```javascript
{
  id: "auto-id",
  name: "Complete Blood Count",
  price: 500,
  details: "Measures blood components",
  rules: "Fasting not required"
}
```

### Checkup/Bill
```javascript
{
  id: "auto-id",
  patientId: "patient-id",
  tests: [
    { id: "test1", name: "CBC", price: 500 }
  ],
  total: 500,
  notes: "Follow-up required",
  timestamp: "2025-01-11T10:30:00Z"
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**"Firebase not initialized"**
- Verify `.env` file exists with all variables
- Ensure variables start with `VITE_`
- Restart dev server

**"Permission denied" in Firestore**
- Update Firestore Security Rules
- Ensure user is authenticated

**"User not found" after login**
- Create user profile in Firestore
- Document ID must match Auth UID

See [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md) for more troubleshooting help.

### ⚠️ Authentication Issue: Dashboard Opens Directly

**Problem:** Live app bypasses login page and opens dashboard directly
**Cause:** GitHub Secrets not configured

**Solution:**
1. Go to: https://github.com/ThanuMahee12/Blood-Lab-Manager/settings/secrets/actions
2. Add all 7 Firebase secrets (see [docs/GITHUB_SECRETS_SETUP.md](./docs/GITHUB_SECRETS_SETUP.md))
3. Re-run failed GitHub Actions workflow
4. Wait 2-3 minutes for redeployment

**Quick Fix:** Add these secrets to GitHub:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 📞 Support

- **Documentation**: Check the docs folder
- **Issues**: Open a GitHub issue
- **Firebase**: https://firebase.google.com/support
- **React**: https://react.dev/learn

## 🎉 Acknowledgments

- React Team for the amazing framework
- Firebase for backend infrastructure
- Bootstrap team for the UI framework
- Redux Toolkit for state management

## 📈 Roadmap

- [ ] Add more blood test types
- [ ] Implement appointment scheduling
- [ ] Add inventory management
- [ ] Email invoice delivery
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode theme

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

## 📚 Documentation

Comprehensive guides and documentation are available in the `docs/` folder:

### Setup & Configuration
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Complete Firebase project setup guide
- **[FIRST_USER_SETUP.md](./FIRST_USER_SETUP.md)** - Creating your first admin user
- **[SUPERADMIN_SETUP.md](./SUPERADMIN_SETUP.md)** - Upgrade account to SuperAdmin
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - Configure GitHub Actions secrets
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - Setup automatic deployment

### Features & Implementation
- **[RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)** - Role-Based Access Control system
  - 4 user roles: User, Editor, Maintainer, SuperAdmin
  - Permission matrix and approval workflows
  - Auto serial number generation for checkups
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[VERSION_GUIDE.md](./VERSION_GUIDE.md)** - Version history and updates
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature implementation summary
- **[REMAINING_UPDATES.md](./REMAINING_UPDATES.md)** - Planned features and updates

### Development
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and project structure for AI assistants

---

**Built with ❤️ using React, Firebase, and modern web technologies**
