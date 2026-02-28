# Learning Management System (LMS) - Detailed Project Analysis

**Generated: February 27, 2026**
**Project Status: Phase 1 - Core Features Implemented**

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose & Scope
The LMS is a **production-ready web platform** for organizations to create, manage, sell, and deliver educational content. It supports a complete learning ecosystem with:
- **Admin Portal:** Full platform management and configuration
- **Teacher Portal:** Course creation and delivery
- **Student Portal:** Learning and course consumption
- **Landing Page:** Marketing and public course discovery

### 1.2 Technology Stack

#### Backend
```
Framework:    Node.js + Express.js
Language:     TypeScript
Database:     MySQL 8.0
ORM:          Sequelize v6.35.2
Port:         5000
Authentication: JWT (Access + Refresh Tokens)
Security:     Bcrypt hashing, Helmet, CORS, Rate Limiting
File Storage: Multer + Local Filesystem
External:     Zoom API, Razorpay Payment Gateway, NodeMailer
```

#### Frontend
```
Framework:    React 18.2
Build Tool:   Vite
UI Library:   Material-UI (MUI) v5.15
Styling:      Emotion (CSS-in-JS)
State:        Redux Toolkit + React Query
Routing:      React Router v6
Video:        Vidstack (HTML5 native player)
Rich Text:    Editor.js (for course content)
```

#### Frontend Applications
- **Admin Portal** (Port 3001) → Course & user management
- **Teacher Portal** (Port 3002) → Content creation & delivery
- **Student Portal** (Port 3003) → Learning experience
- **Landing Page** (Next.js) → Marketing site

---

## 2. ARCHITECTURE & DESIGN PATTERNS

### 2.1 Monorepo Structure
```
lms-dev/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database, Multer, Mail
│   │   ├── middleware/        # Auth, Upload validation
│   │   ├── models/           # Sequelize ORM models
│   │   ├── modules/          # Feature modules (see 2.2)
│   │   ├── services/         # External API integrations
│   │   ├── scripts/          # DB migrations, seed data
│   │   ├── utils/            # JWT, helpers
│   │   └── server.ts         # Express app entry
│   ├── database/             # schema.sql, migrations
│   └── uploads/              # User-generated content
│
├── frontend/
│   ├── admin/                # Admin portal (Vite)
│   │   ├── src/pages/        # Dashboard, Users, Courses, Settings
│   │   ├── src/components/   # Reusable UI components
│   │   └── src/context/      # Global theme, auth state
│   ├── teacher/              # Teacher portal (Vite)
│   ├── student/              # Student portal (Vite)
│   ├── landing/              # Marketing site (Next.js)
│   └── shared/               # Shared types, components, utils
│
└── docs/                      # PRD, rules, security, progress logs
```

### 2.2 Backend Module Architecture (Modular Monolith)
Each feature is **self-contained** with:
- **routes.ts** → Express route definitions
- **controller.ts** → Business logic
- **service.ts** (optional) → Complex operations or external API calls

**Active Modules:**
```
modules/
├── auth/              # Login, Register, Token Refresh
├── users/             # Admin user management (Admin/Moderator)
├── teachers/          # Teacher CRUD (Admin/Moderator)
├── students/          # Student CRUD (Admin/Moderator)
├── profile/           # Self-service user profile (Any authenticated user)
├── courses/           # Full course CRUD + curriculum
├── categories/        # Course category management
├── enrollments/       # Student enrollment tracking
├── live-classes/      # Zoom meeting management
├── payments/          # Razorpay payment processing
└── settings/          # System configuration (Admin only)
```

---

## 3. DATABASE DESIGN

### 3.1 Core Tables
```sql
users                -- Users across all roles (Admin, Teacher, Student)
courses              -- Course definitions with pricing, metadata
course_categories    -- Category organization
course_sections      -- Course modules/chapters
lessons              -- Video, text, live, quiz content
lesson_resources     -- Downloadable attachments
enrollments          -- Student enrollment records
lesson_progress      -- Per-student completion tracking
live_sessions        -- Zoom meetings
payments             -- Razorpay transaction records
system_settings      -- Key-value configuration store
```

### 3.2 Key Relationships
```
User 1---* Courses (created_by)
User 1---* Enrollments (student_id)
Course 1---* CourseSection
CourseSection 1---* Lesson
Lesson 1---* LessonResource
Lesson 1---* LessonProgress
Course 1---* Payment
User 1---* Payment
```

