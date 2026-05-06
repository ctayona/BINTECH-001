# Backend API Implementation Guide for Bin Management

## Overview
The frontend is now fully database-driven and production-ready. This guide shows what backend API endpoints need to be implemented.

## Required API Endpoints

### 1. GET /api/bins
**Purpose:** Load all bins from database on page load

**Request:**
```
GET /api/bins
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "BIN-0001",
    "location": "Main Lobby - Zone A",
    "latitude": 14.562568,
    "longitude": 121.055909,
    "status": "active",
    "capacity": 100,
    "filled_percentage": 45.5,
    "last_collected_at": "2026-05-02T10:30:00Z",
    "last_maintenance_at": "2026-04-28T14:20:00Z",
    "created_at": "2026-04-20T08:15:00Z",
    "updated_at": "2026-05-02T10:30:00Z",
    "created_by": "admin-uuid",
    "zone_id": null,
    "cleared_at": null
  }
]
```

**Error Response (500):**
```json
{
  "error": "Failed to load bins"
}
```

---

### 2. POST /api/bins
**Purpose:** Create a new bin

**Request:**
```json
{
  "code": "BIN-0002",
  "location": "Corridor B - Zone 2",
  "latitude": 14.5650,
  "longitude": 121.0560,
  "status": "active",
  "capacity": 120,
  "filled_percentage": 0,
  "last_maintenance_at": "2026-05-03T09:00:00Z",
  "zone_id": null
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "code": "BIN-0002",
  "location": "Corridor B - Zone 2",
  "latitude": 14.5650,
  "longitude": 121.0560,
  "status": "active",
  "capacity": 120,
  "filled_percentage": 0,
  "last_collected_at": null,
  "last_maintenance_at": "2026-05-03T09:00:00Z",
  "created_at": "2026-05-03T10:15:00Z",
  "updated_at": "2026-05-03T10:15:00Z",
  "created_by": "admin-uuid",
  "zone_id": null,
  "cleared_at": null
}
```

**Validation:**
- `code` must be unique (check for duplicates)
- `code` is required
- `location` is required
- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180
- `status` must be one of: active, maintenance, inactive
- `capacity` must be > 0

**Error Response (400):**
```json
{
  "error": "Bin code already exists"
}
```

---

### 3. PUT /api/bins/:id
**Purpose:** Update bin status (or other fields)

**Request:**
```json
{
  "status": "maintenance"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "BIN-0001",
  "location": "Main Lobby - Zone A",
  "latitude": 14.562568,
  "longitude": 121.055909,
  "status": "maintenance",
  "capacity": 100,
  "filled_percentage": 45.5,
  "last_collected_at": "2026-05-02T10:30:00Z",
  "last_maintenance_at": "2026-04-28T14:20:00Z",
  "created_at": "2026-04-20T08:15:00Z",
  "updated_at": "2026-05-03T10:20:00Z",
  "created_by": "admin-uuid",
  "zone_id": null,
  "cleared_at": null
}
```

**Validation:**
- `status` must be one of: active, maintenance, inactive
- Update `updated_at` timestamp

**Error Response (404):**
```json
{
  "error": "Bin not found"
}
```

---

### 4. DELETE /api/bins/:id
**Purpose:** Delete a bin

**Request:**
```
DELETE /api/bins/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bin deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Bin not found"
}
```

---

## Database Schema

Use this PostgreSQL schema:

```sql
CREATE TABLE public.bins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'active'::text,
  capacity integer NOT NULL DEFAULT 100,
  filled_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  last_collected_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cleared_at timestamp with time zone,
  zone_id uuid,
  last_maintenance_at timestamp with time zone,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  
  CONSTRAINT bins_pkey PRIMARY KEY (id),
  CONSTRAINT bins_code_key UNIQUE (code),
  CONSTRAINT bins_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES admin_accounts (id) ON DELETE SET NULL,
  CONSTRAINT bins_status_check CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'inactive'::text]))
);

-- Indexes
CREATE INDEX idx_bins_code ON public.bins USING btree (code);
CREATE INDEX idx_bins_status ON public.bins USING btree (status);
CREATE INDEX idx_bins_location ON public.bins USING btree (latitude, longitude);
CREATE INDEX idx_bins_zone_id ON public.bins USING btree (zone_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_bins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bins_updated_at
BEFORE UPDATE ON bins
FOR EACH ROW
EXECUTE FUNCTION set_bins_updated_at();
```

---

## Frontend Integration Points

### When bins are loaded:
```javascript
// Frontend calls:
const response = await fetch('/api/bins');
const bins = await response.json();
// Then renders table + map markers
```

### When a new bin is created:
```javascript
// Frontend calls:
const response = await fetch('/api/bins', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newBin)
});
const savedBin = await response.json();
// Then adds marker to map + updates table
```

### When bin status changes:
```javascript
// Frontend calls:
const response = await fetch(`/api/bins/${binId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: newStatus })
});
// Then updates marker color + table
```

### When a bin is deleted:
```javascript
// Frontend calls:
const response = await fetch(`/api/bins/${binId}`, {
  method: 'DELETE'
});
// Then removes marker from map + updates table
```

---

## Implementation Checklist

- [ ] Create PostgreSQL bins table with schema above
- [ ] Implement GET /api/bins endpoint
- [ ] Implement POST /api/bins endpoint with validation
- [ ] Implement PUT /api/bins/:id endpoint
- [ ] Implement DELETE /api/bins/:id endpoint
- [ ] Add error handling for all endpoints
- [ ] Add authentication/authorization checks
- [ ] Test with frontend
- [ ] Add logging for debugging
- [ ] Add rate limiting if needed

---

## Testing the Integration

1. **Load page** → Should fetch bins from GET /api/bins
2. **Click map** → Should show confirmation modal
3. **Confirm location** → Should open Add Bin form
4. **Fill form and save** → Should POST to /api/bins
5. **Verify marker appears** → Should render on map immediately
6. **Change status** → Should PUT to /api/bins/:id
7. **Verify marker color changes** → Should update immediately
8. **Delete bin** → Should DELETE from /api/bins/:id
9. **Verify marker removed** → Should remove from map immediately

---

## Error Handling

Frontend expects:
- **2xx responses** = Success (parse JSON response)
- **4xx/5xx responses** = Error (show notification to user)

All errors are caught and displayed as notifications:
```javascript
showNotification('Error message here', 'error');
```

---

## Notes

- All timestamps should be ISO 8601 format (e.g., "2026-05-03T10:15:00Z")
- Latitude/Longitude should be numeric with 6+ decimal places for accuracy
- Status values are case-sensitive: "active", "maintenance", "inactive"
- Bin codes should be unique and human-readable (e.g., "BIN-0001")
- The `created_by` field should be set to the current admin's UUID
