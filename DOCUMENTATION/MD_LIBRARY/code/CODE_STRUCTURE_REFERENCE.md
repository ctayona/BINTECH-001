# ADMIN_ROUTES.html - Code Structure Reference

## File Organization

```
templates/ADMIN_ROUTES.html
├── HTML Head
│   ├── Meta tags
│   ├── Tailwind CSS
│   ├── Leaflet Map Library
│   ├── Google Fonts
│   └── Tailwind Config + Styles
├── HTML Body
│   ├── Sidebar Navigation
│   ├── Main Content Area
│   │   ├── Page Header
│   │   ├── Stats Cards (3)
│   │   ├── Bins Management Section
│   │   │   ├── Header with Add Bin Button
│   │   │   └── Bins Table
│   │   └── Bin Location Map
│   ├── Add Bin Modal (NEW)
│   ├── Add Route Modal
│   └── Script Section
│       ├── Map Functions
│       ├── Bins Management Functions (NEW)
│       └── Initialization
```

## Modal Structure

### Add Bin Modal HTML
```html
<div id="addBinModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
    <h3 class="text-xl font-bold text-forest mb-4">Add New Bin</h3>
    <form id="binForm" class="space-y-4">
      <!-- 6 form fields -->
      <!-- Cancel and Add Bin buttons -->
    </form>
  </div>
</div>
```

### Form Fields
1. **Bin Code** - text input, required
2. **Location** - text input, required
3. **Status** - select dropdown, required
4. **Capacity** - number input, required, min=1
5. **Filled %** - number input, required, min=0, max=100
6. **Last Maintenance** - datetime-local input, optional

## Bins Table Structure

```html
<table>
  <thead>
    <tr>
      <th>Bin Code</th>
      <th>Location</th>
      <th>Status</th>
      <th>Capacity</th>
      <th>Filled %</th>
      <th>Placed At</th>
      <th>Last Collected</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="binsTableBody">
    <!-- Populated by renderBinsTable() -->
  </tbody>
</table>
```

## JavaScript Functions

### 1. Modal Management

```javascript
function openAddBinModal() {
  // Show modal
  // Reset form
}

function closeAddBinModal() {
  // Hide modal
  // Clear form data
}
```

### 2. Bin Operations

```javascript
function saveBin() {
  // Get form values
  // Validate required fields
  // Check for duplicate codes
  // Create bin object
  // Add to bins array
  // Render table
  // Show notification
}

function deleteBinFromTable(binId) {
  // Find bin by ID
  // Remove from array
  // Re-render table
  // Show notification
}

function updateBinStatus(binId, newStatus) {
  // Find bin by ID
  // Update status
  // Update timestamp
  // Re-render table
  // Show notification
}
```

### 3. Data Rendering

```javascript
function renderBinsTable() {
  // Get table body element
  // If no bins: show empty state
  // Else: generate rows for each bin
  // Include status dropdown
  // Include fill percentage bar
  // Include delete button
  // Update stats card
}

function loadBins() {
  // Placeholder for API call
  // Currently just calls renderBinsTable()
}
```

### 4. Supporting Functions

```javascript
function showNotification(message, type) {
  // Create notification element
  // Add to DOM
  // Auto-dismiss after 3 seconds
}
```

## Data Structure

### Bins Array
```javascript
let bins = [];
```

### Bin Object
```javascript
{
  id: "1714761234567",           // Timestamp-based unique ID
  code: "BIN-0001",              // Unique bin code
  location: "Main Lobby - Zone A", // Physical location
  status: "active",              // 'active' | 'maintenance' | 'inactive'
  capacity: 100,                 // Liters
  filled_percentage: 50,         // 0-100
  last_maintenance_at: "2026-05-03T10:30:00Z", // ISO string or null
  created_at: "2026-05-03T10:00:00Z",  // ISO string
  updated_at: "2026-05-03T10:00:00Z"   // ISO string
}
```

## Event Handlers

