# Security Issues - LMS Project

This document outlines all security vulnerabilities identified in the LMS project. New AI agents can use this file to understand and fix security issues.

---

## 1. Project Overview

### Project Information
- **Name**: Learning Management System (LMS)
- **Type**: Full-stack Web Application
- **Backend**: Node.js + Express + TypeScript (Port 5000)
- **Frontend**: React + TypeScript (Vite)
  - Admin Portal: Port 3001
  - Teacher Portal: Port 3002
  - Student Portal: Port 3003
  - Landing Page: Next.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (Access Token + Refresh Token)
- **File Storage**: Local filesystem with Multer

### Technology Stack
```
Backend:
├── Express.js (Web Framework)
├── TypeScript
├── Sequelize (ORM)
├── MySQL (Database)
├── JWT (Authentication)
├── Bcrypt (Password Hashing)
├── Multer (File Uploads)
├── NodeMailer (Email)
├── Razorpay (Payments)
└── Zoom API (Live Classes)

Frontend:
├── React 18
├── TypeScript
├── Vite
├── Material UI (MUI)
├── React Router v6
├── Axios (HTTP Client)
├── Vidstack (Video Player)
└── Editor.js (Rich Text)
```

### Project Structure
```
LMS/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, multer config
│   │   ├── middleware/      # Auth, upload middleware
│   │   ├── models/         # Sequelize models
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Login, register
│   │   │   ├── courses/    # Course CRUD
│   │   │   ├── students/   # Student management
│   │   │   ├── teachers/   # Teacher management
│   │   │   ├── users/      # Admin/moderator users
│   │   │   ├── enrollments/
│   │   │   ├── payments/
│   │   │   ├── live-classes/
│   │   │   ├── categories/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── services/       # External APIs
│   │   ├── utils/          # JWT, helpers
│   │   └── server.ts       # Entry point
│   ├── dist/               # Compiled JS
│   └── uploads/            # Uploaded files
├── frontend/
│   ├── admin/              # Admin portal (3001)
│   ├── teacher/            # Teacher portal (3002)
│   ├── student/            # Student portal (3003)
│   ├── landing/            # Marketing site
│   └── shared/             # Shared components
└── security_issues.md      # This file
```

---

## 2. Backend Security Issues

### 2.1 Critical Issues

#### Issue #1: TLS Certificate Verification Disabled in SMTP
- **Severity**: CRITICAL
- **Location**: `backend/src/modules/settings/controller.ts:204-206`
- **Description**: SMTP transport has TLS verification disabled with `rejectUnauthorized: false`, allowing man-in-the-middle attacks on email communications.
- **Current Code**:
```typescript
transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: { user: smtpUsername, pass: smtpPassword },
    tls: {
        rejectUnauthorized: false  // DANGEROUS
    }
});
```
- **Recommended Fix**:
```typescript
transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: { user: smtpUsername, pass: smtpPassword },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV !== 'development'
    }
});
```

---

#### Issue #2: Default Empty Database Password
- **Severity**: CRITICAL
- **Location**: `backend/src/config/database.ts:9`
- **Description**: Default database password is empty string, which could lead to insecure configurations in production.
- **Current Code**:
```typescript
const sequelize = new Sequelize(
    process.env.DB_NAME || 'lms_database',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',  // Empty default!
    { ... }
);
```
- **Recommended Fix**:
```typescript
const sequelize = new Sequelize(
    process.env.DB_NAME || 'lms_database',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        // Add validation
        validateCredentials: process.env.NODE_ENV === 'production',
        pool: { ... }
    }
);

// Add validation check
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD is required in production');
}
```

---

