# Phase 2 Development

## 1. Two-Factor Authentication (2FA) Security
Implimented optional TOTP-based 2FA (via `otplib` and Authentication Apps) with an integrated UI settings component for all user roles. A robust backend flow interrupts standard token issuance with a temporary JWT, validating a final 6-digit OTP before granting session access. 
- **Migration Script:** Created `backend/database/migrations/20260323_add_2fa_columns.sql` to append `two_factor_secret` (VARCHAR) and `is_two_factor_enabled` (BOOLEAN) to the existing `users` table.

## 2. CSV Data Export
Added a unified "Export CSV" feature to the Admin panel (Students, Teachers, and Users pages). This implements a client-side utility (`csvExport.ts`) that reliably formats table data into CSV string formats, complete with Excel-friendly format-preserving techniques (especially for Phone Numbers), and creates a local browser blob download without added backend routing.

## 3. Lesson Discussions
Implemented an interactive discussion board linked directly to individual lessons inside the student `CoursePlayer`, allowing continuous engagement.
- **Migration Script:** Created and executed a dedicated migration script `backend/database/migrations/20260323_create_lesson_discussions.sql` to safely construct the table on the live database.
- **Backend & Database:** Orchestrated a new table `lesson_discussions` linking users to specific lessons with full cascading deletion support. This table is now natively registered inside the `schema.sql` for all future spin-ups.
- **Frontend Execution:** Exchanged the placeholder UI tab in the course player with a fully stylized `<LessonDiscussion />` component that seamlessly leverages the `AuthContext` to display proper names, dynamic avatar initials, and custom `Instructor` badges when applicable.

## 4. Email OTP System (Registration & Forgot Password)
Implemented a secure, stateless Email OTP verification flow for both new account registrations and password resets.
- **Migration Scripts:** 
  - `backend/database/migrations/20260323_add_email_verification_fields.sql`
  - `backend/database/migrations/20260323_create_email_otps_table.sql`
- **Stateless Architecture:** Created an `email_otps` database table to temporarily hold validation codes, ensuring unverified users are never prematurely inserted into the primary `users` table.
- **Frontend Refactoring:** Redesigned the `/register` and `/forgot-password` pages into elegant, multi-step React components that collect user data, trigger OTP emails via `nodemailer`, and validate the 6-digit codes before authorizing account creation or password mutation.
- **Security Enhancements:** Added a 60-second cooldown timer to prevent OTP spam and integrated native `User.beforeUpdate` hooks to securely hash new passwords.

## 5. Content Drip
Implemented a comprehensive content drip system that gives instructors granular control over when students can access individual lessons. Four independent strategies are supported and can be combined per lesson.

- **Migration Script:** `backend/database/migrations/20260323_add_drip_columns.sql`
  - Adds `is_sequential` (BOOLEAN) to the `courses` table.
  - Adds `release_date` (DATE), `drip_days` (INT), and `prerequisite_lesson_id` (INT FK) to the `lessons` table.

### Drip Strategies
| Strategy | Field | Behaviour |
|---|---|---|
| **Scheduled Release** | `release_date` | Lesson unlocks on a specific calendar date regardless of enrollment |
| **Time-Based Unlock** | `drip_days` | Lesson unlocks X days after the student's enrollment date |
| **Sequential Progression** | `is_sequential` (course) | Forces students to complete lessons one-by-one in order |
| **Prerequisite Trigger** | `prerequisite_lesson_id` | Lesson unlocks only after a specific prerequisite lesson is completed |

### Backend Changes
- **`models/Course.ts` & `models/Lesson.ts`:** Added Sequelize field definitions for the four new columns.
- **`modules/courses/controller.ts`:** Drip evaluation engine inside `getCourseById` iterates lessons and checks all four drip conditions against the student's enrollment date and completion progress. Locked lessons have sensitive payload fields stripped (`content_body`, `file_path`, `zoom_join_url`, etc.) and receive `is_locked: true` and a human-readable `lock_reason` string instead.

### Frontend Changes
- **`SettingsSection.tsx` (Admin/Teacher Course Editor):** Added "Enforce Sequential Learning" toggle switch linked to `is_sequential`.
- **`DripSettingsModal.tsx` (Admin/Teacher — New Component):** Centralized modal for per-lesson drip configuration. Supports all four strategies with date picker, number input, and prerequisite lesson dropdown. Fully theme-aware (no hardcoded colors).
- **`CurriculumSection.tsx` (Admin & Teacher):** Added a 🔒 icon button alongside each lesson's edit button that opens the `DripSettingsModal`.
- **`CoursePlayer.tsx` (Student):** Locked lessons display a lock icon in the sidebar instead of a play/check indicator. Clicking a locked lesson renders a "Content Locked" fallback screen with the specific `lock_reason`. All interactive elements (Mark Complete, Tabs, Resources, Discussions) are hidden for locked lessons.
