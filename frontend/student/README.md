# LMS Student Portal

Student portal for learning and course enrollment.

## Features
- Course Catalog & Discovery
- Video Learning Experience
- Quiz & Assessments
- Discussion Forums
- Live Sessions (Zoom)
- Secure Checkout (Razorpay)

## Tech Stack
- React 18 + TypeScript
- Vite
- React Router v6
- Redux Toolkit
- React Query
- Material-UI
- React Player (for video playback)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The student portal will run on http://localhost:3003

## Folder Structure
```
src/
├── pages/           # Page components
│   ├── auth/
│   ├── dashboard/
│   ├── catalog/
│   ├── my-courses/
│   ├── assessment/
│   ├── discussion/
│   ├── live-sessions/
│   ├── checkout/
│   └── settings/
├── components/      # Reusable components
├── services/        # API services
├── store/           # Redux store
├── hooks/           # Custom hooks
├── types/           # TypeScript types
└── utils/           # Utility functions
```