#### Issue #3: Checkout Flow Bypass Exposing Course Data
- **Severity**: CRITICAL
- **Location**: `backend/src/modules/courses/controller.ts:182-196`
- **Description**: The `getCourseById` endpoint allows unauthenticated access when `req.query.checkout === 'true'`, potentially exposing sensitive course data.
- **Current Code**:
```typescript
export const getCourseById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const isCheckoutFlow = req.query.checkout === 'true';
    
    // Bypasses authentication check when checkout=true
    const course = await Course.findOne({
        where: { id, status: 'published' },
        include: [{ model: User, as: 'instructors', ... }]
    });
    // Returns full course data including instructors
};
```
- **Recommended Fix**:
```typescript
export const getCourseById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const isCheckoutFlow = req.query.checkout === 'true';
    
    // For checkout flow, only expose public course info
    const attributes = isCheckoutFlow 
        ? ['id', 'title', 'short_description', 'price', 'thumbnail', 'is_free']
        : undefined;
    
    const course = await Course.findOne({
        where: { id, status: 'published' },
        attributes,
        include: isCheckoutFlow 
            ? [] 
            : [{ model: User, as: 'instructors', ... }]
    });
    
    if (!course) {
        return res.status(404).json({ status: 'error', message: 'Course not found' });
    }
    
    return res.status(200).json({ status: 'success', data: course });
};
```

---

#### Issue #4: Webhook Endpoint Accessibility
- **Severity**: CRITICAL
- **Location**: `backend/src/modules/payments/routes.ts:13`
- **Description**: The Razorpay webhook endpoint is publicly accessible. While signature validation exists, additional security measures should be in place.
- **Current Code**:
```typescript
router.post('/webhook', createWebhookOrder);
```
- **Recommended Fix**:
```typescript
// Add IP allowlisting for webhook
import { isIP } from 'net';

const RAZORPAY_WEBHOOK_IPS = ['172.16.238.1', '172.16.238.2']; // Razorpay IPs

router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress;
    // Only allow Razorpay IPs in production (optional)
    if (process.env.NODE_ENV === 'production') {
        if (!RAZORPAY_WEBHOOK_IPS.includes(clientIP)) {
            // Log but don't block (Razorpay IPs may change)
            console.warn(`Webhook from unexpected IP: ${clientIP}`);
        }
    }
    next();
}, createWebhookOrder);
```

---

### 2.2 High Issues

#### Issue #5: No Rate Limiting on Authentication Endpoints
- **Severity**: HIGH
- **Location**: `backend/src/modules/auth/routes.ts`
- **Description**: The `/register` and `/login` endpoints have no rate limiting protection, making them vulnerable to brute force attacks.
- **Current Code**:
```typescript
router.post('/login', login);
router.post('/register', register);
```
- **Recommended Fix**:
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { status: 'error', message: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: { status: 'error', message: 'Too many accounts created. Please try again later.' },
});

router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
```

---

#### Issue #6: JWT Algorithm Not Explicitly Specified
- **Severity**: HIGH
- **Location**: `backend/src/utils/jwt.ts:37, 50, 56, 65`
- **Description**: JWT signing doesn't specify algorithm, potentially allowing algorithm confusion attacks.
- **Current Code**:
```typescript
// Sign access token
const token = jwt.sign(payload, secret, { expiresIn });

// Verify token
const decoded = jwt.verify(token, secret);
```
- **Recommended Fix**:
```typescript
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

const accessTokenOptions: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
};

const refreshTokenOptions: SignOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256'
};

const verifyOptions: VerifyOptions = {
    algorithms: ['HS256']
};

// Sign access token
const token = jwt.sign(payload, secret, accessTokenOptions);

// Verify token
const decoded = jwt.verify(token, secret, verifyOptions);
```

---

#### Issue #7: Stack Traces Exposed in Error Responses
- **Severity**: HIGH
- **Location**: Multiple controllers (auth, users, students, teachers, profile, payments, enrollments)
- **Description**: Error messages with stack traces are conditionally exposed, potentially revealing internal implementation details.
- **Current Code** (example from auth/controller.ts:64):
```typescript
} catch (error: any) {
    return res.status(500).json({
        status: 'error',
        message: 'Failed to register user',
        error: error.message,  // Exposes internal error!
    });
}
```
- **Recommended Fix**:
```typescript
// Create centralized error handler
// Add to server.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Internal server error'
    });
});

