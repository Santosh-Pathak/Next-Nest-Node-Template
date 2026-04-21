# Authentication Module

A comprehensive authentication system for NestJS with JWT tokens, OTP verification, password reset, and role-based access control.

## Features

### 🔐 Authentication
- **User Signup** - Register new users with email and password
- **User Login** - Authenticate users with email and password
- **JWT Tokens** - Access and refresh token mechanism
- **Token Refresh** - Refresh expired access tokens
- **Logout** - Blacklist tokens on logout

### 👤 User Management
- **Admin User Registration** - Create users with system-generated passwords
- **Profile Management** - View and update user profile
- **Password Management** - Update password for logged-in users
- **Role-Based Access** - Support for customer, staff, admin, and superAdmin roles

### 📧 Email Verification
- **Send Verification Email** - Send OTP for email verification
- **Verify Email** - Confirm email with OTP
- **OTP Expiration** - 10-minute expiration for security

### 🔑 Password Reset
- **Forget Password** - Request password reset via email
- **Verify OTP** - Verify OTP before password reset
- **Reset Password** - Set new password after OTP verification
- **Email Confirmation** - Send confirmation email after successful reset

## API Endpoints

### Public Routes (No Authentication Required)

#### POST /auth/signup
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

#### POST /auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /auth/refresh
Refresh access token
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/logout
Logout user (blacklist refresh token)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/send-verification-email
Send verification email with OTP
```json
{
  "email": "john@example.com"
}
```

#### POST /auth/verify-email
Verify email with OTP
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST /auth/forget-password
Request password reset
```json
{
  "email": "john@example.com"
}
```

#### POST /auth/verify-otp
Verify OTP for password reset
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST /auth/reset-password
Reset password
```json
{
  "email": "john@example.com",
  "password": "newPassword123"
}
```

### Protected Routes (Authentication Required)

#### POST /auth/register-user (Admin/SuperAdmin only)
Register user with system-generated password
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "staff",
  "description": "Customer support specialist"
}
```

#### GET /auth/profile
Get current user profile
```
Authorization: Bearer {accessToken}
```

#### PATCH /auth/profile
Update user profile
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

#### PATCH /auth/update-password
Update password for logged-in user
```json
{
  "currentPassword": "oldPassword123",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

## Architecture

### Services

#### AuthService
Core authentication logic
- User validation
- Login/Signup
- Password management
- User registration

#### TokenService
JWT token management
- Generate access/refresh tokens
- Token blacklisting
- Token validation
- Token cleanup

#### OtpService
OTP generation and verification
- Generate 6-digit OTP
- Email OTP management
- OTP expiration (10 minutes)
- Automatic cleanup via TTL

#### EmailService
Email delivery
- Verification emails
- Password reset emails
- Welcome emails
- System password emails

### Guards

#### JwtAuthGuard
Validates JWT access tokens and checks if blacklisted

#### JwtRefreshGuard
Validates JWT refresh tokens

#### LocalAuthGuard
Validates user credentials (email/password)

#### RolesGuard
Enforces role-based access control

### Strategies

#### JwtStrategy
Passport strategy for JWT validation

#### JwtRefreshStrategy
Passport strategy for refresh token validation

#### LocalStrategy
Passport strategy for local authentication

### Decorators

#### @Public()
Mark routes as public (skip JWT authentication)

#### @Roles(...roles)
Specify required roles for route access

#### @GetUser()
Extract user data from request

## Database Schemas

### Token Schema
```typescript
{
  token: string          // Token ID (JTI)
  user: ObjectId         // User reference
  type: TokenType        // ACCESS, REFRESH, RESET_PASSWORD, VERIFY_EMAIL
  expires: Date          // Expiration date
  blacklisted: boolean   // Blacklist status
}
```

### OTP Schema
```typescript
{
  email: string          // User email
  otp: string           // 6-digit OTP
  expiresIn: Date       // Expiration date
}
```

### Updated User Schema
```typescript
{
  name: string
  email: string
  password: string
  role: string          // customer, staff, admin, superAdmin
  isActive: boolean
  isEmailVerified: boolean
  phone?: string
  photo?: string
  description?: string
  lastLogin?: Date
}
```

## Security Features

### Token Management
- Access tokens expire in 1 hour (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens stored with unique JTI (JWT ID)
- Token blacklisting on logout
- Automatic token cleanup via TTL indexes

### Password Security
- Bcrypt hashing with salt rounds (10)
- Minimum password length: 8 characters
- Password confirmation required for updates
- System-generated passwords for admin-created users

### OTP Security
- 6-digit random OTP
- 10-minute expiration
- One-time use (deleted after verification)
- Automatic cleanup of expired OTPs

### Role-Based Access Control
- Global JWT guard (all routes protected by default)
- Public routes marked with @Public() decorator
- Role-specific access with @Roles() decorator
- Four user roles: customer, staff, admin, superAdmin

## Configuration

Required environment variables in `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com
```

## Email Templates

The module includes professionally designed HTML email templates for:
- Email verification
- Password reset
- Password reset confirmation
- System-generated password delivery

## Error Handling

All endpoints return consistent error responses:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

Common status codes:
- 200: Success
- 204: No Content (logout)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (email already exists)

## Usage Examples

### Authentication Flow

1. **User Signup**
```bash
POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

2. **Verify Email** (Optional)
```bash
POST /auth/send-verification-email
{ "email": "john@example.com" }

POST /auth/verify-email
{ "email": "john@example.com", "otp": "123456" }
```

3. **Login**
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

4. **Access Protected Routes**
```bash
GET /auth/profile
Authorization: Bearer {accessToken}
```

5. **Refresh Token**
```bash
POST /auth/refresh
{ "refreshToken": "..." }
```

6. **Logout**
```bash
POST /auth/logout
{ "refreshToken": "..." }
```

### Password Reset Flow

1. **Request Reset**
```bash
POST /auth/forget-password
{ "email": "john@example.com" }
```

2. **Verify OTP**
```bash
POST /auth/verify-otp
{ "email": "john@example.com", "otp": "123456" }
```

3. **Reset Password**
```bash
POST /auth/reset-password
{
  "email": "john@example.com",
  "password": "newPassword123"
}
```

## Testing

The authentication system is production-ready with:
- Input validation using class-validator
- Comprehensive error handling
- Secure password hashing
- Token blacklisting
- Email delivery (with fallback logging)
- MongoDB TTL indexes for automatic cleanup

## Notes

- All routes are protected by default (global JwtAuthGuard)
- Use @Public() decorator for public routes
- Use @Roles() decorator for role-based access
- Email service logs messages if SMTP is not configured
- Passwords are never returned in API responses
- All tokens are automatically cleaned up when expired
