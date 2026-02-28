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

## What Needs To Be Done Next

### Admin Portal — Remaining Pages
Copy-paste from `frontend/admin/src/pages/` → `frontend/Web/src/components/admin/` + wire route files:
- [ ] `Courses.tsx` → `/admin/courses`
- [ ] `Teachers.tsx` → `/admin/teachers`
- [ ] `Students.tsx` → `/admin/students`
- [ ] `Users.tsx` → `/admin/users`
- [ ] `Analytics.tsx` → `/admin/analytics`
- [ ] `Financials.tsx` → `/admin/financials`
- [ ] `Settings.tsx` → `/admin/settings`
- [ ] `Help.tsx` → `/admin/help`
- [ ] `Profile.tsx` → `/admin/profile`

### Teacher Portal
- [ ] Port `teacher/src/components/TeacherLayout.tsx` → `src/components/teacher/TeacherLayoutComponent.tsx`
- [ ] Port all teacher pages from `teacher/src/pages/`
- [ ] Wire route files under `(dashboard)/teacher/`

### Student Portal
- [ ] Port `student/src/components/StudentLayout.tsx` → `src/components/student/StudentLayoutComponent.tsx`
- [ ] Port all student pages from `student/src/pages/`
- [ ] Wire route files under `(dashboard)/student/`

### Landing Pages
- [ ] Port landing site from `frontend/landing/` → `src/app/(public)/` routes

### Final Steps
- [ ] Update `docker-compose.yml` to serve single frontend
- [ ] Full testing of all portals
- [ ] Remove old frontend directories

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
├── public/images/          # Static assets (teacher.ico, student.ico)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx          # Root layout (fonts, providers)
│   │   ├── page.tsx            # Landing placeholder
│   │   ├── providers.tsx       # MUI + React Query + Auth + Theme
│   │   ├── login/page.tsx      # Unified login (ported from admin)
│   │   └── (dashboard)/
│   │       ├── layout.tsx      # Auth check wrapper
│   │       ├── admin/
│   │       │   ├── layout.tsx  # RoleGuard + AdminLayoutComponent
│   │       │   └── page.tsx    # Dashboard page
│   │       ├── teacher/
│   │       │   ├── layout.tsx  # RoleGuard (placeholder)
│   │       │   └── page.tsx    # Placeholder
│   │       └── student/
│   │           ├── layout.tsx  # RoleGuard (placeholder)
│   │           └── page.tsx    # Placeholder
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayoutComponent.tsx  # Sidebar + Header (ported)
│   │   │   └── Dashboard.tsx             # Dashboard page (ported)
│   │   └── shared/
│   │       ├── RoleGuard.tsx
│   │       └── ErrorBoundary.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/               # 12 unified API services
│   ├── types/index.ts
│   └── middleware.ts
├── .env.local
└── migrate.md                  # THIS FILE
```
