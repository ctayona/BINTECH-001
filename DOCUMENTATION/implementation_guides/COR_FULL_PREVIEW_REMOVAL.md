# COR Full Preview Section Removal

## What Was Removed

### HTML Section
Removed the entire COR full preview section from the edit modal:

```html
<!-- REMOVED -->
<div id="editCorFullPreviewSection" class="modal-section hidden">
  <h3 class="modal-section-title">Certificate of Registration (COR) - Full Preview</h3>
  <div id="editCorFullPreviewContent" class="space-y-4">
    <!-- COR preview will be rendered here -->
  </div>
</div>
```

**Location:** `templates/ADMIN_ACCOUNTS.html` (after COR file upload section)

### JavaScript Code
Removed the code that populated the full preview section from `populateEditModalFields()` function:

```javascript
// REMOVED
// Update COR full preview section
const corFullPreviewSection = document.getElementById('editCorFullPreviewSection');
const corFullPreviewContent = document.getElementById('editCorFullPreviewContent');
if (account.cor && corFullPreviewSection && corFullPreviewContent) {
  corFullPreviewContent.innerHTML = renderCorView(account.cor);
  corFullPreviewSection.classList.remove('hidden');
} else if (corFullPreviewSection) {
  corFullPreviewSection.classList.add('hidden');
}
```

**Location:** `templates/ADMIN_ACCOUNTS.html` (in `populateEditModalFields()` function)

---

## What Remains

✅ **COR File Upload Section** - Still present
- Upload COR button
- Remove COR button
- File name display
- Small preview in the upload section

✅ **COR Preview in View Modal** - Still present
- Shows COR thumbnail with preview link
- Displays in read-only format

✅ **COR Functions** - Still present
- `renderCorView()` - Renders COR display
- `openCorImagePreview()` - Opens full-screen preview
- `closeCorImagePreview()` - Closes preview
- `triggerEditCorFilePicker()` - Opens file picker
- `removeEditCorPhoto()` - Removes COR
- `handleEditCorFileSelected()` - Handles file upload

---

## Impact

### Removed
- ❌ Full preview section in edit modal
- ❌ Duplicate COR display in edit modal

### Kept
- ✅ COR file upload/remove functionality
- ✅ COR preview in upload section
- ✅ COR preview in view modal
- ✅ Full-screen COR preview (via click)
- ✅ All COR-related functions

---

## Result

The edit modal now has:
1. COR file upload/remove buttons
2. Small COR preview in the upload section
3. No duplicate full preview section

Users can still:
- Upload COR images
- Remove COR images
- Preview COR by clicking the thumbnail
- View COR in the view modal

---

## Verification

✅ HTML file is valid
✅ No syntax errors
✅ All remaining functions intact
✅ COR functionality preserved

---

**Status:** ✅ COMPLETE
**Date:** April 30, 2026
