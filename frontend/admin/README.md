# LMS Admin Portal

Admin portal for managing the Learning Management System.

## Features
- User Management (Teachers & Students)
- Course Management
- Payments & Transactions
- Reports & Analytics
- System Settings (Razorpay, Zoom, AWS, Email)

## Tech Stack
- React 18 + TypeScript
- Vite
- React Router v6
- Redux Toolkit
- React Query
- Material-UI
- Recharts (for analytics)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The admin portal will run on http://localhost:3001

## Folder Structure
```
src/
├── pages/           # Page components
│   ├── auth/
│   ├── dashboard/
│   ├── teachers/
│   ├── students/
│   ├── courses/
│   ├── payments/
│   ├── reports/
│   └── settings/
├── components/      # Reusable components
│   ├── common/
│   └── layout/
├── services/        # API services
├── store/           # Redux store
├── hooks/           # Custom hooks
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Environment Variables
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000/api)