// In controllers, simplify error handling:
} catch (error: any) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
    });
}
```

---

#### Issue #8: Missing Enrollment Verification for Zoom Signature
- **Severity**: HIGH
- **Location**: `backend/src/modules/live-classes/controller.ts:268-359`
- **Description**: The `getZoomSignature` function doesn't verify that the user is enrolled in the course before generating a join token.
- **Current Code**:
```typescript
export const getZoomSignature = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const session = await LiveSession.findByPk(sessionId);
    // Missing: Check if user is enrolled in the course!
    
    const signature = generateZoomSignature(...);
    return res.json({ signature });
};
```
- **Recommended Fix**:
```typescript
export const getZoomSignature = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const session = await LiveSession.findByPk(sessionId, {
        include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
        return res.status(404).json({ status: 'error', message: 'Session not found' });
    }
    
    // Check enrollment
    const enrollment = await Enrollment.findOne({
        where: { student_id: userId, course_id: session.course_id }
    });
    
    if (!enrollment && req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ status: 'error', message: 'Not enrolled in this course' });
    }
    
    const signature = generateZoomSignature(...);
    return res.json({ status: 'success', data: { signature } });
};
```

---

### 2.3 Medium Issues

#### Issue #9: Category CRUD Not Restricted to Admins
- **Severity**: MEDIUM
- **Location**: `backend/src/modules/categories/routes.ts:27-33`
- **Description**: Category create, update, and delete endpoints only require authentication but not admin authorization.
- **Current Code**:
```typescript
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);
```
- **Recommended Fix**:
```typescript
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);
```

---

#### Issue #10: No CSRF Protection
- **Severity**: MEDIUM
- **Location**: All routes in `backend/src/server.ts`
- **Description**: No CSRF middleware implemented. API is vulnerable if cookies are used for authentication.
- **Recommended Fix**:
```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Add middleware
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

// For API routes that need CSRF protection
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Note: For JWT in Authorization headers, CSRF risk is lower but still recommend implementing
```

---

#### Issue #11: Insufficient File Type Validation
- **Severity**: MEDIUM
- **Location**: 
  - `backend/src/config/multer.ts:25-33`
  - `backend/src/config/multer-avatar.ts:24-32`
  - `backend/src/middleware/upload.ts:43-58`
- **Description**: File type validation relies solely on MIME type which can be spoofed. No magic number validation.
- **Current Code**:
```typescript
const fileFilter = (req: any, file: Express.Multer.File, cb: Multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};
```
- **Recommended Fix**:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const validateFileMagicNumber = async (buffer: Buffer): Promise<boolean> => {
    const type = await fileTypeFromBuffer(buffer);
    return type ? ALLOWED_MIME_TYPES.includes(type.mime) : false;
};

const fileFilter = async (req: any, file: Express.Multer.File, cb: Multer.FileFilterCallback) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type'));
    }
    
    // For uploaded files, validate magic number
    const buffer = file.buffer || Buffer.alloc(0);
    const isValid = await validateFileMagicNumber(buffer);
    if (!isValid) {
        return cb(new Error('File content does not match extension'));
    }
    
    cb(null, true);
};
```

---

#### Issue #12: Weak Password Requirements
- **Severity**: MEDIUM
- **Location**: 
  - `backend/src/modules/profile/controller.ts:139`
  - `backend/src/modules/students/controller.ts:178`
  - `backend/src/modules/teachers/controller.ts`
- **Description**: Password change only requires 6 characters minimum, which is too weak.
- **Current Code**:
```typescript
if (new_password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
}
```
- **Recommended Fix**:
```typescript
const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: 'Password is valid' };
};
```

---

#### Issue #13: Long Token Expiration
- **Severity**: MEDIUM
- **Location**: `backend/src/utils/jwt.ts:35, 48`
- **Description**: Default token expiration is 7 days (access) and 30 days (refresh), which is too long for security.
- **Current Code**:
```typescript
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
```
- **Recommended Fix**:
```typescript
const expiresIn = process.env.JWT_EXPIRES_IN || '24h';        // 24 hours
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // 7 days
```

---

#### Issue #14: No Token Blacklist/Revocation
- **Severity**: MEDIUM
- **Location**: All auth-related files
- **Description**: No mechanism to revoke tokens before expiration (e.g., on logout or password change).
- **Recommended Fix**:
```typescript
// Option 1: Simple in-memory blacklist (not for distributed)
// Option 2: Use Redis for production

// Add to auth middleware
const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
    tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
    return tokenBlacklist.has(token);
};

// In JWT verify
const decoded = jwt.verify(token, secret, verifyOptions);
if (isTokenBlacklisted(token)) {
    return res.status(401).json({ status: 'error', message: 'Token has been revoked' });
}
```

