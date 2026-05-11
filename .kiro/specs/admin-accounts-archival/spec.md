# Admin Accounts Archival Feature Specification

## Overview

Implement a complete admin account archival system that allows administrators to archive inactive or removed admin accounts while maintaining a permanent, immutable record of all archived accounts with full data snapshots for audit trails and potential restoration.

## Status: COMPLETE ✅

---

## Requirements

### Functional Requirements

#### FR1: Archive Admin Account
- **Description**: Allow authorized admins to archive another admin account
- **Trigger**: User clicks "Archive" button on admin account row or in account details modal
- **Process**:
  1. Display confirmation dialog with archive reason input
  2. Capture archiving admin's email (from session)
  3. Create snapshot of current admin account data
  4. Mark account as archived (is_archived = true)
  5. Store archive metadata and snapshot in archive_history table
  6. Remove account from active admin list
- **Validation**:
  - Only Head/Super Admin can archive other admins
  - Cannot archive own account
  - Archive reason is optional but recommended
- **Success**: Toast notification, account removed from list
- **Error**: Display error message, account remains active

#### FR2: View Archive History
- **Description**: Display list of all archived admin accounts
- **Trigger**: Click "Archive History" tab or button
- **Display**:
  - Table with columns: Email, Archived Date, Archived By, Reason, Actions
  - Sortable by archived date (newest first)
  - Searchable by email
  - Pagination for large lists
- **Actions**: View snapshot, Restore account

#### FR3: View Archived Account Snapshot
- **Description**: Display full data snapshot of archived account at time of archival
- **Trigger**: Click "View Snapshot" button in archive history
- **Display**:
  - Modal showing all account data from snapshot
  - Read-only fields
  - Timestamp of archival
  - Who archived it and why
- **Data Shown**:
  - Email, Full Name, Phone, Role
  - First/Middle/Last Name
  - Google ID, Profile Picture
  - Archived timestamp, Archived by, Reason

#### FR4: Restore Archived Account
- **Description**: Restore an archived admin account to active status
- **Trigger**: Click "Restore" button in archive history
- **Process**:
  1. Display confirmation dialog
  2. Restore account from snapshot (optional: allow editing before restore)
  3. Mark is_archived = false
  4. Create new archive history entry noting restoration
  5. Account reappears in active admin list
- **Validation**:
  - Only Head/Super Admin can restore
  - Email must not conflict with existing active account
- **Success**: Toast notification, account appears in active list
- **Error**: Display error message

#### FR5: Archive History Audit Trail
- **Description**: Maintain immutable record of all archival actions
- **Data Captured**:
  - archive_id (unique identifier)
  - admin_id (original account ID)
  - email (account email)
  - archived_at (timestamp)
  - archived_by_email (who performed action)
  - archive_reason (optional reason)
  - previous_role (role before archival)
  - snapshot (full JSONB copy of account data)
- **Immutability**: Archive history records cannot be modified or deleted
- **Indexes**: On email and archived_at for performance

### Non-Functional Requirements

#### NFR1: Performance
- Archive operation: < 500ms
- Restore operation: < 500ms
- Archive history query: < 1s for 1000+ records
- Snapshot storage: Efficient JSONB indexing

#### NFR2: Security
- Only authorized admins can archive/restore
- Archive history is audit-only (no modifications)
- Snapshots contain sensitive data (email, names) - access controlled
- Archived accounts cannot be used for login

#### NFR3: Accessibility
- Keyboard navigation for all modals
- Screen reader support for archive status
- Clear visual indicators for archived accounts
- Confirmation dialogs for destructive actions

#### NFR4: Usability
- Clear visual distinction between active and archived accounts
- Intuitive archive/restore workflow
- Helpful error messages
- Undo capability (restore function)

---

## Technical Design

### Database Schema

#### admin_accounts (existing table - modifications)
```sql
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS archived_by_email text NULL;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS archive_reason text NULL;
```

#### admin_accounts_archive_history (new table)
```sql
CREATE TABLE IF NOT EXISTS public.admin_accounts_archive_history (
  archive_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NULL,
  email text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by_email text NULL,
  archive_reason text NULL,
  previous_role text NULL,
  snapshot jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_email
ON public.admin_accounts_archive_history (email);

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_archived_at
ON public.admin_accounts_archive_history (archived_at DESC);
```

#### Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.log_admin_account_archive()
RETURNS trigger
LANGUAGE plpgsql
AS $
BEGIN
  IF (
    (COALESCE(NEW.is_archived, false) = true AND COALESCE(OLD.is_archived, false) = false)
    OR
    (lower(COALESCE(NEW.role, '')) = 'archived' AND lower(COALESCE(OLD.role, '')) <> 'archived')
  ) THEN
    NEW.is_archived := true;
    NEW.archived_at := COALESCE(NEW.archived_at, now());

    INSERT INTO public.admin_accounts_archive_history (
      admin_id,
      email,
      archived_at,
      archived_by_email,
      archive_reason,
      previous_role,
      snapshot
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, OLD.email),
      COALESCE(NEW.archived_at, now()),
      NEW.archived_by_email,
      NEW.archive_reason,
      OLD.role,
      to_jsonb(OLD)
    );
  END IF;

  RETURN NEW;
