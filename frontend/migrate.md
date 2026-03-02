# Frontend Consolidation Migration

## Project Overview

**Edunura LMS** — a Learning Management System with a Node.js/Express backend and **4 separate React (Vite) frontends**:

| Portal | Dir | Port | Role |
|--------|-----|------|------|
| Admin | `frontend/admin` | 3001 | Admin/Moderator dashboard |
| Teacher | `frontend/teacher` | 3002 | Teacher course management |
| Student | `frontend/student` | 3003 | Student learning interface |
| Landing | `frontend/landing` | 3004 | Public marketing site |

**Goal:** Merge all 4 into a **single Next.js app** at `frontend/Web` using the App Router with role-based routing (`/admin/*`, `/teacher/*`, `/student/*`, `/` for landing).

**Backend:** Runs on port `5000` at `http://localhost:5000/api`. No backend changes needed.

---

## Architecture Decisions

- **Framework:** Next.js 15 (App Router)
- **UI Library:** Material UI (same as originals)
- **State:** React Query + AuthContext + ThemeContext
- **Routing:** `(dashboard)/admin/*`, `(dashboard)/teacher/*`, `(dashboard)/student/*` with `RoleGuard` per portal
- **Migration Strategy:** Direct copy-paste from originals → minimal changes (swap `useNavigate`→`useRouter`, `useLocation`→`usePathname`, `<Outlet />`→`{children}`, `RouterLink`→Next.js `Link`, update import paths to `@/services/` and `@/context/`)

---

## Chat 1 — Completed Work

### Phase 1: Project Setup
- [x] Initialized Next.js project in `frontend/Web`
- [x] Installed all dependencies (MUI, Redux Toolkit, React Query, etc.) with `--legacy-peer-deps`
- [x] Set up project structure (`src/services/`, `src/context/`, `src/types/`, `src/components/`)

### Phase 2: Shared Infrastructure
- [x] **12 API service files** in `src/services/` (consolidated from ~23 duplicates across portals):
  - `apiClient.ts`, `authService.ts`, `courseService.ts`, `enrollmentService.ts`, `paymentService.ts`, `profileService.ts`, `settings.ts`, `users.ts`, `teachers.ts`, `students.ts`, `categories.ts`, `liveClassService.ts`
