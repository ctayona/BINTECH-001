# ADMIN_ROUTES - Bins Management Quick Reference

## How to Use

### Adding a Bin
1. Click the **"Add Bin"** button in the Bins Management section
2. Fill in the required fields:
   - **Bin Code**: Unique identifier (e.g., BIN-0001)
   - **Location**: Physical location (e.g., Main Lobby - Zone A)
   - **Status**: Select from Active, Maintenance, or Inactive
   - **Capacity**: Bin size in liters
   - **Filled %**: Current fill level (0-100)
3. Optionally set the **Last Maintenance** date
4. Click **"Add Bin"** to save

### Managing Bins
- **Change Status**: Use the dropdown in the Status column to change bin status
- **Delete Bin**: Click the "Delete" button in the Actions column
- **View Details**: All bin information is displayed in the table

### Map Features
- **Place Markers**: Click on the map to place bin location markers
- **View Coordinates**: Hover over the map to see current latitude/longitude
- **Copy Coordinates**: Click "Copy" in the marker popup to copy coordinates
- **Delete Marker**: Click "Delete" in the marker popup to remove marker
- **Toggle View**: Click "Satellite" to switch between map and satellite view
- **Export Locations**: Click "Export" to download bin locations as JSON
- **Clear All**: Click "Clear All" to remove all markers (with confirmation)

## Bins Table Columns

| Column | Description |
|--------|-------------|
| Bin Code | Unique identifier for the bin |
| Location | Physical location description |
| Status | Current status (Active/Maintenance/Inactive) |
| Capacity | Total capacity in liters |
| Filled % | Current fill percentage with visual bar |
| Placed At | Date bin was created |
| Last Collected | Date of last collection or "Never" |
| Actions | Delete button |

## Stats Cards

- **Total Routes**: Number of collection routes
- **Active Routes**: Number of active routes
- **Bins Assigned**: Total number of bins in the system

## Validation Rules

✓ Bin Code is required and must be unique
✓ Location is required
✓ Capacity must be at least 1 liter
✓ Filled % must be between 0-100
✓ Status must be selected

## Notifications

- ✅ **Success**: Green notification when bin is added/updated/deleted
- ❌ **Error**: Red notification for validation failures or duplicate codes

## Data Persistence

Currently, bins are stored in browser memory. To persist data:
1. Connect to backend API endpoints
2. Modify `saveBin()` to POST to `/api/bins`
3. Modify `loadBins()` to GET from `/api/bins`
4. Modify `deleteBinFromTable()` to DELETE from `/api/bins/:id`
5. Modify `updateBinStatus()` to PUT to `/api/bins/:id`

## Keyboard Shortcuts

- **Escape**: Close modal (when implemented)
- **Enter**: Submit form (when implemented)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ⚠️ Requires polyfills

## Tips

1. Use consistent bin code naming (e.g., BIN-0001, BIN-0002)
2. Include zone information in location (e.g., "Zone A", "Zone B")
3. Update fill percentage regularly for accurate tracking
4. Mark bins as "Maintenance" when they need service
5. Export bin locations periodically for backup
