# Authentication & Authorization System Architecture Plan
## Pakistani School Management System

**Document Version:** 1.0
**Last Updated:** 2025-01-09
**Target Scale:** 500,000+ students, 2,000+ staff
**Tech Stack:** Next.js 16, TypeScript 5, NextAuth.js v4, Prisma ORM, SQLite

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Authentication System](#authentication-system)
4. [Authorization System](#authorization-system)
5. [Security Features](#security-features)
6. [Multi-School Support](#multi-school-support)
7. [API Specifications](#api-specifications)
8. [Database Schema Additions](#database-schema-additions)
9. [Implementation Steps](#implementation-steps)
10. [Security Considerations](#security-considerations)
11. [Pakistani-Specific Features](#pakistani-specific-features)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  (Next.js 16 App Router + shadcn/ui Components)                │
├─────────────────────────────────────────────────────────────────┤
│                    API Layer (Next.js API Routes)               │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  Auth Routes   │  │  Middleware    │  │  Protected      │  │
│  │  (/api/auth/*) │  │  (Authorization)│  │  Routes         │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  NextAuth.js   │  │  RBAC Engine   │  │  Security       │  │
│  │  Configuration │  │  (Permissions) │  │  Services       │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Data Access Layer                            │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  Prisma Client │  │  Caching Layer │  │  Session Store  │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   Database Layer (SQLite)                       │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  User, Role    │  │  Sessions,     │  │  Audit Logs     │  │
│  │  Permissions   │  │  2FA, Lockout  │  │  Tokens         │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

1. **Defense in Depth**: Multiple layers of security at each tier
2. **Principle of Least Privilege**: Users have minimum required access
3. **Audit Trail**: Comprehensive logging of all auth actions
4. **Scalability**: Optimized for high-concurrency (500K+ users)
5. **Pakistani Context**: Phone verification, CNIC validation, regional features
6. **Multi-Tenancy**: Support for multiple schools with data isolation

### 1.3 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Login   │────▶│ Validate │────▶│  Create  │
│  Browser │     │  Page    │     │ Credentials│   │ Session  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │  2FA     │
                                    │  Check   │
                                    └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │  Update  │
                                    │  Last    │
                                    │  Login   │
                                    └──────────┘
```

---

## 2. System Components

### 2.1 Frontend Components

| Component | Description | Location |
|-----------|-------------|----------|
| `LoginView` | Login page with username/password | `/src/app/auth/login/page.tsx` |
| `RegisterView` | User registration (if enabled) | `/src/app/auth/register/page.tsx` |
| `ForgotPasswordView` | Password reset request | `/src/app/auth/forgot-password/page.tsx` |
| `ResetPasswordView` | Password reset form | `/src/app/auth/reset-password/page.tsx` |
| `TwoFactorAuthView` | 2FA setup and verification | `/src/app/auth/2fa/page.tsx` |
| `ProfileView` | User profile management | `/src/app/profile/page.tsx` |
| `AuthGuard` | Route protection wrapper | `/src/components/auth/auth-guard.tsx` |
| `RequireAuth` | HOC for protected routes | `/src/components/auth/require-auth.tsx` |
| `PermissionGate` | Permission-based access control | `/src/components/auth/permission-gate.tsx` |

### 2.2 Backend Components

| Component | Description | Location |
|-----------|-------------|----------|
| `auth.config.ts` | NextAuth configuration | `/src/lib/auth/auth.config.ts` |
| `auth-options.ts` | NextAuth options with callbacks | `/src/lib/auth/auth-options.ts` |
| `auth-helpers.ts` | Auth utility functions | `/src/lib/auth/auth-helpers.ts` |
| `permission-engine.ts` | RBAC permission checker | `/src/lib/auth/permission-engine.ts` |
| `password-validator.ts` | Password policy validation | `/src/lib/auth/password-validator.ts` |
| `session-manager.ts` | Session management utilities | `/src/lib/auth/session-manager.ts` |
| `audit-logger.ts` | Audit logging service | `/src/lib/auth/audit-logger.ts` |
| `rate-limiter.ts` | Rate limiting for auth endpoints | `/src/lib/auth/rate-limiter.ts` |
| `account-lockout.ts` | Account lockout mechanism | `/src/lib/auth/account-lockout.ts` |
| `two-factor-service.ts` | 2FA generation and validation | `/src/lib/auth/two-factor-service.ts` |

---

## 3. Authentication System

### 3.1 Authentication Methods

#### 3.1.1 Credentials-Based Authentication (Primary)

- **Username/Email + Password**
- Supports both username and email for login
- Password hashing with bcrypt (cost factor: 12)
- JWT tokens for session management

#### 3.1.2 Two-Factor Authentication (2FA)

- **Optional for all users**
- **Mandatory for privileged roles**: Super Admin, Principal, Vice Principal, Accountant
- **Methods**:
  - TOTP (Time-based One-Time Password) - Google Authenticator, Authy
  - SMS OTP (Pakistani phone numbers only)
  - Email OTP (backup method)

### 3.2 Authentication Features

#### 3.2.1 Login Flow

```
1. User submits credentials (username/email + password)
2. Validate input format and rate limits
3. Check if user exists and is active
4. Verify password hash
5. Check account lockout status
6. If 2FA enabled → Require 2FA verification
7. Create JWT session token
8. Update last login timestamp
9. Log authentication attempt
10. Return session token and user data
```

#### 3.2.2 Password Reset Flow

```
1. User requests password reset (email/phone)
2. Validate rate limits
3. Generate secure reset token (expires in 1 hour)
4. Send reset link via SMS/Email
5. User clicks link and enters new password
6. Validate token and expiration
7. Apply password policies
8. Update password hash
9. Invalidate all existing sessions
10. Log password reset event
```

#### 3.2.3 Session Management

- **Session Strategy**: JWT (JSON Web Tokens)
- **Token Storage**: HttpOnly cookies with Secure flag
- **Session Duration**:
  - Default: 30 days (configurable)
  - Remember Me: 90 days
  - Idle timeout: 4 hours
- **Session Refresh**: Automatic refresh token rotation
- **Multiple Devices**: Support for concurrent sessions (max 5 per user)

### 3.3 Password Policies

#### 3.3.1 Password Requirements

| Requirement | Value | Description |
|-------------|-------|-------------|
| Minimum Length | 8 characters | Basic security requirement |
| Maximum Length | 128 characters | Prevent DoS attacks |
| Uppercase Letters | At least 1 | A-Z |
| Lowercase Letters | At least 1 | a-z |
| Numbers | At least 1 | 0-9 |
| Special Characters | At least 1 | !@#$%^&*()_+-=[]{}|;:',.<>? |
| Common Passwords | Blocked | Prevent weak passwords |
| Personal Information | Blocked | Cannot contain username/email parts |
| Password History | Last 5 passwords | Cannot reuse recent passwords |
| Password Expiry | 180 days | Force password change every 6 months |

#### 3.3.2 Password Validation Process

```
1. Check minimum/maximum length
2. Check character composition (uppercase, lowercase, numbers, symbols)
3. Check against common password dictionary
4. Check for personal information inclusion
5. Check password history
6. Calculate password strength score (0-100)
7. Provide user-friendly feedback
```

---

## 4. Authorization System

### 4.1 Role-Based Access Control (RBAC)

#### 4.1.1 Roles Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| **Super Admin** | 10 | Full system access, manage all schools |
| **Principal** | 9 | Full access to single school |
| **Vice Principal** | 8 | Almost all school access, no user management |
| **HOD (Head of Department)** | 7 | Department-level management |
| **Teacher** | 6 | Class and subject access |
| **Accountant** | 6 | Financial data access |
| **Librarian** | 5 | Library management |
| **Transport Manager** | 5 | Transport system access |
| **Hostel Warden** | 5 | Hostel management |
| **Receptionist** | 4 | Front desk operations |
| **Data Entry Operator** | 3 | Basic data entry |

#### 4.1.2 Permission Structure

Permissions are organized into **modules** and **actions**:

```typescript
// Module Structure
type Permission = {
  module: 'students' | 'staff' | 'fees' | 'attendance' | 'exams' |
           'library' | 'transport' | 'hostel' | 'inventory' |
           'reports' | 'settings' | 'users' | 'roles';
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'import';
  scope?: 'own' | 'department' | 'school' | 'all';
};
```

#### 4.1.3 Role-Permission Matrix

| Role | Students | Staff | Fees | Attendance | Exams | Library | Transport | Hostel | Settings | Users | Roles |
|------|----------|-------|------|------------|-------|---------|-----------|--------|----------|-------|-------|
| Super Admin | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ | ✓✓✓✓✓✓✓ |
| Principal | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓✓✓ | ✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓ |
| Vice Principal | ✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓✓✓✓ | ✓✓ | - | - |
| HOD | ✓✓✓✓ | ✓✓✓ | - | ✓✓✓ | ✓✓✓ | - | - | - | - | - | - |
| Teacher | ✓✓✓ | - | - | ✓✓✓ | ✓✓✓ | - | - | - | - | - | - |
| Accountant | - | ✓✓✓ | ✓✓✓✓✓ | - | - | - | - | - | - | - | - |
| Librarian | - | - | - | - | - | ✓✓✓✓✓ | - | - | - | - | - |
| Transport Manager | - | - | - | - | - | - | ✓✓✓✓✓ | - | - | - | - |
| Hostel Warden | - | - | - | ✓✓ | - | - | - | ✓✓✓✓✓ | - | - | - |
| Receptionist | ✓✓ | - | ✓✓ | - | - | - | - | - | - | - | - |
| Data Entry Operator | ✓✓ | - | ✓ | ✓✓ | - | - | - | - | - | - | - |

**Legend:** ✓ = view, ✓✓ = create, ✓✓✓ = edit, ✓✓✓✓ = delete, ✓✓✓✓✓ = approve, ✓✓✓✓✓✓ = export, ✓✓✓✓✓✓✓ = import

### 4.2 Permission Checking System

#### 4.2.1 Permission Evaluation Flow

```
1. Extract user from session
2. Load user's role with permissions
3. Check if user is active
4. Check school scope (for multi-school)
5. Evaluate requested permission
6. Apply role hierarchy rules
7. Return allow/deny decision
8. Log permission check (for audit)
```

#### 4.2.2 Middleware Integration

```typescript
// Route-level middleware example
export async function requirePermission(
  permission: Permission,
  scope?: 'own' | 'department' | 'school' | 'all'
) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkPermission(
      session.user.id,
      permission,
      scope
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  };
}
```

### 4.3 Data-Level Security

#### 4.3.1 Row-Level Security (RLS)

- **School Isolation**: Users can only access data from their assigned school
- **Department Scoping**: HODs can only access their department's data
- **Owner Scoping**: Teachers can only access their own classes/subjects
- **Student Privacy**: Sensitive data masked based on role

#### 4.3.2 Field-Level Security

```typescript
// Example: Sensitive field masking
const SENSITIVE_FIELDS = {
  cnicNumber: ['Super Admin', 'Principal', 'Vice Principal'],
  salary: ['Super Admin', 'Principal', 'Accountant'],
  medicalConditions: ['Super Admin', 'Principal'],
  bankAccount: ['Super Admin', 'Principal', 'Accountant'],
};
```

---

## 5. Security Features

### 5.1 Two-Factor Authentication (2FA)

#### 5.1.1 Implementation Approach

| Feature | Details |
|---------|---------|
| **Primary Method** | TOTP (Time-based One-Time Password) |
| **Backup Method** | SMS OTP (Pakistani networks) |
| **Fallback Method** | Email OTP |
| **2FA Expiry** | 5 minutes after generation |
| **Recovery Codes** | 10 recovery codes (single-use) |
| **Trusted Devices** | Optional 30-day device trust |

#### 5.1.2 2FA Workflow

```
Setup Phase:
1. User enables 2FA in settings
2. Generate TOTP secret key
3. Display QR code for authenticator app
4. Verify first-time 2FA code
5. Generate and display recovery codes
6. User saves recovery codes securely

Login Phase with 2FA:
1. User enters credentials
2. System validates credentials
3. Check if 2FA is enabled for user
4. Prompt for 2FA code
5. Validate TOTP code
6. If valid, create session
7. If invalid, allow retry (max 3 attempts)
8. Lock account after max failed attempts
```

### 5.2 Account Lockout Mechanism

#### 5.2.1 Lockout Policy

| Parameter | Value | Description |
|-----------|-------|-------------|
| Max Failed Attempts | 5 | Consecutive failed login attempts |
| Lockout Duration | 30 minutes | Initial lockout period |
| Progressive Lockout | Yes | Duration increases with repeat offenses |
| Max Lockout Duration | 24 hours | Maximum lockout time |
| Admin Override | Yes | Super Admin can unlock accounts |

#### 5.2.2 Lockout Algorithm

```
1. Track failed login attempts per user
2. Reset counter on successful login
3. Increment counter on failed attempt
4. If counter >= threshold:
   - Lock account
   - Calculate lockout duration based on history
   - Set lockout expiry time
   - Notify user via email/SMS
   - Log lockout event
5. Allow retry after lockout expires
```

### 5.3 Rate Limiting

#### 5.3.1 Rate Limiting Strategy

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/signin` | 5 requests | 15 minutes | Prevent brute force |
| `/api/auth/signup` | 3 requests | 1 hour | Prevent spam registration |
| `/api/auth/forgot-password` | 3 requests | 1 hour | Prevent abuse |
| `/api/auth/reset-password` | 10 requests | 1 hour | Reasonable limit |
| `/api/auth/verify-2fa` | 10 requests | 5 minutes | Prevent 2FA brute force |
| `/api/auth/resend-otp` | 3 requests | 15 minutes | Prevent SMS abuse |

#### 5.3.2 Implementation

```typescript
// In-memory rate limiting (for development)
// Redis for production (recommended)
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5.4 Audit Logging

#### 5.4.1 Events to Log

| Category | Events |
|----------|--------|
| **Authentication** | Login success/failure, logout, password change, 2FA enable/disable |
| **Authorization** | Permission granted/denied, role changes, privilege escalation |
| **User Management** | User creation/deletion, profile updates, activation/deactivation |
| **Data Access** | Sensitive data access, bulk data exports, data modifications |
| **Security Events** | Account lockout, suspicious activity, multiple failed attempts |

#### 5.4.2 Log Structure

```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: DateTime;
  metadata?: {
    schoolId?: string;
    deviceInfo?: string;
    location?: string;
    sessionId?: string;
  };
}
```

#### 5.4.3 Log Retention Policy

| Log Type | Retention Period |
|----------|------------------|
| Authentication logs | 2 years |
| Authorization logs | 2 years |
| User management logs | 5 years |
| Data access logs | 1 year |
| Security events | 5 years |

### 5.5 Security Headers

```typescript
// Security headers to apply to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': CSP_DIRECTIVE,
};
```

### 5.6 Password Security

#### 5.6.1 Password Hashing

| Configuration | Value |
|---------------|-------|
| Algorithm | bcrypt |
| Cost Factor | 12 (recommended for 2025) |
| Salt | Auto-generated (128-bit) |
| Hash Length | 60 characters |

#### 5.6.2 Password Reset Tokens

| Configuration | Value |
|---------------|-------|
| Token Type | Cryptographically secure random string |
| Length | 64 characters |
| Algorithm | SHA-256 |
| Expiry | 1 hour |
| Single Use | Yes |

---

## 6. Multi-School Support

### 6.1 Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│              School Context Resolution Middleware            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   School A  │  │   School B  │  │      School C       │  │
│  │  (isolate)  │  │  (isolate)  │  │     (isolate)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Database Layer                          │
│  All tables include `schoolId` for data isolation           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 School Context Management

#### 6.2.1 Session Structure

```typescript
interface ExtendedSession {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    schoolId: string; // Primary school
    accessibleSchools: string[]; // For Super Admin
    permissions: Permission[];
  };
  currentSchool: {
    id: string;
    name: string;
    code: string;
  };
  twoFactorVerified: boolean;
  lastActivity: DateTime;
}
```

#### 6.2.2 School Isolation Strategy

1. **Database Level**: All queries include `schoolId` filter
2. **API Level**: Middleware validates school context
3. **UI Level**: School selector (for multi-school users)
4. **Cache Level**: Cache keys include school ID

### 6.3 Cross-School Access

| Role | Cross-School Access |
|------|---------------------|
| Super Admin | Full access to all schools |
| Principal | Access only to assigned school |
| Vice Principal | Access only to assigned school |
| Other Roles | Access only to assigned school |

---

## 7. API Specifications

### 7.1 Authentication Endpoints

#### 7.1.1 POST `/api/auth/signin`

**Description:** User login endpoint

**Request Body:**
```typescript
{
  username?: string; // Either username or email
  email?: string;    // Either username or email
  password: string;
  twoFactorCode?: string; // If 2FA enabled
  rememberMe?: boolean;   // Default: false
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: Permission[];
    };
    schoolId: string;
  };
  requiresTwoFactor: boolean;
  message: string;
}
```

**Response (401 Unauthorized):**
```typescript
{
  success: false;
  error: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_INACTIVE' | '2FA_REQUIRED';
  message: string;
  lockoutExpiry?: string; // ISO 8601 timestamp
  remainingAttempts?: number;
}
```

**Response (429 Too Many Requests):**
```typescript
{
  success: false;
  error: 'RATE_LIMIT_EXCEEDED';
  message: string;
  retryAfter: number; // seconds
}
```

#### 7.1.2 POST `/api/auth/signout`

**Description:** User logout endpoint

**Headers:**
- `Authorization: Bearer {token}` (optional, cookie-based preferred)

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

#### 7.1.3 POST `/api/auth/forgot-password`

**Description:** Request password reset

**Request Body:**
```typescript
{
  identifier: string; // username or email or phone
  method?: 'email' | 'sms'; // Default: auto-detect
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
  method: 'email' | 'sms';
  // Note: Never reveal if user exists or not
}
```

**Response (429 Too Many Requests):**
```typescript
{
  success: false;
  error: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
}
```

#### 7.1.4 POST `/api/auth/reset-password`

**Description:** Reset password with token

**Request Body:**
```typescript
{
  token: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

**Response (400 Bad Request):**
```typescript
{
  success: false;
  error: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'PASSWORD_MISMATCH' | 'WEAK_PASSWORD';
  message: string;
  errors?: {
    newPassword?: string[];
  };
}
```

#### 7.1.5 POST `/api/auth/change-password`

**Description:** Change password (authenticated)

**Request Body:**
```typescript
{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

**Response (400 Bad Request):**
```typescript
{
  success: false;
  error: 'INVALID_CURRENT_PASSWORD' | 'PASSWORD_MISMATCH' | 'WEAK_PASSWORD' | 'PASSWORD_REUSE';
  message: string;
}
```

### 7.2 Two-Factor Authentication Endpoints

#### 7.2.1 POST `/api/auth/2fa/enable`

**Description:** Enable 2FA for user account

**Request Body:**
```typescript
{
  password: string; // Confirm password before enabling 2FA
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  secret: string; // Base32 encoded TOTP secret
  qrCode: string; // Data URI of QR code
  backupCodes: string[]; // Array of 10 recovery codes
  message: string;
}
```

#### 7.2.2 POST `/api/auth/2fa/verify-setup`

**Description:** Verify 2FA setup (first-time)

**Request Body:**
```typescript
{
  secret: string;
  code: string; // 6-digit TOTP code
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

**Response (400 Bad Request):**
```typescript
{
  success: false;
  error: 'INVALID_CODE';
  message: string;
  remainingAttempts: number;
}
```

#### 7.2.3 POST `/api/auth/2fa/disable`

**Description:** Disable 2FA for user account

**Request Body:**
```typescript
{
  password: string;
  twoFactorCode?: string; // Required if 2FA is currently enabled
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

#### 7.2.4 POST `/api/auth/2fa/verify`

**Description:** Verify 2FA code during login

**Request Body:**
```typescript
{
  userId: string;
  code: string; // 6-digit TOTP or backup code
  trustDevice?: boolean; // Optional, default: false
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
  sessionToken: string;
}
```

**Response (400 Bad Request):**
```typescript
{
  success: false;
  error: 'INVALID_CODE' | 'BACKUP_CODE_USED' | 'CODE_EXPIRED';
  message: string;
  remainingAttempts: number;
}
```

### 7.3 User Management Endpoints

#### 7.3.1 GET `/api/users`

**Description:** List users (with pagination and filtering)

**Query Parameters:**
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, Max: 100
  search?: string;        // Search by name, username, email
  roleId?: string;        // Filter by role
  schoolId?: string;      // Filter by school
  isActive?: boolean;     // Filter by active status
  isStaff?: boolean;      // Filter by staff status
  sortBy?: string;        // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### 7.3.2 GET `/api/users/:id`

**Description:** Get user details by ID

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: Role;
    isActive: boolean;
    isStaff: boolean;
    lastLogin?: string;
    dateJoined: string;
    schoolId?: string;
    twoFactorEnabled: boolean;
    profilePhoto?: string;
  };
}
```

#### 7.3.3 POST `/api/users`

**Description:** Create new user

**Request Body:**
```typescript
{
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  schoolId?: string;
  isStaff?: boolean;
  sendInvite?: boolean; // Send invitation email
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  data: User;
  message: string;
}
```

**Response (400 Bad Request):**
```typescript
{
  success: false;
  error: 'VALIDATION_ERROR' | 'USERNAME_EXISTS' | 'EMAIL_EXISTS' | 'WEAK_PASSWORD';
  message: string;
  errors?: Record<string, string[]>;
}
```

#### 7.3.4 PUT `/api/users/:id`

**Description:** Update user details

**Request Body:**
```typescript
{
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
  schoolId?: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: User;
  message: string;
}
```

#### 7.3.5 DELETE `/api/users/:id`

**Description:** Delete user (soft delete)

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

### 7.4 Role Management Endpoints

#### 7.4.1 GET `/api/roles`

**Description:** List all roles

**Response (200 OK):**
```typescript
{
  success: true;
  data: Role[];
}
```

#### 7.4.2 GET `/api/roles/:id`

**Description:** Get role details with permissions

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    level: number;
    isSystem: boolean;
    userCount: number;
  };
}
```

#### 7.4.3 POST `/api/roles`

**Description:** Create new role (Super Admin only)

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  permissions: Permission[];
  level: number; // 1-10
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  data: Role;
  message: string;
}
```

#### 7.4.4 PUT `/api/roles/:id`

**Description:** Update role details

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  permissions?: Permission[];
  level?: number;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: Role;
  message: string;
}
```

### 7.5 Permission Check Endpoint

#### 7.5.1 POST `/api/auth/check-permission`

**Description:** Check if user has specific permission

**Request Body:**
```typescript
{
  permission: {
    module: string;
    action: string;
    scope?: string;
  };
  resourceId?: string; // Optional, for resource-specific checks
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  hasPermission: boolean;
  reason?: string; // If permission denied
}
```

### 7.6 Session Management Endpoints

#### 7.6.1 GET `/api/auth/sessions`

**Description:** Get user's active sessions

**Response (200 OK):**
```typescript
{
  success: true;
  data: {
    current: Session;
    otherSessions: Session[];
  };
}
```

#### 7.6.2 DELETE `/api/auth/sessions/:id`

**Description:** Revoke specific session

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

#### 7.6.3 DELETE `/api/auth/sessions/all`

**Description:** Revoke all sessions except current

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;
}
```

### 7.7 Audit Log Endpoints

#### 7.7.1 GET `/api/audit-logs`

**Description:** Get audit logs (with filtering)

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  tableName?: string;
  startDate?: string; // ISO 8601
  endDate?: string;   // ISO 8601
  schoolId?: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### 7.7.2 GET `/api/audit-logs/:id`

**Description:** Get specific audit log entry

**Response (200 OK):**
```typescript
{
  success: true;
  data: AuditLog;
}
```

---

## 8. Database Schema Additions

### 8.1 Existing Models (Already in Schema)

The following models already exist in the Prisma schema:

- **User**: Basic user information with role reference
- **Role**: Role definitions with permissions (JSON field)
- **AuditLog**: Comprehensive audit logging
- **Staff**: Staff details linked to User

### 8.2 Required Schema Additions

#### 8.2.1 Additions to User Model

```prisma
model User {
  // ... existing fields ...

  // Additions for enhanced authentication
  twoFactorSecret   String?  // TOTP secret for 2FA
  twoFactorEnabled  Boolean  @default(false)
  twoFactorBackupCodes String? // JSON array of backup codes
  failedLoginAttempts Int    @default(0)
  lockedUntil      DateTime?
  passwordChangedAt DateTime @default(now())
  passwordExpiryDate DateTime?
  mustChangePassword Boolean @default(false)
  lastPasswordChange DateTime?
  passwordHistory  String?  // JSON array of password hashes
  emailVerified    Boolean  @default(false)
  emailVerifiedAt  DateTime?
  phoneVerified    Boolean  @default(false)
  phoneVerifiedAt  DateTime?
  loginProvider    String   @default("credentials") // credentials, google, etc.
  providerAccountId String?

  // Additions for multi-school support
  schoolId         String?  // Primary school assignment
  accessibleSchools String? // JSON array for Super Admin

  // ... existing relations ...
}
```

#### 8.2.2 New Model: PasswordResetToken

```prisma
model PasswordResetToken {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  used        Boolean  @default(false)
  usedAt      DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

#### 8.2.3 New Model: TwoFactorBackupCode

```prisma
model TwoFactorBackupCode {
  id          String   @id @default(cuid())
  userId      String
  code        String   @unique
  used        Boolean  @default(false)
  usedAt      DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([code])
  @@index([userId, used])
}
```

#### 8.2.4 New Model: Session

```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  ipAddress   String?
  userAgent   String?
  deviceType  String?  // desktop, mobile, tablet
  deviceName  String?
  browser     String?
  os          String?
  location    String?
  city        String?
  country     String?
  lastActive  DateTime @default(now())
  expiresAt   DateTime
  isTrusted   Boolean  @default(false)
  trustedAt   DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([userId, expiresAt])
}
```

#### 8.2.5 New Model: LoginAttempt

```prisma
model LoginAttempt {
  id          String   @id @default(cuid())
  userId      String?
  username    String
  email       String?
  ipAddress   String
  userAgent   String?
  success     Boolean
  failureReason String? // INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.
  twoFactorRequired Boolean @default(false)
  twoFactorVerified Boolean @default(false)
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([username])
  @@index([ipAddress])
  @@index([timestamp])
  @@index([success, timestamp])
}
```

#### 8.2.6 New Model: RolePermission

```prisma
model RolePermission {
  id          String   @id @default(cuid())
  roleId      String
  module      String
  action      String
  scope       String?  // own, department, school, all
  granted     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, action, scope])
  @@index([roleId])
  @@index([module])
  @@index([action])
}
```

#### 8.2.7 New Model: SchoolUserRole

```prisma
model SchoolUserRole {
  id          String   @id @default(cuid())
  userId      String
  schoolId    String
  roleId      String
  isPrimary   Boolean  @default(false)
  assignedAt  DateTime @default(now())
  assignedBy  String?

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, schoolId])
  @@index([userId])
  @@index([schoolId])
  @@index([roleId])
  @@index([userId, isPrimary])
}
```

#### 8.2.8 Additions to Role Model

```prisma
model Role {
  // ... existing fields ...

  // Update permissions field - move to RolePermission
  // permissions String   // JSON string of permissions - DEPRECATED

  // New relation
  rolePermissions RolePermission[]
  schoolUserRoles SchoolUserRole[]
}
```

#### 8.2.9 Additions to User Model Relations

```prisma
model User {
  // ... existing fields ...

  // New relations
  passwordResetTokens PasswordResetToken[]
  twoFactorBackupCodes TwoFactorBackupCode[]
  sessions Session[]
  loginAttempts LoginAttempt[]
  schoolUserRoles SchoolUserRole[]
}
```

### 8.3 Migration Strategy

```bash
# Step 1: Create migration file
npx prisma migrate dev --name add-authentication-features

# Step 2: Review generated migration
# Check /prisma/migrations/xxxxxx_add_authentication_features/migration.sql

# Step 3: Apply migration to database
npx prisma db push

# Step 4: Regenerate Prisma client
npx prisma generate
```

---

## 9. Implementation Steps

### Phase 1: Foundation (Week 1-2)

#### Step 1.1: Database Schema Updates
- [ ] Add new models to Prisma schema
- [ ] Create and run migration
- [ ] Update Prisma client
- [ ] Test database changes

#### Step 1.2: Core Authentication Setup
- [ ] Install NextAuth.js v4 (already installed)
- [ ] Create NextAuth configuration structure
- [ ] Set up JWT strategy
- [ ] Configure session management
- [ ] Create database adapter for Prisma

#### Step 1.3: Password Security
- [ ] Implement password hashing utilities (bcrypt)
- [ ] Create password validator with policies
- [ ] Implement password strength checker
- [ ] Add password history tracking

#### Step 1.4: Basic Auth Endpoints
- [ ] Create `/api/auth/[...nextauth]` route
- [ ] Implement sign-in callback
- [ ] Implement session callback
- [ ] Implement sign-out handler
- [ ] Test basic login flow

### Phase 2: Security Features (Week 3-4)

#### Step 2.1: Rate Limiting
- [ ] Install rate limiting library
- [ ] Configure rate limits for auth endpoints
- [ ] Implement in-memory rate limiter (dev)
- [ ] Plan Redis integration for production
- [ ] Add rate limit headers to responses

#### Step 2.2: Account Lockout
- [ ] Implement failed login tracking
- [ ] Create lockout mechanism
- [ ] Add progressive lockout logic
- [ ] Implement account unlock flow
- [ ] Add admin unlock functionality

#### Step 2.3: Two-Factor Authentication
- [ ] Install TOTP library (speakeasy or similar)
- [ ] Implement TOTP secret generation
- [ ] Create QR code generation
- [ ] Implement TOTP code validation
- [ ] Generate and manage backup codes
- [ ] Create 2FA setup flow
- [ ] Implement 2FA verification flow

#### Step 2.4: Audit Logging
- [ ] Enhance existing AuditLog model
- [ ] Create audit logging service
- [ ] Implement log formatting
- [ ] Add audit logging to auth actions
- [ ] Create audit log viewer
- [ ] Implement log export functionality

### Phase 3: Authorization System (Week 5-6)

#### Step 3.1: Permission System
- [ ] Define permission structure
- [ ] Create permission constants
- [ ] Implement permission engine
- [ ] Create role-permission mapping
- [ ] Define default role permissions

#### Step 3.2: Role Management
- [ ] Create role management API
- [ ] Implement role CRUD operations
- [ ] Create role-permission editor UI
- [ ] Add role hierarchy logic
- [ ] Implement role assignment

#### Step 3.3: Permission Checking
- [ ] Create permission checking middleware
- [ ] Implement permission guards
- [ ] Add permission checking to API routes
- [ ] Create permission-based UI components
- [ ] Implement permission caching

#### Step 3.4: Data-Level Security
- [ ] Implement school isolation
- [ ] Add row-level security
- [ ] Implement field-level masking
- [ ] Create scope-based access control
- [ ] Test data isolation

### Phase 4: User Management (Week 7)

#### Step 4.1: User CRUD Operations
- [ ] Create user management API
- [ ] Implement user listing with filters
- [ ] Create user detail view
- [ ] Implement user creation
- [ ] Add user update functionality
- [ ] Implement user soft delete

#### Step 4.2: Profile Management
- [ ] Create profile page
- [ ] Implement profile update
- [ ] Add password change flow
- [ ] Create 2FA management UI
- [ ] Implement session management
- [ ] Add profile photo upload

#### Step 4.3: User Activation/Deactivation
- [ ] Implement user activation flow
- [ ] Create user deactivation
- [ ] Add bulk operations
- [ ] Implement user status notifications

### Phase 5: Password Reset (Week 8)

#### Step 5.1: Forgot Password Flow
- [ ] Create forgot password page
- [ ] Implement password reset request
- [ ] Generate secure reset tokens
- [ ] Send reset emails
- [ ] Implement SMS sending (Pakistani networks)

#### Step 5.2: Password Reset
- [ ] Create reset password page
- [ ] Implement token validation
- [ ] Add password reset form
- [ ] Validate new password
- [ ] Invalidate existing sessions
- [ ] Send confirmation notification

### Phase 6: Multi-School Support (Week 9)

#### Step 6.1: School Context
- [ ] Implement school context middleware
- [ ] Add school selector for multi-school users
- [ ] Update session structure
- [ ] Implement school switching

#### Step 6.2: Data Isolation
- [ ] Add schoolId to all queries
- [ ] Implement school-scoped APIs
- [ ] Test data isolation
- [ ] Add cross-school access control

### Phase 7: Frontend Integration (Week 10-11)

#### Step 7.1: Auth Pages
- [ ] Create login page
- [ ] Create forgot password page
- [ ] Create reset password page
- [ ] Create 2FA setup page
- [ ] Create profile page
- [ ] Create session management page

#### Step 7.2: Auth Components
- [ ] Create AuthGuard component
- [ ] Create RequireAuth HOC
- [ ] Create PermissionGate component
- [ ] Create RoleGate component
- [ ] Create SchoolSelector component

#### Step 7.3: Auth State Management
- [ ] Set up auth context
- [ ] Implement auth hooks
- [ ] Create auth utilities
- [ ] Add error handling
- [ ] Implement loading states

### Phase 8: Admin Features (Week 12)

#### Step 8.1: User Management UI
- [ ] Create user list page
- [ ] Add filtering and search
- [ ] Create user form (add/edit)
- [ ] Add bulk operations
- [ ] Implement user export

#### Step 8.2: Role Management UI
- [ ] Create role list page
- [ ] Create role form (add/edit)
- [ ] Implement permission editor
- [ ] Add role assignment UI
- [ ] Create role clone functionality

#### Step 8.3: Audit Log Viewer
- [ ] Create audit log page
- [ ] Add filtering options
- [ ] Implement log details view
- [ ] Add log export
- [ ] Create log analytics

### Phase 9: Testing & Security (Week 13)

#### Step 9.1: Security Testing
- [ ] Perform penetration testing
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test account lockout

#### Step 9.2: Load Testing
- [ ] Test with 500K+ concurrent users
- [ ] Optimize database queries
- [ ] Implement caching where needed
- [ ] Test session management under load
- [ ] Optimize API response times

#### Step 9.3: Integration Testing
- [ ] Test complete auth flows
- [ ] Test permission system
- [ ] Test multi-school scenarios
- [ ] Test 2FA flows
- [ ] Test password reset flows

### Phase 10: Deployment & Documentation (Week 14)

#### Step 10.1: Deployment
- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Set up Redis for rate limiting
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Deploy to production

#### Step 10.2: Documentation
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Document admin procedures
- [ ] Create troubleshooting guide
- [ ] Write security best practices

#### Step 10.3: Training
- [ ] Create training materials
- [ ] Conduct admin training
- [ ] Create video tutorials
- [ ] Provide quick reference cards

---

## 10. Security Considerations

### 10.1 Critical Security Points

#### 10.1.1 Password Security
- ✅ Use bcrypt with cost factor 12 or higher
- ✅ Never log or store passwords in plaintext
- ✅ Implement password complexity requirements
- ✅ Enforce password expiration
- ✅ Prevent password reuse
- ✅ Hash passwords on the client side (optional, additional layer)

#### 10.1.2 Session Security
- ✅ Use HTTP-only, Secure, SameSite cookies
- ✅ Implement short-lived access tokens (30 minutes)
- ✅ Use refresh tokens with rotation
- ✅ Invalidate sessions on password change
- ✅ Implement session timeout (4 hours idle)
- ✅ Limit concurrent sessions (max 5 per user)
- ✅ Store session IP and User-Agent for validation

#### 10.1.3 API Security
- ✅ Implement rate limiting on all endpoints
- ✅ Use CORS properly (restrict origins)
- ✅ Validate all input data
- ✅ Sanitize all outputs
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Implement proper error handling (don't leak info)
- ✅ Add security headers to all responses

#### 10.1.4 2FA Security
- ✅ Use TOTP with time-based codes (RFC 6238)
- ✅ Generate cryptographically secure secrets
- ✅ Implement backup codes (single-use)
- ✅ Rate limit 2FA verification attempts
- ✅ Lock account after multiple 2FA failures
- ✅ Log all 2FA activities

#### 10.1.5 Data Protection
- ✅ Encrypt sensitive data at rest (optional for SQLite)
- ✅ Mask sensitive fields in API responses
- ✅ Implement data retention policies
- ✅ Secure backups with encryption
- ✅ Implement proper access controls

### 10.2 Common Vulnerabilities & Mitigations

| Vulnerability | Risk Level | Mitigation |
|---------------|------------|------------|
| SQL Injection | Critical | Use Prisma ORM (parameterized queries) |
| XSS (Cross-Site Scripting) | High | Sanitize outputs, use CSP headers |
| CSRF (Cross-Site Request Forgery) | High | Use CSRF tokens, SameSite cookies |
| Brute Force Attacks | Medium | Rate limiting, account lockout |
| Session Hijacking | High | HTTPS, HTTP-only cookies, session binding |
| Password Guessing | Medium | Strong password policies, account lockout |
| Man-in-the-Middle | High | HTTPS/TLS, certificate pinning |
| Data Exposure | High | Encrypt sensitive data, access controls |
| DoS Attacks | Medium | Rate limiting, request throttling |
| Broken Authentication | Critical | Proper session management, 2FA |

### 10.3 Compliance & Standards

#### 10.3.1 OWASP Top 10 Coverage

| OWASP Risk | Coverage Status |
|------------|-----------------|
| A01:2021 – Broken Access Control | ✅ Fully covered |
| A02:2021 – Cryptographic Failures | ✅ Fully covered |
| A03:2021 – Injection | ✅ Fully covered (Prisma) |
| A04:2021 – Insecure Design | ✅ Fully covered |
| A05:2021 – Security Misconfiguration | ✅ Fully covered |
| A06:2021 – Vulnerable Components | ✅ Regular updates needed |
| A07:2021 – Identification and Failures | ✅ Fully covered |
| A08:2021 – Software and Data Integrity | ✅ Fully covered |
| A09:2021 – Security Logging | ✅ Fully covered |
| A10:2021 – Server-Side Request Forgery | ✅ Need to validate URLs |

#### 10.3.2 Pakistani Data Protection
- Comply with Pakistan's data protection regulations
- Implement data localization if required
- Obtain consent for data processing
- Provide data export functionality
- Implement data deletion (right to be forgotten)

### 10.4 Monitoring & Alerting

#### 10.4.1 Security Events to Monitor
- Multiple failed login attempts (>5 in 15 minutes)
- Account lockouts
- Unusual access patterns (geo-location, time)
- Privilege escalation attempts
- Bulk data exports
- Failed permission checks
- 2FA failures
- Password reset requests (abnormal volume)

#### 10.4.2 Alerting Thresholds
| Event Type | Threshold | Action |
|------------|-----------|--------|
| Failed logins | 10 in 15 minutes | Send alert to admin |
| Account lockout | Any | Send email to user |
| Suspicious location | New country | Require 2FA re-verification |
| Bulk export | >1000 records | Log and alert |
| Admin access | After hours | Additional 2FA required |

---

## 11. Pakistani-Specific Features

### 11.1 Phone Verification

#### 11.1.1 Pakistani Phone Number Format
- **Format**: +92XXXXXXXXXX or 03XXXXXXXXX
- **Valid Networks**: Jazz, Telenor, Zong, Ufone, Warid
- **Validation**: Check against known mobile prefixes

#### 11.1.2 SMS OTP Integration

| Provider | Support | Notes |
|----------|---------|-------|
| **Jazz** | ✅ | Largest network in Pakistan |
| **Telenor** | ✅ | Good coverage |
| **Zong** | ✅ | 4G coverage |
| **Ufone** | ✅ | Popular in urban areas |
| **Warid** | ✅ | Now merged with Jazz |

#### 11.1.3 SMS Gateway Options

**Recommended Providers for Pakistan:**
1. **Telenor SMS API** - Reliable, good pricing
2. **Jazz Business SMS** - Excellent delivery
3. **Twilio** - International, higher cost
4. **MessageBird** - Good alternative
5. **Local SMS aggregators** - Cost-effective

### 11.2 CNIC Validation

#### 11.2.1 CNIC Format
- **Format**: XXXXX-XXXXXXX-X (13 digits with hyphens)
- **Example**: 12345-1234567-1
- **Validation Rules**:
  - Total 13 digits
  - Check digit validation (if available)
  - Age calculation from date of birth
  - Gender determination (last digit: odd=male, even=female)

#### 11.2.2 CNIC Fields
```typescript
interface CNICInfo {
  number: string;        // Formatted: XXXXX-XXXXXXX-X
  unformatted: string;   // 13 digits only
  isValid: boolean;
  expiryDate?: Date;     // For ID cards
  dateOfBirth?: Date;    // Extracted if available
  gender?: 'male' | 'female';
}
```

### 11.3 Regional Features

#### 11.3.1 Multi-Language Support
- **Primary Languages**: English, Urdu
- **Regional Languages**: Punjabi, Sindhi, Pashto, Balochi (optional)
- **RTL Support**: For Urdu and other RTL languages

#### 11.3.2 Pakistani Time Zone
- **Time Zone**: Pakistan Standard Time (PKT)
- **UTC Offset**: UTC+5:00
- **No Daylight Saving Time**

#### 11.3.3 Pakistani Date Format
- **Display Format**: DD-MM-YYYY
- **Input Format**: Flexible (DD-MM-YYYY, YYYY-MM-DD)
- **Islamic Calendar**: Optional display option

### 11.4 Pakistani Payment Methods

#### 11.4.1 Mobile Wallet Integration
| Service | Support | Use Case |
|---------|---------|----------|
| **JazzCash** | ✅ | Fee payments |
| **EasyPaisa** | ✅ | Fee payments |
| **U Paisa** | ✅ | Fee payments |
| **SadaPay** | ✅ | Optional |
| **Nayapay** | ✅ | Optional |

#### 11.4.2 Bank Integration
- **HBL (Habib Bank Limited)**
- **UBL (United Bank Limited)**
- **MCB (Muslim Commercial Bank)**
- **Allied Bank**
- **Standard Chartered**
- **Bank Alfalah**

### 11.5 Educational Board Integration

#### 11.5.1 Supported Boards
| Board | Province | Coverage |
|-------|----------|----------|
| **BISE Lahore** | Punjab | Central Punjab |
| **BISE Gujranwala** | Punjab | Northern Punjab |
| **BISE Faisalabad** | Punjab | Central Punjab |
| **BISE Rawalpindi** | Punjab | Northern Punjab |
| **BISE Multan** | Punjab | Southern Punjab |
| **BISE Sargodha** | Punjab | Central Punjab |
| **BISE Bahawalpur** | Punjab | Southern Punjab |
| **BISE Dera Ghazi Khan** | Punjab | Southern Punjab |
| **BISE Sahiwal** | Punjab | Central Punjab |
| **BISE Federal Board** | Federal | Nationwide |
| **BISE Karachi** | Sindh | Karachi |
| **BISE Hyderabad** | Sindh | Sindh |
| **BISE Sukkur** | Sindh | Sindh |
| **BISE Mirpurkhas** | Sindh | Sindh |
| **BISE Peshawar** | KPK | KPK |
| **BISE Mardan** | KPK | KPK |
| **BISE Swat** | KPK | KPK |
| **BISE Abbottabad** | KPK | KPK |
| **BISE Quetta** | Balochistan | Balochistan |

#### 11.5.2 Grade Systems
- **Matriculation**: 900-1000 marks, 9 subjects
- **Intermediate**: 1100-1200 marks, 6-7 subjects
- **O-Level**: Cambridge system, A*-G grades
- **A-Level**: Cambridge system, A-E grades

### 11.6 Pakistani Academic Year

#### 11.6.1 Academic Calendar
- **Academic Year Start**: April (for most schools)
- **Academic Year End**: March
- **Summer Break**: June-August
- **Winter Break**: December-January
- **Spring Break**: March-April

#### 11.6.2 Exam Schedule
- **Mid-Term Exams**: October-November
- **Final Exams**: February-March
- **Board Exams (Matric)**: March-April
- **Board Exams (Inter)**: April-May
- **Send-Up Exams**: December

### 11.7 Communication Channels

#### 11.7.1 SMS Templates (Urdu & English)

**Password Reset SMS (English):**
```
School Management System: Your password reset code is: {CODE}. Valid for 10 minutes. Do not share this code with anyone.
```

**Password Reset SMS (Urdu):**
```
اسکول مینجمنٹ سسٹم: آپ کا پاس ورڈ ری سیٹ کوڈ ہے: {CODE}۔ یہ 10 منٹ کے لیے درست ہے۔ یہ کوڈ کسی کے ساتھ شیئر نہ کریں۔
```

**2FA Verification SMS (English):**
```
School Management System: Your verification code is: {CODE}. Valid for 5 minutes. If you didn't request this, ignore this message.
```

**2FA Verification SMS (Urdu):**
```
اسکول مینجمنٹ سسٹم: آپ کا تصدیقی کوڈ ہے: {CODE}۔ یہ 5 منٹ کے لیے درست ہے۔ اگر آپ نے اس کی درخواست نہیں کی ہے تو اس پیغام کو نظر انداز کریں۔
```

#### 11.7.2 Email Templates
- Professional HTML email templates
- Bilingual (English & Urdu)
- Mobile-responsive design
- School branding

---

## 12. Performance Optimization

### 12.1 Database Optimization

#### 12.1.1 Indexing Strategy
- All foreign keys indexed
- Frequently queried fields indexed
- Composite indexes for common query patterns
- Covering indexes for critical queries

#### 12.1.2 Query Optimization
- Use Prisma's `select` to limit returned fields
- Implement pagination for all list endpoints
- Use `include` vs `select` appropriately
- Cache frequently accessed data (roles, permissions)

### 12.2 Caching Strategy

#### 12.2.1 Cache Layers
| Layer | Tool | TTL |
|-------|------|-----|
| **Session Cache** | Redis/In-memory | 30 minutes |
| **Permission Cache** | Redis/In-memory | 1 hour |
| **Role Cache** | Redis/In-memory | 1 hour |
| **School Cache** | Redis/In-memory | 24 hours |
| **User Profile Cache** | Redis/In-memory | 1 hour |

#### 12.2.2 Cache Invalidation
- Invalidate on data modification
- Implement cache versioning
- Use cache tags for grouped invalidation
- Implement cache warming for critical data

### 12.3 Load Balancing (Future)

- Horizontal scaling with multiple server instances
- Session storage in Redis (shared across instances)
- Database read replicas (if needed)
- CDN for static assets

---

## 13. Monitoring & Analytics

### 13.1 Key Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| **Active Sessions** | Number of active user sessions | >10,000 |
| **Login Success Rate** | Successful logins / total attempts | <95% |
| **Failed Login Rate** | Failed logins / total attempts | >5% |
| **2FA Adoption Rate** | Users with 2FA / total users | Target: 80% |
| **Avg. Response Time** | API response time | >500ms |
| **Error Rate** | Failed requests / total requests | >1% |
| **Password Reset Requests** | Daily password reset requests | >100 |
| **Account Lockouts** | Daily account lockouts | >50 |

### 13.2 Logging Strategy

#### 13.2.1 Log Levels
- **ERROR**: Critical errors, security incidents
- **WARN**: Warning conditions, potential issues
- **INFO**: General information, normal operations
- **DEBUG**: Detailed debugging information (dev only)

#### 13.2.2 Log Rotation
- Daily log rotation
- Retain logs for 30 days (debug), 1 year (info/error)
- Compress old logs
- Archive critical logs to long-term storage

---

## 14. Disaster Recovery & Backup

### 14.1 Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| **Database Snapshot** | Hourly | 24 hours | Local |
| **Daily Backup** | Daily | 30 days | Local + Cloud |
| **Weekly Backup** | Weekly | 12 weeks | Cloud |
| **Monthly Backup** | Monthly | 12 months | Cloud |
| **Audit Logs** | Daily | 5 years | Cold Storage |

### 14.2 Recovery Procedures

1. **Database Restoration**
   - Point-in-time recovery
   - Rollback to specific backup
   - Data validation after restore

2. **System Recovery**
   - Server provisioning
   - Application deployment
   - Configuration restoration
   - Health checks

---

## 15. Future Enhancements

### 15.1 Phase 2 Features (Post-Launch)

#### 15.1.1 Advanced Authentication
- Biometric authentication (fingerprint, face recognition)
- Hardware security keys (FIDO2/WebAuthn)
- Social login (Google, Facebook - if applicable)
- SAML 2.0 / SSO integration (for school districts)

#### 15.1.2 Advanced Security
- AI-powered anomaly detection
- Behavioral biometrics
- Device fingerprinting
- Geo-fencing for access
- IP whitelisting

#### 15.1.3 Enhanced Features
- Self-service password reset (security questions)
- Temporary access tokens
- Delegated administration
- Approval workflows for sensitive actions
- Advanced audit log analytics

### 15.2 Integrations

#### 15.2.1 Government Systems
- PERN (Punjab Education Records Network)
- SIS (Sindh Education Information System)
- BISE result integration
- CNIC verification with NADRA

#### 15.2.2 Third-Party Services
- Payment gateways (JazzCash, EasyPaisa, banks)
- SMS gateways (multiple providers)
- Email service providers (SendGrid, AWS SES)
- File storage (AWS S3, local storage)

---

## 16. Maintenance & Support

### 16.1 Regular Maintenance Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| **Security Updates** | Weekly | Update dependencies, patch vulnerabilities |
| **Database Maintenance** | Monthly | Optimize database, clean up old data |
| **Log Review** | Weekly | Review audit logs for suspicious activity |
| **Performance Review** | Monthly | Analyze performance metrics |
| **Backup Verification** | Monthly | Test backup restoration |
| **User Account Cleanup** | Quarterly | Remove inactive accounts |
| **Password Policy Review** | Quarterly | Review and update if needed |
| **Security Audit** | Annually | Comprehensive security assessment |

### 16.2 Support Tiers

| Tier | Response Time | Scope |
|------|---------------|-------|
| **Critical** | < 1 hour | System down, security breach |
| **High** | < 4 hours | Major functionality broken |
| **Medium** | < 24 hours | Minor issues, feature requests |
| **Low** | < 72 hours | General inquiries, documentation |

---

## 17. Appendices

### Appendix A: Permission Matrix (Detailed)

See Section 4.1.3 for the complete role-permission matrix.

### Appendix B: Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_001` | Invalid credentials | 401 |
| `AUTH_002` | Account locked | 401 |
| `AUTH_003` | Account inactive | 401 |
| `AUTH_004` | 2FA required | 401 |
| `AUTH_005` | Invalid 2FA code | 400 |
| `AUTH_006` | Rate limit exceeded | 429 |
| `AUTH_007` | Invalid token | 400 |
| `AUTH_008` | Token expired | 400 |
| `AUTH_009` | Weak password | 400 |
| `AUTH_010` | Password mismatch | 400 |
| `AUTH_011` | Password reuse | 400 |
| `AUTH_012` | User not found | 404 |
| `AUTH_013` | Email already exists | 409 |
| `AUTH_014` | Username already exists | 409 |
| `PERM_001` | Permission denied | 403 |
| `PERM_002` | Insufficient privileges | 403 |
| `PERM_003` | Invalid scope | 400 |
| `USER_001` | User creation failed | 500 |
| `USER_002` | User update failed | 500 |
| `USER_003` | User deletion failed | 500 |
| `ROLE_001` | Role creation failed | 500 |
| `ROLE_002` | Role not found | 404 |
| `ROLE_003` | Cannot delete system role | 400 |

### Appendix C: Configuration Examples

#### C.1 NextAuth Configuration

```typescript
// src/lib/auth/auth.config.ts
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Implementation details
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add custom claims to JWT
    },
    async session({ session, token }) {
      // Add user data to session
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/auth/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

#### C.2 Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRY="30d"

# 2FA
TOTP_ISSUER="School Management System"

# Rate Limiting (Redis for production)
REDIS_URL="redis://localhost:6379"

# SMS Gateway (Pakistani)
SMS_PROVIDER="telenor"
SMS_API_KEY="your-api-key"
SMS_SENDER_ID="SCHOOL"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@school.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@school.com"

# Security
BCRYPT_ROUNDS="12"
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="30"

# Multi-School
DEFAULT_SCHOOL_ID="default-school-id"
```

### Appendix D: Testing Checklist

#### D.1 Authentication Testing
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with locked account
- [ ] Login with inactive account
- [ ] Password change
- [ ] Password reset request
- [ ] Password reset with token
- [ ] Password reset with expired token
- [ ] Logout
- [ ] Session timeout
- [ ] Multiple sessions

#### D.2 2FA Testing
- [ ] Enable 2FA
- [ ] Verify 2FA setup
- [ ] Login with 2FA
- [ ] Login with invalid 2FA code
- [ ] Use backup code
- [ ] Disable 2FA
- [ ] 2FA with TOTP app
- [ ] 2FA with SMS OTP

#### D.3 Authorization Testing
- [ ] Access permitted resources
- [ ] Access forbidden resources
- [ ] Role-based access
- [ ] Permission-based access
- [ ] Scope-based access
- [ ] School isolation
- [ ] Department scoping

#### D.4 Security Testing
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Account lockout
- [ ] Password policies
- [ ] Session hijacking prevention
- [ ] Brute force prevention

#### D.5 Performance Testing
- [ ] Load testing (500K+ users)
- [ ] Concurrent login attempts
- [ ] Permission check performance
- [ ] Database query performance
- [ ] API response times
- [ ] Memory usage
- [ ] CPU usage

---

## Conclusion

This architecture plan provides a comprehensive blueprint for implementing a robust, secure, and scalable Authentication & Authorization system for the Pakistani School Management System. The plan covers:

- **Complete authentication flow** with multiple security layers
- **Role-Based Access Control (RBAC)** with granular permissions
- **Advanced security features** including 2FA, account lockout, and audit logging
- **Multi-school support** with proper data isolation
- **Pakistani-specific features** including phone verification and CNIC validation
- **Scalability considerations** for 500,000+ students
- **Comprehensive API specifications** for implementation
- **Database schema additions** for enhanced functionality
- **Step-by-step implementation plan** spanning 14 weeks

The architecture follows industry best practices, OWASP security guidelines, and is designed to meet the unique requirements of Pakistani educational institutions.

---

**Document Status:** ✅ Ready for Implementation
**Next Steps:** Review with stakeholders, allocate resources, begin Phase 1 implementation

---

*This document is part of the Pakistani School Management System architecture documentation.*
*For questions or clarifications, contact the development team.*
