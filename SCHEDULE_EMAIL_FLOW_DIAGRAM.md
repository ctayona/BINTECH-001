# Schedule Email Notification - Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN SCHEDULE MODULE                        │
│                  (templates/ADMIN_SCHEDULE.html)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User creates/updates event
                              │ with "Assigned To" selected
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - saveEvent()                        │
│  - Validates form data                                           │
│  - Sends POST/PUT to /api/admin/schedule                         │
│  - Includes assigned_to (admin system_id)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST/PUT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND - addSchedule() / updateSchedule()          │
│           (controllers/adminController.js)                       │
│                                                                   │
│  1. Validate request data                                        │
│  2. Insert/Update schedule in database                           │
│  3. Check if assigned_to is set                                  │
│     └─ If YES: Continue to email logic                           │
│     └─ If NO: Skip email, return response                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ assigned_to is set
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         FETCH ADMIN DETAILS FROM DATABASE                        │
│                                                                   │
│  Query: SELECT email, full_name FROM admin_accounts              │
│          WHERE system_id = assigned_to                           │
│                                                                   │
│  Result: { email: 'admin@example.com', full_name: 'John Doe' }  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Admin found
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         EMAIL SERVICE - sendScheduleNotification()               │
│           (services/emailService.js)                             │
│                                                                   │
│  1. Initialize email transporter (nodemailer)                    │
│  2. Generate HTML email template                                 │
│  3. Prepare email options:                                       │
│     - From: bintechman@gmail.com                                 │
│     - To: admin@example.com                                      │
│     - Subject: Schedule Assignment: [Event Title]                │
│     - HTML: Professional template with event details             │
│  4. Send email via SMTP                                          │
│  5. Return success/failure status                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Email sent
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN'S EMAIL INBOX                                 │
│                                                                   │
│  From: BinTECH <bintechman@gmail.com>                            │
│  Subject: Schedule Assignment: Zone A Collection                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Hi John Doe,                                            │    │
│  │                                                         │    │
│  │ You have been assigned to a new schedule event.        │    │
│  │                                                         │    │
│  │ 📅 Zone A Collection                                   │    │
│  │ 📅 Date: Monday, April 30, 2026                        │    │
│  │ 🕐 Time: 2:30 PM                                       │    │
│  │ 📝 Notes: Please collect all bins in Zone A            │    │
│  │                                                         │    │
│  │ Please log in to your admin dashboard to view the      │    │
│  │ full event details and confirm your availability.      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow - Create Schedule with Assignment

```
START
  │
  ├─ User fills schedule form
  │  ├─ Event Title: "Zone A Collection"
  │  ├─ Date: 2026-05-01
  │  ├─ Time: 10:00 - 12:00
  │  ├─ Assigned To: "John Doe (admin@example.com)"
  │  └─ Notes: "Collect all bins"
  │
  ├─ User clicks "Save Event"
  │
  ├─ Frontend: saveEvent()
  │  ├─ Validate form data ✓
  │  ├─ Extract assigned_to = "system_id_123"
  │  ├─ POST /api/admin/schedule
  │  │  └─ Body: { task, scheduled_at, assigned_to, notes, ... }
  │  └─ Wait for response
  │
  ├─ Backend: addSchedule()
  │  ├─ Receive request ✓
  │  ├─ Validate data ✓
  │  ├─ Insert into schedules table ✓
  │  ├─ Check: assigned_to is set? YES
  │  │
  │  ├─ Try to send email:
  │  │  ├─ Fetch admin from admin_accounts
  │  │  │  └─ Query: WHERE system_id = 'system_id_123'
  │  │  │  └─ Result: { email: 'admin@example.com', full_name: 'John Doe' }
  │  │  │
  │  │  ├─ Call emailService.sendScheduleNotification()
  │  │  │  ├─ Initialize transporter ✓
  │  │  │  ├─ Generate HTML template ✓
  │  │  │  ├─ Prepare mail options ✓
  │  │  │  ├─ Send via SMTP ✓
  │  │  │  └─ Return true
  │  │  │
  │  │  └─ Log: "✓ Schedule notification email sent successfully"
  │  │
  │  ├─ Return response: { success: true, schedules: [...] }
  │  └─ (Email failure doesn't affect response)
  │
  ├─ Frontend: Receive response
  │  ├─ Close modal ✓
  │  ├─ Reload schedules ✓
  │  └─ Display success message ✓
  │
  ├─ Admin receives email
  │  ├─ Email arrives in inbox ✓
  │  ├─ Subject: "Schedule Assignment: Zone A Collection"
  │  ├─ Contains event details ✓
  │  └─ Admin can click to view in dashboard
  │
  └─ END ✓
```

## Error Handling Flow

