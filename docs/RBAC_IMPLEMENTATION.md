# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the RBAC system implementation for the Blood Lab Manager application with 4 distinct roles and comprehensive permission management.

## Role Hierarchy

1. **User** (Level 1) - View-only access
2. **Editor** (Level 2) - Can edit but requires approval
3. **Maintainer** (Level 3) - User management + approval authority
4. **SuperAdmin** (Level 4) - Full system control

---

## Roles and Permissions

### 1. User Role (`user`)

**Capabilities:**
- ✅ View checkup details (read-only)
- ✅ Generate PDF from existing checkups
- ✅ View test details (read-only)
- ✅ View patient details (read-only)
- ✅ View own profile
- ❌ Cannot edit or delete anything
- ❌ Cannot see other users

**Use Case:** Staff members who need to view and print records only

---

### 2. Editor Role (`editor`)

**Capabilities:**
- ✅ View all checkups, tests, patients
- ✅ Create new checkups, tests, patients
- ✅ Edit checkups and tests (creates edit request for approval)
- ✅ Edit patients (direct edit)
- ✅ Generate PDFs
- ✅ View own edit requests status
- ❌ Cannot directly edit checkups/tests without approval
- ❌ Cannot delete anything
- ❌ Cannot manage users

**Workflow:**
1. Editor makes changes to checkup or test
2. System creates an "Edit Request" with status: PENDING
3. Changes are NOT applied until approved
4. Maintainer or SuperAdmin reviews and approves/rejects
5. If approved, changes are applied automatically

**Use Case:** Lab technicians who need to create and update records with oversight

---

### 3. Maintainer Role (`maintainer`)

**Capabilities:**
- ✅ Full CRUD on checkups, tests, patients
- ✅ View users (User, Editor, Maintainer roles)
- ✅ Request to add new user (requires SuperAdmin approval)
- ✅ Request to edit user (requires SuperAdmin approval)
- ✅ Request to remove user (requires SuperAdmin approval)
- ✅ Initiate password reset for users
- ✅ Approve/reject Editor edit requests
- ✅ View all maintainers and below
- ❌ Cannot directly add/edit/delete users
- ❌ Cannot see SuperAdmins
- ❌ Cannot change user permissions/roles

**Workflow for User Management:**
1. Maintainer creates user request (add/edit/delete)
2. Request goes to SuperAdmin for approval
3. SuperAdmin reviews and approves/rejects
4. If approved, changes are applied

**Use Case:** Lab managers who oversee operations and manage staff

---

### 4. SuperAdmin Role (`superadmin`)

**Capabilities:**
- ✅ Full CRUD on all resources (direct, no approval needed)
- ✅ View all users including other SuperAdmins
- ✅ Create/Edit/Delete users directly
- ✅ Change user roles and permissions
- ✅ Approve all pending requests (editor edits, maintainer user requests)
- ✅ Trigger password reset email links
- ✅ View user IDs (only SuperAdmin can see IDs)
- ✅ Access to complete audit trail

**Use Case:** System administrators with full control

---

## Key Features Implemented

### 1. Auto Serial Number Generation

Every checkup gets a unique 12-digit serial number:

**Format:** `XXXXXXXXXXXX` (12 digits)
- First 10 digits: Timestamp-based (last 10 digits of milliseconds)
- Last 2 digits: Check digits (calculated using sum and XOR operations)

**Example:** `7423891256`89

**Display Format:** `7423-8912-5689`

**Location:** `src/utils/serialNumberGenerator.js`

**Functions:**
- `generateCheckupSerialNumber()` - Generate new serial number
- `validateSerialNumber(serial)` - Validate format
- `formatSerialNumber(serial)` - Format for display

---

### 2. Edit Request System

Tracks all edit requests that require approval.

**Schema:**
```javascript
{
  id: string,
  type: 'checkup_edit' | 'test_edit' | 'user_create' | 'user_edit' | 'user_delete',
  resourceId: string, // ID of item being edited
  originalData: object, // Original state
  proposedData: object, // Proposed changes
  requestedBy: string, // User ID who made request
  requestedByName: string,
  requestedByRole: string,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: string, // ID of approver
  approvedByName: string,
  approverNotes: string,
  rejectionReason: string,
  createdAt: timestamp,
  approvedAt: timestamp,
  rejectedAt: timestamp
}
```

**Location:** `src/store/editRequestsSlice.js`

---

### 3. Permission System

**Location:** `src/constants/roles.js`

**Core Functions:**
```javascript
hasPermission(userRole, resource, action)
// Example: hasPermission('editor', 'checkups', 'edit')

isRoleHigherOrEqual(userRole, targetRole)
// Example: isRoleHigherOrEqual('maintainer', 'editor') // true

canViewRole(userRole, targetRole)
// Example: canViewRole('maintainer', 'superadmin') // false

needsApproval(userRole, resource, action)
// Example: needsApproval('editor', 'checkups', 'edit') // true
```

---

### 4. PermissionGate Component

Conditionally render UI based on permissions.

**Location:** `src/components/auth/PermissionGate.jsx`

**Usage:**
```jsx
import { PermissionGate, usePermission } from '../components/auth/PermissionGate'

// Component-based
<PermissionGate resource="checkups" action="edit">
  <Button>Edit Checkup</Button>
</PermissionGate>

<PermissionGate requiredRole="maintainer">
  <ManageUsersButton />
</PermissionGate>

// Hook-based
const { checkPermission, checkRole, userRole } = usePermission()

if (checkPermission('users', 'delete')) {
  // Show delete button
}

if (checkRole('superadmin')) {
  // Show admin panel
}
```

---

## Implementation Checklist