### 3.3 Important Fields
```
courses.instructors  -- JSON array of {id, name, email, avatar}
courses.outcomes     -- JSON array of learning outcomes
system_settings      -- Encrypted storage for secrets (SMTP, Zoom, Razorpay)
lesson_progress      -- Tracks completion status per student per lesson
```

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 JWT Strategy
```
Access Token (Short-lived)
├─ Expires: ~15 minutes
├─ Contains: userId, role, email
└─ Used: API requests (Authorization header)

Refresh Token (Long-lived)
├─ Expires: ~7 days
├─ Contains: userId
└─ Used: /api/auth/refresh to issue new access token
```

### 4.2 Role-Based Access Control (RBAC)
```
ADMIN      → Full platform access
MODERATOR  → User/Course management (subset of admin)
TEACHER    → Own courses + enrollment view
STUDENT    → Enrolled courses only
```

**Middleware Flow:**
```
Request → authenticate() → authorize(['admin', 'teacher']) → Controller
  ↓
Verify JWT from Authorization header
  ↓
Extract userId, role, add to req.user
  ↓
If authorize() specified, check req.user.role
  ↓
Proceed or 403 Forbidden
```

### 4.3 Security Measures
- ✅ Passwords hashed with **bcrypt** (10 salt rounds)
- ✅ JWT signed with **HS256** algorithm
- ✅ Rate limiting (500 req/15min per IP)
- ✅ CORS configured for frontend origins
- ✅ Helmet for HTTP security headers
- ✅ Cookie-Parser for secure token storage (optional)

---

## 5. API ENDPOINTS (RESTful)

### 5.1 Authentication
```
POST   /api/auth/register          Public
POST   /api/auth/login             Public
POST   /api/auth/refresh           Public (with refresh token)
GET    /api/auth/me                Protected
```

### 5.2 User Management (Admin/Moderator)
```
GET    /api/users                  List all
GET    /api/users/:id              Get by ID
POST   /api/users                  Create
PATCH  /api/users/:id              Update
DELETE /api/users/:id              Soft delete
```

### 5.3 Teachers (Admin/Moderator)
```
GET    /api/teachers               List all
GET    /api/teachers/:id           Get details
POST   /api/teachers               Assign role
DELETE /api/teachers/:id           Remove role
```

### 5.4 Courses (Admin/Teacher)
```
GET    /api/courses                List (paginated)
GET    /api/courses/:id            Get details
POST   /api/courses                Create new
PATCH  /api/courses/:id            Update
DELETE /api/courses/:id            Archive
```

### 5.5 Course Curriculum
```
POST   /api/courses/:courseId/sections              Create section
PATCH  /api/courses/:courseId/sections/:sectionId  Update section
POST   /api/courses/:courseId/sections/:sectionId/lessons
PATCH  /api/courses/:courseId/lessons/:lessonId
DELETE /api/courses/:courseId/lessons/:lessonId
```

### 5.6 Enrollments & Progress
```
GET    /api/enrollments            Student's enrollments
POST   /api/enrollments            Enroll in course
PATCH  /api/enrollments/:id        Update status
GET    /api/progress               Lesson progress
POST   /api/progress/:lessonId     Mark lesson complete
```

### 5.7 Payments
```
POST   /api/payments/orders        Create Razorpay order
POST   /api/payments/verify        Verify after payment
GET    /api/payments/:courseId     Get course payment status
```

### 5.8 Settings (Admin only)
```
GET    /api/settings               All settings
GET    /api/settings/:key          Single setting
PUT    /api/settings/:key          Update setting
POST   /api/settings/test-email    Send SMTP test
POST   /api/settings/check-zoom    Verify Zoom config
```

### 5.9 File Operations
```
POST   /api/upload                 Upload course content
POST   /api/profile/avatar         Upload user avatar
GET    /uploads/*                  Serve uploaded files
```

---

## 6. KEY FEATURES IMPLEMENTED

### 6.1 Course Management
| Feature | Status | Details |
|---------|--------|---------|
| Create Course | ✅ | Full CRUD with pricing, validity, metadata |
| Course Curriculum | ✅ | Drag-drop sections/lessons (frontend ready) |
| Content Types | ✅ | Video (upload + URL), Text (Editor.js), Live (Zoom) |
| Preview Access | ✅ | Free preview lessons for unpublished courses |
| Instructor Assignment | ✅ | Multiple instructors per course (lead/assistant roles) |
| Category Management | ✅ | Hierarchical categories with colors and icons |
| Course Images | ✅ | Thumbnail and intro video support |

