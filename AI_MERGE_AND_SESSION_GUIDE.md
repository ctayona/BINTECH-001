# AI Merge Guide for Project Folder Transfer

Use this guide when merging this project with a partner’s copy of the same folder. The goal is to preserve the changes recorded in `PROJECT_PROGRESS_REPORT.md` while safely combining both versions of the codebase without losing live machine session behavior.

## What the AI must do first

1. Read `PROJECT_PROGRESS_REPORT.md` and treat it as the source of truth for the latest completed work.
2. Check which files were changed in the progress report areas, especially authentication, admin account management, dashboard analytics, bin management, and the QR/session flow.
3. Compare the local files against the partner’s version file by file.
4. Merge carefully instead of replacing whole files unless the report clearly shows a full rewrite.

## Merge priority rules

- Keep every feature marked as completed in `PROJECT_PROGRESS_REPORT.md`.
- If two versions conflict, prefer the version that preserves the latest working behavior described in the progress report.
- Do not remove session-related code unless you are sure the same session logic exists in the partner file and is intentionally being replaced.
- Keep database, route, controller, and frontend changes aligned with one another.
- If one file depends on another file that was already updated, make sure both sides still match after the merge.

## Important files to protect

- `controllers/wasteSorterController.js`
- `routes/waste-sorter.js`
- `templates/USER_QR_CODE.HTML`
- `migrations/create_hardware_sessions_table.sql`
- `PROJECT_PROGRESS_REPORT.md`
- Any auth, admin, dashboard, or QR-transfer files connected to the current workflow

## Why the machine session connection matters

The machine session is not optional. It is what keeps the live connection between the user, the QR transfer page, and the ESP32 or waste-sorting machine.

- If the session connection is lost, live updates can stop.
- If the session expires or is deleted too early, points may not transfer.
- The system depends on session tracking to record the machine state, sorting activity, and audit logs.
- Only one active session per user should exist at a time.
- The transfer must happen before the session ends, or the pending points can be lost.

Because of that, the AI must preserve:

- session creation logic
- session validation logic
- device or machine identifier mapping
- live update routes
- transfer-point actions
- audit/logging rows tied to the session

## Merge behavior the AI should follow

1. Keep the code that creates and validates the machine session.
2. Keep the code that links the user to the machine through the session or device ID.
3. Keep the code that allows live point updates before final transfer.
4. Keep the code that writes transfer and session logs.
5. If the partner file changes UI text or layout only, merge those changes without touching the session logic.
6. If both files change the same session feature, combine them only if the final result still keeps live machine tracking working.

## Conflict resolution hints

- For progress-report features, do not downgrade a completed feature to an older version.
- For session code, prefer the version that keeps the connection active and traceable.
- For database changes, preserve the columns or tables required by the session workflow.
- For frontend changes, keep the QR page able to display live session status and transfer points.

## Safe merge checklist

- Confirm the merged files still match the behavior in `PROJECT_PROGRESS_REPORT.md`.
- Confirm the machine session connection still exists after the merge.
- Confirm the QR transfer page still talks to the backend correctly.
- Confirm live updates and final transfer still work together.
- Confirm no session data is lost during the merge.

## Short instruction for the AI

Merge the project by preserving the latest progress report changes first, then combine the partner’s changes only where they do not break the machine session connection, point transfer flow, or logged session history.