### ✅ Completed
- [x] Role hierarchy definition
- [x] Permission constants and configuration
- [x] Serial number generator utility
- [x] Edit request system (Redux slice)
- [x] Store configuration updated
- [x] Checkup serial number integration
- [x] PermissionGate component and hook

### 🔄 Next Steps (To Be Implemented)
- [ ] Update authSlice to support new roles
- [ ] Create ApprovalRequests page/component
- [ ] Update Checkups page with RBAC
- [ ] Update Tests page with RBAC
- [ ] Update Patients page with RBAC
- [ ] Update Users page with approval workflow
- [ ] Add role badges to user profiles
- [ ] Create email notification system for approvals
- [ ] Add audit log for all actions
- [ ] Create SuperAdmin dashboard
- [ ] Add password reset functionality

---

## How to Use RBAC in Components

### Example 1: Conditional Button Rendering
```jsx
import { PermissionGate } from '../../components/auth/PermissionGate'

function CheckupsPage() {
  return (
    <div>
      <PermissionGate resource="checkups" action="edit">
        <Button onClick={handleEdit}>Edit</Button>
      </PermissionGate>

      <PermissionGate resource="checkups" action="delete">
        <Button onClick={handleDelete}>Delete</Button>
      </PermissionGate>
    </div>
  )
}
```

### Example 2: Role-Based Navigation
```jsx
import { usePermission } from '../../components/auth/PermissionGate'

function Navbar() {
  const { checkRole } = usePermission()

  return (
    <Nav>
      <Nav.Link to="/checkups">Checkups</Nav.Link>
      {checkRole('maintainer') && (
        <Nav.Link to="/approvals">Approvals</Nav.Link>
      )}
      {checkRole('superadmin') && (
        <Nav.Link to="/admin">Admin Panel</Nav.Link>
      )}
    </Nav>
  )
}
```

### Example 3: Editor Edit Request Flow
```jsx
import { needsApproval } from '../../constants/roles'
import { createEditRequest } from '../../store/editRequestsSlice'

const handleEdit = async () => {
  if (needsApproval(userRole, 'checkups', 'edit')) {
    // Create edit request instead of direct update
    await dispatch(createEditRequest({
      type: 'checkup_edit',
      resourceId: checkup.id,
      originalData: checkup,
      proposedData: updatedCheckup,
    }))
    notify('Edit request submitted for approval')
  } else {
    // Direct update for maintainer/superadmin
    await dispatch(updateCheckup(updatedCheckup))
    notify('Checkup updated successfully')
  }
}
```

---

## Testing the RBAC System

### Test User Accounts (To Be Created)
```javascript
// User role
{ email: 'user@bloodlab.com', password: 'user123', role: 'user' }

// Editor role
{ email: 'editor@bloodlab.com', password: 'editor123', role: 'editor' }

// Maintainer role
{ email: 'maintainer@bloodlab.com', password: 'maintainer123', role: 'maintainer' }

// SuperAdmin role
{ email: 'superadmin@bloodlab.com', password: 'admin123', role: 'superadmin' }
```

### Test Scenarios

1. **User Role:**
   - Try to edit checkup → Should see "View Only" or no edit button
   - Try to delete → Should see no delete button
   - Generate PDF → Should work

2. **Editor Role:**
   - Edit checkup → Should create edit request
   - View edit requests → Should see own pending requests
   - Try to delete → Should not be allowed

3. **Maintainer Role:**
   - Edit checkup → Should edit directly
   - View users → Should see users, editors, other maintainers
   - Try to add user → Should create user request for approval
   - Approve editor request → Should work

4. **SuperAdmin Role:**
   - All operations → Should work directly
   - View all users → Should see everyone including IDs
   - Approve all requests → Should work

---

## Database Schema Updates

### Checkups Collection
```javascript
{
  id: string,
  serialNumber: string, // NEW: 12-digit serial number
  patientId: string,
  tests: array,
  total: number,
  notes: string,
  timestamp: string,
  createdBy: string, // NEW: User ID who created
  createdByName: string, // NEW: Username who created
}
```

### EditRequests Collection (NEW)
```javascript
{
  id: string,
  type: string,
  resourceId: string,
  originalData: object,
  proposedData: object,
  requestedBy: string,
  requestedByName: string,
  requestedByRole: string,
  status: string,
  approvedBy: string,
  approvedByName: string,
  approverNotes: string,
  rejectionReason: string,
  createdAt: string,
  approvedAt: string,
  rejectedAt: string,
}
```

### Users Collection (Updated)
```javascript
{
  id: string,
  username: string,
  email: string,
  mobile: string,
  role: 'user' | 'editor' | 'maintainer' | 'superadmin', // UPDATED
  createdAt: string,
  createdBy: string,
  lastModifiedAt: string,
  lastModifiedBy: string,
}
```

---

## Security Considerations

1. **Client-Side Validation:** PermissionGate provides UI-level security
2. **Server-Side Validation:** Must implement Firestore security rules
3. **Password Reset:** Use Firebase Auth password reset functionality
4. **Audit Trail:** Log all critical actions with user ID and timestamp
5. **Role Changes:** Only SuperAdmin can modify roles
6. **Session Management:** Implement proper logout and session timeout

---

## Next Implementation Phase

To complete the RBAC system, implement in this order:

1. Update `authSlice.js` to handle all 4 roles
2. Create `ApprovalRequests.jsx` page
3. Update existing CRUD pages with PermissionGate
4. Add approval workflow UI
5. Implement email notifications
6. Add audit logging
7. Create admin dashboard
8. Write Firestore security rules
9. Add comprehensive testing

---

## Support

For questions or issues with RBAC implementation, refer to:
- `src/constants/roles.js` - Permission definitions
- `src/components/auth/PermissionGate.jsx` - Component usage
- `src/store/editRequestsSlice.js` - Edit request workflow
- This document - Complete RBAC guide