### 6.2 User Management
| Feature | Status | Details |
|---------|--------|---------|
| Multi-Role System | ✅ | Admin, Teacher, Student, Moderator |
| User CRUD | ✅ | Admin can manage all users |
| Soft Delete | ✅ | Users disabled but data preserved |
| Profile Management | ✅ | Self-service profile updates, password change |
| Avatar Uploads | ✅ | User profile pictures with auto-cleanup |
| Billing Info | ✅ | Address, city, state, zip, country tracking |

### 6.3 Student Learning Experience
| Feature | Status | Details |
|---------|--------|---------|
| Course Enrollment | ✅ | Purchase or free enrollment |
| Course Player | ✅ | Vidstack video player with side navigation |
| Progress Tracking | ✅ | Visual progress bars per course |
| Lesson Completion | ✅ | Mark lessons complete, track percentage |
| Download Resources | ✅ | Lesson attachments available for download |
| Certificate | 🔄 | DB field present, UI/generation TBD |

### 6.4 Payments & Monetization
| Feature | Status | Details |
|---------|--------|---------|
| Razorpay Integration | ✅ | Payment gateway for INR currency |
| Order Creation | ✅ | Server-side order generation |
| Payment Verification | ✅ | Webhook signature validation |
| Refund Support | ✅ | DB field for tracking refunded payments |
| Free Courses | ✅ | is_free flag support |
| Pricing Options | ✅ | Regular price + discounted price |

### 6.5 Live Classes
| Feature | Status | Details |
|---------|--------|---------|
| Zoom Integration | ✅ | API-driven meeting creation |
| Live Lesson Type | ✅ | Content type in curriculum |
| Meeting Scheduling | ✅ | start_time field for scheduling |
| Auto-Cleanup | ✅ | Delete meetings on lesson removal |
| Resource Attachment | ✅ | Downloadable materials per live session |

### 6.6 Admin Portal
| Feature | Status | Details |
|---------|--------|---------|
| Dashboard | ✅ | Stats, charts, recent activity |
| User Management | ✅ | Create, edit, delete teachers/students |
| Course Management | ✅ | Full CRUD with curriculum builder |
| Settings | ✅ | Theming, email, payment, Zoom config |
| Theme Customization | ✅ | Dynamic primary/secondary colors, dark mode |
| Email Config | ✅ | SMTP settings with test functionality |

### 6.7 Teacher Portal
| Feature | Status | Details |
|---------|--------|---------|
| Course List | ✅ | View assigned courses |
| Content Creation | ✅ | Add lessons with Editor.js and video |
| Curriculum Editor | ✅ | Drag-drop sections and lessons |
| Student View | ✅ | See enrolled students |
| Profile | ✅ | Avatar and password management |

### 6.8 Landing Page
| Feature | Status | Details |
|---------|--------|---------|
| Course Discovery | 🔄 | Course listing and filters (Partial) |
| Public Catalog | 🟡 | Published courses visible |
| SEO Support | ✅ | meta_title, meta_description fields |

---

## 7. IMPLEMENTATION PATTERNS & BEST PRACTICES

### 7.1 Frontend (React) Guidelines
```typescript
// Rule 1.1: No Hardcoded Colors
❌ bgcolor: '#2b8cee'
✅ bgcolor: theme.palette.primary.main

// Rule 1.2: Dynamic Transparency
❌ bgcolor: 'rgba(43, 140, 238, 0.1)'
✅ bgcolor: alpha(theme.palette.primary.main, 0.1)

// Rule 2.1: Admin Layout Wrapper
// All admin pages use <AdminLayout> (no nested Sidebar)
// Pages import: import AdminLayout from '../components/AdminLayout'

// Rule 3.1: System Settings Source
// Database is single source of truth
// Access via: GET /api/settings → useQuery hook
```

### 7.2 Backend Patterns
```typescript
// Module Structure
modules/feature/
├── routes.ts          // Express Router with auth middleware
├── controller.ts      // Business logic
└── (service.ts)       // Optional: External API calls

// API Response Format
{
  "status": "success" | "error",
  "data": {...},
  "message": "Optional error message"
}

// Error Handling
- 400 Bad Request: Validation
- 401 Unauthorized: Missing JWT
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource doesn't exist
- 500 Server Error: Unhandled exceptions
```

