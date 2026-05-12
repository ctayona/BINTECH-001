# 🧪 Shoutbox Testing Guide

## Pre-Testing Checklist

Before starting tests, ensure:
- [ ] Database migration has been run successfully
- [ ] Server is running without errors
- [ ] You have at least 2 test accounts (different roles)
- [ ] Browser console is open for debugging

---

## Test Suite 1: Database & Backend

### Test 1.1: Database Schema
```sql
-- Verify table exists
SELECT * FROM shoutbox_messages LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'shoutbox_messages';

-- Verify foreign key
SELECT conname FROM pg_constraint WHERE conrelid = 'shoutbox_messages'::regclass;
```

**Expected Results:**
- ✅ Table exists
- ✅ 3 indexes present (sender, created_at, not_deleted)
- ✅ Foreign key to user_accounts exists

---

### Test 1.2: API Endpoints

#### GET Messages
```bash
curl http://localhost:3000/api/shoutbox/messages
```

**Expected Response:**
```json
{
  "success": true,
  "messages": [],
  "count": 0
}
```

#### POST Message
```bash
curl -X POST http://localhost:3000/api/shoutbox/messages \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "YOUR_USER_UUID",
    "message_text": "Test message from API"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message posted successfully",
  "data": {
    "message_id": "...",
    "message_text": "Test message from API",
    "sender": { ... }
  }
}
```

---

## Test Suite 2: Frontend UI

### Test 2.1: Page Load
1. Navigate to `/rewards`
2. Log in with valid credentials
3. Observe shoutbox on right sidebar

**Expected Results:**
- ✅ Shoutbox visible on desktop
- ✅ Header shows "💬 Community Chat"
- ✅ Messages container loads
- ✅ Input section visible at bottom

---

### Test 2.2: Message Display
1. Ensure at least 3 messages exist in database
2. Refresh the page
3. Observe message rendering

**Expected Results:**
- ✅ Messages load automatically
- ✅ Alternating background colors (white/yellow)
- ✅ User avatars display with initials
- ✅ Usernames show correctly
- ✅ Role badges display (👑 Admin, 📚 Student, etc.)
- ✅ Timestamps format correctly ("Just now", "5m ago")
- ✅ Messages scroll smoothly
- ✅ Auto-scroll to bottom

---

### Test 2.3: Send Message
1. Type "Hello world!" in textarea
2. Observe character counter
3. Click "Send" button

**Expected Results:**
- ✅ Character counter updates (12/250)
- ✅ Message sends successfully
- ✅ New message appears at bottom
- ✅ Input clears after sending
- ✅ Character counter resets to 0/250
- ✅ Auto-scroll to new message

---

### Test 2.4: Character Limit
1. Type exactly 250 characters
2. Observe character counter
3. Try to type more

**Expected Results:**
- ✅ Counter shows 250/250
- ✅ Counter turns orange/red
- ✅ Cannot type beyond 250 characters
- ✅ Can still send message

---

### Test 2.5: Empty Message
1. Leave textarea empty
2. Click "Send" button

**Expected Results:**
- ✅ Error message appears
- ✅ "Message cannot be empty" displayed
- ✅ Message not sent
- ✅ Error auto-hides after 5 seconds

---

### Test 2.6: Cooldown Period
1. Send a message
2. Immediately try to send another message

**Expected Results:**
- ✅ Error message appears
- ✅ "Please wait X seconds" displayed
- ✅ Countdown shows remaining time
- ✅ Can send after cooldown expires

---

### Test 2.7: Auto-Refresh
1. Open page in two browser windows
2. Send message in window 1
3. Wait 5 seconds
4. Observe window 2

**Expected Results:**
- ✅ Message appears in window 2 automatically
- ✅ No page refresh required
- ✅ Smooth update without flicker

---

### Test 2.8: Delete Own Message
1. Send a message
2. Hover over your message
3. Click trash icon
4. Confirm deletion

**Expected Results:**
- ✅ Trash icon visible on own messages
- ✅ Confirmation dialog appears
- ✅ Message disappears after confirmation
- ✅ Message marked as deleted in database

---

### Test 2.9: Admin Moderation
1. Log in as admin
2. View messages from other users
3. Click trash icon on any message
4. Confirm deletion

**Expected Results:**
- ✅ Trash icon visible on all messages
- ✅ Can delete any message
- ✅ Message disappears immediately
- ✅ Soft delete in database (is_deleted = true)

