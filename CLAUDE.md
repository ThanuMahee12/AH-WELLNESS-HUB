# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blood Lab Manager is a complete Point of Sale (POS) system for blood testing laboratories. It provides comprehensive management of patients, blood tests, checkups/billing, users, and generates professional PDF invoices. The application features role-based authentication with admin and user roles.

## Development Commands

- **Start dev server**: `npm run dev` - Starts Vite dev server with HMR at http://localhost:5173
- **Build**: `npm run build` - Production build to `dist/` directory
- **Lint**: `npm run lint` - Run ESLint on all files
- **Preview build**: `npm run preview` - Preview production build locally

## Tech Stack

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **State Management**: Redux Toolkit (@reduxjs/toolkit 2.9.0)
- **Routing**: React Router DOM 7.9.4
- **UI Framework**: React Bootstrap 2.10.10 + Bootstrap 5.3.8
- **Icons**: React Icons 5.5.0
- **PDF Generation**: jsPDF 3.0.3 + jspdf-autotable 5.0.2
- **Language**: JavaScript (JSX)

## Project Structure

### Core Files
- `src/main.jsx` - Entry point with Redux Provider, Router, and Bootstrap CSS
- `src/App.jsx` - Main app with routing and protected routes
- `index.html` - HTML shell

### State Management (Redux)
- `src/store/store.js` - Redux store configuration
- `src/store/authSlice.js` - Authentication state (login/logout, user persistence)
- `src/store/testsSlice.js` - Blood tests management
- `src/store/patientsSlice.js` - Patients management
- `src/store/checkupsSlice.js` - Checkups/billing management
- `src/store/usersSlice.js` - Users management

### Components
- `src/components/Navbar.jsx` - Navigation bar with role-based menu items
- `src/components/ProtectedRoute.jsx` - Route protection HOC with optional admin-only access

### Pages
- `src/pages/Home.jsx` - Landing page with features showcase
- `src/pages/Login.jsx` - Authentication page
- `src/pages/Dashboard.jsx` - Analytics dashboard with statistics
- `src/pages/Patients.jsx` - Patient CRUD operations
- `src/pages/Checkups.jsx` - Checkup/billing management with PDF generation
- `src/pages/Tests.jsx` - Blood tests CRUD (Admin only)
- `src/pages/Users.jsx` - User management CRUD (Admin only)

### Utilities
- `src/utils/pdfGenerator.js` - PDF bill generation using jsPDF

## Application Features

### Authentication
- Role-based access control (Admin/User)
- User persistence via localStorage
- Protected routes with automatic redirect

### Data Models

**User**: `{ id, username, email, password, mobile, role }`
**Patient**: `{ id, name, age, gender, mobile, address, email }`
**Test**: `{ id, name, price, details, rules }`
**Checkup**: `{ id, patientId, tests[], total, notes, timestamp }`

### User Roles

**Admin** - Full access:
- Manage blood tests (CRUD)
- Manage users (CRUD)
- All user permissions

**User** - Limited access:
- Manage patients (CRUD)
- Create/manage checkups
- Generate PDF bills

### Default Credentials
- Admin: `admin@bloodlab.com` / `admin123`
- User: `user@bloodlab.com` / `user123`

## Design System

### Theme
- Color scheme: Black/Grey/White theme
  - Primary backgrounds: Black (#000000) to Dark Grey (#1a1a1a, #2d2d2d)
  - Accents: Grey (#666, #888)
  - Text: White (#fff) on dark, Dark on light
- Fully responsive: Mobile-first design
- Breakpoints: xs, sm, md, lg, xl (Bootstrap standard)

### Responsive Design
- **Sidebar**: Toggle sidebar that slides from right on mobile/tablet (hamburger menu)
- **Tables**: Mobile-responsive with card layout
  - On mobile: Tables transform to card layout with data-label attributes
  - Each row becomes a card showing label-value pairs
  - Action buttons stack appropriately
- **Forms**: Responsive modal forms that adapt to screen size
- Fluid containers with responsive padding
- Stack cards vertically on small screens
- Responsive charts and widgets

## Code Conventions

- **State Management**: Use Redux Toolkit slices with Immer for immutable updates
- **Routing**: Protected routes wrap authenticated pages
- **Forms**: Controlled components with local state
- **Modals**: Single modal per page, toggled with show/hide state
- **PDF Generation**: Use `generateCheckupPDF` utility function
- **Icons**: Import from `react-icons/fa` (Font Awesome)
- **Styling**: Bootstrap utility classes preferred over custom CSS
- **Responsive Tables**: Use `table-mobile-responsive` class with `data-label` attributes on `<td>` elements
- **Color Scheme**: Use black/grey/white theme consistently across components

## Git Commit Guidelines

- **DO NOT** include Claude Code signature in commit messages
- Keep commit messages concise and descriptive
- Format: `type: description` (e.g., `feat: add responsive tables`, `fix: resolve mobile layout issues`)

## Key Workflows

### Creating a Checkup
1. Select patient from dropdown
2. Select multiple tests (checkboxes)
3. Total auto-calculates
4. Add optional notes
5. Save creates checkup with timestamp
6. Generate PDF button creates downloadable invoice

### PDF Bill Format
- Blue header with lab branding
- Patient and bill information
- Tests table with prices
- Total with highlighted footer
- Optional notes section
- Contact information in footer

## Development Notes

- All state persists only in Redux (no backend)
- Auth state persists in localStorage
- IDs auto-increment per entity
- Timestamps generated on checkup creation
- PDF downloads directly to browser
