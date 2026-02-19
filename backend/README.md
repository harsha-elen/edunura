# LMS Backend - Modular Monolithic Architecture

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Database connection
│   │   └── ...
│   ├── models/           # Sequelize models
│   │   ├── User.ts
│   │   ├── Course.ts
│   │   └── index.ts
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management module
│   │   ├── courses/      # Course management module
│   │   ├── content/      # Content management module
│   │   ├── liveclass/    # Zoom integration module
│   │   ├── payment/      # Razorpay integration module
│   │   ├── enrollment/   # Enrollment module
│   │   ├── assessment/   # Quiz/Assessment module
│   │   ├── notification/ # Notification module
│   │   ├── reporting/    # Reporting module
│   │   └── discussion/   # Discussion forum module
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   └── server.ts         # Main server file
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Module Structure

Each module follows this structure:
```
module/
├── controller.ts    # Request handlers
├── service.ts       # Business logic
├── routes.ts        # Route definitions
├── validation.ts    # Input validation
└── types.ts         # TypeScript types
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Create MySQL database:
```sql
CREATE DATABASE lms_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API information
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- More endpoints to be added...

## Database Models

- **User** - Admin, Teacher, Student users
- **Course** - Course information
- More models to be added...