---

## Test Suite 3: Security

### Test 3.1: XSS Prevention
1. Try to send message with HTML:
   ```
   <script>alert('XSS')</script>
   ```
2. Try to send message with tags:
   ```
   <b>Bold text</b>
   ```

**Expected Results:**
- ✅ HTML tags stripped
- ✅ Script tags removed
- ✅ Plain text displayed
- ✅ No JavaScript execution

---

### Test 3.2: Profanity Filter
1. Send message with profanity word
2. Observe response

**Expected Results:**
- ✅ Message rejected
- ✅ Error message displayed
- ✅ "Inappropriate content" warning
- ✅ Message not saved to database

---

### Test 3.3: Suspended User
1. Suspend a user account in database:
   ```sql
   UPDATE user_accounts SET status = 'suspended' WHERE email = 'test@example.com';
   ```
2. Log in as suspended user
3. Try to send message

**Expected Results:**
- ✅ Message rejected
- ✅ "Not allowed to post" error
- ✅ Input disabled or error shown

---

### Test 3.4: Unauthenticated User
1. Log out
2. Navigate to `/rewards`
3. Observe shoutbox

**Expected Results:**
- ✅ Redirected to login page
- ✅ OR shoutbox shows "Login to chat"
- ✅ Cannot send messages

---

### Test 3.5: SQL Injection
1. Try to send message with SQL:
   ```
   '; DROP TABLE shoutbox_messages; --
   ```

**Expected Results:**
- ✅ Message treated as plain text
- ✅ No SQL execution
- ✅ Database intact
- ✅ Parameterized queries prevent injection

---

## Test Suite 4: Responsive Design

### Test 4.1: Desktop (≥ 1024px)
1. Open page on desktop browser
2. Resize window to 1024px+

**Expected Results:**
- ✅ Two-column layout
- ✅ Shoutbox visible on right
- ✅ Rewards on left (2/3 width)
- ✅ Shoutbox sticky positioning

---

### Test 4.2: Tablet (768px - 1023px)
1. Resize window to 800px width

**Expected Results:**
- ✅ Single column layout
- ✅ Shoutbox hidden
- ✅ Rewards take full width
- ✅ No layout breaking

---

### Test 4.3: Mobile (< 768px)
1. Open on mobile device or resize to 375px

**Expected Results:**
- ✅ Shoutbox completely hidden
- ✅ Rewards stack vertically
- ✅ Touch-friendly buttons
- ✅ Readable text sizes

---

## Test Suite 5: Performance

### Test 5.1: Load Time
1. Clear browser cache
2. Navigate to `/rewards`
3. Measure load time

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Messages load in < 1 second
- ✅ No blocking requests
- ✅ Smooth rendering

---

### Test 5.2: Message Rendering
1. Add 100 messages to database
2. Load page
3. Observe rendering

**Expected Results:**
- ✅ All messages render quickly
- ✅ Smooth scrolling
- ✅ No lag or stutter
- ✅ Memory usage reasonable

---

### Test 5.3: Auto-Refresh Impact
1. Open browser performance monitor
2. Let page run for 5 minutes
3. Observe CPU/memory usage

**Expected Results:**
- ✅ CPU usage < 5%
- ✅ Memory stable (no leaks)
- ✅ Network requests efficient
- ✅ No performance degradation

---

## Test Suite 6: Edge Cases

### Test 6.1: Very Long Message
1. Type exactly 250 characters
2. Send message

**Expected Results:**
- ✅ Message accepted
- ✅ Full text displayed
- ✅ Word wrap works correctly
- ✅ No text overflow

---

### Test 6.2: Special Characters
1. Send message with emojis: "Hello 👋 🌍 🎉"
2. Send message with symbols: "Test @#$%^&*()"
3. Send message with unicode: "Héllo Wörld"

**Expected Results:**
- ✅ All characters display correctly
- ✅ No encoding issues
- ✅ Emojis render properly
- ✅ Database stores correctly

---

### Test 6.3: Rapid Sending
1. Try to send 10 messages rapidly
2. Observe cooldown enforcement

**Expected Results:**
- ✅ Only 1 message per 5 seconds
- ✅ Cooldown error shows
- ✅ No rate limit bypass
- ✅ Server handles gracefully

---

### Test 6.4: Network Failure
1. Disconnect internet
2. Try to send message
3. Reconnect internet

