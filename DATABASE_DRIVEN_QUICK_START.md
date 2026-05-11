# Database-Driven Bin System - Quick Start

## 🚀 Quick Overview

The bin management system now follows a **strict UX flow**:

```
1. User clicks map
   ↓
2. Confirmation modal appears
   ↓
3. User confirms location
   ↓
4. Add Bin modal opens (coordinates auto-filled)
   ↓
5. User fills details
   ↓
6. Save to database
   ↓
7. Marker appears on map
   ↓
8. Table updates
```

---

## 🗄️ Database Setup

### Create Bins Table
```sql
CREATE TABLE public.bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  location text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  status text NOT NULL DEFAULT 'active',
  capacity integer NOT NULL DEFAULT 100,
  filled_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  last_collected_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cleared_at timestamp with time zone,
  zone_id uuid,
  last_maintenance_at timestamp with time zone,
  CONSTRAINT bins_status_check CHECK (status = ANY(ARRAY['active', 'maintenance', 'inactive']))
);

-- Indexes
CREATE INDEX idx_bins_code ON public.bins USING btree (code);
CREATE INDEX idx_bins_status ON public.bins USING btree (status);
CREATE INDEX idx_bins_location ON public.bins USING btree (latitude, longitude);
CREATE INDEX idx_bins_zone_id ON public.bins USING btree (zone_id);
```

---

## 🔌 API Endpoints

### 1. GET /api/bins
Load all bins on page load

**Response**:
```json
[
  {
    "id": "uuid",
    "code": "BIN-0001",
    "location": "Main Lobby",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "status": "active",
    "capacity": 100,
    "filled_percentage": 50,
    "created_at": "2026-05-03T10:00:00Z",
    "updated_at": "2026-05-03T10:00:00Z"
  }
]
```

### 2. POST /api/bins
Create new bin

**Request**:
```json
{
  "code": "BIN-0001",
  "location": "Main Lobby",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "status": "active",
  "capacity": 100,
  "filled_percentage": 50
}
```

### 3. PUT /api/bins/:id
Update bin status

**Request**:
```json
{
  "status": "maintenance"
}
```

### 4. DELETE /api/bins/:id
Delete bin

---

## 🎯 UX Flow Details

### Step 1: Map Click
```javascript
// User clicks on map
map.on('click', function(e) {
  showLocationConfirmation(e.latlng.lat, e.latlng.lng);
});
```

### Step 2: Confirmation
```javascript
// Modal shows coordinates
// User clicks "Confirm & Continue"
confirmLocation()
// Opens Add Bin modal with auto-filled coordinates
```

### Step 3: Form Fill
```javascript
// User enters:
// - Bin Code (required, unique)
// - Location (required)
// - Status (required)
// - Capacity (required)
// - Filled % (required)
// - Last Maintenance (optional)
```

### Step 4: Save
```javascript
async saveBin() {
  // Validate
  // POST to /api/bins
  // Get response with ID
  // Update UI
}
```

---

## 🗺️ Map Features

### Marker Colors
- **Active**: Green
- **Maintenance**: Yellow
- **Inactive**: Red

### Marker Popup
- Bin code
- Location
- Coordinates
- Status
- Fill %
- Capacity
- Copy/Delete buttons

### Map Controls
- **Export**: Download bins as JSON
- **Satellite**: Toggle map view
- **Clear All**: Remove all markers

---

## 📊 Stats Cards

| Card | Shows |
|------|-------|
| Total Bins | All bins |
| Active Bins | Status = active |
| Maintenance Bins | Status = maintenance |
| Inactive Bins | Status = inactive |

---

## ✅ Validation

### Required Fields
- Bin Code (unique)
- Location
- Latitude (-90 to 90)
- Longitude (-180 to 180)
- Status
- Capacity (≥1)
- Filled % (0-100)

### Errors
- Duplicate code
- Invalid coordinates
- Missing required fields
- Database errors

---

## 🔄 Real-Time Updates

### When You Add a Bin
1. ✅ Table row added
2. ✅ Marker appears on map
3. ✅ Stats updated
4. ✅ Success notification

### When You Change Status
1. ✅ Table dropdown updated
2. ✅ Marker color changes
3. ✅ Stats updated
4. ✅ Success notification

### When You Delete a Bin
1. ✅ Table row removed
2. ✅ Marker removed
3. ✅ Stats updated
4. ✅ Success notification

---

## 🚀 Implementation Steps

### Step 1: Database
```bash
# Run SQL schema
psql -U postgres -d bintech < bins_schema.sql
```

### Step 2: Backend API
```javascript
// Implement endpoints
GET /api/bins
POST /api/bins
PUT /api/bins/:id
DELETE /api/bins/:id
```

### Step 3: Frontend
```bash
# Deploy updated ADMIN_ROUTES.html
# No changes needed - already implemented
```

### Step 4: Test
```
1. Click map
2. Confirm location
3. Fill form
4. Save bin
5. Verify marker appears
6. Verify table updates
7. Verify stats update
```

---

## 🎨 Key Features

✅ Strict UX flow (click → confirm → fill → save)
✅ Database-driven (all data from PostgreSQL)
✅ No fake markers (only from database)
✅ Real-time sync (table ↔ map)
✅ Status-based colors (visual indicators)
✅ Readonly coordinates (auto-filled)
✅ Full validation (client + server)
✅ Error handling (user notifications)
✅ Responsive design (mobile-friendly)
✅ Production ready (scalable)

---

## 📝 Example Workflow

### Adding a Bin

1. **Click map** at "Main Lobby"
   - Coordinates: 14.5995, 120.9842

2. **Confirmation modal** appears
   - Shows coordinates
   - Click "Confirm & Continue"

3. **Add Bin modal** opens
   - Latitude: 14.5995 (auto-filled, readonly)
   - Longitude: 120.9842 (auto-filled, readonly)
   - Bin Code: BIN-0001
   - Location: Main Lobby - Zone A
   - Status: Active
   - Capacity: 100
   - Filled %: 50

4. **Click "Save Bin"**
   - Validates all fields
   - POSTs to /api/bins
   - Database saves bin
   - Response includes ID

5. **UI Updates**
   - Table row added
   - Green marker appears on map
   - Stats: Total Bins +1, Active Bins +1
   - Success notification

---

## 🔧 Troubleshooting

### Markers not appearing?
- Check coordinates are valid
- Verify bins loaded from database
- Check browser console

### Form not opening?
- Ensure confirmation modal closed
- Check pendingLocation is set
- Verify modal HTML present

### Database save fails?
- Check API endpoint
- Verify authentication
- Check request format
- Review server logs

---

## 📚 Files

- `templates/ADMIN_ROUTES.html` - Main implementation
- `DATABASE_DRIVEN_BIN_SYSTEM_GUIDE.md` - Complete guide
- `DATABASE_DRIVEN_QUICK_START.md` - This file

---

## ✨ Status

✅ **Frontend**: Complete
⏳ **Backend**: Needs implementation
⏳ **Database**: Needs setup
⏳ **Testing**: Pending

---

**Version**: 3.0.0
**Status**: Frontend Ready
**Date**: May 3, 2026
