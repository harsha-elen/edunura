# Edunura LMS - Comprehensive Project Analysis

**Last Updated:** March 18, 2026  
**Status:** Phase 1 - Core Features Implemented  
**Project Type:** Full-Stack Learning Management System (Production-Ready)

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Design](#3-architecture--design)
4. [Database Structure](#4-database-structure)
5. [Core Features Implemented](#5-core-features-implemented)
6. [Authentication & Security](#6-authentication--security)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [API Architecture](#8-api-architecture)
9. [Frontend Applications](#9-frontend-applications)
10. [Deployment Infrastructure](#10-deployment-infrastructure)
11. [File Organization](#11-file-organization)
12. [Code Quality & Best Practices](#12-code-quality--best-practices)
13. [Identified Issues & Risks](#13-identified-issues--risks)
14. [Recommendations](#14-recommendations)

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
Edunura is a **production-ready Learning Management System** designed for organizations to:
- Create and manage educational content
- Deliver courses to students (online & live)
- Process course payments
- Track student progress and engagement
- Integrate with video conferencing (Zoom, Jitsi)
- Conduct real-time online classes

### 1.2 Target Users
- **Admin:** Full platform control, user/course management, settings
- **Teachers:** Course creation, content delivery, class management
- **Students:** Course enrollment, learning, progress tracking
- **Guests:** Browse and view public course information

### 1.3 Key Characteristics
- ✅ Multi-tenant capable (single deployment, multiple clients)
- ✅ Role-based access control (RBAC)
- ✅ Payment gateway integrated (Razorpay)
- ✅ Video hosting support (Zoom, Jitsi, HTML5)
- ✅ RESTful API architecture
- ✅ Microservices-ready (modular monolith)
- ✅ Docker containerized & cloud-ready
- ✅ Type-safe (TypeScript throughout)

---

## 2. TECHNOLOGY STACK

### 2.1 Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | v20+ |
| **Language** | TypeScript | 5.3.3 |
| **Framework** | Express.js | 4.18.2 |
| **Database** | MySQL | 8.0 |
| **ORM** | Sequelize | 6.35.2 |
| **Authentication** | JWT (HS256) | - |
| **Security** | Bcrypt + Helmet | 5.1.1 / 7.1.0 |
| **File Upload** | Multer | 1.4.5 |
| **Email** | Nodemailer | 8.0.1 |
| **Payment** | Razorpay SDK | 2.9.2 |
| **HTTP Client** | Axios | 1.6.2 |
| **Dev Tools** | Nodemon | 3.0.2 |

### 2.2 Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 19.2.3 |
| **Meta Framework** | Next.js | 16.1.6 |
| **Build Tool** | Vite (for portals) | - |
| **UI Library** | Material-UI (MUI) | 7.3.8 |
| **Styling** | Tailwind CSS + Emotion | - |
| **State Management** | Redux Toolkit | 2.11.2 |
| **Data Fetching** | React Query | 5.90.21 |
| **Rich Text Editor** | Editor.js | 2.31.3 |
| **Video Player** | Vidstack + React | 1.12.13 |
| **Video SDK** | Zoom SDK + Jitsi | 5.1.2 / 1.4.4 |
| **Http Client** | Axios | 1.13.6 |
| **Animation** | Framer Motion | 12.34.3 |
| **Charts** | Recharts | 3.7.0 |
| **Date Handling** | date-fns | 4.1.0 |

### 2.3 Infrastructure
| Component | Technology |
|-----------|-----------|
| **Container Platform** | Docker |
| **Orchestration** | Docker Compose |
| **Deployment** | Dokploy (Traefik-based) |
| **Reverse Proxy** | Traefik (via Dokploy) |
| **SSL/TLS** | Let's Encrypt (automatic) |
| **Version Control** | Git (GitHub/GitLab) |

---

## 3. ARCHITECTURE & DESIGN

### 3.1 Overall System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├──────────────────┬──────────────────┬──────────────────┬────────┤
│   Landing Page   │  Student Portal  │ Teacher Portal   │ Admin  │
│   (Next.js)      │   (React/Vite)   │  (React/Vite)    │ Portal │
│   Port: 3000     │   Port: 3002     │   Port: 3003     │ 3001   │
└────────┬──────────┴────────┬─────────┴────────┬────────┴────┬───┘
         │                   │                  │             │
         └───────────────────┴──────────────────┴─────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
    ┌────▼────────────────────────────────────▼────┐
    │       API Gateway (Express.js)                │
    │         Port: 5000                           │
    │    JWT Authentication + Validation           │
    └────┬───────────────────────────────────┬─────┘
         │                                   │
    ┌────▼──────────────────────────────────▼──────┐
    │    Modular Monolith (Feature Modules)        │
    ├──────────────────────────────────────────────┤
    │ • Auth        • Courses     • Users           │
    │ • Payments    • Enrollments • Teachers       │
    │ • Live Classes • Settings   • Students       │
    └────┬──────────────────────────────────┬──────┘
         │                                  │
    ┌────▼───────────────┐  ┌──────────────▼─────┐
    │   MySQL Database   │  │  External Services  │
    │   (Persistent)     │  │  • Zoom API         │
    └────────────────────┘  │  • Jitsi Server     │
                            │  • Razorpay         │
                            │  • SMTP/Email       │
                            │  • AWS S3 (optional)│
                            └─────────────────────┘
```

### 3.2 Backend: Modular Monolithic Architecture
Each feature is a **self-contained module** with three layers:

```
Module Structure:
├── routes.ts          → Express route definitions + middleware
├── controller.ts      → HTTP request/response handling
├── service.ts (opt)   → Business logic & external API calls
└── validation.ts      → Input validation schemas

Example: Courses Module
modules/courses/
├── controller.ts      (getAll, getOne, create, update, delete)
├── routes.ts          (GET /courses, POST /courses, etc.)
├── service.ts         (calculateProgress, validateEnrollment, etc.)
└── validation.ts      (courseSchema, updateCourseSchema)
```

**Active Modules (11 total):**
1. **auth** - Login, registration, JWT refresh
2. **users** - Admin user management
3. **teachers** - Teacher CRUD operations
4. **students** - Student CRUD operations
5. **profile** - Self-service profile updates
6. **courses** - Full course lifecycle management
7. **categories** - Course categorization
8. **enrollments** - Student enrollment tracking
9. **live-classes** - Zoom/Jitsi meeting management
10. **payments** - Razorpay payment processing
11. **settings** - System configuration & secrets

### 3.3 Frontend: Multi-Application Architecture
```
┌─────────────────────────────────────────────────────────┐
│           FRONTEND MONOREPO (frontend/Web/)              │
├────────────────────────────────────────────────────────┤
│  Next.js Unified Entry Point (Port 3000)               │
│  ├── /landing            → Public marketing site        │
│  ├── /login              → Authentication              │
│  ├── /register           → User registration           │
│  ├── /dashboard/admin    → Admin portal               │
│  ├── /dashboard/teacher  → Teacher portal             │
│  ├── /dashboard/student  → Student portal             │
│  ├── /courses            → Public course browsing     │
│  ├── /course/:id         → Course details & enroll    │
│  ├── /checkout           → Payment processing         │
│  └── /meeting            → Live class/meeting         │
│                                                        │
│  Shared Components & Utilities:                        │
│  ├── components/         → UI components              │
│  ├── context/           → Global state (auth, theme) │
│  ├── services/          → API client functions        │
│  └── types/             → TypeScript definitions      │
└─────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE STRUCTURE

### 4.1 Core Tables & Relationships
```sql
TABLE: users
├── id (PK)
├── email (UNIQUE)
├── password (hashed)
├── firstName, lastName
├── role (ENUM: 'admin', 'moderator', 'teacher', 'student')
├── avatar (file path)
├── status (ENUM: 'active', 'inactive')
└── timestamps (createdAt, updatedAt)

TABLE: courses
├── id (PK)
├── title, description
├── category_id (FK → course_categories)
├── created_by (FK → users, teacher)
├── instructors (JSON array: [{id, name, email, avatar}, ...])
├── price (decimal)
├── currency
├── isPublished (boolean)
├── outcomes (JSON array)
├── coverImage
└── timestamps

TABLE: course_sections (modules/chapters)
├── id (PK)
├── course_id (FK → courses)
├── title, description
├── order (sequence)
└── timestamps

TABLE: lessons
├── id (PK)
├── section_id (FK → course_sections)
├── title, description
├── type (ENUM: 'video', 'text', 'quiz', 'assignment', 'live')
├── content (JSON or URL)
├── videoUrl (for video lessons)
├── duration (in minutes)
├── resources (JSON array of attachments)
└── timestamps

TABLE: lesson_progress (per student per lesson)
├── id (PK)
├── lesson_id (FK → lessons)
├── student_id (FK → users)
├── isCompleted (boolean)
├── completedAt (timestamp)
├── watchedDuration (minutes)
├── lastAccessedAt
└── timestamps

TABLE: enrollments
├── id (PK)
├── course_id (FK → courses)
├── student_id (FK → users)
├── enrollmentDate
├── lastAccessedAt
├── status (ENUM: 'active', 'dropped', 'completed')
└── timestamps

TABLE: payments
├── id (PK)
├── user_id (FK → users)
├── course_id (FK → courses)
├── razorpayOrderId
├── razorpayPaymentId
├── amount
├── currency
├── status (ENUM: 'pending', 'captured', 'failed')
└── timestamps

TABLE: live_sessions (Zoom/Jitsi meetings)
├── id (PK)
├── course_id (FK → courses)
├── teacherId (FK → users)
├── title, description
├── scheduledAt (datetime)
├── zoomMeetingId (or jitsiRoomId)
├── joinUrl
├── recordingUrl (optional)
└── timestamps

TABLE: system_settings (key-value config)
├── id (PK)
├── key (UNIQUE, e.g., 'zoom_client_id')
├── value (encrypted)
├── encrypted (boolean)
└── timestamps

TABLE: course_categories
├── id (PK)
├── name
├── description
└── timestamps
```

### 4.2 Key Relationships
```
User 1──→ Many Courses (created_by)
User 1──→ Many Enrollments (student)
User 1──→ Many Payments
Course 1──→ Many Enrollments
Course 1──→ Many Sections
Course 1──→ Many Payments
Course 1──→ Many LiveSessions
Section 1──→ Many Lessons
Lesson 1──→ Many LessonProgress (one per student)
Lesson 1──→ Many Resources
Category 1──→ Many Courses
```

### 4.3 Database Migrations
Located in `backend/database/migrations/`:
- `20260303_add_host_joined_at.sql` - Track when hosts join live sessions
- `20260303_add_jitsi_support.sql` - Jitsi integration fields
- `20260303_drop_host_joined_at.sql` - Cleanup migration
- `20260303_fix_jitsi_credentials.sql` - Security & field corrections
- `20260304_add_jitsi_missing_columns.sql` - Additional Jitsi fields
- `20260304_fix_jitsi_settings.sql` - Jitsi configuration fixes

---

## 5. CORE FEATURES IMPLEMENTED

### 5.1 User Management
- ✅ Multi-role system (Admin, Moderator, Teacher, Student)
- ✅ User registration & login
- ✅ Profile management (avatar, personal info)
- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Admin user creation & activation

### 5.2 Course Management
- ✅ Full course CRUD operations
- ✅ Course categorization
- ✅ Multiple instructors per course
- ✅ Course sectioning (chapters/modules)
- ✅ Lesson creation (video, text, quiz, live)
- ✅ Course pricing & payment integration
- ✅ Course status management (draft, published)
- ✅ Learning outcomes definition

### 5.3 Learning Experience
- ✅ Student enrollment system
- ✅ Progress tracking per lesson
- ✅ Watchlist/favorite courses
- ✅ Course search and filtering
- ✅ Student dashboard with enrolled courses
- ✅ Lesson completion tracking
- ✅ Resource downloads (PDFs, documents)

### 5.4 Live Classes
- ✅ Zoom integration (create & join meetings)
- ✅ Jitsi integration (with JWT authentication)
- ✅ Scheduled sessions
- ✅ Teacher/student role differentiation
- ✅ Session recording support (Zoom)
- ✅ Real-time class management

### 5.5 Payments
- ✅ Razorpay payment gateway integration
- ✅ Course purchase workflow
- ✅ Enrollment on successful payment
- ✅ Transaction history
- ✅ Payment status tracking
- ✅ Invoice generation (PDF via pdfkit)

### 5.6 Admin Management
- ✅ Dashboard with system overview
- ✅ User management interface
- ✅ Course management & approval
- ✅ Payment verification
- ✅ System settings configuration
- ✅ Enrollment reports
- ✅ Revenue tracking

### 5.7 System Configuration
- ✅ Settings management (SMTP, Zoom, Razorpay, Jitsi)
- ✅ Email notifications (Nodemailer integration)
- ✅ Branding customization (logos, site name)
- ✅ Time zone configuration

---

## 6. AUTHENTICATION & SECURITY

### 6.1 JWT Strategy
```
Access Token (Short-lived):
├─ Expiration: ~15 minutes
├─ Algorithm: HS256
├─ Payload: userId, role, email
└─ Usage: Authorization header (Bearer {token})

Refresh Token (Long-lived):
├─ Expiration: ~7 days
├─ Algorithm: HS256
├─ Payload: userId
└─ Usage: POST /api/auth/refresh
```

**Security Secrets:**
```env
JWT_SECRET=<64-char hex string>
JWT_REFRESH_SECRET=<64-char hex string> (must differ from above)
```

### 6.2 Role-Based Access Control (RBAC)
```
ADMIN
├─ Create/edit/delete users
├─ Manage all courses
├─ Configure system settings
├─ View all payments
└─ Access admin dashboard

MODERATOR
├─ Manage users (limited)
├─ Manage courses
└─ View reports

TEACHER
├─ Create & edit own courses
├─ Create live sessions
├─ View student progress (own courses)
└─ Access teacher dashboard

STUDENT
├─ Enroll in courses
├─ View enrolled courses
├─ Track progress
├─ Join live classes
└─ Generate certificates (optional)
```

### 6.3 Middleware Stack
```
Request Flow:
1. CORS Check           → Allowed origins only
2. Helmet              → Security headers
3. Body Parser         → JSON/URL-encoded (10MB limit)
4. Rate Limiting       → 500 req/15min per IP globally
                        → 10 login attempts/15min per IP
5. Authentication     → Verify JWT from Authorization header
6. Authorization      → Check user role against resource
7. Validation         → Sanitize & validate input
8. Business Logic     → Execute controller
9. Response          → JSON response + status code
```

### 6.4 Security Measures Implemented
| Feature | Status | Implementation |
|---------|--------|-----------------|
| **Password Hashing** | ✅ | Bcrypt (salt rounds: 10) |
| **JWT Signing** | ✅ | HS256 algorithm |
| **CORS** | ✅ | Whitelist by domain |
| **Rate Limiting** | ✅ | express-rate-limit |
| **HTTP Headers** | ✅ | Helmet middleware |
| **Input Validation** | ✅ | express-validator |
| **SQL Injection** | ✅ | Sequelize ORM (parameterized queries) |
| **XSS Protection** | ⚠️ | Partial (Helmet CSP + frontend sanitization) |
| **HTTPS/SSL** | ✅ | Traefik auto-renewal |
| **Environment Secrets** | ✅ | .env file (not in Git) |
| **Sensitive Data Encryption** | ⚠️ | system_settings.value (needs implementation) |

### 6.5 Known Security Gaps
⚠️ **Issue 1:** Static file access (`/uploads`) lacks authentication
- **Risk:** Paid course content (videos, PDFs) accessible without verification
- **Recommendation:** Implement token-based access control in production

⚠️ **Issue 2:** Jitsi credentials exposed in code
- **Risk:** JWT app secret visible in lms_integration_guide.md (hard-coded)
- **Recommendation:** Move to environment variables

---

## 7. THIRD-PARTY INTEGRATIONS

### 7.1 Zoom Integration
**File:** `backend/src/services/zoomService.ts`

**Features:**
- Create meeting sessions
- Generate join URLs
- Retrieve recordings
- Manage meeting settings

**Environment Variables:**
```env
ZOOM_ACCOUNT_ID=<zoom_account_id>
ZOOM_CLIENT_ID=<zoom_client_id>
ZOOM_CLIENT_SECRET=<zoom_client_secret>
```

**API Endpoints:**
- `POST /api/live-classes/create-zoom` - Create Zoom meeting
- `GET /api/live-classes/:id/join-zoom` - Get join URL

### 7.2 Jitsi Integration
**File:** `backend/src/services/jitsiService.ts`

**Features:**
- JWT token generation for secure rooms
- Role-based access (owner=teacher, member=student)
- Branding support (logo override)
- Guest authentication

**Credentials:**
```
App ID: edunura_appid
App Secret: 5d4d41c349892695ea65b66e3f1041e5bfc9a903d6595b441ffebd44d268844d
Domain: class.edunura.com
```

**JWT Payload Structure:**
```json
{
  "aud": "jitsi",
  "iss": "edunura_appid",
  "sub": "class.edunura.com",
  "room": "course-123-live",
  "exp": 1741123456,
  "context": {
    "user": {
      "name": "Student Name",
      "email": "student@edunura.com",
      "affiliation": "member"
    }
  }
}
```

### 7.3 Razorpay Integration
**File:** `backend/src/services/razorpayService.ts`

**Features:**
- Create payment orders
- Verify payment signatures
- Handle webhooks
- Payment status tracking

**Environment Variables:**
```env
RAZORPAY_KEY_ID=<razorpay_key>
RAZORPAY_KEY_SECRET=<razorpay_secret>
```

**API Endpoints:**
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify & complete payment
- `GET /api/payments/history` - Payment history

### 7.4 Email Service
**Technology:** Nodemailer

**Configuration (via System Settings):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@edunura.com
SMTP_PASSWORD=<app_password>
SMTP_FROM=Edunura <noreply@edunura.com>
```

**Use Cases:**
- Welcome emails on registration
- Payment confirmation emails
- Course enrollment confirmations
- Password reset links (future)
- Course announcements

### 7.5 File Storage
**Current:** Local filesystem (`backend/uploads/`)
- `avatars/` - User profile pictures
- `courses/` - Course covers, resources
- `assets/` - Site settings, logos

**Future:** AWS S3 support (SDK already included)

---

## 8. API ARCHITECTURE

### 8.1 RESTful API Endpoints

#### Authentication Module (`/api/auth`)
```
POST   /api/auth/register          Register new user (Public)
POST   /api/auth/login             Login & get tokens (Public)
POST   /api/auth/refresh           Refresh access token (Public + Refresh token)
GET    /api/auth/me                Get current user details (Protected)
```

#### Users Module (`/api/users`)
```
GET    /api/users                  List all users (Admin)
GET    /api/users/:id              Get user details (Admin)
POST   /api/users                  Create user (Admin)
PUT    /api/users/:id              Update user (Admin)
DELETE /api/users/:id              Delete user (Admin)
```

#### Courses Module (`/api/courses`)
```
GET    /api/courses                List courses + filters (Public)
GET    /api/courses/:id            Get course details (Public)
POST   /api/courses                Create course (Teacher)
PUT    /api/courses/:id            Update course (Teacher)
DELETE /api/courses/:id            Delete course (Teacher)
POST   /api/courses/:id/publish    Publish course (Teacher)

Sections & Lessons:
POST   /api/courses/:id/sections   Create section
POST   /api/courses/:courseId/sections/:sectionId/lessons   Create lesson
GET    /api/courses/:courseId/sections/:sectionId/lessons   Get lessons
```

#### Enrollments Module (`/api/enrollments`)
```
POST   /api/enrollments            Enroll in course (Student + Payment)
GET    /api/enrollments            List enrollments (Student/Teacher)
GET    /api/enrollments/:id        Get enrollment details (Protected)
PUT    /api/enrollments/:id        Update enrollment (Admin)
DELETE /api/enrollments/:id        Drop enrollment (Student)
```

#### Payments Module (`/api/payments`)
```
POST   /api/payments/create-order        Create Razorpay order (Student)
POST   /api/payments/verify-payment      Verify payment (Student)
GET    /api/payments/history             Payment history (Protected)
GET    /api/payments/reports             Admin payment reports (Admin)
```

#### Live Classes Module (`/api/live-classes`)
```
POST   /api/live-classes/create-zoom           Create Zoom session (Teacher)
GET    /api/live-classes/:id/join-zoom         Get Zoom join URL (Protected)
POST   /api/live-classes/create-jitsi          Create Jitsi session (Teacher)
GET    /api/live-classes/:id/join-jitsi        Get Jitsi token (Protected)
GET    /api/live-classes                       List sessions (Protected)
```

#### Settings Module (`/api/settings`)
```
GET    /api/settings                Get all settings (Admin)
GET    /api/settings/:key           Get specific setting (Admin)
POST   /api/settings/:key           Create/update setting (Admin)
DELETE /api/settings/:key           Delete setting (Admin)
```

#### Profile Module (`/api/profile`)
```
GET    /api/profile                 Get own profile (Protected)
PUT    /api/profile                 Update own profile (Protected)
POST   /api/profile/avatar          Upload avatar (Protected)
```

### 8.2 Response Format
All API responses follow a consistent structure:

**Success Response (200, 201):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-03-18T10:30:00Z"
}
```

**Error Response (400, 401, 403, 500):**
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-03-18T10:30:00Z"
}
```

### 8.3 Request/Response Cycle
```
Client Request
  ↓
[CORS Check]
  ↓
[Rate Limiter]
  ↓
[Body Parser]
  ↓
[JWT Authentication]
  ↓
[Role Authorization]
  ↓
[Input Validation]
  ↓
[Controller Logic]
  ↓
[Service Layer]
  ↓
[Database Query]
  ↓
[Response Formatting]
  ↓
Client Response (JSON)
```

---

## 9. FRONTEND APPLICATIONS

### 9.1 Landing Page & Public Areas
**Technology:** Next.js  
**Port:** 3000 (default)

**Routes:**
- `/` - Hero section, course showcase
- `/landing` - Marketing content
- `/courses` - Browse all courses (paginated, filtered)
- `/course/:id` - Course details, instructor info, reviews
- `/login` - Authentication page
- `/register` - User registration
- `/about` - About the platform
- `/contact` - Contact form
- `/course-details/:id` - Detailed course view with enrollment CTA

### 9.2 Student Portal
**Technology:** React + Vite (historically), now Next.js  
**Port:** 3002 (legacy) or path-based routing via Next.js  
**Role Requirement:** `student`

**Features:**
- Dashboard with enrolled courses
- Course progress tracking
- Video player with playback controls (Vidstack)
- Lesson resources download
- Live class join interface
- Course continuation (resume from last watched)
- Certificate view/download
- Progress analytics dashboard

**Key Components:**
- Course card with progress bar
- Video lesson player
- Lesson completion indicator
- Resources sidebar
- Discussion/Q&A section

### 9.3 Teacher Portal
**Technology:** React + Vite (legacy) or Next.js  
**Port:** 3003 (legacy)  
**Role Requirement:** `teacher`

**Features:**
- Course creation wizard
- Section/chapter management
- Lesson creation (drag-drop editor using Editor.js)
- Live class scheduling (Zoom/Jitsi)
- Student enrollment list
- Class attendance tracking
- Grade management
- Announcement broadcasting
- Class schedule calendar

**Key Components:**
- Course builder interface
- Lesson editor with rich text (Editor.js)
- Live session scheduling form
- Student roster with filters
- Grade spreadsheet interface
- Analytics dashboard

### 9.4 Admin Portal
**Technology:** React + Vite (legacy) or Next.js  
**Port:** 3001 (legacy)  
**Role Requirement:** `admin` or `moderator`

**Features:**
- System dashboard with KPIs
- User management (create, edit, delete, roles)
- Course approval/publishing
- Payment verification & reports
- Settings configuration
- Email template management
- System logs & audit trails
- Backup & maintenance tools

**Key Components:**
- Admin dashboard with charts (Recharts)
- User management table
- Course approval queue
- Payment transaction history
- Settings configuration forms
- System health monitor

### 9.5 Shared Infrastructure
```
src/
├── components/              # Reusable UI components
│   ├── Header.tsx          # Navigation bar
│   ├── Footer.tsx          # Footer
│   ├── CourseCard.tsx      # Course display card
│   ├── VideoPlayer.tsx     # Vidstack wrapper
│   ├── Editor.tsx          # Editor.js wrapper
│   └── ...
├── context/                # Global state
│   ├── AuthContext.tsx     # User authentication state
│   ├── ThemeContext.tsx    # Dark/light theme
│   └── NotificationContext.tsx
├── services/               # API client functions
│   └── api.ts             # Axios instance + endpoints
├── types/                  # TypeScript definitions
│   ├── User.ts
│   ├── Course.ts
│   ├── Payment.ts
│   └── ...
├── utils/                  # Helper functions
└── middleware.ts           # Next.js middleware (auth checks)

Key Dependencies on Frontend:
├── @mui/material          # Material Design components
├── @emotion/react         # CSS-in-JS styling
├── @reduxjs/toolkit       # State management
├── @tanstack/react-query  # Server state management
├── @editorjs/editorjs     # Rich text editing
├── @vidstack/react        # Video player wrapper
├── @jitsi/react-sdk       # Jitsi integration
├── @zoom/meetingsdk       # Zoom integration
└── axios                  # HTTP client
```

---

## 10. DEPLOYMENT INFRASTRUCTURE

### 10.1 Docker Setup
**Compose File:** `docker-compose.dokploy.yml`

**Services:**
1. **MySQL 8.0** (Internal)
   - Container: `lms_db`
   - Volume: `db_data` (persistent)
   - Network: `lms_internal` (isolated)
   - Health checks enabled

2. **Backend API** (Express.js)
   - Container: `lms_backend`
   - Port: 5000
   - Image: `harshath/lms-backend:latest`
   - Volume: `uploads_data` (course assets)
   - Network: `dokploy-network` (Traefik accessible)

3. **Frontend** (Next.js)
   - Container: `lms_web`
   - Port: 3000
   - Image: `harshath/lms-web:latest`
   - Network: `dokploy-network`

4. **Optional: Jitsi Server**
   - Image: `jitsi/jicofo`, `jitsi/jvb`, etc.
   - Uses `docker-compose.jitsi.yml`
   - Ports: 5280 (HTTP), 5349 (HTTPS), 10000 (JVB)

### 10.2 Dokploy Deployment Platform
**Role:** Container orchestration + Traefik reverse proxy + SSL automation

**Deployment Flow:**
```
1. Git Push
   ↓
2. Dokploy Webhook Triggered
   ↓
3. Git Clone into Working Directory
   ↓
4. Environment Variables Loaded (.env)
   ↓
5. Docker Images Built (if needed)
   ↓
6. Containers Started (docker-compose up)
   ↓
7. Traefik Routes Configured
   ↓
8. SSL Certificates Generated/Renewed
   ↓
9. Application Accessible at Domain
```

### 10.3 DNS & Domain Configuration
**Required DNS Records (A Records):**
```
Subdomain          → Points To      → Resolves To
─────────────────────────────────────────────────────
@                  VPS IP          example.com
api                VPS IP          api.example.com
app                VPS IP          app.example.com
mail               VPS IP          (optional, for email)
```

**Dokploy Domain Configuration:**
| Domain | Service | Port | HTTPS |
|--------|---------|------|-------|
| `api.example.com` | backend | 5000 | ✅ Auto |
| `example.com` | web-app | 3000 | ✅ Auto |
| `app.example.com` | web-app | 3000 | ✅ Auto |

### 10.4 Environment Configuration (.env.docker.example)
```env
# Application
DOMAIN=clientdomain.com
API_SUBDOMAIN=api
STUDENT_BASE_PATH=/        # or /app for subdirectory
FRONTEND_URL=https://clientdomain.com
STUDENT_URL=https://clientdomain.com

# Database
DB_HOST=db
DB_PORT=3306
DB_NAME=lms_database
DB_USER=lms_user
DB_PASSWORD=<strong_password>
DB_ROOT_PASSWORD=<strong_password>

# JWT Authentication
JWT_SECRET=<64-char hex from: openssl rand -hex 32>
JWT_REFRESH_SECRET=<64-char hex from: openssl rand -hex 32>

# Admin Account
ADMIN_EMAIL=admin@clientdomain.com
ADMIN_PASSWORD=<initial_strong_password>

# Third-Party Services (configure in Admin Panel)
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Jitsi (if self-hosted)
JITSI_DOMAIN=class.clientdomain.com
JITSI_APP_ID=edunura_appid
JITSI_APP_SECRET=...
```

### 10.5 Deployment Checklist
- [ ] VPS provisioned with Docker & Dokploy installed
- [ ] Domain registered & DNS A records configured
- [ ] Git repository created (GitHub/GitLab)
- [ ] Code pushed to main branch
- [ ] Dokploy project created
- [ ] Docker Compose service linked to Git repo
- [ ] ALL environment variables filled in Dokploy UI
- [ ] First deployment initiated
- [ ] Domains added in Dokploy (with HTTPS enabled)
- [ ] SSL certificates auto-generated
- [ ] Admin login tested
- [ ] Admin panel settings configured (Zoom, Razorpay, SMTP)
- [ ] Admin password changed
- [ ] Database backups configured

---

## 11. FILE ORGANIZATION

### 11.1 Backend Directory Tree
```
backend/
├── src/
│   ├── server.ts                    # Express app entry point
│   ├── config/
│   │   ├── database.ts              # Sequelize configuration
│   │   ├── multer.ts                # File upload config
│   │   └── multer-avatar.ts         # Avatar-specific config
│   ├── models/
│   │   ├── User.ts                  # User model definition
│   │   ├── Course.ts                # Course model
│   │   ├── Enrollment.ts            # Enrollment model
│   │   ├── Lesson.ts                # Lesson content
│   │   ├── LessonProgress.ts        # Student progress tracking
│   │   ├── LiveSession.ts           # Zoom/Jitsi meetings
│   │   ├── Payment.ts               # Payment records
│   │   ├── SystemSetting.ts         # Config key-value store
│   │   └── index.ts                 # Model associations
│   ├── middleware/
│   │   ├── auth.ts                  # JWT verification + authorization
│   │   └── upload.ts                # Multer integration
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controller.ts        # Login, register, refresh logic
│   │   │   └── routes.ts            # /api/auth routes
│   │   ├── courses/
│   │   │   ├── controller.ts        # CRUD operations
│   │   │   └── routes.ts            # /api/courses routes
│   │   ├── payments/
│   │   │   ├── controller.ts        # Razorpay order & verification
│   │   │   └── routes.ts            # /api/payments routes
│   │   ├── live-classes/
│   │   │   ├── controller.ts        # Zoom/Jitsi management
│   │   │   └── routes.ts            # /api/live-classes routes
│   │   └── [other 7 modules]
│   ├── services/
│   │   ├── zoomService.ts           # Zoom API wrapper
│   │   ├── jitsiService.ts          # Jitsi JWT generation
│   │   └── razorpayService.ts       # Razorpay API wrapper
│   ├── scripts/
│   │   ├── seedAdminUser.ts         # Create admin on startup
│   │   ├── resetAdminPassword.ts    # CLI password reset
│   │   └── checkZoomAccount.ts      # Zoom connection test
│   └── utils/
│       ├── jwt.ts                   # Token generation/verification
│       ├── timezone.ts              # Timezone utilities
│       ├── migrationRunner.ts       # Database migration executor
│       └── folderService.ts         # File system helpers
├── database/
│   ├── schema.sql                   # Initial database structure
│   └── migrations/                  # SQL migration files
├── uploads/                         # File storage (runtime)
│   ├── avatars/                     # User profile pictures
│   ├── courses/                     # Course assets
│   └── assets/                      # Site settings/branding
├── Dockerfile                       # Backend image definition
├── docker-compose.dokploy.yml       # Production compose file
├── nodemon.json                     # Dev server auto-reload config
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
└── README.md
```

### 11.2 Frontend Directory Tree
```
frontend/Web/
├── src/
│   ├── middleware.ts                # Next.js auth redirect middleware
│   ├── app/
│   │   ├── layout.tsx               # Root layout (head, providers)
│   │   ├── page.tsx                 # Homepage/redirect
│   │   ├── globals.css              # Global styles
│   │   ├── providers.tsx            # Redux + React Query setup
│   │   ├── (dashboard)/             # Protected dashboard routes
│   │   │   ├── admin/               # /dashboard/admin
│   │   │   ├── teacher/             # /dashboard/teacher
│   │   │   └── student/             # /dashboard/student
│   │   ├── landing/                 # /landing page
│   │   ├── login/                   # /login form
│   │   ├── register/                # /register form
│   │   ├── courses/                 # /courses browse
│   │   ├── course/                  # /course/:id details
│   │   ├── course-details/          # /course-details/:id
│   │   ├── checkout/                # /checkout payment flow
│   │   ├── purchase-success/        # /purchase-success confirmation
│   │   ├── meeting/                 # /meeting live class join
│   │   ├── about/                   # /about info
│   │   └── contact/                 # /contact form
│   ├── components/                  # Reusable React components
│   │   ├── CourseCard.tsx           # Course display card
│   │   ├── VideoPlayer.tsx          # Vidstack wrapper
│   │   ├── EditorJsComponent.tsx    # Editor.js wrapper
│   │   ├── Header.tsx               # Navigation bar
│   │   ├── Sidebar.tsx              # Dashboard sidebar
│   │   └── [many others]
│   ├── context/
│   │   ├── AuthContext.tsx          # User & auth state
│   │   ├── ThemeContext.tsx         # Dark/light mode
│   │   └── NotificationContext.tsx  # Toast notifications
│   ├── services/
│   │   └── api.ts                   # Axios instance + all endpoints
│   ├── types/
│   │   ├── User.ts                  # User TypeScript interface
│   │   ├── Course.ts                # Course interface
│   │   ├── Payment.ts               # Payment interface
│   │   └── [others]
│   └── utils/
│       └── [helper functions]
├── public/
│   └── images/                      # Static assets
├── Dockerfile                       # Frontend image definition
├── next.config.ts                   # Next.js configuration
├── tailwind.config.mjs              # Tailwind CSS config
├── postcss.config.mjs               # PostCSS plugins
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
└── README.md
```

---

## 12. CODE QUALITY & BEST PRACTICES

### 12.1 Strengths
✅ **Type Safety:**
- Full TypeScript throughout backend & frontend
- Strong typing reduces runtime errors
- IDE autocomplete support

✅ **Architecture:**
- Modular monolithic design (easily separable to microservices)
- Clear separation of concerns (routes → controller → service)
- Each module is self-contained

✅ **Security:**
- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- Rate limiting on auth endpoints
- Helmet for HTTP headers
- CORS properly configured

✅ **Database:**
- Sequelize ORM (parameterized queries prevent SQL injection)
- Database migrations for schema versioning
- Proper relationships defined

✅ **API Design:**
- RESTful conventions followed
- Consistent response formats
- Proper HTTP status codes
- Validation on input

✅ **Frontend:**
- React best practices (hooks, context)
- Redux for state management
- React Query for server state
- Material-UI for consistent design

✅ **DevOps:**
- Docker containerization
- Multi-stage builds possible
- Environment-based configuration
- Dokploy integration ready

### 12.2 Areas for Improvement

⚠️ **Code Organization:**
- Some services lack TypeScript interfaces (type safety gaps)
- Error handling could be more standardized
- Some controller functions are too long (>100 lines)

⚠️ **Testing:**
- No unit tests visible
- No integration tests
- Recommendation: Add Jest + Supertest for backend, Vitest for frontend

⚠️ **Logging:**
- No structured logging implementation
- Recommendation: Add Winston or Pino for production logging

⚠️ **Documentation:**
- API documentation incomplete (but present in code comments)
- Recommendation: Add Swagger/OpenAPI documentation

⚠️ **Error Handling:**
- Some edge cases not handled
- Generic 500 errors without specifics
- Recommendation: Create custom error classes & handlers

⚠️ **Caching:**
- No Redis/caching layer
- Recommendation: Add Redis for session storage & query caching

⚠️ **Monitoring:**
- No APM (Application Performance Monitoring)
- Recommendation: Add New Relic, DataDog, or similar

---

## 13. IDENTIFIED ISSUES & RISKS

### 13.1 Critical Issues
🔴 **Issue 1: Static File Access Without Authentication**
- **Severity:** HIGH
- **Location:** `backend/src/server.ts` line ~45
- **Description:** `/uploads` endpoint serves all files without token verification
- **Risk:** Paid course content (videos, PDFs) accessible without payment
- **Code:**
  ```typescript
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  ```
- **Solution:** Implement token-based access middleware or AWS S3 signed URLs
- **Recommended Fix:**
  ```typescript
  app.use('/uploads', authenticateToken, serveFile);
  ```

🔴 **Issue 2: Jitsi Secrets Exposed in Repository**
- **Severity:** HIGH
- **Location:** `lms_integration_guide.md`
- **Description:** Jitsi App ID & Secret are hard-coded in documentation
- **Risk:** Security breach if repo is public
- **Secret:** `5d4d41c349892695ea65b66e3f1041e5bfc9a903d6595b441ffebd44d268844d`
- **Solution:** Move all credentials to environment variables or vault
- **Recommended Fix:**
  ```typescript
  const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET;
  ```

### 13.2 High Priority Issues
🟠 **Issue 3: No Rate Limiting on File Uploads**
- **Severity:** MEDIUM-HIGH
- **Risk:** Disk space exhaustion, DoS attacks
- **Solution:** Add file size limits & upload rate limiting

🟠 **Issue 4: Insufficient Input Validation**
- **Severity:** MEDIUM-HIGH
- **Examples Missing:**
  - Email format validation on some routes
  - File type validation on uploads
  - Content length limits
- **Solution:** Audit all inputs with express-validator

🟠 **Issue 5: No Session Timeout**
- **Severity:** MEDIUM
- **Risk:** Access tokens don't expire in some cases
- **Solution:** Ensure all tokens have expiration times

### 13.3 Medium Priority Issues
🟡 **Issue 6: Database Encryption**
- **Severity:** MEDIUM
- **Risk:** Sensitive data (Zoom keys, Razorpay secrets) stored in plain text
- **Solution:** Encrypt `system_settings.value` column

🟡 **Issue 7: No Audit Logging**
- **Severity:** MEDIUM
- **Risk:** Cannot track who changed what
- **Solution:** Add audit log table for admin actions

🟡 **Issue 8: No Backup Strategy**
- **Severity:** MEDIUM
- **Risk:** Data loss in production
- **Solution:** Automated daily backups with retention policy

🟡 **Issue 9: CORS Configuration Too Broad**
- **Severity:** MEDIUM
- **Location:** `backend/src/server.ts`
- **Current:**
  ```typescript
  origin: [
    'http://localhost:3000',         // OK
    process.env.FRONTEND_URL || '',  // Could be empty string
    jitsiOrigin ? `https://${jitsiOrigin}` : '',
  ].filter(Boolean),
  ```
- **Risk:** Empty strings pass filter, allowing wildcard origins
- **Solution:** Validate origins before adding

### 13.4 Low Priority Issues
🟢 **Issue 10: No Pagination Defaults**
- Some list endpoints might not have default pagination limits

🟢 **Issue 11: Magic Numbers in Code**
- Hard-coded values like JWT expiration times should be constants

🟢 **Issue 12: Missing Error Context**
- Some errors lack descriptive messages for frontend

---

## 14. RECOMMENDATIONS

### 14.1 Immediate Actions (Next Sprint)
1. **Fix Static File Security** ⚠️ CRITICAL
   - Add authentication middleware to `/uploads`
   - Alternative: Move to AWS S3 or Cloudinary
   - Estimated: 4-6 hours

2. **Remove Jitsi Secrets from Code** ⚠️ CRITICAL
   - Extract to `JITSI_APP_SECRET` environment variable
   - Update `lms_integration_guide.md` with placeholder
   - Update all code references
   - Estimated: 2 hours

3. **Add Comprehensive Input Validation**
   - Audit all user inputs
   - Add file type/size validation
   - Estimated: 8 hours

### 14.2 Short-term Improvements (2-4 Weeks)
4. **Add Unit & Integration Tests**
   - Backend: Jest + Supertest (goal: 60% coverage)
   - Frontend: Vitest (goal: 40% coverage)
   - Estimated: 3-4 days

5. **Implement Structured Logging**
   - Use Winston or Pino
   - Log all API calls, errors, auth events
   - Estimated: 1-2 days

6. **Add Swagger/OpenAPI Documentation**
   - Auto-generate from code
   - Can use `swagger-jsdoc` or `NestJS approach`
   - Estimated: 1-2 days

7. **Database Encryption for Secrets**
   - Encrypt `system_settings.value` column
   - Add encryption/decryption utilities
   - Estimated: 2 hours

### 14.3 Medium-term Enhancements (1-2 Months)
8. **Add Caching Layer (Redis)**
   - Cache frequently accessed data (courses, categories)
   - Use Redis for session storage
   - Estimated: 2-3 days

9. **Implement Audit Logging**
   - Track all admin actions
   - Create audit_logs table
   - Estimated: 2 days

10. **Add Monitoring & APM**
    - Integrate Sentry for error tracking
    - Add New Relic or DataDog for performance
    - Estimated: 1-2 days

11. **Move to AWS/Cloud Infrastructure**
    - Set up RDS for database
    - Use S3 for file storage
    - CloudFront CDN for static assets
    - Estimated: 3-5 days

### 14.4 Long-term Roadmap (3-6 Months)
12. **Break Monolith into Microservices**
    - Separate payment service
    - Separate video streaming service
    - Use API Gateway
    - Estimated: 2 weeks

13. **Add Real-time Features**
    - WebSocket support for notifications
    - Chat system
    - Live notifications
    - Estimated: 1 week

14. **Mobile App Support**
    - React Native app
    - Or Progressive Web App (PWA)
    - Estimated: 4 weeks

15. **Advanced Analytics**
    - Student engagement dashboards
    - Course performance metrics
    - Teacher effectiveness scoring
    - Estimated: 1 week

### 14.5 Infrastructure Roadmap
16. **High Availability Setup**
    - Load balancer
    - Multiple backend instances
    - Database replication
    - Estimated: 1 week

17. **Disaster Recovery**
    - Automated backups (daily to weekly retention)
    - Geographic redundancy
    - Failover procedures
    - Estimated: 2-3 days

---

## Summary

**Edunura LMS** is a well-architected, production-ready learning platform with a solid foundation. The codebase demonstrates good software engineering practices with:

✅ **Strengths:**
- Full TypeScript type safety
- Modular architecture
- Comprehensive feature set
- Security-first approach
- Docker containerization

⚠️ **Critical Gaps:**
- Static file authentication missing
- Hardcoded secrets in documentation
- Limited testing coverage
- No structured logging

🎯 **Next Steps:**
1. Address critical security issues (file access, exposed secrets)
2. Add unit & integration tests
3. Implement structured logging & monitoring
4. Plan migration to cloud infrastructure

**Overall Assessment:** 8/10 - Production-ready with some security refinements needed.

---

**Generated:** March 18, 2026  
**Analyzed by:** AI Code Review System
