# COR Preview Implementation - Technical Details

## Summary of Changes

### Files Modified
- `templates/ADMIN_ACCOUNTS.html`

### Lines Changed
- Added COR image preview modal (lines 590-600)
- Added `renderCorView()` function (lines 1117-1135)
- Added `openCorImagePreview()` function (lines 1136-1157)
- Added `closeCorImagePreview()` function (lines 1159-1163)
- Updated `renderViewAccountContent()` to use `renderCorView()` (line 1184)

---

## Function Documentation

### `renderCorView(corUrl)`

**Purpose**: Renders the COR display with thumbnail and preview capability.

**Parameters**:
- `corUrl` (string): The COR URL or text value

**Returns**: HTML string

**Logic**:
1. If `corUrl` is empty/null → return "—"
2. If `corUrl` is not a URL → return escaped plain text
3. If `corUrl` is a URL → return interactive thumbnail + "View Full" link

**Example Usage**:
```javascript
${renderCorView(account.cor)}
```

**Output Examples**:

Empty COR:
```html
<p class="text-forest text-sm">—</p>
```

Plain text COR:
```html
<p class="text-forest text-sm">Student COR on file</p>
```

URL COR:
```html
<div class="flex items-center gap-3">
  <img src="https://..." alt="COR" class="w-20 h-20 rounded border border-creamDark object-cover cursor-pointer hover:opacity-80 transition" onclick="openCorImagePreview('https://...')" title="Click to preview full image">
  <div>
    <p class="text-xs text-moss mb-1">Certificate of Registration</p>
    <a href="https://..." target="_blank" class="text-teal hover:text-tealMuted text-sm font-medium inline-flex items-center gap-1">
      View Full
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
    </a>
  </div>
</div>
```

---

### `openCorImagePreview(imageUrl)`

**Purpose**: Opens the COR image preview modal with the specified image.

**Parameters**:
- `imageUrl` (string): The URL of the COR image to preview

**Returns**: void

**Logic**:
1. Get the modal element by ID
2. Get the image element by ID
3. Set the image source (escaped)
4. Remove 'hidden' class to show modal
5. Add event listeners for:
   - Escape key press
   - Background click

**Example Usage**:
```javascript
openCorImagePreview('https://example.com/cor.jpg')
```

**Event Listeners**:
- `keydown` event: Closes modal on Escape key
- `click` event: Closes modal when clicking outside image

---

### `closeCorImagePreview()`

**Purpose**: Closes the COR image preview modal.

**Parameters**: None

**Returns**: void

**Logic**:
1. Get the modal element by ID
2. Add 'hidden' class to hide modal

**Example Usage**:
```javascript
closeCorImagePreview()
```

---

## HTML Structure

### COR Image Preview Modal

```html
<!-- COR Image Preview Modal -->
<div id="corImagePreviewModal" class="hidden fixed inset-0 bg-black/75 flex items-center justify-center z-[70] p-4">
  <div class="relative max-w-4xl w-full">
    <!-- Close Button -->
    <button onclick="closeCorImagePreview()" class="absolute -top-10 right-0 text-white hover:text-gray-300 transition">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
    
    <!-- Image -->
    <img id="corImagePreviewContent" src="" alt="COR Preview" class="w-full h-auto rounded-lg max-h-[80vh] object-contain">
  </div>
</div>
```

**CSS Classes Breakdown**:
- `hidden`: Initially hidden
- `fixed`: Fixed positioning (full screen)
- `inset-0`: Covers entire viewport
- `bg-black/75`: Dark overlay (75% opacity)
- `flex items-center justify-center`: Centers content
- `z-[70]`: High z-index (above other modals)
- `p-4`: Padding on mobile
- `relative`: For absolute positioning of close button
- `max-w-4xl`: Max width constraint
- `w-full`: Full width of container
- `rounded-lg`: Rounded corners
- `max-h-[80vh]`: Max height (80% of viewport)
- `object-contain`: Maintains aspect ratio

---

## CSS Styling

### Tailwind Classes Used

| Class | Purpose |
|-------|---------|
| `hidden` | Hide/show modal |
| `fixed` | Fixed positioning |
| `inset-0` | Full screen coverage |
| `bg-black/75` | Dark overlay |
| `flex` | Flexbox layout |
| `items-center` | Vertical centering |
| `justify-center` | Horizontal centering |
| `z-[70]` | Z-index layering |
| `p-4` | Padding |
| `relative` | Relative positioning |
| `absolute` | Absolute positioning |
| `-top-10` | Position close button |
| `right-0` | Align to right |
| `text-white` | White text |
| `hover:text-gray-300` | Hover effect |
| `transition` | Smooth transition |
| `w-8 h-8` | Icon size |
| `max-w-4xl` | Max width |
| `w-full` | Full width |
| `h-auto` | Auto height |
| `rounded-lg` | Rounded corners |
| `max-h-[80vh]` | Max height |
| `object-contain` | Image scaling |

---

## Data Flow

### View Account Modal → COR Preview

```
User clicks "View" button
         ↓
viewAccount(email, type) called
         ↓
fetchAccountDetails(email, type) called
         ↓
Account data fetched from API
         ↓
renderViewAccountContent(account) called
         ↓
renderCorView(account.cor) called
         ↓
COR HTML rendered in modal
         ↓
User sees COR thumbnail (if URL)
         ↓
User clicks thumbnail
         ↓
openCorImagePreview(imageUrl) called
         ↓
Modal shown with full image
         ↓
User closes modal (X, Escape, or click background)
         ↓
closeCorImagePreview() called
         ↓
Modal hidden
```

---

## Testing Instructions

### Manual Testing

