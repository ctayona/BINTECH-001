# Project Progress Report

## Start of Work
- [x] Scanned the project structure and identified the main app files.
- [x] Removed unnecessary/redundant files from the repository.

## Authentication
- [x] Restored Google login support.
- [x] Wired Google Identity Services into the app.
- [x] Fixed Google signup so it auto-fills the signup form instead of logging in directly.
- [x] Verified the auth flow works with the current credentials setup.

## Account Creation and Profiles
- [x] Fixed staff account ID generation.
- [x] Corrected duplicate key issues during staff/other account creation.
- [x] Stabilized profile creation across role-based account tables.

## Admin Account Management
- [x] Added admin delete support for user accounts.
- [x] Narrowed deletion so logs and sessions are preserved.
- [x] Added confirmation UI for delete actions.
- [x] Added promote and demote account conversion actions.
- [x] Added typed CONFIRM validation for account conversion.
- [x] Added role selection for demotion so the target table is explicit.
- [x] Kept user-side data intact when promoting accounts to admin.
- [x] Adjusted demotion flow to restore the account back into user-side storage.

## Mobile and Navigation
- [x] Added mobile-friendly navigation behavior.
- [x] Preserved sidebar/navigation behavior for small screens.
- [x] Added popup-style mobile nav menus on user pages (Dashboard, History, Profile, QR Transfer).
- [x] Hid desktop-only points badge/logout from compact mobile header to prevent touch blocking.
- [x] Kept the existing user visual style while improving mobile page-to-page navigation access.
- [x] Refined the user QR page scanner container to be smaller and more professional on web and mobile.
- [x] Matched the standard user page mobile dropdown behavior to the QR/How It Works reference pattern.
- [x] Removed the conflicting notification icon from the standard user page headers.

## Website Logs and Redemptions
- [x] Fixed redeemed reward attribution so Website Logs resolves the real user name instead of showing Unknown user.
- [x] Aligned redemption and activity lookups to honor both account ids and system ids.
- [x] Cleaned up the redemption process logging order so the server no longer references points before they are calculated.
- [x] Stored redemption `user_id` using the campus/account identifier and saved the user Gmail on redemption rows.
- [x] Extended Website Logs to resolve redemption rows through student, faculty, and staff account tables.

## User Experience Pages
- [x] Improved the user dashboard activity statistics so the counts load from live account data.
- [x] Wired the user dashboard Start Scanning action to the QR transfer page.
- [x] Reworked the How It Works page into a flow-based explanation of the live kiosk logic.
- [x] Removed the live scanner block from How It Works and replaced it with a Start Earning Points CTA.

## Bin Management
- [x] Added a circular bin-capacity UI for BINTECH-SORTER-001.
- [x] Displayed Metal, Plastic, and Paper capacity states.
- [x] Added visual indicators for full/near-full status.
- [x] Added a combined machine telemetry table for live capacity and sorting totals.
- [x] Connected ESP32 full-state telemetry to Supabase as `FULL`.
- [x] Updated Bin Management to render `FULL` as 100%.
- [x] Added live sorting totals tracking for metal, plastic, paper, total waste, and points.
- [x] Added BINTECH-SORTER-001 Session Logs button and modal view.
- [x] Session Logs now show user email, material counts, points, and timestamps from machine_sessions.

## Dashboard Analytics
- [x] Reviewed the admin dashboard structure and existing charts.
- [x] Added backend summary data for total collected waste.
- [x] Added material breakdown totals for Metal, Plastic, and Paper.
- [x] Added a new waste collection analytics card to the admin dashboard.
- [x] Added material filter buttons and a donut-style visualization.
- [x] Made waste analytics read from the combined machine telemetry row when available.
- [x] Enhanced dashboard pie analytics to include total points and total waste context.
- [x] Added mini capacity bars for Metal/Plastic/Paper linked to machine telemetry FULL state.
- [x] Added system statistics panel (accounts, sessions, rewards, collections).
- [x] Moved System Statistics to the top area of the admin dashboard above the main page header.
- [x] Replaced the "Waste Collection Analytics" section with a waste-type statistics pie/legend view using live material breakdown data.
- [x] Added operational total cards for waste sorted, points generated, and per-material counts.
- [x] Updated the admin pie analytics to display live counts for metal, plastic, and paper.

## Current State
- [x] Google login works.
- [x] Google signup auto-fills correctly.
- [x] Admin account management actions are wired.
- [x] Dashboard analytics now shows collected waste totals and breakdowns.
- [x] BINTECH-SORTER-001 capacity now shows live FULL/100% state from telemetry.
- [ ] Final runtime verification is still needed after restarting the Node server and applying the new Supabase migration.

## Notes
- [x] The report follows the work from the beginning through the latest dashboard updates.
- [x] This file is intended as a simple progress checklist for the full implementation history.
