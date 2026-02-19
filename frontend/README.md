# LMS Frontend Setup

This directory contains three separate React + TypeScript applications for the LMS platform.

## Portals

### 1. Admin Portal (`/admin`)
- **Port:** 3001
- **Purpose:** Platform administration, user management, system settings
- **Pages:** 8 pages (Login, Dashboard, Teachers, Students, Courses, Payments, Reports, Settings)

### 2. Teacher Portal (`/teacher`)
- **Port:** 3002
- **Purpose:** Course content management, live class scheduling
- **Pages:** 7 pages (Login, Dashboard, Course Content, Live Classes, Attendance, Inbox)

### 3. Student Portal (`/student`)
- **Port:** 3003
- **Purpose:** Learning, course enrollment, assessments
- **Pages:** 12 pages (Login, Dashboard, Catalog, My Courses, Video Player, Quiz, Discussion, Live Sessions, Checkout, Settings)

## Shared Resources (`/shared`)
- Common TypeScript types
- API constants and endpoints
- Utility functions

## Quick Start

### Install all dependencies:
```bash
# Admin Portal
cd admin && npm install

# Teacher Portal
cd ../teacher && npm install

# Student Portal
cd ../student && npm install
```

### Run all portals:
```bash
# Terminal 1 - Admin Portal
cd admin && npm run dev

# Terminal 2 - Teacher Portal
cd teacher && npm run dev

# Terminal 3 - Student Portal
cd student && npm run dev
```

### Access URLs:
- Admin: http://localhost:3001
- Teacher: http://localhost:3002
- Student: http://localhost:3003
- Backend API: http://localhost:5000

## Technology Stack

All portals use:
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router v6** for routing
- **Redux Toolkit** for state management
- **React Query** for data fetching
- **Material-UI** for UI components
- **Axios** for API calls

## Folder Structure

Each portal follows the same structure:
```
portal/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   │   ├── common/     # Shared components
│   │   └── layout/     # Layout components
│   ├── services/       # API service layer
│   ├── store/          # Redux store
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env
```

## Next Steps

1. Install dependencies for all portals
2. Review the implementation plan
3. Start building authentication module
4. Create page components based on Stitch designs
