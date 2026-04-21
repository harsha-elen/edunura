# Edunura LMS — Project Details

**Last Audited:** April 1, 2026 · **Status:** Phase 1 Complete · **Rating:** 7.5/10

---

## Tech Stack

### Backend
- **Runtime:** Node.js 20 + TypeScript 5.3 (strict mode)
- **Framework:** Express.js 4.18
- **Database:** MySQL 8.0 + Sequelize 6 ORM
- **Auth:** JWT (HS256) + Bcrypt + TOTP 2FA (otplib)
- **Payments:** Razorpay SDK
- **Live Classes:** Zoom (OAuth2) + Jitsi (JWT)
- **Email:** Nodemailer (SMTP from DB settings)
- **File Uploads:** Multer (avatars 5MB, courses 1GB)
- **Security:** Helmet, CORS, express-rate-limit

### Frontend
- **Framework:** Next.js 16 + React 19
- **UI:** Material-UI 7 + Tailwind CSS 4
- **State:** React Context (auth, theme) + React Query + Redux Toolkit
- **Editor:** Editor.js (10+ block plugins)
- **Video:** Vidstack player
- **Live:** Jitsi React SDK + Zoom Meeting SDK

### Infrastructure
- **Containers:** Docker (multi-stage Alpine builds)
- **Orchestration:** Docker Compose + Dokploy (Traefik)
- **SSL:** Let's Encrypt (auto via Traefik)

---

## Architecture

```
Browser → Traefik (SSL) → Next.js (:3000) → Express API (:5000) → MySQL
                                                    ↕
                                          Zoom / Jitsi / Razorpay / SMTP
```

**Backend:** Modular monolith — 12 feature modules, each with `controller.ts` + `routes.ts`.  
**Frontend:** Unified Next.js app — public pages + 3 role-based dashboards (`/admin`, `/teacher`, `/student`).  
**Database:** 18 tables, InnoDB, utf8mb4, proper foreign keys & unique constraints.

---

## Modules (12)

| Module | Purpose | Auth |
|--------|---------|------|
| auth | Login, register, 2FA, OTP email verify, password reset | Public |
| profile | Self-service profile + avatar upload | Any user |
| users | Admin/moderator CRUD | Admin |
| teachers | Teacher directory & management | Admin |
| students | Student directory & management | Admin |
| categories | Course categories (hierarchical, tags) | Admin |
| courses | Full course lifecycle (sections, lessons, 6 content types) | Teacher+ |
| enrollments | Enroll, progress, CSV bulk import | Student/Admin |
| payments | Razorpay orders, verify, webhooks, refunds | Student |
| live-classes | Zoom/Jitsi session management | Teacher |
| quiz | Questions, options, attempts, auto-grading | Teacher/Student |
| analytics | *(Empty — not yet implemented)* | — |

---

## Database Tables (18)

| Table | Key Constraints |
|-------|----------------|
| users | Unique email |
| courses | Unique slug, FK → users (created_by) |
| course_categories | Unique name/slug, self-referencing parent_id |
| course_sections | FK → courses, ordered |
| lessons | FK → sections, 6 content types, drip fields |
| lesson_resources | FK → lessons |
| lesson_progress | Unique (course, student, lesson) |
| lesson_discussions | FK → lessons, users |
| enrollments | **Unique (course_id, student_id)** |
| payments | Unique order_id, FK → users + courses |
| live_sessions | FK → courses, zoom/jitsi meeting type |
| quiz_questions | FK → lessons, 3 question types |
| quiz_question_options | FK → questions |
| quiz_attempts | **Unique (lesson_id, student_id)** |
| assignment_submissions | **Unique (lesson_id, student_id)** |
| system_settings | Unique key, 9 categories |
| email_otps | Email, OTP, expiry |

---

## Auth Flow

```
Register: Send OTP → Verify OTP → Create user → Issue JWT (7d) + Refresh (30d)
Login:    Verify password → [2FA check] → [Email verify check] → Issue tokens
Refresh:  POST /api/auth/refresh with refresh token → New access token
```

**Roles:** `admin` · `moderator` · `teacher` · `student`  
**Middleware:** `authenticate` (JWT verify + DB user lookup) → `authorize(...roles)`

---

## Lesson Content Types

| Type | Details |
|------|---------|
| video | File upload or URL, Vidstack player |
| text | Editor.js rich content (HTML blocks) |
| quiz | Multiple choice, true/false, short answer — auto-graded |
| assignment | Student uploads PDF, teacher reviews/scores/feedback |
| live | Zoom or Jitsi session with scheduling |
| document | Downloadable file resources |

