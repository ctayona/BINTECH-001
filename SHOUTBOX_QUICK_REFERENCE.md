# 🚀 Shoutbox Quick Reference

## Quick Start

### 1. Run Database Migration
```bash
psql -U your_username -d your_database -f migrations/create_shoutbox_messages_table.sql
```

### 2. Restart Server
```bash
node app.js
```

### 3. Test
Navigate to `/rewards` and start chatting!

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shoutbox/messages` | Fetch messages |
| POST | `/api/shoutbox/messages` | Send message |
| PUT | `/api/shoutbox/messages/:id` | Edit message |
| DELETE | `/api/shoutbox/messages/:id` | Delete message |

---

## Key Files

```
migrations/create_shoutbox_messages_table.sql  # Database schema
controllers/shoutboxController.js              # Backend logic
routes/shoutbox.js                             # API routes
public/js/shoutbox.js                          # Frontend class
templates/REWARDS.HTML                         # UI integration
```

---

## Database Schema

```sql
shoutbox_messages (
  message_id UUID PRIMARY KEY,
  sender_id UUID → user_accounts(system_id),
  message_text VARCHAR(250),
  is_deleted BOOLEAN,
  is_edited BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## Frontend Usage

```javascript
// Initialize
const shoutbox = new Shoutbox();
await shoutbox.init();

// Send message
await shoutbox.sendMessage();

// Delete message
await shoutbox.deleteMessage(messageId);

// Load messages
await shoutbox.loadMessages();
```

---

## Security Features

✅ XSS Prevention (HTML sanitization)  
✅ Profanity Filter  
✅ Rate Limiting (5-second cooldown)  
✅ User Status Validation  
✅ SQL Injection Prevention  

---

## Configuration

### Cooldown Period
```javascript
// In public/js/shoutbox.js
this.cooldownSeconds = 5; // Change to adjust cooldown
```

### Auto-Refresh Interval
```javascript
// In public/js/shoutbox.js
this.refreshInterval = setInterval(() => this.loadMessages(), 5000); // 5 seconds
```

### Message Limit
```javascript
// In controllers/shoutboxController.js
const limit = parseInt(req.query.limit) || 50; // Default 50 messages
```

---

## Common Tasks

### Add Profanity Words
Edit `controllers/shoutboxController.js`:
```javascript
const PROFANITY_LIST = [
  'badword1', 'badword2', 'badword3',
  // Add more words here
];
```

### Change Message Height
Edit `templates/REWARDS.HTML`:
```html
<div id="shoutbox-messages" class="h-[400px] ...">
  <!-- Change h-[400px] to desired height -->
</div>
```

### Disable Auto-Refresh
Edit `public/js/shoutbox.js`:
```javascript
// Comment out this line in init()
// this.refreshInterval = setInterval(() => this.loadMessages(), 5000);
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Messages not loading | Check database connection, verify migration |
| Cannot send messages | Check user login status, verify cooldown |
| Auto-refresh not working | Check browser console, verify API endpoint |
| Styling issues | Clear browser cache, check CSS classes |

---

## Testing Commands

```bash
# Test GET messages
curl http://localhost:3000/api/shoutbox/messages

# Test POST message
curl -X POST http://localhost:3000/api/shoutbox/messages \
  -H "Content-Type: application/json" \
  -d '{"sender_id":"uuid","message_text":"Test message"}'

# Test DELETE message
curl -X DELETE http://localhost:3000/api/shoutbox/messages/message-uuid \
  -H "Content-Type: application/json" \
  -d '{"admin_id":"admin-uuid"}'
```

---

## Performance Tips

1. **Limit message history** - Adjust `limit` parameter in API calls
2. **Increase refresh interval** - Change from 5s to 10s or more
3. **Add pagination** - Implement offset-based pagination
4. **Cache user data** - Store user info in memory
5. **Use WebSockets** - Replace polling with real-time updates

---

## Future Enhancements

- [ ] Emoji picker
- [ ] Message reactions
- [ ] Reply threads
- [ ] User mentions (@username)
- [ ] Message search
- [ ] Export chat history
- [ ] Rich text formatting
- [ ] File attachments
- [ ] Voice messages
- [ ] Video chat integration

---

## Support

For issues or questions:
1. Check `SHOUTBOX_IMPLEMENTATION_COMPLETE.md` for detailed documentation
2. Review browser console for errors
3. Check server logs for backend issues
4. Verify database schema is correct

---

**Happy Chatting! 💬**
