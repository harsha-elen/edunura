# Frontend Consolidation: From 3 SPAs to 1 Unified Application

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Implementation Steps](#implementation-steps)
5. [Code Changes](#code-changes)
6. [Migration Guide](#migration-guide)
7. [Docker & Deployment](#docker--deployment)
8. [Testing & Validation](#testing--validation)
9. [Timeline & Effort](#timeline--effort)
10. [Rollback Plan](#rollback-plan)

---

## Overview

Currently, the LMS runs **3 separate React applications**:
- **Admin Portal** (Port 3001) - Course/user management
- **Teacher Portal** (Port 3002) - Course creation/live classes
- **Student Portal** (Port 3003) - Course learning/enrollment
- **Landing Site** (Next.js, Port 3000) - Public marketing site

### Problem with Current Setup
- ❌ 3x package.json, 3x build processes, 3x deployments
- ❌ Duplicate auth logic, API clients, types
- ❌ Session/token not shared—users login separately per portal
- ❌ Complex Docker Compose with 3 services
- ❌ Each portal has its own node_modules (~1GB× 3)
- ❌ Cross-app updates require coordinating 3 repos/builds

### Solution: Single Unified Frontend + Landing Site (Next.js)
- ✅ **One Vite app** (port 3000) for admin/teacher/student
- ✅ **Shared session** — login once, role determines UI
- ✅ **Shared dependencies** — 1× node_modules
- ✅ **One Docker image** — easier to deploy, scale, maintain
- ✅ **Landing stays separate** (Next.js) for SEO + static site benefits

---

## Architecture

### High-Level Flow

```
User visits https://yourdomain.com/
    ↓
Landing (Next.js) OR App (Vite) based on path
    ↓
If landing path → serve Next.js landing
If /app path or authenticated → serve Vite app
    ↓
Vite App determines role from JWT token
    ↓
Renders:
  - AdminLayout + Admin pages (if role=admin)
  - TeacherLayout + Teacher pages (if role=teacher)
  - StudentLayout + Student pages (if role=student)
```

### Directory Structure After Consolidation

```
frontend/
├── landing/                    (Separate Next.js app — UNCHANGED)
│   ├── src/
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
│
├── app/                        (NEW: Unified Vite app for all roles)
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ForgotPassword.tsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Courses.tsx
│   │   │   │   ├── CourseDetails.tsx
│   │   │   │   ├── CourseCategories.tsx
│   │   │   │   ├── Teachers.tsx
│   │   │   │   ├── Students.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── LiveClasses/
│   │   │   │       ├── LiveClassSession.tsx
│   │   │   │       └── StandaloneLiveClass.tsx
│   │   │   │
│   │   │   ├── teacher/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Courses.tsx
│   │   │   │   ├── ManageCourse.tsx
│   │   │   │   ├── Calendar.tsx
│   │   │   │   ├── LiveClasses.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── LiveClasses/
│   │   │   │       └── StandaloneLiveClass.tsx
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── MyCourses.tsx
│   │   │   │   ├── Checkout.tsx
│   │   │   │   ├── CoursePlayer.tsx
│   │   │   │   ├── LiveSessions.tsx
│   │   │   │   ├── PurchaseSuccess.tsx
│   │   │   │   ├── Calendar.tsx
│   │   │   │   ├── Help.tsx
│   │   │   │   └── Profile.tsx
│   │   │   │
│   │   │   └── public/
│   │   │       └── NotFound.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layouts/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── TeacherLayout.tsx
│   │   │   │   ├── StudentLayout.tsx
│   │   │   │   └── BlankLayout.tsx
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── Toast.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── CourseForm.tsx
│   │   │       ├── CourseGrid.tsx
│   │   │       ├── UserTable.tsx
│   │   │       └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── authService.ts
│   │   │   ├── courseService.ts
│   │   │   ├── userService.ts
│   │   │   ├── enrollmentService.ts
│   │   │   └── zoomService.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useFetch.ts
│   │   │   ├── useRole.ts
│   │   │   └── useToast.ts
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── ToastContext.tsx
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts        (User, Course, Enrollment, etc.)
│   │   │   ├── api.ts          (API response models)
│   │   │   └── auth.ts         (Token, Auth payloads)
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── videoUtils.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── api.ts
│   │   │   ├── roles.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── App.tsx             (Role-based routing)
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── README.md
│
├── shared/                     (Shared utilities — if needed)
│   ├── types/
│   ├── constants/
│   └── utils/
│
└── README.md                   (Updated with new structure)
```

---

## Folder Structure

### Detailed Breakdown

#### 1. **pages/ organization**

```
src/pages/
├── auth/
│   ├── Login.tsx              — Public, unauthenticated
│   ├── Register.tsx           — Public, unauthenticated
│   └── ForgotPassword.tsx     — Public, unauthenticated
│
├── admin/                     — Protected: role === 'admin'
│   ├── Dashboard.tsx
│   ├── Courses/
│   │   ├── index.tsx
│   │   ├── Create.tsx
│   │   ├── Edit.tsx
│   │   └── Details.tsx
│   ├── Categories/
│   ├── Users/
│   ├── Teachers.tsx
│   ├── Students.tsx
│   ├── Settings.tsx
│   ├── Profile.tsx
│   └── LiveClasses/
│       ├── LiveClassSession.tsx
│       └── StandaloneLiveClass.tsx
│
├── teacher/                   — Protected: role === 'teacher'
│   ├── Dashboard.tsx
│   ├── Courses.tsx
│   ├── ManageCourse.tsx
│   ├── Calendar.tsx
│   ├── LiveClasses.tsx
│   ├── Profile.tsx
│   └── LiveClasses/
│       └── StandaloneLiveClass.tsx
│
├── student/                   — Protected: role === 'student'
│   ├── Dashboard.tsx
│   ├── MyCourses.tsx
│   ├── CoursePlayer.tsx
│   ├── Checkout.tsx
│   ├── PurchaseSuccess.tsx
│   ├── LiveSessions.tsx
│   ├── Calendar.tsx
│   ├── Help.tsx
│   └── Profile.tsx
│
├── shared/                    — Public or shared between roles
│   ├── NotFound.tsx
│   └── Unauthorized.tsx
```

#### 2. **services/ organization**

All services are **role-agnostic**; the same API clients used by all roles.

```
src/services/
├── apiClient.ts              — Axios instance with interceptors
├── authService.ts            — Login, logout, refresh, getMe
├── courseService.ts          — getCourses, createCourse, etc.
├── enrollmentService.ts      — Enroll, getEnrollments
├── paymentService.ts         — Razorpay integration
├── zoomService.ts            — Zoom meeting management
├── userService.ts            — Get/update user profile
├── categoryService.ts        — Course categories
└── settingsService.ts        — System settings
```

#### 3. **components/ organization**

```
src/components/
├── layouts/
│   ├── AdminLayout.tsx       — Admin sidebar + header
│   ├── TeacherLayout.tsx     — Teacher sidebar + header
│   ├── StudentLayout.tsx     — Student sidebar + header
│   └── BlankLayout.tsx       — For login/public pages (no sidebar)
│
├── common/
│   ├── ProtectedRoute.tsx    — Wrapper for role-based access
│   ├── Sidebar.tsx           — Reusable sidebar (config-driven)
│   ├── Header.tsx            — Reusable header
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   └── Toast.tsx
│
├── admin/                    — Admin-specific reusable components
│   ├── CourseForm.tsx
│   ├── CourseGrid.tsx
│   ├── UserTable.tsx
│   └── ...
│
├── teacher/                  — Teacher-specific reusable components
│   ├── CourseCard.tsx
│   ├── LessonForm.tsx
│   └── ...
│
└── student/                  — Student-specific reusable components
    ├── CourseCard.tsx
    ├── CoursePlayer.tsx
    └── ...
```

#### 4. **hooks/ organization**

```
src/hooks/
├── useAuth.ts               — { user, login, logout, isLoading }
├── useRole.ts               — { role, hasRole }
├── useFetch.ts              — Generic data fetching with React Query
├── useToast.ts              — { showToast, showError, showSuccess }
├── useLocalStorage.ts       — Wrapper around localStorage
├── useDebounce.ts           — Debounced state
└── useProtectedRoute.ts     — Query user + redirect if not authed
```

#### 5. **types/ organization**

```
src/types/
├── index.ts                 — Main exports (User, Course, etc.)
├── api.ts                   — API response envelopes
├── auth.ts                  — JWT payload, auth request/response
├── entities.ts              — Database models (mirrors backend)
└── forms.ts                 — Form validation schemas (if using Zod)
```

---

## Implementation Steps

### Phase 1: Preparation (Day 1)

#### Step 1.1: Create new `app/` folder structure

```bash
mkdir -p frontend/app/src/{pages,components,services,hooks,context,types,utils,constants}
cd frontend/app
npm init -y
```

#### Step 1.2: Copy baseline files from admin

```bash
# Copy package.json, config files, and tsconfig
cp ../admin/package.json .
cp ../admin/tsconfig.json .
cp ../admin/vite.config.ts .
cp ../admin/nginx.conf .
cp ../admin/Dockerfile .
cp ../admin/docker-entrypoint.sh .
cp ../admin/index.html .
cp -r ../admin/public .
```

#### Step 1.3: Update package.json

```json
{
  "name": "lms-frontend-unified",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@tanstack/react-query": "^5.14.2",
    "date-fns": "^3.0.6",
    "recharts": "^2.10.3",
    "@vidstack/react": "^1.12.13",
    "@zoom/meetingsdk": "^5.1.2",
    "react-sortablejs": "^6.1.4",
    "sortablejs": "^1.15.7",
    "@editor-js/editorjs": "^2.31.2",
    "react-international-phone": "^4.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1"
  }
}
```

### Phase 2: Code Migration (Days 2–3)

#### Step 2.1: Consolidate services

```typescript
// frontend/app/src/services/authService.ts
import apiClient from './apiClient';
import { User, AuthResponse } from '../types/auth';

export const authService = {
  login: (email: string, password: string, portal?: string): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', { email, password, portal });
  },

  register: (userData: any): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', userData);
  },

  logout: (): Promise<void> => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return apiClient.post('/auth/logout').catch(() => {});
  },

  getMe: (): Promise<User> => {
    return apiClient.get('/auth/me').then(res => res.data.data);
  },

  refreshToken: (refreshToken: string): Promise<AuthResponse> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
};

export default authService;
```

#### Step 2.2: Create role-based routing constants

```typescript
// frontend/app/src/constants/routes.ts
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  MODERATOR: 'moderator',
};

export const ROLE_ROUTES = {
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/courses', label: 'Courses', icon: 'book' },
    { path: '/categories', label: 'Categories', icon: 'category' },
    { path: '/teachers', label: 'Teachers', icon: 'person' },
    { path: '/students', label: 'Students', icon: 'school' },
    { path: '/users', label: 'Users', icon: 'group' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
  ],
  teacher: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/courses', label: 'My Courses', icon: 'book' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar' },
    { path: '/live-classes', label: 'Live Classes', icon: 'videocam' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
  ],
  student: [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/my-courses', label: 'My Courses', icon: 'book' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar' },
    { path: '/live-sessions', label: 'Live Sessions', icon: 'videocam' },
    { path: '/help', label: 'Help', icon: 'help' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
  ],
};
```

#### Step 2.3: Create hooks for shared logic

```typescript
// frontend/app/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '../types/auth';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        setError('Invalid user data');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return response.data.user;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  return { user, login, logout, isLoading, error };
};
```

#### Step 2.4: Create ProtectedRoute component

```typescript
// frontend/app/src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

#### Step 2.5: Create role-based Layout dispatcher

```typescript
// frontend/app/src/components/RoleLayoutDispatcher.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

export const RoleLayoutDispatcher: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const Layout = {
    admin: AdminLayout,
    moderator: AdminLayout,
    teacher: TeacherLayout,
    student: StudentLayout,
  }[user.role];

  if (!Layout) return <Navigate to="/unauthorized" replace />;

  return <Layout>{children}</Layout>;
};
```

### Phase 3: App.tsx Consolidation (Days 3)

#### Step 3.1: Create consolidated App.tsx

```typescript
// frontend/app/src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminCourses = React.lazy(() => import('./pages/admin/Courses'));
const CourseDetails = React.lazy(() => import('./pages/admin/CourseDetails'));
const AdminCategories = React.lazy(() => import('./pages/admin/CourseCategories'));
const Teachers = React.lazy(() => import('./pages/admin/Teachers'));
const Students = React.lazy(() => import('./pages/admin/Students'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const Settings = React.lazy(() => import('./pages/admin/Settings'));
const AdminProfile = React.lazy(() => import('./pages/admin/Profile'));
const AdminLiveClass = React.lazy(() => import('./pages/admin/LiveClasses/StandaloneLiveClass'));

// Teacher pages
const TeacherDashboard = React.lazy(() => import('./pages/teacher/Dashboard'));
const TeacherCourses = React.lazy(() => import('./pages/teacher/Courses'));
const ManageCourse = React.lazy(() => import('./pages/teacher/ManageCourse'));
const TeacherCalendar = React.lazy(() => import('./pages/teacher/Calendar'));
const TeacherLiveClasses = React.lazy(() => import('./pages/teacher/LiveClasses'));
const TeacherProfile = React.lazy(() => import('./pages/teacher/Profile'));
const TeacherLiveClass = React.lazy(() => import('./pages/teacher/LiveClasses/StandaloneLiveClass'));

// Student pages
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const StudentMyCourses = React.lazy(() => import('./pages/student/MyCourses'));
const StudentCheckout = React.lazy(() => import('./pages/student/Checkout'));
const StudentCoursePlayer = React.lazy(() => import('./pages/student/CoursePlayer'));
const StudentLiveSessions = React.lazy(() => import('./pages/student/LiveSessions'));
const StudentPurchaseSuccess = React.lazy(() => import('./pages/student/PurchaseSuccess'));
const StudentCalendar = React.lazy(() => import('./pages/student/Calendar'));
const StudentHelp = React.lazy(() => import('./pages/student/Help'));
const StudentProfile = React.lazy(() => import('./pages/student/Profile'));

// Layouts
import { RoleLayoutDispatcher } from './components/RoleLayoutDispatcher';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import BlankLayout from './components/layouts/BlankLayout';

// Loading fallback
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingFallback />;

  return (
    <ThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<BlankLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected routes with role-based layout */}
          <Route
            element={
              <ProtectedRoute>
                <RoleLayoutDispatcher>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Admin Routes */}
                      {user?.role === 'admin' && (
                        <>
                          <Route path="/dashboard" element={<AdminDashboard />} />
                          <Route path="/courses" element={<AdminCourses />} />
                          <Route path="/courses/create" element={<CourseDetails />} />
                          <Route path="/courses/edit/:id" element={<CourseDetails />} />
                          <Route path="/categories" element={<AdminCategories />} />
                          <Route path="/teachers" element={<Teachers />} />
                          <Route path="/students" element={<Students />} />
                          <Route path="/users" element={<Users />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/profile" element={<AdminProfile />} />
                          <Route path="/live-class/:meetingId" element={<AdminLiveClass />} />
                          <Route path="/meeting/:meetingId" element={<AdminLiveClass />} />
                        </>
                      )}

                      {/* Teacher Routes */}
                      {user?.role === 'teacher' && (
                        <>
                          <Route path="/dashboard" element={<TeacherDashboard />} />
                          <Route path="/courses" element={<TeacherCourses />} />
                          <Route path="/courses/:id/manage" element={<ManageCourse />} />
                          <Route path="/calendar" element={<TeacherCalendar />} />
                          <Route path="/live-classes" element={<TeacherLiveClasses />} />
                          <Route path="/profile" element={<TeacherProfile />} />
                          <Route path="/meeting/:meetingId" element={<TeacherLiveClass />} />
                        </>
                      )}

                      {/* Student Routes */}
                      {user?.role === 'student' && (
                        <>
                          <Route path="/dashboard" element={<StudentDashboard />} />
                          <Route path="/my-courses" element={<StudentMyCourses />} />
                          <Route path="/checkout/:courseId" element={<StudentCheckout />} />
                          <Route path="/course/:courseId/player/:lessonId" element={<StudentCoursePlayer />} />
                          <Route path="/course/:courseId/learn" element={<StudentCoursePlayer />} />
                          <Route path="/live-sessions" element={<StudentLiveSessions />} />
                          <Route path="/purchase-success/:courseId" element={<StudentPurchaseSuccess />} />
                          <Route path="/calendar" element={<StudentCalendar />} />
                          <Route path="/help" element={<StudentHelp />} />
                          <Route path="/profile" element={<StudentProfile />} />
                        </>
                      )}

                      {/* Default dashboard for any role */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </RoleLayoutDispatcher>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

#### Step 3.2: Update Layouts to be role-agnostic

Each layout should be simplified to accept children instead of hardcoding nav items. Nav items are now loaded from `ROLE_ROUTES` constant.

```typescript
// frontend/app/src/components/layouts/AdminLayout.tsx
import React from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROLE_ROUTES } from '../../constants/routes';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const navItems = ROLE_ROUTES.admin;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: 250 }}>
        <List sx={{ marginTop: 10 }}>
          {navItems.map(item => (
            <ListItem button key={item.path} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, marginLeft: '250px', marginTop: '64px', p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
```

---

## Code Changes

### File-by-File Migration Checklist

#### Move to `frontend/app/src/services/`:
- [ ] `apiClient.ts` (consolidate from all 3 portals)
- [ ] `authService.ts` (consolidate + add refresh logic)
- [ ] `courseService.ts`
- [ ] `enrollmentService.ts`
- [ ] `paymentService.ts`
- [ ] `userService.ts`
- [ ] `categoryService.ts`
- [ ] `settingsService.ts`
- [ ] `zoomService.ts`

#### Move to `frontend/app/src/hooks/`:
- [ ] `useAuth.ts`
- [ ] `useFetch.ts`
- [ ] `useRole.ts`
- [ ] `useToast.ts`
- [ ] `useLocalStorage.ts`
- [ ] `useDebounce.ts`

#### Move to `frontend/app/src/types/`:
- [ ] `index.ts` (all entity types)
- [ ] `auth.ts` (auth models)
- [ ] `api.ts` (API response envelopes)

#### Move to `frontend/app/src/pages/admin/`:
- [ ] All admin pages from `frontend/admin/src/pages`

#### Move to `frontend/app/src/pages/teacher/`:
- [ ] All teacher pages from `frontend/teacher/src/pages`

#### Move to `frontend/app/src/pages/student/`:
- [ ] All student pages from `frontend/student/src/pages`

#### Move to `frontend/app/src/components/layouts/`:
- [ ] `AdminLayout.tsx`
- [ ] `TeacherLayout.tsx`
- [ ] `StudentLayout.tsx`
- [ ] `BlankLayout.tsx` (new)

#### Move to `frontend/app/src/components/common/`:
- [ ] `ProtectedRoute.tsx`
- [ ] `Sidebar.tsx` (refactored)
- [ ] `Header.tsx` (refactored)
- [ ] `LoadingSpinner.tsx`
- [ ] `ErrorBoundary.tsx`
- [ ] `Toast.tsx`

---

## Migration Guide

### Step-by-Step Implementation

#### Phase 1: Setup (2 hours)
1. Create `frontend/app` directory
2. Copy base config files (package.json, vite.config.ts, tsconfig.json, nginx.conf, Dockerfile)
3. Install dependencies
4. Create folder structure

#### Phase 2: Backend Compatibility (4 hours)
1. Consolidate `apiClient.ts` — ensure it works for all 3 roles
2. Consolidate `authService.ts` — test login for admin/teacher/student
3. Create `useAuth` hook
4. Update `ProtectedRoute` to accept role restrictions
5. Test auth flow end-to-end

#### Phase 3: Pages Migration (8 hours)
1. Copy all page components to `frontend/app/src/pages/{admin,teacher,student}`
2. Update imports in all pages:
   - Change `../../services/authService` to `../../services/authService`
   - Change `../../hooks/useAuth` to `../../hooks/useAuth`
   - Change relative imports to absolute paths if using path aliases
3. Fix component imports (layouts, common components)

#### Phase 4: Routes & Layouts (4 hours)
1. Create `RoleLayoutDispatcher` component
2. Rewrite `App.tsx` with consolidated routing
3. Refactor `AdminLayout`, `TeacherLayout`, `StudentLayout` to use `ROLE_ROUTES`
4. Test all 3 login flows
5. Verify sidebar/header load correct nav items per role

#### Phase 5: Testing & QA (4 hours)
1. Test login as admin → verify admin dashboard loads
2. Test login as teacher → verify teacher dashboard loads
3. Test login as student → verify student dashboard loads
4. Test logout
5. Test invalid user → redirect to login
6. Test role-based access (e.g., teacher can't access /admin/users)

### Testing Checklist

```markdown
## QA Checklist

### Auth
- [ ] Login as admin works
- [ ] Login as teacher works
- [ ] Login as student works
- [ ] Logout clears session
- [ ] Refresh token works
- [ ] Invalid credentials show error
- [ ] Unauthenticated user redirected to login

### Navigation
- [ ] Admin sees admin sidebar
- [ ] Teacher sees teacher sidebar
- [ ] Student sees student sidebar
- [ ] Sidebar links navigate correctly
- [ ] Header displays user profile menu

### Role-Based Access
- [ ] Admin can access /dashboard, /courses, /users, /settings
- [ ] Teacher can access /dashboard, /courses, /calendar
- [ ] Student can access /dashboard, /my-courses, /checkout
- [ ] Student cannot access /admin/users
- [ ] Teacher cannot access /student/checkout

### API Integration
- [ ] Course fetching works
- [ ] User profile fetching works
- [ ] Payment flow works (if student)
- [ ] Zoom integration works (if admin/teacher)
- [ ] Settings API works (if admin)

### Performance
- [ ] Page load time < 3s
- [ ] Lazy loading works for heavy pages
- [ ] No duplicate API calls
```

---

## Docker & Deployment

### Updated docker-compose.dokploy.yml

```yaml
services:
  # Database (unchanged)
  db:
    image: mysql:8.0
    container_name: lms_db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
    networks:
      - lms_internal

  # Backend API (unchanged)
  backend:
    image: harshath/lms-backend:latest
    container_name: lms_backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: ${NODE_ENV}
      PORT: ${PORT}
      # ... all backend env vars
    volumes:
      - uploads_data:/app/uploads
    expose:
      - "5000"
    networks:
      - lms_internal
      - dokploy-network

  # Landing Site (Next.js — unchanged)
  landing:
    image: harshath/lms-landing:latest
    container_name: lms_landing
    expose:
      - "3000"
    networks:
      - dokploy-network

  # Unified Frontend App (Vite — REPLACES admin/teacher/student)
  frontend:
    image: harshath/lms-frontend:latest
    container_name: lms_frontend
    expose:
      - "80"
    environment:
      VITE_API_BASE_URL: ${BACKEND_URL}/api
    networks:
      - dokploy-network

volumes:
  db_data:
    driver: local
  uploads_data:
    driver: local

networks:
  lms_internal:
    driver: bridge
  dokploy-network:
    external: true
```

### Updated Dockerfile (frontend/app/)

```dockerfile
# Build stage - multi-stage for smaller final image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install nginx in Alpine
RUN apk add --no-cache nginx

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["./docker-entrypoint.sh"]
```

### Updated nginx.conf (frontend/app/)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 256;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 1G;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    server {
        listen 80;
        server_name _;

        root /app/dist;
        index index.html;

        # SPA routing - all routes fall back to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (optional, if backend on same domain)
        location /api {
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        error_page 404 /index.html;
    }
}
```

### Deployment Path

```bash
# Build image locally
cd frontend/app
docker build -t harshath/lms-frontend:latest .

# Push to registry
docker push harshath/lms-frontend:latest

# In Dokploy UI:
# 1. Remove "admin-app", "teacher-app", "student-app" services
# 2. Add "frontend" service pointing to this image
# 3. Add domain mapping: yourapp-domain.com → frontend:80
# 4. Set VITE_API_BASE_URL env var to backend API URL
# 5. Deploy
```

---

## Testing & Validation

### Local Development

```bash
cd frontend/app
npm install
npm run dev

# App will run on http://localhost:3000
# Test flow:
# 1. Visit http://localhost:3000 → redirected to /login
# 2. Login as admin@test.com → see admin dashboard
# 3. Visit http://localhost:3000/courses → see admin courses page
# 4. Logout → redirected to /login
# 5. Login as teacher@test.com → see teacher dashboard
# 6. Verify teacher sidebar shows different nav items
# 7. Try accessing /admin/users as teacher → should see error or redirect
```

### End-to-End Testing Script

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

echo "🧪 Starting E2E tests..."

# Test 1: Login as Admin
echo -n "Test 1: Admin login... "
ADMIN_TOKEN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' | jq -r '.data.token')

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}PASSED${NC}"
fi

# Test 2: Access admin dashboard
echo -n "Test 2: Admin dashboard access... "
RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${BASE_URL}/api/admin/dashboard" | jq -r '.status')

if [ "$RESPONSE" = "success" ]; then
  echo -e "${GREEN}PASSED${NC}"
else
  echo -e "${RED}FAILED${NC}"
fi

# Test 3: Login as Teacher
echo -n "Test 3: Teacher login... "
TEACHER_TOKEN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"password"}' | jq -r '.data.token')

if [ -z "$TEACHER_TOKEN" ]; then
  echo -e "${RED}FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}PASSED${NC}"
fi

# Test 4: Login as Student
echo -n "Test 4: Student login... "
STUDENT_TOKEN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password"}' | jq -r '.data.token')

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}PASSED${NC}"
fi

echo -e "${GREEN}✅ All tests passed!${NC}"
```

---

## Timeline & Effort

| Phase | Task | Effort | Days |
|-------|------|--------|------|
| **Phase 1** | Setup folder structure, configs | 2h | 0.5 |
| **Phase 1** | Copy base files, install deps | 1h | 0.5 |
| **Phase 2** | Consolidate services & hooks | 4h | 1 |
| **Phase 2** | Create ProtectedRoute & dispatchers | 2h | 0.5 |
| **Phase 3** | Move page components | 6h | 1.5 |
| **Phase 3** | Fix imports across all files | 3h | 0.75 |
| **Phase 4** | Rewrite App.tsx & layouts | 3h | 0.75 |
| **Phase 4** | Update routes constants | 1h | 0.25 |
| **Phase 5** | Test all 3 login flows | 2h | 0.5 |
| **Phase 5** | QA role-based access | 2h | 0.5 |
| **Phase 5** | Performance tuning, fixes | 2h | 0.5 |
| **Deployment** | Update Docker, docker-compose | 2h | 0.5 |
| **Deployment** | Test in staging | 2h | 0.5 |
| **Buffer** | Contingency (10%) | 2h | 0.5 |
| | **TOTAL** | **36h** | **~4.5 days** |

### Recommended Schedule

- **Day 1 (Mon):** Phase 1 + Phase 2 (setup, services, hooks)
- **Day 2 (Tue):** Phase 3 (pages & components migration)
- **Day 3 (Wed):** Phase 4 (routing & layouts)
- **Day 4 (Thu):** Phase 5 (testing & QA)
- **Day 5 (Fri):** Deployment + staging validation

---

## Rollback Plan

### If Issues Arise

**Option 1: Keep Old Apps Running (Safety Net)**
```bash
# During transition, keep old apps running:
# - admin/ on port 3001 (old)
# - teacher/ on port 3002 (old)
# - frontend/app/ on port 3000 (new)

# In docker-compose, run all 4 simultaneously
# Route traffic to new app, but keep old ones available

# If new app has issues, traffic can be rerouted to old apps via reverse proxy
```

**Option 2: Git Branch Strategy**
```bash
# Create branch for consolidation
git checkout -b feature/frontend-consolidation

# Merge old apps into new app incrementally
# Only merge to main after 3 days of staging validation
# If rollback needed: git revert main to previous stable commit
```

**Option 3: Canary Deployment**
```yaml
# In Dokploy: Route 10% traffic to new unified app, 90% to old apps
# Monitor error rates for 24 hours
# If stable, increase to 50/50, then 100% new app
# If issues, can instantly revert to 100% old apps
```

---

## Post-Consolidation Improvements

### Once Unified & Stable

1. **Remove old app artifacts**
   ```bash
   rm -rf frontend/admin frontend/teacher frontend/student
   ```

2. **Update CI/CD**
   - Single build pipeline for frontend
   - Single Docker image build

3. **Code splitting optimization**
   - Lazy load pages per role
   - Smaller initial bundle for each role

4. **Shared component library**
   - Extract reusable components to `shared/`
   - Use with npm workspaces

5. **State management simplification**
   - Migrate from localStorage → cookies (httpOnly)
   - Use React Query for server state
   - Context for UI state

---

## FAQ

### Q: Will this work with the landing site (Next.js)?
**A:** Yes. Landing remains separate (Next.js on port 3000 internal). The Vite app runs on port 80 inside Docker. In production, reverse proxy (Dokploy's Traefik) routes:
- `yourdomain.com` → Landing (Next.js)
- `yourdomain.com/app` → Vite frontend
- Or entirely separate subdomains: `app.yourdomain.com` → Vite

### Q: Can users switch roles mid-session?
**A:** No. Users have one role per account (admin/teacher/student). To switch roles, logout and login with a different account. Multi-role support can be added later if needed.

### Q: What about performance? Will one app be slower?
**A:** No, likely faster:
- Shared dependencies → smaller total bundle
- Lazy loading per role → still fast initial load
- Shared API client → reuse connections
- Single server process → lower memory

### Q: Can I gradually migrate without downtime?
**A:** Yes:
1. Run old apps + new app simultaneously for 2–3 days
2. Test new app thoroughly
3. Gradually shift users to new app
4. Keep old apps as fallback for 1 week

### Q: What if a page is customized per role?
**A:** The page itself can check `useRole()` and render differently:
```tsx
// pages/Dashboard.tsx
const { role } = useRole();

if (role === 'admin') return <AdminDashboard />;
if (role === 'teacher') return <TeacherDashboard />;
if (role === 'student') return <StudentDashboard />;
```

Or keep separate page components in `pages/{admin,teacher,student}/Dashboard.tsx` and import conditionally in routes.

---

## References

- React Router v6: https://reactrouter.com/
- Vite Documentation: https://vitejs.dev/
- Material-UI: https://mui.com/
- Docker Multi-stage builds: https://docs.docker.com/build/building/multi-stage/

---

## Summary

This consolidation reduces your frontend from **3 deployments → 1**, simplifies state management, and makes future feature development faster. Once complete, adding a new feature requires update in **one codebase** instead of three.

