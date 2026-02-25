# Product Requirements Document (PRD)

## Product Name

Learning Management System (LMS) – Phase 1

## Document Purpose

This document defines the **Phase 1 scope** of the LMS platform to be shared with stakeholders and clients. Phase 1 focuses on delivering a **fully functional, monetizable, and production-ready LMS** with core learning, teaching, and administration capabilities.

---

## 1. Product Overview

The LMS is a web-based platform designed for organizations to create, manage, sell, and deliver educational content. It supports **Admin, Teacher, and Student** roles and enables learning through **video courses, live Zoom classes, and text-based content**.

Phase 1 delivers all essential features required to launch, operate, and scale an online learning business.

---

## 2. Goals & Objectives

### Business Goals

* Enable organizations to launch paid online courses
* Support instructor-led live learning
* Automate enrollments, payments, and notifications
* Provide operational visibility to administrators

### Product Goals

* Simple and intuitive user experience
* Secure and scalable architecture
* Minimal manual intervention for admins

---

## 3. User Roles & Access

### 3.1 Admin

Admins manage the platform and control all operations.

**Key Capabilities:**

* Create and manage courses
* Assign multiple teachers to courses
* Manage users (teachers and students)
* Configure pricing, taxes, and payments
* Monitor enrollments, revenue, and reports
* Configure email notifications
* Manage Zoom integration

---

### 3.2 Teacher

Teachers deliver and manage learning content.

**Key Capabilities:**

* View assigned courses
* Upload and manage course content
* Schedule and conduct live Zoom classes
* View enrolled students
* Track attendance and engagement
* Post announcements and discussion updates

---

### 3.3 Student

Students consume learning content and attend classes.

**Key Capabilities:**

* Register and log in
* Purchase or enroll in courses
* Access video, live, and text content
* Join live Zoom sessions
* Track learning progress
* Receive notifications

---

## 4. Core Functional Requirements

### 4.1 Authentication & User Management

* Role-based login (Admin / Teacher / Student)
* Secure email and password authentication
* Password reset via email
* User profile management

---

### 4.2 Course Management

**Admin Features:**

* Create, edit, publish, and archive courses
* Define course details (title, description, category)
* Set pricing (free or paid)
* Assign one or multiple teachers

**Teacher Features:**

* Add and organize course content
* Manage lessons and modules

---

### 4.3 Learning Content Types

#### Video Content

* Upload or embed video lessons
* Organize videos into modules

#### Text-Based Content

* Rich text editor for lessons
* Downloadable learning resources

#### Live Classes (Zoom)

* Schedule live sessions
* Automatic Zoom meeting creation
* Student access via LMS dashboard
* Attendance tracking
* Access to recorded session links

---

### 4.4 Zoom Integration

* Organization-level Zoom account integration
* Teachers schedule and host live classes
* Students join sessions from LMS
* Store session metadata and recordings

---

### 4.5 Payments & Monetization

* One-time course payments
* Subscription-based access (monthly / yearly)
* Tax configuration (GST / VAT)
* Automatic enrollment after payment
* Invoice and receipt generation
* Refund management (admin-controlled)

---

### 4.6 Notifications & Communication

* Automated email notifications for:

  * Registration
  * Course purchase and enrollment
  * Live class reminders
  * Password reset

* In-app notifications

* Course announcements

* Discussion boards for student-teacher interaction

---

### 4.7 Quizzes & Assessments

* Multiple-choice and objective quizzes
* Auto-evaluation
* Pass/fail criteria
* Attempt limits

---

## 5. Dashboards

### Admin Dashboard

* User overview
* Course and enrollment statistics
* Revenue and payment reports
* Live class monitoring

### Teacher Dashboard

* Assigned courses
* Upcoming live sessions
* Student lists and attendance
* Content management

### Student Dashboard

* Enrolled courses
* Learning progress
* Upcoming live classes
* Payment history

---

## 6. Reporting & Administration

* Enrollment reports
* Payment and revenue reports
* Attendance tracking
* Data export (CSV)
* Audit logs for admin actions

---

## 7. Technical Specifications

### 7.1 Technology Stack

#### Backend
* **Runtime:** Node.js (LTS version)
* **Framework:** Express.js
* **Database:** MySQL 8.0+
* **ORM:** Sequelize or TypeORM
* **Authentication:** JWT (JSON Web Tokens)
* **File Storage:** AWS S3 or compatible object storage
* **Video Streaming:** HLS (HTTP Live Streaming) protocol

#### Frontend
* **Framework:** React.js with TypeScript
* **State Management:** Redux Toolkit or Zustand
* **UI Library:** Material-UI or Ant Design
* **Video Player:** Video.js or React Player
* **API Communication:** Axios with interceptors

#### Third-Party Integrations
* **Payment Gateway:** Razorpay
* **Video Conferencing:** Zoom API (OAuth 2.0)
* **Email Service:** SendGrid or AWS SES
* **Cloud Infrastructure:** AWS or DigitalOcean

---

### 7.2 Architecture Approach

**Modular Monolithic Architecture**

The application follows a modular monolithic pattern where the codebase is organized into distinct, loosely-coupled modules within a single deployable unit.

#### Core Modules

