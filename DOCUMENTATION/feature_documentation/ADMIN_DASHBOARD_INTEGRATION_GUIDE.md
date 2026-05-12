# 🔗 Admin Dashboard Integration Guide

## Quick Integration (10 minutes)

### Step 1: Import Controller
```javascript
// In your main app.js or routes file
const adminDashboardController = require('./controllers/adminDashboardController');
```

### Step 2: Add Routes
```javascript
// Admin Dashboard Routes
app.get('/api/admin/stats', adminDashboardController.getAdminStats);
app.get('/api/admin/profile', adminDashboardController.getAdminProfile);
app.get('/api/admin/all-active', adminDashboardController.getAllActiveAdmins);
app.get('/api/admin/archived', adminDashboardController.getArchivedAdmins);
app.post('/api/admin/archive', adminDashboardController.archiveAdminAccount);
app.post('/api/admin/restore', adminDashboardController.restoreAdminAccount);
app.post('/api/admin/profile/update', adminDashboardController.updateAdminProfile);
```

### Step 3: Test Endpoints
```bash
# Test 1: Get admin stats
curl "http://localhost:3000/api/admin/stats?email=admin@example.com"

# Test 2: Get admin profile
curl "http://localhost:3000/api/admin/profile?email=admin@example.com"

# Test 3: Get all active admins
curl "http://localhost:3000/api/admin/all-active"
```

### Step 4: Verify
- ✅ All endpoints respond with 200 status
- ✅ Response format is correct
- ✅ No console errors
- ✅ Ranking calculation works

---

## Frontend Integration

### Display Admin Profile
```html
<div id="admin-profile">
  <h2 id="admin-name">Loading...</h2>
  <p id="admin-email">Loading...</p>
  <p id="admin-rank">Loading...</p>
  <p id="admin-status">Loading...</p>
</div>
```

### Fetch and Display
```javascript
async function loadAdminProfile() {
  try {
    const response = await fetch('/api/admin/profile?email=admin@example.com');
    const data = await response.json();

    if (data.success) {
      // Display admin info
      document.getElementById('admin-name').textContent = data.admin.fullName;
      document.getElementById('admin-email').textContent = data.admin.email;
      
      // Display rank
      if (data.rank.notRanked) {
        document.getElementById('admin-rank').textContent = data.rank.displayText;
      } else {
        document.getElementById('admin-rank').textContent = `Rank: ${data.rank.displayText}`;
      }
      
      // Display status
      document.getElementById('admin-status').textContent = 
        data.admin.isArchived ? 'Archived' : 'Active';
    }
  } catch (error) {
    console.error('Error loading admin profile:', error);
  }
}

// Call on page load
loadAdminProfile();
```

---

## Display Admin List

### HTML
```html
<table id="admin-list">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="admin-list-body">
    <!-- Populated by JavaScript -->
  </tbody>
</table>
```

### JavaScript
```javascript
async function loadAdminList() {
  try {
    const response = await fetch('/api/admin/all-active');
    const data = await response.json();

    if (data.success) {
      const tbody = document.getElementById('admin-list-body');
      tbody.innerHTML = '';

      data.admins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${admin.displayText}</td>
          <td>${admin.full_name}</td>
          <td>${admin.email}</td>
          <td>${admin.role}</td>
          <td>Active</td>
          <td>
            <button onclick="archiveAdmin('${admin.id}')">Archive</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading admin list:', error);
  }
}

loadAdminList();
```

---

## Archive Admin

### HTML
```html
<button onclick="showArchiveModal()">Archive Admin</button>

<div id="archive-modal" style="display: none;">
  <input type="text" id="archive-reason" placeholder="Archive reason">
  <button onclick="confirmArchive()">Confirm Archive</button>
  <button onclick="closeArchiveModal()">Cancel</button>
</div>
```

### JavaScript
```javascript
let adminToArchive = null;

function showArchiveModal(adminId) {
  adminToArchive = adminId;
  document.getElementById('archive-modal').style.display = 'block';
}

function closeArchiveModal() {
  document.getElementById('archive-modal').style.display = 'none';
}

async function confirmArchive() {
  const reason = document.getElementById('archive-reason').value;
  const currentUserEmail = getCurrentUserEmail(); // Your function

  try {
    const response = await fetch('/api/admin/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminIdToArchive: adminToArchive,
        archiveReason: reason,
        archivedByEmail: currentUserEmail
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('Admin archived successfully');
      closeArchiveModal();
      loadAdminList(); // Refresh list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error archiving admin:', error);
  }
}
```

---

## Restore Admin

### HTML
```html
<table id="archived-admin-list">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Archived At</th>
      <th>Reason</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="archived-admin-list-body">
    <!-- Populated by JavaScript -->
  </tbody>
</table>
```

### JavaScript
```javascript
async function loadArchivedAdmins() {
  try {
    const response = await fetch('/api/admin/archived');
    const data = await response.json();

    if (data.success) {
      const tbody = document.getElementById('archived-admin-list-body');
      tbody.innerHTML = '';

      data.archivedAdmins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${admin.full_name}</td>
          <td>${admin.email}</td>
          <td>${new Date(admin.archived_at).toLocaleDateString()}</td>
          <td>${admin.archive_reason}</td>
          <td>
            <button onclick="restoreAdmin('${admin.id}')">Restore</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading archived admins:', error);
  }
}

async function restoreAdmin(adminId) {
  const currentUserEmail = getCurrentUserEmail(); // Your function

  try {
    const response = await fetch('/api/admin/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminIdToRestore: adminId,
        restoredByEmail: currentUserEmail
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('Admin restored successfully');
      loadArchivedAdmins(); // Refresh list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error restoring admin:', error);
  }
}

loadArchivedAdmins();
```