```
START: addSchedule() with assigned_to
  │
  ├─ Try to send email
  │  │
  │  ├─ Error: Admin not found in database
  │  │  ├─ Log warning: "Could not fetch admin details"
  │  │  ├─ Continue (don't fail)
  │  │  └─ Return success response
  │  │
  │  ├─ Error: Email transporter not configured
  │  │  ├─ Log warning: "Email transporter not configured"
  │  │  ├─ Continue (don't fail)
  │  │  └─ Return success response
  │  │
  │  ├─ Error: SMTP connection failed
  │  │  ├─ Log error: "Error sending schedule notification"
  │  │  ├─ Continue (don't fail)
  │  │  └─ Return success response
  │  │
  │  └─ Success: Email sent
  │     ├─ Log success: "✓ Schedule notification email sent"
  │     └─ Return success response
  │
  └─ END: Schedule is always created/updated
     (Email success/failure doesn't affect schedule operation)
```

## Database Query Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │   schedules      │        │ admin_accounts   │
        ├──────────────────┤        ├──────────────────┤
        │ id               │        │ system_id        │
        │ task             │        │ email            │
        │ scheduled_at     │        │ full_name        │
        │ assigned_to ────────────→ │ role             │
        │ notes            │        │ ...              │
        │ status           │        └──────────────────┘
        │ ...              │
        └──────────────────┘

Flow:
1. Insert into schedules with assigned_to = 'system_id_123'
2. Query admin_accounts WHERE system_id = 'system_id_123'
3. Get email and full_name
4. Send email to that address
```

## Email Template Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL TEMPLATE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  HEADER (Forest Green Gradient)                         │    │
│  │  📅 Schedule Assignment                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Hi John Doe,                                                    │
│                                                                   │
│  You have been assigned to a new schedule event.                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  EVENT DETAILS                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Zone A Collection                               │    │    │
│  │  │                                                 │    │    │
│  │  │ 📅 Date: Monday, April 30, 2026                │    │    │
│  │  │ 🕐 Time: 2:30 PM                               │    │    │
│  │  │ 📝 Notes: Please collect all bins in Zone A    │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ACTION SECTION                                         │    │
│  │  Please log in to your admin dashboard to view the      │    │
│  │  full event details and confirm your availability.      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  FOOTER                                                 │    │
│  │  © 2026 BinTECH. All rights reserved.                   │    │
│  │  This is an automated message.                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Logging Flow

```
Server Console Output:

[addSchedule] Received payload: {
  task: 'Zone A Collection',
  scheduled_at: '2026-05-01T10:00:00Z',
  assigned_to: 'system_id_123',
  notes: 'Collect all bins',
  ...
}

[addSchedule] Final assigned_to to send: system_id_123

[addSchedule] Success: [event data]

[addSchedule] Sending schedule notification to: admin@example.com

[Email Service] 📤 Sending schedule notification to admin@example.com
[Email Service] Event: Zone A Collection

[Email Service] ✓ Schedule notification sent successfully to admin@example.com
[Email Service] Message ID: <message_id@gmail.com>

[addSchedule] ✓ Schedule notification email sent successfully
```

## State Transitions

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCHEDULE STATES                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  UNASSIGNED                                                        │
│  ├─ No assigned_to value                                          │
│  ├─ No email sent                                                 │
│  └─ Schedule created normally                                     │
│                                                                    │
│  ASSIGNED (Email Sent)                                            │
│  ├─ assigned_to = system_id                                       │
│  ├─ Email sent to admin                                           │
│  ├─ Admin receives notification                                   │
│  └─ Schedule created with assignment                              │
│                                                                    │
│  REASSIGNED (Email Sent)                                          │
│  ├─ assigned_to changed to different admin                        │
│  ├─ Email sent to new admin                                       │
│  ├─ New admin receives notification                               │
│  └─ Schedule updated with new assignment                          │
│                                                                    │
│  UNASSIGNED (No Email)                                            │
│  ├─ assigned_to removed/cleared                                   │
│  ├─ No email sent                                                 │
│  └─ Schedule updated without assignment                           │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                   SYSTEM INTEGRATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (ADMIN_SCHEDULE.html)                                  │
│  └─ saveEvent() → POST/PUT /api/admin/schedule                   │
│                                                                   │
│  Backend Routes (routes/admin.js)                                │
│  ├─ POST /api/admin/schedule → addSchedule()                     │
│  └─ PUT /api/admin/schedule/:id → updateSchedule()               │
│                                                                   │
│  Controllers (controllers/adminController.js)                    │
│  ├─ addSchedule() → Email logic added                            │
│  └─ updateSchedule() → Email logic added                         │
│                                                                   │
│  Email Service (services/emailService.js)                        │
│  ├─ sendScheduleNotification()                                   │
│  ├─ generateScheduleNotificationTemplate()                       │
│  └─ Uses nodemailer for SMTP                                     │
│                                                                   │
│  Database (Supabase)                                             │
│  ├─ schedules table (stores events)                              │
│  └─ admin_accounts table (stores admin info)                     │
│                                                                   │
│  Email Provider (Gmail SMTP)                                     │
│  └─ Sends emails via bintechman@gmail.com                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

The email notification system is fully integrated into the schedule module with:
- ✅ Non-blocking email sending
- ✅ Graceful error handling
- ✅ Comprehensive logging
- ✅ Professional email templates
- ✅ Automatic admin lookup
- ✅ Support for create and update operations