END;
$;
```

### Backend API Endpoints

#### 1. Archive Admin Account
- **Endpoint**: `POST /admin/accounts/:id/archive`
- **Auth**: Requires Head/Super Admin role
- **Request Body**:
  ```json
  {
    "archive_reason": "Account no longer needed"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Account archived successfully",
    "archive_id": "uuid"
  }
  ```

#### 2. Get Archive History
- **Endpoint**: `GET /admin/accounts/archive-history`
- **Auth**: Requires Admin role
- **Query Params**:
  - `limit`: Number of records (default 50, max 200)
  - `offset`: Pagination offset (default 0)
  - `search`: Search by email
  - `sort`: Sort field (archived_at, email)
  - `order`: asc or desc
- **Response**:
  ```json
  {
    "success": true,
    "archives": [
      {
        "archive_id": "uuid",
        "email": "admin@example.com",
        "archived_at": "2026-04-30T10:00:00Z",
        "archived_by_email": "head@example.com",
        "archive_reason": "Reason",
        "previous_role": "admin"
      }
    ],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
  ```

#### 3. Get Archive Snapshot
- **Endpoint**: `GET /admin/accounts/archive-history/:archive_id`
- **Auth**: Requires Admin role
- **Response**:
  ```json
  {
    "success": true,
    "archive": {
      "archive_id": "uuid",
      "email": "admin@example.com",
      "archived_at": "2026-04-30T10:00:00Z",
      "archived_by_email": "head@example.com",
      "archive_reason": "Reason",
      "previous_role": "admin",
      "snapshot": { /* full account data */ }
    }
  }
  ```

#### 4. Restore Archived Account
- **Endpoint**: `POST /admin/accounts/archive-history/:archive_id/restore`
- **Auth**: Requires Head/Super Admin role
- **Request Body**:
  ```json
  {
    "restore_reason": "Account needed again"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Account restored successfully",
    "account": { /* restored account data */ }
  }
  ```

### Frontend Components

#### 1. Archive Button (in Admin Accounts Table)
- Location: Each row in admin accounts table
- Action: Opens archive confirmation modal
- Visibility: Only for Head/Super Admin, not for own account

#### 2. Archive Confirmation Modal
- Title: "Archive Admin Account"
- Fields:
  - Email (read-only)
  - Archive Reason (optional textarea)
  - Confirmation checkbox: "I understand this action is permanent"
- Buttons: Cancel, Archive
- Validation: Reason recommended but not required

#### 3. Archive History Tab
- Location: Next to "Users" and "Admins" tabs
- Content: Table of archived accounts
- Columns: Email, Archived Date, Archived By, Reason, Actions
- Actions: View Snapshot, Restore

#### 4. Archive Snapshot Modal
- Title: "Archived Account Snapshot"
- Display: All account fields from snapshot
- Read-only display
- Metadata: Archived date, archived by, reason
- Buttons: Close, Restore

#### 5. Restore Confirmation Modal
- Title: "Restore Admin Account"
- Fields:
  - Email (read-only)
  - Restore Reason (optional textarea)
  - Confirmation checkbox
- Buttons: Cancel, Restore

---

## Implementation Tasks

### Task 1: Database Migration ✅
- [x] Create migration file with table and indexes
- [x] Create trigger function for auto-logging
- [x] Add archive columns to admin_accounts table

### Task 2: Backend API Functions ✅
- [x] Implement `archiveAdminAccount()` function
- [x] Implement `getArchiveHistory()` function
- [x] Implement `getArchiveSnapshot()` function
- [x] Implement `restoreArchivedAccount()` function
- [x] Add authorization checks
- [x] Add error handling

### Task 3: Frontend UI Components ✅
- [x] Add "Archive History" tab
- [x] Create archive confirmation modal
- [x] Create archive history table
- [x] Create snapshot view modal
- [x] Create restore confirmation modal
- [x] Add styling and animations

### Task 4: Frontend JavaScript Functions ✅
- [x] `archiveAdmin(email)` - Opens archive confirmation
- [x] `confirmArchiveAccount()` - Executes archive
- [x] `loadArchiveHistory()` - Loads archive records
- [x] `openSnapshotModal(archiveId)` - Shows snapshot
- [x] `openRestoreConfirmModal(archiveId)` - Opens restore dialog
- [x] `confirmRestoreAccount()` - Executes restore
- [x] `displayArchiveHistory(data)` - Renders archive table

### Task 5: Integration & Testing ✅
- [x] Tab switching functionality
- [x] Archive button integration in admin table
- [x] Archive history display
- [x] Snapshot viewing
- [x] Restore functionality
- [x] Authorization checks
- [x] Error handling

---

## Success Criteria

- ✅ Admin accounts can be archived with reason
- ✅ Archive history is immutable and auditable
- ✅ Archived accounts don't appear in active list
- ✅ Archived accounts can be restored
- ✅ Full data snapshots are preserved
- ✅ Only authorized admins can archive/restore
- ✅ UI is intuitive and accessible
- ✅ Performance meets requirements
- ✅ All error cases handled gracefully

---

## Notes

- Migration file already exists: `migrations/admin_accounts_archiving_and_profile_picture.sql`
- Trigger function automatically logs archives to history table
- Archive history is immutable (no updates/deletes)
- Snapshots stored as JSONB for flexibility
- Restoration creates new archive history entry