---

#### Issue #15: Race Condition in Payment Verification
- **Severity**: MEDIUM
- **Location**: `backend/src/modules/payments/controller.ts:154-177`
- **Description**: Payment verification doesn't use database transactions, potentially allowing duplicate enrollments.
- **Recommended Fix**:
```typescript
await sequelize.transaction(async (t) => {
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        where: { student_id: userId, course_id: courseId },
        transaction: t
    });
    
    if (existingEnrollment) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Already enrolled in this course' 
        });
    }
    
    // Create enrollment
    await Enrollment.create({
        student_id: userId,
        course_id: courseId,
        payment_id: payment.id,
        status: 'active'
    }, { transaction: t });
    
    // Update course enrollment count
    await Course.increment('total_enrollments', {
        where: { id: courseId },
        transaction: t
    });
});
```

---

#### Issue #16: No Input Length Limits
- **Severity**: MEDIUM
- **Location**: Multiple controller files
- **Description**: Text fields accept any length without validation, potentially leading to DoS or storage issues.
- **Recommended Fix**:
```typescript
// Create validation middleware
export const validateInputLength = (fields: { [key: string]: number }) => {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const [field, maxLength] of Object.entries(fields)) {
            if (req.body[field] && req.body[field].length > maxLength) {
                return res.status(400).json({
                    status: 'error',
                    message: `${field} must be less than ${maxLength} characters`
                });
            }
        }
        next();
    };
};

// Usage
router.post('/',
    authenticate,
    validateInputLength({
        first_name: 100,
        last_name: 100,
        title: 200,
        description: 5000,
        bio: 1000
    }),
    createCourse
);
```

---

### 2.4 Low Issues

#### Issue #17: Input Sanitization in Profile Updates
- **Severity**: LOW
- **Location**: `backend/src/modules/profile/controller.ts:68`
- **Description**: Email format not validated when updating profile.
- **Recommended Fix**:
```typescript
if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid email format'
        });
    }
    user.email = email.trim().toLowerCase();
}
```

---

#### Issue #18: XSS in Error Messages
- **Severity**: LOW
- **Location**: Multiple controllers return `error.message` in responses
- **Description**: Error messages from database could contain malicious content.
- **Recommended Fix**:
```typescript
const sanitizeMessage = (msg: string): string => {
    return msg.replace(/[<>"'&]/g, (char) => {
        const entities: { [key: string]: string } = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
        };
        return entities[char] || char;
    });
};
```

---

#### Issue #19: Path Traversal in File Delete
- **Severity**: LOW
- **Location**: `backend/src/utils/folderService.ts:61`
- **Description**: The deleteFile function could have path traversal risk.
- **Recommended Fix**:
```typescript
export const deleteFile = async (relativePath: string): Promise<void> => {
    // Sanitize path
    const sanitizedPath = relativePath.replace(/[^a-zA-Z0-9_./-]/g, '');
    
    // Normalize and verify path
    const normalizedPath = path.normalize(sanitizedPath);
    const absolutePath = path.join(UPLOADS_BASE, normalizedPath);
    
    // Ensure path doesn't escape uploads directory
    if (!absolutePath.startsWith(path.resolve(UPLOADS_BASE))) {
        throw new Error('Invalid file path');
    }
    
    // Delete file
    await fs.promises.unlink(absolutePath);
};
```

---

#### Issue #20: Hardcoded Copyright Years
- **Severity**: LOW
- **Location**: Multiple login pages
- **Description**: Copyright years hardcoded as "2024".
- **Recommended Fix**:
```typescript
const currentYear = new Date().getFullYear();
// Use {currentYear} in JSX
```

---

## 3. Frontend Security Issues

### 3.1 Critical Issues

#### Issue #1: JWT Tokens Stored in localStorage (XSS Vulnerable)
- **Severity**: CRITICAL
- **Location**: 
  - `frontend/admin/src/services/apiClient.ts:19`
  - `frontend/teacher/src/services/apiClient.ts:19`
  - `frontend/student/src/services/apiClient.ts:17`