---

## Update Admin Profile

### HTML
```html
<form id="admin-profile-form">
  <input type="text" id="full-name" placeholder="Full Name">
  <input type="text" id="first-name" placeholder="First Name">
  <input type="text" id="middle-name" placeholder="Middle Name">
  <input type="text" id="last-name" placeholder="Last Name">
  <input type="tel" id="phone" placeholder="Phone">
  <button type="submit">Update Profile</button>
</form>
```

### JavaScript
```javascript
document.getElementById('admin-profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const adminId = getCurrentAdminId(); // Your function

  try {
    const response = await fetch('/api/admin/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: adminId,
        fullName: document.getElementById('full-name').value,
        firstName: document.getElementById('first-name').value,
        middleName: document.getElementById('middle-name').value,
        lastName: document.getElementById('last-name').value,
        phone: document.getElementById('phone').value
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('Profile updated successfully');
      loadAdminProfile(); // Refresh profile
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  }
});
```

---

## Display Admin Rank

### Simple Display
```html
<div id="admin-rank-display">
  <p id="rank-text">Loading...</p>
  <p id="rank-tooltip" title="">Hover for details</p>
</div>
```

### JavaScript
```javascript
async function displayAdminRank() {
  try {
    const response = await fetch('/api/admin/profile?email=admin@example.com');
    const data = await response.json();

    if (data.success && data.rank) {
      const rankEl = document.getElementById('rank-text');
      const tooltipEl = document.getElementById('rank-tooltip');

      if (data.rank.notRanked) {
        rankEl.textContent = data.rank.displayText;
        tooltipEl.title = data.rank.message;
      } else {
        rankEl.textContent = `Rank: ${data.rank.displayText}`;
        tooltipEl.title = `You are in the top ${data.rank.percentile}% of admins`;
      }
    }
  } catch (error) {
    console.error('Error displaying rank:', error);
  }
}

displayAdminRank();
```

---

## Error Handling

### Handle API Errors
```javascript
async function fetchAdminData(endpoint) {
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('API Error:', data.message);
      showErrorMessage(data.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Fetch Error:', error);
    showErrorMessage('Failed to load data. Please try again.');
    return null;
  }
}

function showErrorMessage(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}
```

---

## Complete Example

### Full Admin Dashboard Page
```html
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    button { padding: 5px 10px; cursor: pointer; }
    .error { color: red; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Admin Dashboard</h1>
    
    <div class="error" id="error-message"></div>

    <!-- Admin Profile -->
    <div id="admin-profile">
      <h2 id="admin-name">Loading...</h2>
      <p id="admin-rank">Loading...</p>
      <p id="admin-status">Loading...</p>
    </div>

    <!-- Admin List -->
    <h2>Active Admins</h2>
    <table id="admin-list">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="admin-list-body"></tbody>
    </table>

    <!-- Archived Admins -->
    <h2>Archived Admins</h2>
    <table id="archived-admin-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Archived At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="archived-admin-list-body"></tbody>
    </table>
  </div>

  <script>
    // Load all data on page load
    async function initializeDashboard() {
      await loadAdminProfile();
      await loadAdminList();
      await loadArchivedAdmins();
    }

    // Call on page load
    window.addEventListener('load', initializeDashboard);
  </script>
</body>
</html>
```

---

## Testing Checklist

- [ ] All API endpoints respond
- [ ] Admin profile displays correctly
- [ ] Admin ranking shows correctly
- [ ] Admin list displays all active admins
- [ ] Archive functionality works
- [ ] Restore functionality works
- [ ] Update profile functionality works
- [ ] Error messages display correctly
- [ ] No console errors
- [ ] Responsive design works

---

## Troubleshooting

### Endpoint Returns 404
- Check route is added to Express app
- Verify controller is imported correctly
- Check URL spelling

### Admin Not Found
- Verify admin exists in database
- Check email/ID is correct
- Verify admin is not archived

### Ranking Not Showing
- Check admin is in database
- Verify admin is not archived
- Check database connection

### Archive Fails
- Verify admin ID is correct
- Check archived_by_email is provided
- Verify admin exists

---

## Performance Tips

1. **Cache Admin Data**
   - Cache admin list for 5 minutes
   - Invalidate on archive/restore

2. **Lazy Load**
   - Load archived admins only when needed
   - Load admin list on demand

3. **Pagination**
   - Add pagination for large admin lists
   - Load 10-20 admins per page

4. **Indexing**
   - Ensure database indexes exist
   - Check query performance

---

## Security Tips

1. **Authentication**
   - Verify user is authenticated
   - Check user has admin role

2. **Authorization**
   - Only admins can archive/restore
   - Only admins can update profiles

3. **Input Validation**
   - Validate all inputs
   - Sanitize email addresses

4. **Audit Trail**
   - Log all archive/restore operations
   - Track who archived/restored

---

## Status

✅ **Integration Ready**

- All endpoints documented
- Frontend examples provided
- Error handling included
- Testing checklist included

---

**Version:** 1.0.0  
**Last Updated:** May 5, 2026
