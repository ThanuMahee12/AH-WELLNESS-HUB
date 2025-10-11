# Remaining Page Updates

The following pages still need to be updated to use the new Redux Thunk actions with Firebase:

## ✅ Already Updated
- **Login.jsx** - Using `loginUser` thunk
- **Users.jsx** - Using `fetchUsers`, `registerUser`, `updateUser`, `deleteUser` thunks
- **App.jsx** - Using Firebase auth state observer

## ⏳ Need Updates

### 1. Patients.jsx

**Current imports:**
```javascript
import { addPatient, updatePatient, deletePatient } from '../store/patientsSlice'
```

**Should be:**
```javascript
import { useState, useEffect } from 'react'
import { fetchPatients, addPatient, updatePatient, deletePatient } from '../store/patientsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
```

**Changes needed:**
1. Add `useEffect` to fetch patients on mount:
   ```javascript
   useEffect(() => {
     dispatch(fetchPatients())
   }, [dispatch])
   ```

2. Update selector to get loading and error:
   ```javascript
   const { patients, loading, error } = useSelector(state => state.patients)
   ```

3. Add loading spinner before return
4. Add error alert in render
5. Make submit handlers async

### 2. Tests.jsx

**Current imports:**
```javascript
import { addTest, updateTest, deleteTest } from '../store/testsSlice'
```

**Should be:**
```javascript
import { useState, useEffect } from 'react'
import { fetchTests, addTest, updateTest, deleteTest } from '../store/testsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
```

**Changes needed:**
1. Add `useEffect` to fetch tests on mount
2. Update selector to get loading and error
3. Add loading spinner
4. Add error alert
5. Make submit handlers async

### 3. Checkups.jsx

**Current imports:**
```javascript
import { addCheckup, updateCheckup, deleteCheckup } from '../store/checkupsSlice'
```

**Should be:**
```javascript
import { useState, useEffect } from 'react'
import { fetchCheckups, addCheckup, updateCheckup, deleteCheckup } from '../store/checkupsSlice'
import { fetchPatients } from '../store/patientsSlice'  // Need patient list
import { fetchTests } from '../store/testsSlice'  // Need test list
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
```

**Changes needed:**
1. Add `useEffect` to fetch checkups, patients, and tests
2. Update selectors
3. Add loading spinner
4. Add error alert
5. Make submit handlers async

## Quick Fix Pattern

For each page, follow this pattern:

### 1. Update imports
```javascript
import { useState, useEffect } from 'react'
import { fetch[Entity], add[Entity], update[Entity], delete[Entity] } from '../store/[entity]Slice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
```

### 2. Add useEffect
```javascript
useEffect(() => {
  dispatch(fetch[Entity]())
}, [dispatch])
```

### 3. Update selector
```javascript
const { [entities], loading, error } = useSelector(state => state.[entity])
```

### 4. Add loading check
```javascript
if (loading && [entities].length === 0) {
  return <LoadingSpinner text="Loading [entities]..." />
}
```

### 5. Add error display
```javascript
{error && (
  <Row className="mb-3">
    <Col>
      <ErrorAlert error={error} />
    </Col>
  </Row>
)}
```

### 6. Make handlers async
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()

  if (editing[Entity]) {
    await dispatch(update[Entity]({ id: editing[Entity].id, ...formData }))
  } else {
    await dispatch(add[Entity](formData))
  }
  handleClose()
}

const handleDelete = async (id) => {
  if (window.confirm('Are you sure?')) {
    await dispatch(delete[Entity](id))
  }
}
```

## Alternative: Let Me Update Them

If you'd like, I can update all three pages for you. Just let me know and I'll:
1. Update Patients.jsx
2. Update Tests.jsx
3. Update Checkups.jsx

All three will follow the same pattern as Users.jsx that's already been updated.

## Testing After Updates

After updating, test:
1. ✅ Page loads without errors
2. ✅ Data fetches from Firestore
3. ✅ Loading spinner shows
4. ✅ Can add new items
5. ✅ Can edit items
6. ✅ Can delete items
7. ✅ Errors display properly

## Current Status

- **Login**: ✅ Working
- **Users**: ✅ Working
- **App**: ✅ Working
- **Patients**: ⏳ Needs update
- **Tests**: ⏳ Needs update
- **Checkups**: ⏳ Needs update
- **Dashboard**: Should work (read-only)

Let me know if you want me to update the remaining pages!
