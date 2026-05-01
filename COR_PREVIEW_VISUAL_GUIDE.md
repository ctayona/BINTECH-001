# COR Preview Feature - Visual Guide

## Feature Overview

### 1. View Account Modal - Student Account

#### Before (Buggy)
```
┌─────────────────────────────────────────────────────────┐
│ Account Details                                      [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Avatar] John Doe                                       │
│          john@example.com                              │
│          Role: Student                                 │
│                                                         │
│ ┌──────────────┬──────────────┬──────────────┐         │
│ │ Email        │ Full Name    │ Role         │         │
│ │ john@...     │ John Doe     │ Student      │         │
│ ├──────────────┼──────────────┼──────────────┤         │
│ │ Campus ID    │ Student ID   │ Program      │         │
│ │ CS-2024      │ 2024-001     │ BS CS        │         │
│ ├──────────────┼──────────────┼──────────────┤         │
│ │ Year Level   │ COR          │ COR          │ ← DOUBLED!
│ │ 2nd Year     │ https://...  │ https://...  │         │
│ └──────────────┴──────────────┴──────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### After (Fixed)
```
┌─────────────────────────────────────────────────────────┐
│ Account Details                                      [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Avatar] John Doe                                       │
│          john@example.com                              │
│          Role: Student                                 │
│                                                         │
│ ┌──────────────┬──────────────┬──────────────┐         │
│ │ Email        │ Full Name    │ Role         │         │
│ │ john@...     │ John Doe     │ Student      │         │
│ ├──────────────┼──────────────┼──────────────┤         │
│ │ Campus ID    │ Student ID   │ Program      │         │
│ │ CS-2024      │ 2024-001     │ BS CS        │         │
│ ├──────────────┼──────────────┼──────────────┤         │
│ │ Year Level   │ Birthdate    │ Sex          │         │
│ │ 2nd Year     │ Jan 15, 2004 │ Male         │         │
│ └──────────────┴──────────────┴──────────────┘         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ COR (Certificate of Registration)                   │ │
│ │                                                     │ │
│ │ [Thumbnail]  Certificate of Registration           │ │
│ │ [20x20px]    View Full →                           │ │
│ │              (clickable)                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. COR Image Preview Modal

#### Interaction Flow

```
User clicks on COR thumbnail
         ↓
┌─────────────────────────────────────────────────────────┐
│                                                      [X] │
│                                                         │
│                    ┌─────────────────┐                 │
│                    │                 │                 │
│                    │   COR Image     │                 │
│                    │   (Full Size)   │                 │
│                    │                 │                 │
│                    │   Max Height:   │                 │
│                    │   80vh          │                 │
│                    │                 │                 │
│                    └─────────────────┘                 │
│                                                         │
│  Dark overlay (bg-black/75)                            │
└─────────────────────────────────────────────────────────┘

Close Methods:
1. Click [X] button (top-right)
2. Press Escape key
3. Click dark background
```

### 3. COR Display States

#### State 1: No COR
```
┌─────────────────────────────────────────────────────────┐
│ COR (Certificate of Registration)                       │
│                                                         │
│ —                                                       │
└─────────────────────────────────────────────────────────┘
```

#### State 2: COR as Plain Text (Non-URL)
```
┌─────────────────────────────────────────────────────────┐
│ COR (Certificate of Registration)                       │
│                                                         │
│ Student COR on file                                     │
└─────────────────────────────────────────────────────────┘
```

#### State 3: COR as Image URL (Interactive)
```
┌─────────────────────────────────────────────────────────┐
│ COR (Certificate of Registration)                       │
│                                                         │
│ [Thumbnail]  Certificate of Registration               │
│ [20x20px]    View Full →                               │
│ (hover:      (clickable)                               │
│  opacity-80)                                            │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### COR Thumbnail
- Size: 20x20px
- Border: 1px solid creamDark
- Rounded corners
- Hover effect: opacity-80
- Cursor: pointer
- Click action: Opens full preview

### "View Full" Link
- Color: teal (hover: tealMuted)
- Font: small, medium weight
- Icon: external link arrow
- Opens in new tab
- Fallback if thumbnail fails

### Preview Modal
- Overlay: black/75 opacity
- Image: max-height 80vh
- Object-fit: contain (no distortion)
- Z-index: 70 (above other modals)
- Responsive: works on mobile

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Close preview modal |
| Click X | Close preview modal |
| Click background | Close preview modal |

## Responsive Behavior

### Desktop (lg screens)
- COR card spans 3 columns (full width)
- Thumbnail: 20x20px
- Text: normal size
- Modal: max-width 4xl

### Tablet (md screens)
- COR card spans 2 columns
- Thumbnail: 20x20px
- Text: slightly smaller
- Modal: full width with padding

### Mobile (sm screens)
- COR card spans 1 column
- Thumbnail: 20x20px
- Text: small
- Modal: full screen with padding

## Accessibility Features

- Proper alt text on images
- Semantic HTML structure
- Keyboard navigation support
- Clear visual feedback on hover
- High contrast colors
- Proper z-index layering

## Performance Optimizations

- Images lazy-loaded (only when preview opened)
- Minimal DOM manipulation
- Event listeners properly cleaned up
- No memory leaks
- Efficient CSS classes

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest version |
| Firefox | ✅ Full | Latest version |
| Safari | ✅ Full | Latest version |
| Edge | ✅ Full | Latest version |
| Mobile Safari | ✅ Full | iOS 12+ |
| Chrome Mobile | ✅ Full | Android 5+ |

## Security Features

- XSS protection via `escapeAttr()`
- URL validation before display
- Proper content-type handling
- No inline scripts in modal
- Safe event handling

---

**Last Updated**: April 30, 2026
**Version**: 1.0.0