- [x] **Context providers:** `AuthContext.tsx` (login/logout/role routing), `ThemeContext.tsx` (dynamic theming from backend)
- [x] **Providers wrapper:** `src/app/providers.tsx` (MUI + React Query + Theme + Auth)
- [x] **TypeScript types:** `src/types/index.ts` (User, Course, Lesson, Enrollment, Payment, etc.)
- [x] **Middleware:** `src/middleware.ts` (basic route protection)
- [x] **Route structure:** `(dashboard)/admin/`, `(dashboard)/teacher/`, `(dashboard)/student/` with `RoleGuard` layouts
- [x] **Shared components:** `RoleGuard.tsx`, `ErrorBoundary.tsx`
- [x] `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### Phase 3: Login Page
- [x] Ported `admin/src/pages/auth/Login.tsx` → `src/app/login/page.tsx`
- [x] Changes: `useNavigate`→`useRouter`, imports → `@/services/`, title → "LMS Portal"

### Phase 4: Admin Layout + Dashboard
- [x] Ported `admin/src/components/AdminLayout.tsx` → `src/components/admin/AdminLayoutComponent.tsx`
  - Changes: `useNavigate`→`useRouter`, `useLocation`→`usePathname`, `<Outlet />`→`{children}`, paths prefixed `/admin/`, icon imports from `/images/` public dir
- [x] Ported `admin/src/pages/Dashboard.tsx` → `src/components/admin/Dashboard.tsx`
  - Changes: `RouterLink`→Next.js `Link`, `to=`→`href=`
- [x] Copied icon assets (`teacher.ico`, `student.ico`) to `public/images/`
- [x] Wired up `(dashboard)/admin/layout.tsx` and `(dashboard)/admin/page.tsx`
- [x] Fixed flex width issue: added `minWidth: 0`, `overflow: 'hidden'` to main content Box
- [x] Fixed CSS resets in `globals.css` for `html, body` full width/height

---

## Chat 2 — Completed Work

### Phase 5: Admin Pages — Bulk Migration
- [x] **Users.tsx** → `/admin/users` — User management with CRUD, role filters, search
- [x] **Courses.tsx** → `/admin/courses` — Course listing with grid cards, search, filters, pagination, delete
- [x] **Teachers.tsx** → `/admin/teachers` — Teacher management page
- [x] **Students.tsx** → `/admin/students` — Student management page
- [x] **Settings.tsx** → `/admin/settings` — System settings page
- [x] **CourseCategories.tsx** → `/admin/courses/categories` — Category listing
- [x] **CreateCourseCategory.tsx** → `/admin/courses/categories/create` — Create category
- [x] **EditCourseCategory.tsx** → `/admin/courses/categories/edit/[id]` — Edit category

### Phase 6: Course Creation (5-Tab Form)
- [x] **CreateCourse.tsx** → `/admin/courses/create` — Full course creation form with tabbed UI
  - Tab 0: Basic Information (title, description, category, level, outcomes, prerequisites, thumbnail, intro video)
  - Tab 1: Pricing (price, discounted price, free toggle, validity period)
  - Tab 2: Instructors (instructor assignment)
  - Tab 3: Students (enrollment management, requires courseId)
  - Tab 4: Settings (forum, rating, certificate, visibility, SEO meta)
- [x] **PricingSection.tsx** — Pricing tab component
- [x] **InstructorSection.tsx** — Instructor tab component
- [x] **SettingsSection.tsx** — Settings tab component
- [x] **StudentsSection.tsx** — Students tab component
- [x] **VideoPlayer.tsx** — Dynamic import video player component (SSR-safe)

### Phase 7: Curriculum System (7 Components)
- [x] **CurriculumSection.tsx** — Main curriculum manager with drag-and-drop section/lesson ordering
- [x] **AddModuleModal.tsx** — Dialog for creating/editing course sections
- [x] **AddLessonModal.tsx** — Dialog for selecting lesson type (video/text/live)
- [x] **SimpleLessonModal.tsx** — Quick lesson creation modal
- [x] **VideoLessonUpload.tsx** — Video lesson upload with progress tracking
- [x] **TextMediaLessonUpload.tsx** — Rich text lesson editor (EditorJS)
- [x] **LiveClassLessonUpload.tsx** — Zoom live class lesson scheduling
- [x] Installed react-quill-new, 12 EditorJS plugins, react-sortablejs, sortablejs
- [x] Created `editorjs.d.ts` type declarations for all 15 EditorJS modules

### Phase 8: Curriculum Tab Reorder + Save Bug Fix
- [x] Moved Curriculum tab to 2nd position: `['Basic Information', 'Curriculum', 'Pricing', 'Instructors', 'Students', 'Settings']`
- [x] **Fixed critical save bug** — Root cause: `buildFormData()` returned `FormData` but backend `POST /courses` had no multer middleware, so `req.body.title` was undefined
  - Changed `buildFormData` → `buildCourseData` returning plain JSON object
  - Updated `createCourse` service type from `FormData` to `Record<string, unknown>`
  - Imported and wired `updateCourse` — now used when `courseId` already exists (prevents duplicate creation)

### Phase 9: Edit Course + Thumbnail Fix
- [x] **Edit course route** → `/admin/courses/edit/[id]` — Reuses `CreateCourse` component with `editCourseId` prop
- [x] `CreateCourse` now detects edit mode via `isEditMode = !!editCourseId`
- [x] Added `useEffect` to load course data via `getCourse(id)` — populates all form state (title, description, category, pricing, instructors, settings, thumbnail, video, outcomes, prerequisites)
- [x] Breadcrumb and header update to "Edit Course" in edit mode; save button shows "Save Changes"
- [x] **Fixed thumbnail preview** — `src` was double-wrapping `STATIC_ASSETS_BASE_URL` for non-blob URLs; now uses `thumbnail` directly since it's always a usable URL

### Phase 10: Remaining Admin Pages (Final 3)
- [x] **Profile.tsx** → `/admin/profile` — Admin profile page with:
  - View/edit personal info (first name, last name, phone)
  - Avatar upload with validation (5MB max, JPG/PNG only)
  - Change password dialog with visibility toggles
  - Security settings card (2FA toggle placeholder)
  - Recent login activity table (placeholder data)
  - localStorage sync for immediate navbar updates
- [x] **Fixed `profileService.ts`** — Aligned API routes with backend (`PUT /profile`, `PUT /profile/change-password`, `POST /profile/upload-avatar`) + added TypeScript interfaces
- [x] **LiveClassSession.tsx** → `/admin/live-class/[meetingId]` — Embedded Zoom SDK meeting within admin layout (sidebar visible)
- [x] **StandaloneLiveClass.tsx** → `/meeting/[meetingId]` — Full-screen standalone meeting page (no sidebar/layout)
  - Three join options: direct join with password, browser Zoom web, desktop Zoom app
- [x] Installed `@zoom/meetingsdk@^5.1.2`

### Admin Portal — 100% Complete
All 15 admin routes fully migrated:

| Route | Component | Status |
|-------|-----------|--------|
| `/login` | Login | ✅ |
| `/admin` | Dashboard | ✅ |
| `/admin/courses` | Courses | ✅ |
| `/admin/courses/create` | CreateCourse | ✅ |
| `/admin/courses/edit/[id]` | CreateCourse (edit mode) | ✅ |
| `/admin/courses/categories` | CourseCategories | ✅ |
| `/admin/courses/categories/create` | CreateCourseCategory | ✅ |
| `/admin/courses/categories/edit/[id]` | EditCourseCategory | ✅ |
| `/admin/teachers` | Teachers | ✅ |
| `/admin/students` | Students | ✅ |
| `/admin/users` | Users | ✅ |
| `/admin/settings` | Settings | ✅ |
| `/admin/profile` | Profile | ✅ |
| `/admin/live-class/[meetingId]` | LiveClassSession | ✅ |
| `/meeting/[meetingId]` | StandaloneLiveClass | ✅ |

---
llo
## Chat 3 — Teacher Portal Migration (COMPLETE)

### Phase 11: Teacher Layout + Dashboard
- [x] **Ported TeacherLayoutComponent.tsx** → `src/components/teacher/TeacherLayoutComponent.tsx`
  - Changes: `useNavigate`→`useRouter`, `useLocation`→`usePathname`, `<Outlet />`→`{children}`
  - Updated sidebar paths: `/dashboard` → `/teacher`, `/courses` → `/teacher/courses`, etc.
  - Maintained theming from settings (site_name, org_logo)
  - User profile card with avatar, name, and role
  - Mobile responsive with drawer toggle
- [x] **Created TeacherLayout route wrapper** → `(dashboard)/teacher/layout.tsx`
  - Integrated RoleGuard for teacher-only access
  - Wraps all /teacher/* routes
- [x] **Ported TeacherDashboard** → `src/components/teacher/Dashboard.tsx`
  - Changes: Simplified service calls (using `getLiveSessions` instead of custom `getLiveClassesByCourse`)
  - Displays: Assigned courses count, total students, upcoming classes, motivational quotes
  - Stats cards with icons and dynamic theming
  - Responsive grid layout (MUI v7 `size` prop format)
- [x] **Wired dashboard page** → `(dashboard)/teacher/page.tsx`

### Phase 12: Remaining Teacher Pages
- [x] **Ported Courses.tsx** → `src/components/teacher/Courses.tsx`
  - Course listing with search, sort, grid cards, create/edit/delete actions
  - Navigates to `/teacher/courses/[id]/manage` for curriculum editing
- [x] **Ported Calendar.tsx** → `src/components/teacher/Calendar.tsx`
  - Monthly calendar view with live class events, day-click popover with session details
- [x] **Ported LiveClasses.tsx** → `src/components/teacher/LiveClasses.tsx`
  - Upcoming & past live sessions table, join/copy link actions
- [x] **Ported Profile.tsx** → `src/components/teacher/Profile.tsx`
  - View/edit personal info, avatar upload, change password dialog

### Phase 13: Curriculum System (Teacher)
- [x] **ManageCourse.tsx** → `src/components/teacher/ManageCourse.tsx`
  - Loads course by `[id]` param, breadcrumb nav, renders CurriculumSection
- [x] **CurriculumSection.tsx** → `src/components/teacher/CurriculumSection.tsx`
  - Full curriculum manager: add/edit/delete modules and lessons, drag-to-reorder
- [x] **AddModuleModal.tsx** → `src/components/teacher/modals/AddModuleModal.tsx`
  - Create and edit course modules/sections
- [x] **AddLessonModal.tsx** → `src/components/teacher/modals/AddLessonModal.tsx`
  - Phase-based orchestrator: type selector (create) or direct editor (edit)
  - Routes to Video / Text / Live / Quiz sub-editors
- [x] **VideoLessonUpload.tsx** → `src/components/teacher/lessons/VideoLessonUpload.tsx`
  - Upload file or enter URL, VideoPlayer preview, resource attachments, upload progress bar
- [x] **TextMediaLessonUpload.tsx** → `src/components/teacher/lessons/TextMediaLessonUpload.tsx`
  - EditorJS rich text editor (14 plugins), draft auto-save to localStorage, resource sidebar, image upload
- [x] **LiveClassLessonUpload.tsx** → `src/components/teacher/lessons/LiveClassLessonUpload.tsx`
  - Zoom session scheduling: date/time picker, duration (hours + minutes), free account 40-min limit, resource attachments
  - Uses `createLiveSession` / `updateLiveSession` from `liveClassService`

### Phase 14: Bug Fixes & Route Corrections
- [x] **Fixed StandaloneLiveClass.tsx** — Was a stub with commented-out code; fully ported to call `getLiveClassSignature()`, displays Zoom join options (Join Meeting / Open in Browser / Open Zoom App)
- [x] **Fixed `/teacher/live-class/[meetingId]` route** — Malformed folder `[meetingId\]` (literal backslash) existed; created correct `live-class/[meetingId]/page.tsx`
- [x] **Removed corrupt folders** — `courses/[id\]`, `live-class/[meetingId\]`, `courses/[id` (all malformed from previous session)

### Teacher Portal — 100% Complete

| Route | Component | Status |
|-------|-----------|--------|
| `/teacher` | Dashboard | ✅ |
| `/teacher/courses` | Courses | ✅ |
| `/teacher/courses/[id]/manage` | ManageCourse → CurriculumSection | ✅ |
| `/teacher/live-classes` | LiveClasses | ✅ |
| `/teacher/live-class/[meetingId]` | StandaloneLiveClass | ✅ |
| `/teacher/calendar` | Calendar | ✅ |
| `/teacher/profile` | Profile | ✅ |

---

## What Needs To Be Done Next

### Student Portal
- [ ] Port `student/src/components/StudentLayout.tsx` → `src/components/student/StudentLayoutComponent.tsx`
- [ ] Port all student pages from `student/src/pages/`
- [ ] Wire route files under `(dashboard)/student/`

### Quiz Builder
- [ ] Build `src/components/teacher/lessons/QuizLessonUpload.tsx` — currently saves title only (placeholder)
- [ ] Wire into `AddLessonModal.tsx` `phase === 'quiz'` conditional

### Landing Pages
- [ ] Port landing site from `frontend/landing/` → integrate into `frontend/Web` or keep separate

### Final Steps
- [ ] Update `docker-compose.yml` to serve single frontend
- [ ] Full testing of all portals
- [ ] Remove old frontend directories (`frontend/admin`, `frontend/teacher`, `frontend/student`)

---

## Migration Pattern (For Reference)

When porting any file, make only these changes:

1. Add `'use client';` at top
2. `import { useNavigate, useLocation } from 'react-router-dom'` → `import { useRouter, usePathname } from 'next/navigation'`
3. `const navigate = useNavigate()` → `const router = useRouter()`
4. `navigate('/path')` → `router.push('/path')`
5. `const location = useLocation()` → `const pathname = usePathname()`
6. `location.pathname` → `pathname`
7. `<Outlet />` → `{children}` (layouts only)
8. `import { Link as RouterLink } from 'react-router-dom'` → `import Link from 'next/link'`
9. `<MuiLink component={RouterLink} to="/path">` → `<MuiLink component={Link} href="/path">`
10. Service imports: `'../services/foo'` → `'@/services/foo'`
11. Asset imports: `import icon from '../assets/images/foo.ico'` → use `/images/foo.ico` from `public/`

---

## File Structure (Current)

```
frontend/Web/
├── public/images/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   ├── login/page.tsx
│   │   ├── meeting/[meetingId]/page.tsx      # Standalone Zoom meeting
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── admin/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx                  # Dashboard
│   │       │   ├── profile/page.tsx
│   │       │   ├── settings/page.tsx
│   │       │   ├── users/page.tsx
│   │       │   ├── teachers/page.tsx
│   │       │   ├── students/page.tsx
│   │       │   ├── courses/
│   │       │   │   ├── page.tsx              # Course listing
│   │       │   │   ├── create/page.tsx
│   │       │   │   ├── edit/[id]/page.tsx
│   │       │   │   └── categories/
│   │       │   │       ├── page.tsx
│   │       │   │       ├── create/page.tsx
│   │       │   │       └── edit/[id]/page.tsx
│   │       │   └── live-class/[meetingId]/page.tsx
│   │       ├── teacher/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx                  # Dashboard
│   │       │   ├── courses/
│   │       │   │   ├── page.tsx              # Course listing
│   │       │   │   └── [id]/manage/page.tsx  # Curriculum editor
│   │       │   ├── live-classes/page.tsx
│   │       │   ├── live-class/[meetingId]/page.tsx
│   │       │   ├── calendar/page.tsx
│   │       │   └── profile/page.tsx
│   │       └── student/
│   │           ├── layout.tsx
│   │           └── page.tsx                  # Placeholder
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayoutComponent.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Courses.tsx
│   │   │   ├── CreateCourse.tsx              # Create + Edit course (tabbed)
│   │   │   ├── CourseCategories.tsx
│   │   │   ├── CreateCourseCategory.tsx
│   │   │   ├── EditCourseCategory.tsx
│   │   │   ├── Teachers.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── LiveClassSession.tsx
│   │   │   └── courses/
│   │   │       ├── PricingSection.tsx
│   │   │       ├── InstructorSection.tsx
│   │   │       ├── SettingsSection.tsx
│   │   │       ├── StudentsSection.tsx
│   │   │       ├── CurriculumSection.tsx
│   │   │       ├── AddModuleModal.tsx
│   │   │       ├── AddLessonModal.tsx
│   │   │       ├── SimpleLessonModal.tsx
│   │   │       ├── VideoLessonUpload.tsx
│   │   │       ├── TextMediaLessonUpload.tsx
│   │   │       └── LiveClassLessonUpload.tsx
│   │   ├── teacher/
│   │   │   ├── TeacherLayoutComponent.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Courses.tsx
│   │   │   ├── ManageCourse.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── LiveClasses.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── StandaloneLiveClass.tsx
│   │   │   ├── modals/
│   │   │   │   ├── AddModuleModal.tsx
│   │   │   │   └── AddLessonModal.tsx        # Phase-based orchestrator
│   │   │   └── lessons/
│   │   │       ├── VideoLessonUpload.tsx
│   │   │       ├── TextMediaLessonUpload.tsx # EditorJS rich text
│   │   │       └── LiveClassLessonUpload.tsx # Zoom scheduler
│   │   ├── shared/
│   │   │   ├── RoleGuard.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── StandaloneLiveClass.tsx
│   │   └── VideoPlayer.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/               # 12 unified API services
│   ├── types/
│   │   ├── index.ts
│   │   └── editorjs.d.ts
│   └── middleware.ts
├── .env.local
└── migrate.md
```