### 7.3 File Upload Management
```
Structure:
uploads/
├── avatars/{userId}/{filename}
├── courses/{courseId}/{filename}
    └── videos, documents, resources
└── assets/{settingType}/{filename}

Cleanup:
- Old avatar deleted when new one uploaded
- Orphaned files cleaned on resource deletion
- TODO: Token-based auth for paid content (security note in code)
```

---

## 8. SECURITY ANALYSIS

### 8.1 Currently Implemented ✅
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) on all protected routes
- Password hashing (bcrypt)
- HTTP security headers (Helmet)
- CORS configured for known origins
- Rate limiting (500 requests/15 minutes)
- SQL injection prevention (Sequelize ORM)
- XSS prevention (React default + DOMPurify for user content)
- CSRF protection ready (need cookie-based JWT)

### 8.2 Known Security Issues 🔴
1. **Static File Access** (TODO in code)
   - Uploaded course videos accessible without payment
   - **Status:** Noted but not yet implemented
   - **Fix Needed:** Token-based media URLs or private CDN
   
2. **Potential Missing:**
   - Input validation on some endpoints (review-needed)
   - API rate limiting on payment endpoints
   - HTTPS enforcement in production
   - Session management (JWT only, no logout blacklist)

### 8.3 Production Checklist
- [ ] Enable HTTPS/SSL certificates
- [ ] Use environment variables for all secrets
- [ ] Implement media token authentication
- [ ] Set up monitoring/logging
- [ ] Configure database backups
- [ ] Use AWS S3 or CDN for file storage
- [ ] Enable database encryption
- [ ] Set up API request signing
- [ ] Implement audit logging for admin actions

---

## 9. CURRENT PROJECT STATUS

### 9.1 Completed Phases (11 Chat Sessions)
```
Chat 1:   ✅ Backend + JWT Auth + RBAC
Chat 2:   ✅ Admin Dashboard + Settings + Theme System
Chat 3:   ✅ User Management (Create/Edit/Delete)
Chat 4:   ✅ Organization Profile + File Uploads + Localization
Chat 5:   ✅ Course Creation Wizard + Multi-Instructor
Chat 6:   ✅ Curriculum Builder (Drag-drop sections/lessons)
Chat 7:   ✅ Architecture Cleanup (Removed video.js, optimized bundles)
Chat 8:   ✅ User Profile Backend (Get/Update/Password Change)
Chat 9:   ✅ Zoom Integration + Live Classes
Chat 10:  ✅ Profile UI + Avatar Upload + Storage Optimization
Chat 11:  ✅ Student Learning Experience (Player + Progress)
```

### 9.2 Phase 1 Features Complete
- [x] Authentication & Authorization
- [x] Course Management
- [x] User Management
- [x] Admin Dashboard
- [x] Settings & Configuration
- [x] Zoom Integration
- [x] Payments (Razorpay)
- [x] Student Learning
- [x] Teacher Content Creation
- [x] Live Classes
- [x] Profile Management
- [x] Progress Tracking

### 9.3 Known Limitations & TODOs
```
Backend:
- [ ] Certificate generation (DB field exists, logic TBD)
- [ ] Discussion forum (DB field exists, feature TBD)
- [ ] Advanced search/filtering
- [ ] Batch user import
- [ ] Email notifications queue

Frontend:
- [ ] Mobile responsiveness refinements
- [ ] Dark mode bug fixes
- [ ] Offline content playback
- [ ] Assignment submission system
- [ ] Quizzes & assessments
- [ ] Video quality selection
```

---

## 10. DEPLOYMENT

### 10.1 Local Development
```bash
# Backend
cd backend
npm install
npm run dev                    # Runs on port 5000

# Admin Portal
cd frontend/admin
npm install
npm run dev                    # Runs on port 3001

# Teacher Portal
cd frontend/teacher
npm install  
npm run dev                    # Runs on port 3002

# Student Portal
cd frontend/student
npm install
npm run dev                    # Runs on port 3003

# Landing Page
cd frontend/landing
npm install
npm run dev                    # Runs on port 3000
```