- **Description**: Authentication tokens are stored in localStorage, making them accessible to JavaScript. Vulnerable to XSS attacks - if an attacker can inject malicious JS, they can steal tokens.
- **Current Code**:
```typescript
// apiClient.ts
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```
- **Recommended Fix**:

**Step 1**: Update backend to send HttpOnly cookie
```typescript
// backend/src/modules/auth/controller.ts - login function
res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

**Step 2**: Update frontend API client
```typescript
// apiClient.ts
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Enable cookies
    headers: { 'Content-Type': 'application/json' }
});

// Remove localStorage token reading
apiClient.interceptors.request.use((config) => {
    // Token now comes from cookie automatically
    return config;
});

// Remove token storage on login
const handleLogin = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    // Don't store token: localStorage.setItem('token', response.data.token);
    // Token is now in HttpOnly cookie
    return response.data;
};
```

---

### 3.2 High Issues

#### Issue #2: XSS via dangerouslySetInnerHTML Without Sanitization
- **Severity**: HIGH
- **Location**: `frontend/student/src/pages/CoursePlayer.tsx:564-566`
- **Description**: HTML content rendered without sanitization, vulnerable to XSS attacks if backend doesn't sanitize.
- **Current Code**:
```tsx
<div 
    dangerouslySetInnerHTML={{ 
        __html: currentLesson?.content_body || 'No content available.' 
    }} 
/>
```
- **Recommended Fix**:
```tsx
import DOMPurify from 'dompurify';

<div 
    dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(currentLesson?.content_body || 'No content available.') 
    }} 
/>
```

---

#### Issue #3: No Input Sanitization on Forms
- **Severity**: HIGH
- **Location**: 
  - `frontend/student/src/pages/auth/Register.tsx`
  - `frontend/admin/src/pages/Students.tsx`
  - `frontend/teacher/src/pages/Profile.tsx`
- **Description**: User inputs not sanitized before submission.
- **Recommended Fix**:
```typescript
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

// Use before sending to API
const sanitizedFirstName = sanitizeInput(formData.first_name);
```

---

#### Issue #4: Sensitive Credentials in Admin Settings
- **Severity**: HIGH
- **Location**: `frontend/admin/src/pages/Settings.tsx:63-279`
- **Description**: Admin settings page handles sensitive credentials (Zoom secrets, Razorpay keys, SMTP passwords).
- **Recommended Fix**:
```tsx
// 1. Mask sensitive fields in UI
const SensitiveField = ({ label, value, onChange }) => (
    <TextField
        label={label}
        type={showSecrets ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        InputProps={{
            endAdornment: (
                <IconButton onClick={() => setShowSecrets(!showSecrets)}>
                    {showSecrets ? <VisibilityOff /> : <Visibility />}
                </IconButton>
            )
        }}
    />
);

// 2. Add audit logging notice
<Typography variant="caption" color="text.secondary">
    Changes to sensitive settings are logged for security audit.
</Typography>
```

---

### 3.3 Medium Issues

#### Issue #5: Frontend-Only Role-Based Access Control
- **Severity**: MEDIUM
- **Location**: 
  - `frontend/admin/src/App.tsx:34`
  - `frontend/student/src/App.tsx:35`
- **Description**: Role validation only on frontend, can be bypassed by modifying client code.
- **Recommended Fix**:
```tsx
// This is actually fine as long as backend enforces authorization
// Backend MUST validate roles for every API request
// Frontend RBAC is just for UX (hiding UI elements)

// Ensure backend middleware validates roles
// In routes.ts:
router.get('/admin-only', authenticate, authorize('admin'), handler);
```

---

#### Issue #6: No CSRF Tokens
- **Severity**: MEDIUM
- **Location**: All API clients
- **Description**: No CSRF tokens sent with requests.
- **Recommended Fix**:
```typescript
// Get CSRF token on app load
useEffect(() => {
    const fetchCsrfToken = async () => {
        const response = await apiClient.get('/csrf-token');
        return response.data.csrfToken;
    };
    fetchCsrfToken();
}, []);

// Add to requests
apiClient.interceptors.request.use((config) => {
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
});
```

---

#### Issue #7: No Token Expiration Handling
- **Severity**: MEDIUM
- **Location**: All API clients
- **Description**: Doesn't proactively check token expiration. Users may experience unexpected logouts.
- **Recommended Fix**:
```typescript
// Add token expiration check
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

// Check before requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
        // Try refresh token
        return refreshToken().then(newToken => {
            config.headers.Authorization = `Bearer ${newToken}`;
            return config;
        }).catch(() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return config;
        });
    }
    return config;
});
```

---

#### Issue #8: "Remember Me" with localStorage
- **Severity**: MEDIUM
- **Location**: 
  - `frontend/student/src/pages/auth/Login.tsx:245-264`
  - `frontend/admin/src/pages/auth/Login.tsx:167-173`
- **Description**: "Keep me signed in" persists tokens in localStorage indefinitely.
- **Recommended Fix**:
```tsx
// For "remember me", extend cookie expiration instead
const handleLogin = async (credentials, rememberMe) => {
    const response = await apiClient.post('/auth/login', credentials);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    
    // Set cookie with appropriate expiration
    document.cookie = `token=${response.data.token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    return response.data;
};
```

---

#### Issue #9: Fallback to localhost in API Configuration
- **Severity**: MEDIUM
- **Location**: 
  - `frontend/shared/constants/api.ts:2`
  - `frontend/admin/src/services/apiClient.ts:3`
  - `frontend/teacher/src/services/apiClient.ts:3`
  - `frontend/student/src/services/apiClient.ts:4`
- **Description**: API base URL falls back to localhost if env var not set, could accidentally deploy to production.
- **Recommended Fix**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Throw error if not set in production
if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('VITE_API_BASE_URL environment variable is required');
}

