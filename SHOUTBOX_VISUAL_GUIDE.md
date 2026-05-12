# 🎨 Shoutbox Visual Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REWARDS PAGE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐   │
│  │                              │  │  💬 Community Chat       │   │
│  │   REWARDS GRID               │  │  ─────────────────────   │   │
│  │   (2/3 width)                │  │                          │   │
│  │                              │  │  ┌────────────────────┐  │   │
│  │  ┌────┐ ┌────┐ ┌────┐       │  │  │ 👤 john.doe        │  │   │
│  │  │ 🎁 │ │ 🎁 │ │ 🎁 │       │  │  │ 📚 Student         │  │   │
│  │  │    │ │    │ │    │       │  │  │ Hello everyone!    │  │   │
│  │  └────┘ └────┘ └────┘       │  │  │ 2m ago             │  │   │
│  │                              │  │  └────────────────────┘  │   │
│  │  ┌────┐ ┌────┐ ┌────┐       │  │                          │   │
│  │  │ 🎁 │ │ 🎁 │ │ 🎁 │       │  │  ┌────────────────────┐  │   │
│  │  │    │ │    │ │    │       │  │  │ 👤 jane.smith      │  │   │
│  │  └────┘ └────┘ └────┘       │  │  │ 🎓 Faculty         │  │   │
│  │                              │  │  │ Great rewards!     │  │   │
│  │                              │  │  │ 5m ago             │  │   │
│  │                              │  │  └────────────────────┘  │   │
│  │                              │  │                          │   │
│  │                              │  │  ┌────────────────────┐  │   │
│  │                              │  │  │ Type message...    │  │   │
│  │                              │  │  └────────────────────┘  │   │
│  │                              │  │  0/250        [Send]     │   │
│  └──────────────────────────────┘  └──────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Shoutbox Header
```
┌──────────────────────────────────┐
│ 💬 Community Chat                │
│ Share your thoughts with the     │
│ community                        │
└──────────────────────────────────┘
```
- **Background:** Dark green gradient
- **Text:** White
- **Icon:** 💬 emoji
- **Font:** Playfair Display (heading)

---