### 10.2 Docker Deployment (Dokploy)
- Docker Compose file: `docker-compose.dokploy.yml`
- Each service has a `Dockerfile`
- Automatic HTTPS and domain routing
- **Key Env Vars:** DOMAIN, API_SUBDOMAIN, DB credentials, JWT secrets

### 10.3 Environment Requirements
```
Backend:
- Node.js 18+ 
- MySQL 8.0+
- SMTP server (for emails)
- Zoom API credentials
- Razorpay API keys

Frontend:
- Node.js 18+
- npm/yarn package manager
```

---

## 11. CODE ORGANIZATION SUMMARY

### 11.1 Directory Tree (Condensed)
```
backend/src/
├── config/              Database, Multer, Mail configuration
├── middleware/          Auth verification, file upload handling
├── models/             Sequelize model definitions (User, Course, etc.)
├── modules/            Feature modules (auth, courses, users, etc.)
├── services/           Zoom, Razorpay integrations
├── scripts/            DB setup, seed data, migrations
├── utils/              JWT helpers, utilities
└── server.ts          Express app bootstrap

frontend/admin/src/
├── pages/              Dashboard, Users, Courses, Settings, etc.
├── components/         Reusable UI components
├── context/            Global state (Theme, Auth)
├── services/           API client (axios instance)
└── utils/              Helpers, formatters

frontend/shared/
├── components/         Shared components (VideoPlayer)
├── constants/          API endpoints, defaults
├── types/              TypeScript interfaces
└── utils/              Video utilities
```

---

## 12. KEY METRICS & STATISTICS

| Metric | Value |
|--------|-------|
| **Total Database Tables** | 9+ |
| **API Endpoints** | 50+ |
| **Feature Modules** | 11 |
| **React Components** | 50+ (across 3 portals) |
| **Backend Routes** | Modular per feature |
| **Authentication Type** | JWT (HS256) |
| **File Upload Size Limit** | Configurable (Multer) |
| **Rate Limit** | 500 req/15min |
| **Database ORM** | Sequelize v6 |
| **UI Framework** | Material-UI v5 |

---

## 13. NEXT STEPS & RECOMMENDATIONS

### 13.1 Immediate Priorities
1. **Security Hardening**
   - Implement token-based course content access
   - Add request validation schemas
   - Set up cloud storage (AWS S3) instead of local filesystem

2. **Feature Completion**
   - Certificate generation and delivery
   - Discussion forum backend/frontend
   - Quiz and assessments system
   - Email notification templates

3. **Testing**
   - Unit tests for critical functions (auth, payments)
   - Integration tests for API endpoints
   - E2E tests for user flows

### 13.2 Performance Optimization
- Implement database query caching
- Compress video storage or use CDN
- Optimize frontend bundle sizes
- Set up Redis for session management

### 13.3 Scalability
- Move file storage to AWS S3
- Implement message queue for async tasks
- Set up load balancing
- Database read replicas for high traffic

---

## 14. IMPORTANT FILES TO KNOW

| File | Purpose |
|------|---------|
| [backend/src/server.ts](backend/src/server.ts) | Express app entry point, middleware setup |
| [backend/src/models/index.ts](backend/src/models/index.ts) | Database model associations |
| [backend/database/schema.sql](backend/database/schema.sql) | Complete database schema |
| [docs/rules.md](docs/rules.md) | Development rules (theme, layout, naming) |
| [docs/security_issues.md](docs/security_issues.md) | Known vulnerabilities and fixes |
| [docs/PRD.md](docs/PRD.md) | Product requirements document |
| [DEPLOY.md](DEPLOY.md) | Deployment instructions on Dokploy |

---

## 15. GLOSSARY

| Term | Definition |
|------|-----------|
| **JWT** | JSON Web Token - Stateless authentication mechanism |
| **RBAC** | Role-Based Access Control - Permission system based on user roles |
| **ORM** | Object-Relational Mapping - Sequelize library for database |
| **Micro-Frontend** | Independent React apps with separate bundles (Admin, Teacher, Student) |
| **CORS** | Cross-Origin Resource Sharing - Allow requests from different domains |
| **Helmet** | Express middleware for HTTP security headers |
| **Multer** | Middleware for handling file uploads |
| **Vidstack** | Modern HTML5 video player library |
| **Editor.js** | Block-style rich text editor |
| **Razorpay** | Payment gateway for processing INR transactions |

---

**End of Analysis**