---

## Payment Flow

```
Student → createOrder (Razorpay) → Pay → verifyPayment (signature check) → Auto-enroll
            ↑                                              ↑
     POST /api/payments/create-order          POST /api/payments/verify-payment
                                    
Webhook: POST /api/payments/webhook (public, signature-verified)
```

---

## Frontend Routes

### Public
`/` · `/login` · `/register` · `/forgot-password` · `/courses` · `/course-details/:id` · `/checkout/:id` · `/about` · `/contact` · `/meeting`

### Student (`/student`)
Dashboard · `/courses` · `/live-classes` · `/calendar` · `/profile` · `/help`

### Teacher (`/teacher`)
Dashboard · `/courses` · `/courses/[id]/manage` · `/assignments` · `/live-classes` · `/live-class` · `/calendar` · `/profile`

### Admin (`/admin`)
Dashboard · `/users` · `/teachers` · `/students` · `/courses` · `/courses/create` · `/courses/categories` · `/assignments` · `/live-class/[meetingId]` · `/settings` · `/profile`

---

## Docker Services

| Service | Image | Port | Network |
|---------|-------|------|---------|
| db | mysql:8.0 | 3306 (internal) | lms_internal |
| backend | harshath/lms-backend:latest | 5000 | lms_internal + dokploy-network |
| web-app | harshath/lms-web:latest | 3000 | dokploy-network |

**Volumes:** `db_data` (MySQL persistence), `uploads_data` (course files persistence)

---

## Key Environment Variables

```env
# Database
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD

# Auth
JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN

# Services
JITSI_DOMAIN, JITSI_APP_ID, JITSI_APP_SECRET
FRONTEND_URL, BACKEND_URL

# Frontend (build-time)
NEXT_PUBLIC_API_URL
```

Zoom, Razorpay, and SMTP credentials are managed via Admin Settings panel → stored in `system_settings` table.

---

## Security Issues Found

### Critical
| # | Issue | Location |
|---|-------|----------|
| 1 | **JWT access token defaults to 7 days** (should be 15-60 min) | `backend/src/utils/jwt.ts` |
| 2 | **`/uploads` serves paid content without auth** | `backend/src/server.ts` L49 |
| 3 | **OTP uses `Math.random()`** — not cryptographically secure | auth controller |
| 4 | **OTP field reused** for password reset and email verification | users table `reset_password_token` |
| 5 | **Timing-unsafe string comparisons** on OTPs and webhook signatures | auth controller, razorpayService |
| 6 | **Tokens stored in localStorage** — XSS exposure | frontend AuthContext |
| 7 | **Console logs expose API requests/responses** in production | frontend apiClient.ts |

### High
| # | Issue | Location |
|---|-------|----------|
| 8 | Missing course ownership check on update/delete | courses controller |
| 9 | Jitsi `isHost` determined by client input, not server | jitsiService |
| 10 | No JWT validation in Next.js edge middleware | frontend middleware.ts |
| 11 | Payment amount not cross-verified with course price | payments controller |
| 12 | Webhook returns 500 on error → Razorpay retries → potential duplicates | payments controller |

---

## What's Missing

- **Tests:** Zero — no unit, integration, or E2E tests
- **Logging:** Only `console.log` — no structured logging (Winston/Pino)
- **API Docs:** No Swagger/OpenAPI
- **Caching:** No Redis — every request hits MySQL
- **Settings Encryption:** `is_encrypted` flag exists but encryption never implemented
- **Audit Log:** No tracking of admin actions
- **Backup Strategy:** No automated DB backup configured
- **Monitoring:** No APM (Sentry, DataDog, etc.)

---

## Feature Status

| Feature | Status |
|---------|--------|
| Multi-role auth + 2FA + OTP verify | ✅ Complete |
| Course builder (sections, 6 lesson types) | ✅ Complete |
| Quizzes (3 types, auto-grading) | ✅ Complete |
| Assignments (submit, review, score) | ✅ Complete |
| Enrollment + progress tracking | ✅ Complete |
| Razorpay payments | ✅ Complete |
| Zoom live classes | ✅ Complete |
| Jitsi live classes | ✅ Complete |
| Discussion forums | ✅ Complete |
| Admin/Teacher/Student dashboards | ✅ Complete |
| System settings + branding | ✅ Complete |
| Drip content / prerequisites | ⚠️ Partial (DB ready, logic partial) |
| Certificates | ⚠️ Partial (flag exists, generation not built) |
| Analytics dashboard | ❌ Not started |
| Notifications (WebSocket) | ❌ Not started |
| Mobile app / PWA | ❌ Not started |