### 2. Message Container
```
┌──────────────────────────────────┐
│ ┌──────────────────────────────┐ │
│ │ 👤 john.doe  📚 Student      │ │ ← White background
│ │ Hello everyone!              │ │
│ │ 2m ago                       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 👤 jane.smith  🎓 Faculty    │ │ ← Yellow background
│ │ Great rewards!               │ │
│ │ 5m ago                       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 👤 admin  👑 Admin           │ │ ← White background
│ │ Welcome to the community!    │ │
│ │ 10m ago                      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```
- **Height:** 400px (scrollable)
- **Background:** Light gray (#F5F5F5)
- **Alternating colors:** White / Soft yellow (#FFFDE7)
- **Padding:** 16px
- **Gap:** 8px between messages

---

### 3. Individual Message
```
┌────────────────────────────────────────┐
│  👤  john.doe  📚 Student  (You)       │
│      Hello everyone! This is my        │
│      first message in the chat.        │
│      2m ago  (edited)              🗑️  │
└────────────────────────────────────────┘
```

**Components:**
- **Avatar:** Circular, 40px, gradient background, white initial
- **Username:** Bold, 14px, dark green
- **Badge:** Small pill, colored background, emoji + text
- **Message:** 14px, word-wrap enabled
- **Timestamp:** 12px, gray, relative time
- **Actions:** Delete button (trash icon) for own messages/admin

---

### 4. Input Section
```
┌──────────────────────────────────┐
│ ┌──────────────────────────────┐ │
│ │ Type your message...         │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│ 0/250                    [Send]  │
│ ⏱ 5 second cooldown between     │
│    messages                      │
└──────────────────────────────────┘
```
- **Textarea:** Auto-expanding, max 120px height
- **Character counter:** Real-time, color-coded
- **Send button:** Green gradient, hover effect
- **Info text:** Small, gray

---

## Color Palette

### Primary Colors
```
Dark Green:    #0F3B2E  ████████
Card Green:    #5DAE60  ████████
Accent Yellow: #D4E157  ████████
```

### Background Colors
```
White:         #FFFFFF  ████████
Soft Yellow:   #FFFDE7  ████████
Light Gray:    #F5F5F5  ████████
```

### Text Colors
```
Primary Text:  #0F3B2E  ████████
Secondary:     #0F3B2E/70  ████████
Muted:         #9CA3AF  ████████
```

---

## Badge Styles

### Role Badges
```
┌─────────────┐
│ 👑 Admin    │  ← Red/Gold background
└─────────────┘

┌─────────────┐
│ 🎓 Faculty  │  ← Blue background
└─────────────┘

┌─────────────┐
│ 📚 Student  │  ← Green background
└─────────────┘

┌─────────────┐
│ 👤 User     │  ← Gray background
└─────────────┘
```

**Styling:**
- Font size: 12px
- Padding: 2px 8px
- Border radius: 9999px (fully rounded)
- Font weight: Medium

---

## Responsive Behavior

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────┐
│  Rewards (66%)  │  Shoutbox (33%)       │
│                 │                       │
│  ┌────┐ ┌────┐  │  ┌─────────────────┐ │
│  │ 🎁 │ │ 🎁 │  │  │ 💬 Chat         │ │
│  └────┘ └────┘  │  │                 │ │
│                 │  │ Messages...     │ │
│  ┌────┐ ┌────┐  │  │                 │ │
│  │ 🎁 │ │ 🎁 │  │  │ [Input]         │ │
│  └────┘ └────┘  │  └─────────────────┘ │
└─────────────────────────────────────────┘
```

### Mobile (< 1024px)
```
┌─────────────────────┐
│  Rewards (100%)     │
│                     │
│  ┌────┐ ┌────┐     │
│  │ 🎁 │ │ 🎁 │     │
│  └────┘ └────┘     │
│                     │
│  ┌────┐ ┌────┐     │
│  │ 🎁 │ │ 🎁 │     │
│  └────┘ └────┘     │
│                     │
│  (Shoutbox hidden)  │
└─────────────────────┘
```

---

## Animations

### Message Slide In
```
Frame 1:  ↓ (opacity: 0, translateY: 10px)
Frame 2:  ↓ (opacity: 0.5, translateY: 5px)
Frame 3:  ✓ (opacity: 1, translateY: 0)
```
Duration: 0.3s ease

### Hover Effects
```
Normal:   ┌────────────┐
          │ Message    │
          └────────────┘

Hover:    ┌────────────┐
          │ Message    │  ← Shadow appears
          └────────────┘
```
Duration: 0.2s transition

---

## Scrollbar Styling

### Custom Scrollbar
```
Track:  ████████  (Light gray)
Thumb:  ████████  (Green)
Width:  6px
```

**Behavior:**
- Smooth scrolling
- Auto-scroll to bottom on new message
- Hover to show scrollbar

---

## Character Counter States

### Normal (0-200 chars)
```
0/250  ← Gray color
```

### Warning (201-250 chars)
```
220/250  ← Orange color
```

### Error (> 250 chars)
```
260/250  ← Red color (cannot send)
```

---

## Button States

### Send Button

**Normal:**
```
┌──────────┐
│ ➤ Send   │  ← Green gradient
└──────────┘
```

**Hover:**
```
┌──────────┐
│ ➤ Send   │  ← Darker green + shadow
└──────────┘
```

**Disabled:**
```
┌──────────┐
│ ➤ Send   │  ← Gray + no pointer
└──────────┘
```

---

## Error Messages

### Cooldown Error
```
┌────────────────────────────────────┐
│ ⚠️ Please wait 3 seconds before    │
│    posting again                   │
└────────────────────────────────────┘
```

### Empty Message Error
```
┌────────────────────────────────────┐
│ ⚠️ Message cannot be empty         │
└────────────────────────────────────┘
```

### Profanity Error
```
┌────────────────────────────────────┐
│ ⚠️ Message contains inappropriate  │
│    content                         │
└────────────────────────────────────┘
```

**Styling:**
- Background: Light red (#FEF2F2)
- Border: Red (#FCA5A5)
- Text: Dark red (#991B1B)
- Auto-hide after 5 seconds

---

## Timestamp Formats

```
Just now       ← < 1 minute
2m ago         ← < 1 hour
3h ago         ← < 24 hours
2d ago         ← < 7 days
May 10         ← > 7 days
```

---

## Loading States

### Initial Load
```
┌──────────────────────────────────┐
│                                  │
│        Loading messages...       │
│                                  │
└──────────────────────────────────┘
```

### Empty State
```
┌──────────────────────────────────┐
│                                  │
│  💬 No messages yet. Be the      │
│     first to say hello!          │
│                                  │
└──────────────────────────────────┘
```

---

## Accessibility Features

✅ **Keyboard Navigation**
- Tab to focus textarea
- Enter to send message
- Shift+Enter for new line

✅ **Screen Reader Support**
- Semantic HTML
- ARIA labels
- Alt text for icons

✅ **Color Contrast**
- WCAG AA compliant
- High contrast text
- Clear visual hierarchy

---

## Example Message Flow

```
1. User types message
   ┌──────────────────┐
   │ Hello world!_    │
   └──────────────────┘
   12/250

2. User presses Enter
   [Sending...]

3. Message appears
   ┌──────────────────────────┐
   │ 👤 john.doe  📚 Student  │
   │ Hello world!             │
   │ Just now                 │
   └──────────────────────────┘

4. Auto-scroll to bottom
   ↓ Scroll animation

5. Input cleared
   ┌──────────────────┐
   │ Type message...  │
   └──────────────────┘
   0/250
```

---

## Design Principles

1. **Clean & Modern** - Minimalist design with focus on content
2. **User-Friendly** - Intuitive interface, clear actions
3. **Consistent** - Matches existing Rewards page design
4. **Responsive** - Adapts to different screen sizes
5. **Accessible** - Keyboard navigation, screen reader support
6. **Performant** - Smooth animations, efficient rendering

---

**Visual guide complete! 🎨**