### Button Click Events
```javascript
// Add Bin button
onclick="openAddBinModal()"

// Cancel button
onclick="closeAddBinModal()"

// Add Bin form button
onclick="saveBin()"

// Delete button in table
onclick="deleteBinFromTable('${bin.id}')"

// Status dropdown
onchange="updateBinStatus('${bin.id}', this.value)"
```

## CSS Classes Used

### Modal
- `hidden` - Hide/show modal
- `fixed inset-0` - Full screen overlay
- `bg-black/50` - Semi-transparent background
- `flex items-center justify-center` - Center modal
- `z-50` - High z-index

### Form
- `space-y-4` - Vertical spacing
- `w-full` - Full width
- `border border-gray-300` - Input border
- `rounded-lg` - Rounded corners
- `px-4 py-2` - Padding
- `focus:outline-none focus:border-teal` - Focus state

### Table
- `table-container` - Scrollable container
- `w-full` - Full width
- `border-collapse` - Collapse borders
- `hover:bg-#f8f5f0` - Row hover effect

### Buttons
- `btn-primary` - Primary button style
- `btn-secondary` - Secondary button style
- `flex-1` - Equal width in flex container

## Styling System

### Colors
- `forest` - #1a3a2f (dark green)
- `forestLight` - #2d5a47 (lighter green)
- `cream` - #f8f5f0 (off-white)
- `teal` - #3d8b7a (teal)
- `moss` - #6b9080 (moss green)

### Spacing
- `mb-4` - Margin bottom 1rem
- `mb-6` - Margin bottom 1.5rem
- `mb-8` - Margin bottom 2rem
- `px-4` - Padding horizontal 1rem
- `py-2` - Padding vertical 0.5rem

### Typography
- `text-xl` - 1.25rem
- `font-bold` - 700 weight
- `font-semibold` - 600 weight
- `text-forest` - Forest color
- `text-moss` - Moss color

## Integration Points

### HTML Elements Referenced
- `#addBinModal` - Modal container
- `#binForm` - Form element
- `#binCode` - Code input
- `#binLocation` - Location input
- `#binStatus` - Status select
- `#binCapacity` - Capacity input
- `#binFilledPercentage` - Fill % input
- `#binLastMaintenance` - Maintenance datetime
- `#binsTableBody` - Table body
- `#binsAssigned` - Stats card

### External Dependencies
- Tailwind CSS 3.4.17
- Leaflet 1.9.4 (Map library)
- Plus Jakarta Sans font
- auth-frontend-v2.js (Auth helpers)

## Validation Rules

```javascript
// Required fields
if (!code || !location || !capacity) {
  showNotification('Please fill in all required fields', 'error');
  return;
}

// Unique code
if (bins.some(b => b.code === code)) {
  showNotification('Bin code already exists', 'error');
  return;
}

// Capacity minimum
if (capacity < 1) {
  // Prevented by HTML min="1"
}

// Fill percentage range
if (filledPercentage < 0 || filledPercentage > 100) {
  // Prevented by HTML min="0" max="100"
}
```

## Performance Considerations

### Current Implementation
- In-memory storage (bins array)
- Suitable for up to 1000 bins
- O(n) search operations
- Full table re-render on changes

### Optimization Opportunities
- Implement pagination
- Use virtual scrolling
- Add indexing for searches
- Debounce re-renders
- Lazy load map markers

## Browser APIs Used

- `document.getElementById()` - DOM selection
- `document.querySelector()` - DOM selection
- `classList.add/remove()` - Class manipulation
- `innerHTML` - HTML generation
- `addEventListener()` - Event binding
- `Date.now()` - Timestamp generation
- `new Date()` - Date formatting
- `JSON.stringify()` - JSON serialization
- `Blob` - File creation
- `URL.createObjectURL()` - Object URL
- `navigator.clipboard.writeText()` - Clipboard API

## Error Handling

### Current Implementation
- Form validation
- Duplicate code checking
- Notification system
- Try-catch ready for API calls

### Future Enhancements
- Network error handling
- Retry logic
- Timeout handling
- Fallback UI states

---

**Document Version**: 1.0
**Last Updated**: May 3, 2026
**Status**: Complete Reference
