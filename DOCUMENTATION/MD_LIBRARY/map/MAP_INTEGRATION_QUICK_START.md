# Map Integration - Quick Start Guide

## What's New

✨ **Bins now have latitude and longitude coordinates for map placement!**

## Quick Setup

### 1. Update Database
Run this SQL to add coordinates to bins table:
```sql
ALTER TABLE public.bins ADD COLUMN latitude numeric(10, 8) NULL;
ALTER TABLE public.bins ADD COLUMN longitude numeric(11, 8) NULL;
CREATE INDEX idx_bins_location ON public.bins USING btree (latitude, longitude);
```

### 2. Update Frontend
The ADMIN_ROUTES.html is already updated with:
- Latitude/Longitude input fields in Add Bin modal
- Map integration for auto-filling coordinates
- Marker display on map
- Coordinate display in table

## How to Use

### Adding a Bin with Map

**Step 1**: Click "Add Bin" button
- Modal opens
- Map click mode enabled

**Step 2**: Click on map where you want the bin
- Coordinates auto-fill
- Notification confirms

**Step 3**: Fill in other details
- Bin Code
- Location description
- Status
- Capacity
- Filled %

**Step 4**: Click "Add Bin"
- Bin saved with coordinates
- Marker appears on map
- Table updates

### Viewing Bins on Map

- **Markers**: Each bin shows as a pin (📍)
- **Click Marker**: See bin details in popup
- **Popup Actions**: Copy coordinates or Delete bin

### Changing Bin Location

1. Delete the bin
2. Add new bin with correct coordinates

## Coordinate Format

### WGS84 (GPS Standard)
- **Latitude**: -90 to 90 (North-South)
- **Longitude**: -180 to 180 (East-West)
- **Precision**: 6 decimal places = ~0.1m accuracy

### Example Coordinates
```
Manila:     14.5995, 120.9842
New York:   40.7128, -74.0060
London:     51.5074, -0.1278
Tokyo:      35.6762, 139.6503
```

## Database Schema

### New Fields
```sql
latitude numeric(10, 8) NULL      -- WGS84 latitude
longitude numeric(11, 8) NULL     -- WGS84 longitude
```

### Full Bins Table
```sql
CREATE TABLE public.bins (
  id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  location text,
  latitude numeric(10, 8),        -- NEW
  longitude numeric(11, 8),       -- NEW
  status text DEFAULT 'active',
  capacity integer DEFAULT 100,
  filled_percentage numeric(5, 2) DEFAULT 0,
  last_collected_at timestamp,
  created_by uuid,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  cleared_at timestamp,
  zone_id uuid,
  last_maintenance_at timestamp
);
```

## API Integration

### Bin Object with Coordinates
```json
{
  "code": "BIN-0001",
  "location": "Main Lobby - Zone A",
  "latitude": 14.599500,
  "longitude": 120.984200,
  "status": "active",
  "capacity": 100,
  "filled_percentage": 50,
  "last_maintenance_at": "2026-05-03T10:30:00Z"
}
```

### Backend Endpoints
```
GET    /api/bins              -- Get all bins with coordinates
POST   /api/bins              -- Create bin with lat/lng
PUT    /api/bins/:id          -- Update bin coordinates
DELETE /api/bins/:id          -- Delete bin
```

## Features

✅ Click map to set coordinates
✅ Auto-fill latitude/longitude
✅ Validate coordinate ranges
✅ Display markers on map
✅ Show coordinates in table
✅ Marker popups with details
✅ Status-based marker styling
✅ Export bins with coordinates
✅ Delete bins from map
✅ Real-time map updates

## Validation

### Coordinate Ranges
- Latitude: -90 to 90
- Longitude: -180 to 180

### Required Fields
- Bin Code (unique)
- Location
- Latitude
- Longitude
- Status
- Capacity (≥1)
- Filled % (0-100)

## Troubleshooting

### Coordinates not filling?
- Make sure modal is open
- Click on map area
- Check browser console

### Marker not showing?
- Verify coordinates are valid
- Check map is centered on location
- Refresh page

### Invalid coordinates error?
- Latitude must be -90 to 90
- Longitude must be -180 to 180
- Use decimal format (e.g., 14.5995)

## Tips

1. **Use 6 decimal places** for ~0.1m accuracy
2. **Include zone info** in location (e.g., "Zone A")
3. **Use consistent naming** (e.g., BIN-0001)
4. **Update regularly** for accurate tracking
5. **Export periodically** for backup

## Map Controls

| Button | Action |
|--------|--------|
| Export | Download bin locations as JSON |
| Satellite | Toggle map/satellite view |
| Clear All | Remove all markers |

## Keyboard Shortcuts

- **Escape**: Close modal (when implemented)
- **Enter**: Submit form (when implemented)

## Browser Support

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (needs polyfills)

## Performance

- Suitable for up to 1000 bins
- Consider clustering for larger datasets
- Each marker uses ~1KB memory

## Security

- ✅ Coordinate validation
- ✅ Input validation
- ✅ Unique code enforcement
- ⏳ Add CSRF protection for API

## Next Steps

1. Run SQL schema update
2. Test with sample bins
3. Connect to backend API
4. Deploy to production
5. Monitor performance

## Support

For issues or questions:
1. Check browser console for errors
2. Verify coordinates are valid
3. Ensure database schema is updated
4. Check API endpoints are working

---

**Version**: 2.0.0
**Last Updated**: May 3, 2026
**Status**: Ready to Use