// For development, use localhost but warn
const DEFAULT_URL = 'http://localhost:5000/api';
export const API_URL = API_BASE_URL || DEFAULT_URL;
```

---

#### Issue #10: Potential Open Redirect in Zoom URLs
- **Severity**: MEDIUM
- **Location**: 
  - `frontend/teacher/src/pages/StandaloneLiveClass.tsx:56-71`
  - `frontend/admin/src/pages/StandaloneLiveClass.tsx:56-78`
- **Description**: Application navigates to Zoom URLs from server data without validation.
- **Recommended Fix**:
```typescript
const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return ['https:', 'mailto:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

const handleJoinClass = () => {
    if (zoomConfig.joinUrl && isValidUrl(zoomConfig.joinUrl)) {
        const joinWithPass = `${zoomConfig.joinUrl}?pwd=${zoomConfig.password}`;
        window.location.href = joinWithPass;
    } else {
        console.error('Invalid Zoom URL');
    }
};
```

---

#### Issue #11: Missing Token Blacklist on Logout
- **Severity**: MEDIUM
- **Location**: All login pages
- **Description**: Logout doesn't blacklist the token server-side.
- **Recommended Fix**:
```typescript
// Frontend logout
const handleLogout = async () => {
    try {
        await apiClient.post('/auth/logout');
    } catch (error) {
        console.error('Logout API error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
};

// Backend logout (new endpoint)
router.post('/logout', authenticate, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        blacklistToken(token);
    }
    res.json({ status: 'success', message: 'Logged out successfully' });
});
```

---

### 3.4 Low Issues

#### Issue #12: Unvalidated URL Parameters
- **Severity**: LOW
- **Location**: 
  - `frontend/student/src/pages/Checkout.tsx:70`
  - `frontend/student/src/pages/CoursePlayer.tsx:98`
  - `frontend/admin/src/pages/CourseDetails.tsx:52`
- **Description**: Route parameters used without validation.
- **Recommended Fix**:
```typescript
const { courseId } = useParams<{ courseId: string }>();

useEffect(() => {
    if (!courseId || !/^\d+$/.test(courseId)) {
        navigate('/dashboard', { replace: true });
        return;
    }
    // Fetch course data
}, [courseId]);
```

---

#### Issue #13: Direct window.location.href Usage
- **Severity**: LOW
- **Location**: All API clients (401 redirect)
- **Description**: Uses `window.location.href` causing full page reload.
- **Recommended Fix**:
```typescript
// Instead of in apiClient.ts
// Move to component or use useNavigate hook
// This requires axios interceptor to not do redirect directly

// Option: Return promise that component can handle
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            return Promise.reject(new Error('UNAUTHORIZED')); // Let component handle
        }
        return Promise.reject(error);
    }
);
```

---

## 4. Quick Reference Table

### Backend Issues

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | Critical | settings/controller.ts:204-206 | TLS verification disabled |
| 2 | Critical | config/database.ts:9 | Empty DB password default |
| 3 | Critical | courses/controller.ts:182-196 | Checkout flow bypass |
| 4 | Critical | payments/routes.ts:13 | Webhook accessibility |
| 5 | High | auth/routes.ts | No rate limiting |
| 6 | High | utils/jwt.ts:37,50,56,65 | JWT algorithm not specified |
| 7 | High | Multiple controllers | Stack traces exposed |
| 8 | High | live-classes/controller.ts | Missing enrollment check |
| 9 | Medium | categories/routes.ts | No admin-only on categories |
| 10 | Medium | server.ts | No CSRF protection |
| 11 | Medium | multer.ts, upload.ts | Weak file validation |
| 12 | Medium | profile/controller.ts:139 | Weak passwords (6 chars) |
| 13 | Medium | jwt.ts | Long token expiration |
| 14 | Medium | All auth | No token blacklist |
| 15 | Medium | payments/controller.ts | Race condition in payment |
| 16 | Medium | Multiple controllers | No input length limits |
| 17 | Low | profile/controller.ts:68 | Email not validated |
| 18 | Low | Multiple controllers | XSS in error messages |
| 19 | Low | folderService.ts:61 | Path traversal risk |
| 20 | Low | Login pages | Hardcoded year |

### Frontend Issues

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | Critical | apiClient.ts (all) | localStorage token storage |
| 2 | High | CoursePlayer.tsx:564 | XSS via dangerouslySetInnerHTML |
| 3 | High | Multiple files | No input sanitization |
| 4 | High | Settings.tsx:63-279 | Sensitive credentials exposure |
| 5 | Medium | App.tsx (all) | Frontend-only RBAC |
| 6 | Medium | apiClient.ts | No CSRF tokens |
| 7 | Medium | apiClient.ts | No token expiration check |
| 8 | Medium | Login.tsx | Remember me with localStorage |
| 9 | Medium | apiClient.ts | Fallback to localhost |
| 10 | Medium | StandaloneLiveClass.tsx | Open redirect in Zoom |
| 11 | Medium | Login pages | No token blacklist on logout |
| 12 | Low | useParams usage | Unvalidated URL params |
| 13 | Low | apiClient.ts | window.location.href redirect |

---

## 5. Fix Priority Order

### Phase 1 - Critical (Immediate)
1. Switch token storage to HttpOnly cookies (Issue #1 Frontend)
2. Fix TLS verification in SMTP (Issue #1 Backend)
3. Add DOMPurify sanitization (Issue #2 Frontend)

### Phase 2 - High Priority
1. Add explicit JWT algorithm (Issue #6 Backend)
2. Add rate limiting to auth endpoints (Issue #5 Backend)
3. Fix checkout flow access control (Issue #3 Backend)
4. Add enrollment check for Zoom (Issue #8 Backend)
5. Remove stack trace exposure (Issue #7 Backend)

### Phase 3 - Medium Priority
1. Add password complexity requirements
2. Add CSRF protection
3. Add token expiration handling
4. Implement token blacklist
5. Fix file type validation
6. Remove localhost fallback

### Phase 4 - Low Priority
1. Add URL parameter validation
2. Use React Router navigation
3. Fix hardcoded years

---

## 6. Testing Checklist

After fixing issues, verify:

- [ ] Login/logout works with HttpOnly cookies
- [ ] XSS payloads in course content are sanitized
- [ ] Rate limiting blocks repeated login attempts
- [ ] Invalid tokens are rejected
- [ ] Non-enrolled users cannot join Zoom sessions
- [ ] Checkout flow only exposes public course data
- [ ] Password validation enforces complexity rules
- [ ] File uploads reject spoofed MIME types

---

*Document generated for LMS Project Security*
*Last updated: February 2026*