#### Test 1: View Student Account with COR URL
1. Go to Account Management page
2. Click "View" on a student account with COR URL
3. Verify COR displays as thumbnail + "View Full" link
4. Click thumbnail
5. Verify full image preview opens
6. Click X button
7. Verify modal closes

#### Test 2: View Student Account without COR
1. Go to Account Management page
2. Click "View" on a student account without COR
3. Verify COR displays as "—"

#### Test 3: View Student Account with Plain Text COR
1. Go to Account Management page
2. Click "View" on a student account with plain text COR
3. Verify COR displays as plain text

#### Test 4: Close Preview Modal - Escape Key
1. Open COR preview modal
2. Press Escape key
3. Verify modal closes

#### Test 5: Close Preview Modal - Background Click
1. Open COR preview modal
2. Click on dark background
3. Verify modal closes

#### Test 6: Close Preview Modal - X Button
1. Open COR preview modal
2. Click X button
3. Verify modal closes

#### Test 7: View Full Link
1. Open COR preview modal
2. Click "View Full" link
3. Verify image opens in new tab

#### Test 8: Responsive Design - Mobile
1. Open Account Management on mobile device
2. Click "View" on student account
3. Verify COR card displays properly
4. Click thumbnail
5. Verify preview modal displays full screen
6. Verify close button is accessible

#### Test 9: Responsive Design - Tablet
1. Open Account Management on tablet
2. Click "View" on student account
3. Verify COR card displays properly
4. Click thumbnail
5. Verify preview modal displays with proper sizing

#### Test 10: Faculty Account (No COR)
1. Go to Account Management page
2. Click "View" on a faculty account
3. Verify COR field is not displayed
4. Verify other role-specific fields display correctly

#### Test 11: Other Account (No COR)
1. Go to Account Management page
2. Click "View" on an "other" account
3. Verify COR field is not displayed
4. Verify other role-specific fields display correctly

#### Test 12: Admin Account (No COR)
1. Go to Account Management page
2. Switch to "Admins" tab
3. Click "View" on an admin account
4. Verify COR field is not displayed
5. Verify admin-specific fields display correctly

---

## Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile (Android)

### Tablet Browsers
- [ ] Chrome Tablet (Android)
- [ ] Safari Tablet (iOS)

---

## Performance Testing

### Metrics to Monitor
- Modal open time: < 100ms
- Image load time: < 500ms
- Modal close time: < 50ms
- Memory usage: No leaks after 10 open/close cycles

### Tools
- Chrome DevTools Performance tab
- Firefox Developer Tools
- Safari Web Inspector

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Escape key closes modal
- [ ] Enter key activates buttons
- [ ] Focus visible on all elements

### Screen Reader Testing
- [ ] Alt text on images
- [ ] Proper heading hierarchy
- [ ] Form labels associated with inputs
- [ ] ARIA labels where needed

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Hover states have sufficient contrast
- [ ] Modal overlay has sufficient contrast

---

## Security Testing

### XSS Prevention
- [ ] Test with malicious URLs in COR field
- [ ] Verify `escapeAttr()` is applied
- [ ] Test with special characters in URLs

### URL Validation
- [ ] Test with invalid URLs
- [ ] Test with relative URLs
- [ ] Test with data URLs
- [ ] Test with javascript: URLs

### Content Security Policy
- [ ] Verify no inline scripts
- [ ] Verify no eval() usage
- [ ] Verify proper CSP headers

---

## Regression Testing

### Existing Features
- [ ] View account modal still works
- [ ] Edit account modal still works
- [ ] Add account modal still works
- [ ] Delete account still works
- [ ] Points management still works
- [ ] Table rendering still works
- [ ] Search functionality still works
- [ ] Filtering still works
- [ ] Sorting still works

### Other Modals
- [ ] Notification card still works
- [ ] Delete confirmation modal still works
- [ ] Convert confirmation modal still works
- [ ] Manage points modal still works

---

## Known Limitations

1. **Image Size**: Very large images may take time to load
   - Mitigation: Recommend max 5MB for COR uploads

2. **Image Format**: Only standard image formats supported
   - Supported: JPG, PNG, GIF, WebP
   - Not supported: SVG, PDF, TIFF

3. **Mobile Preview**: Very large images may exceed viewport
   - Mitigation: `max-h-[80vh]` constraint

4. **Slow Networks**: Image preview may be slow on slow connections
   - Mitigation: Show loading indicator (future enhancement)

---

## Future Enhancements

1. **Loading Indicator**: Show spinner while image loads
2. **Image Zoom**: Add zoom in/out functionality
3. **Image Rotation**: Add rotate functionality
4. **Download Button**: Allow downloading COR image
5. **Annotation**: Allow adding notes to COR
6. **Comparison**: Compare multiple COR images side-by-side
7. **OCR**: Extract text from COR image
8. **Validation**: Verify COR authenticity

---

## Troubleshooting

### Issue: Modal doesn't open
**Solution**: 
- Check browser console for errors
- Verify `corImagePreviewModal` element exists
- Verify `openCorImagePreview()` function is defined

### Issue: Image doesn't display
**Solution**:
- Check image URL is valid
- Check CORS headers on image server
- Check image format is supported
- Check image file size

### Issue: Close button doesn't work
**Solution**:
- Check `closeCorImagePreview()` function is defined
- Check onclick handler is correct
- Check z-index layering

### Issue: Escape key doesn't work
**Solution**:
- Check event listener is attached
- Check no other event listeners are preventing default
- Check modal is focused

### Issue: Background click doesn't work
**Solution**:
- Check event listener is attached
- Check event target is modal element
- Check z-index layering

---

**Last Updated**: April 30, 2026
**Version**: 1.0.0
**Status**: ✅ COMPLETE