**Expected Results:**
- ✅ Error message displayed
- ✅ "Network error" shown
- ✅ Message not lost
- ✅ Can retry after reconnect

---

### Test 6.5: Concurrent Users
1. Open 5 browser windows
2. Send messages from each
3. Observe all windows

**Expected Results:**
- ✅ All messages appear in all windows
- ✅ No message duplication
- ✅ Correct order maintained
- ✅ No race conditions

---

## Test Suite 7: Accessibility

### Test 7.1: Keyboard Navigation
1. Use Tab key to navigate
2. Use Enter to send message
3. Use Shift+Enter for new line

**Expected Results:**
- ✅ Can tab to textarea
- ✅ Can tab to send button
- ✅ Enter sends message
- ✅ Shift+Enter adds new line

---

### Test 7.2: Screen Reader
1. Enable screen reader (NVDA/JAWS)
2. Navigate through shoutbox
3. Listen to announcements

**Expected Results:**
- ✅ Header announced correctly
- ✅ Messages read in order
- ✅ Usernames and roles announced
- ✅ Input field labeled

---

### Test 7.3: Color Contrast
1. Use browser contrast checker
2. Check all text elements

**Expected Results:**
- ✅ All text meets WCAG AA
- ✅ Minimum 4.5:1 ratio
- ✅ Readable in all states
- ✅ No color-only indicators

---

## Test Suite 8: Browser Compatibility

### Test 8.1: Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Test 8.2: Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Test 8.3: Safari
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

### Test 8.4: Edge
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

---

## Automated Testing Script

```javascript
// Run in browser console
async function testShoutbox() {
  console.log('🧪 Starting Shoutbox Tests...');
  
  // Test 1: Check if shoutbox exists
  const shoutbox = document.getElementById('shoutbox-messages');
  console.assert(shoutbox !== null, '✅ Shoutbox container exists');
  
  // Test 2: Check if input exists
  const input = document.getElementById('shoutbox-input');
  console.assert(input !== null, '✅ Input field exists');
  
  // Test 3: Check if send button exists
  const sendBtn = document.getElementById('shoutbox-send-btn');
  console.assert(sendBtn !== null, '✅ Send button exists');
  
  // Test 4: Check if character counter exists
  const charCount = document.getElementById('shoutbox-char-count');
  console.assert(charCount !== null, '✅ Character counter exists');
  
  // Test 5: Test character counter
  input.value = 'Test';
  input.dispatchEvent(new Event('input'));
  console.assert(charCount.textContent === '4/250', '✅ Character counter works');
  
  // Test 6: Test API endpoint
  try {
    const response = await fetch('/api/shoutbox/messages');
    const data = await response.json();
    console.assert(data.success === true, '✅ API endpoint works');
  } catch (e) {
    console.error('❌ API endpoint failed:', e);
  }
  
  console.log('🎉 Tests complete!');
}

// Run tests
testShoutbox();
```

---

## Bug Report Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Browser version]
- OS: [Windows/Mac/Linux]
- Screen size: [Desktop/Tablet/Mobile]

### Screenshots
[Attach screenshots if applicable]

### Console Errors
[Paste any console errors]

### Additional Context
[Any other relevant information]
```

---

## Performance Benchmarks

### Target Metrics
- **Page Load:** < 2 seconds
- **Message Load:** < 1 second
- **Message Send:** < 500ms
- **Auto-Refresh:** < 300ms
- **Memory Usage:** < 50MB
- **CPU Usage:** < 5%

### Measurement Tools
- Chrome DevTools Performance tab
- Lighthouse audit
- Network tab
- Memory profiler

---

## Final Checklist

Before marking as complete:
- [ ] All Test Suite 1 tests pass
- [ ] All Test Suite 2 tests pass
- [ ] All Test Suite 3 tests pass
- [ ] All Test Suite 4 tests pass
- [ ] All Test Suite 5 tests pass
- [ ] All Test Suite 6 tests pass
- [ ] All Test Suite 7 tests pass
- [ ] All Test Suite 8 tests pass
- [ ] No console errors
- [ ] No memory leaks
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for production

---

## Support & Troubleshooting

If tests fail:
1. Check server logs for errors
2. Verify database connection
3. Clear browser cache
4. Check network tab for failed requests
5. Review console for JavaScript errors
6. Verify user permissions
7. Check database schema

---

**Happy Testing! 🧪**