1. **Authentication Module**
   * User registration, login, logout
   * JWT token management
   * Password reset functionality
   * Role-based access control (RBAC)

2. **User Management Module**
   * User CRUD operations
   * Profile management
   * Role assignment
   * User activity tracking

3. **Course Management Module**
   * Course CRUD operations
   * Course categorization
   * Teacher assignment
   * Course publishing workflow

4. **Content Management Module**
   * Video content handling
   * Text-based lessons
   * Resource uploads
   * Content organization (modules/lessons)

5. **Live Class Module (Zoom Integration)**
   * Zoom OAuth integration
   * Session scheduling
   * Meeting creation and management
   * Attendance tracking
   * Recording storage and access

6. **Payment Module**
   * Razorpay integration
   * One-time payments
   * Subscription management
   * Tax calculation (GST/VAT)
   * Invoice generation
   * Refund processing

7. **Enrollment Module**
   * Course enrollment logic
   * Access control
   * Progress tracking
   * Certificate generation

8. **Assessment Module**
   * Quiz creation and management
   * Auto-evaluation engine
   * Result tracking
   * Attempt management

9. **Notification Module**
   * Email notifications
   * In-app notifications
   * Announcement system
   * Notification templates

10. **Reporting Module**
    * Enrollment analytics
    * Revenue reports
    * Attendance reports
    * Data export functionality

11. **Discussion Module**
    * Course discussion boards
    * Student-teacher interaction
    * Comment moderation

#### Module Communication
* Modules communicate through well-defined service interfaces
* Shared database with module-specific schemas
* Event-driven communication for cross-module operations
* Centralized error handling and logging

#### Benefits of Modular Monolithic Approach
* **Faster Development:** Single codebase, easier debugging
* **Cost-Effective:** Single deployment, lower infrastructure costs
* **Team Collaboration:** Clear module boundaries for parallel development
* **Future-Ready:** Easy migration to microservices if needed
* **Simplified Testing:** Integrated testing environment

---

### 7.3 Database Design Principles

* Normalized schema design (3NF)
* Proper indexing for performance
* Foreign key constraints for data integrity
* Soft deletes for audit trails
* Timestamp tracking (created_at, updated_at)

#### Key Entities
* Users (Admin, Teacher, Student)
* Courses
* Lessons/Modules
* Enrollments
* Payments/Transactions
* Live Sessions
* Quizzes/Assessments
* Notifications
* Discussion Posts

---

### 7.4 Video Content Strategy

* **Upload:** Direct upload to S3-compatible storage
* **Processing:** Server-side conversion to HLS format
* **Streaming:** Adaptive bitrate streaming (360p, 480p, 720p)
* **Security:** Signed URLs with expiration
* **DRM:** Not required in Phase 1 (streaming only, no downloads)

---

### 7.5 Zoom Integration Specifications

* **API Type:** Zoom OAuth 2.0
* **Meeting Type:** Scheduled meetings
* **Features:**
  * Auto-create meetings when teacher schedules
  * Generate join links for students
  * Webhook integration for attendance tracking
  * Store recording links post-session
* **Account:** Organization-level Zoom account

---

### 7.6 Payment Integration (Razorpay)

* **Payment Methods:** Cards, UPI, Net Banking, Wallets
* **Features:**
  * One-time course purchase
  * Subscription plans (monthly/yearly)
  * Automatic enrollment on successful payment
  * Webhook handling for payment status
  * Invoice generation with GST/VAT
  * Refund API integration

---

### 7.7 Scalability Targets

* **Phase 1 (Months 1-2):** 100 concurrent students
* **Phase 2 (Months 3-6):** 1,000 concurrent students
* **Performance Targets:**
  * Page load time: < 2 seconds
  * API response time: < 500ms (95th percentile)
  * Video streaming: < 3 seconds initial buffering
  * Database queries: Optimized with proper indexing

---

### 7.8 Certificate Generation

* Auto-generated upon course completion
* PDF format with course details and student name
* Digital signature/verification code
* Downloadable from student dashboard
* Email delivery option

---

### 7.9 Development Timeline

**Target Launch:** 7 days from project start

**Suggested Sprint Breakdown:**
* **Days 1-2:** Database schema, authentication, user management
* **Days 3-4:** Course management, content upload, Razorpay integration
* **Days 5-6:** Zoom integration, enrollment flow, dashboards
* **Day 7:** Testing, bug fixes, deployment

---

## 8. Non-Functional Requirements

* **Responsive Design:** Mobile-first approach, works on all devices
* **Security:**
  * HTTPS/SSL encryption
  * Password hashing (bcrypt)
  * SQL injection prevention
  * XSS protection
  * CSRF tokens
  * Rate limiting on APIs
* **Scalability:** Horizontal scaling capability with load balancer
* **Availability:** 99.5% uptime target
* **Performance:** Optimized database queries, caching strategy (Redis)
* **Compliance:**
  * PCI-DSS (via Razorpay)
  * Data privacy (GDPR-ready)
  * Secure payment handling
* **Monitoring:** Application logging, error tracking (Sentry), performance monitoring
* **Backup:** Daily automated database backups with 30-day retention

---

---

**End of Document**
