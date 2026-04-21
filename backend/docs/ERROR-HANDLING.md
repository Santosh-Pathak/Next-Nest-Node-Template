# Error Handling Architecture

## Overview

This application uses **NestJS built-in exception handling** with a global exception filter. You **DO NOT** need `catchAsync` wrappers like in Express.js.

## Architecture

### 1. Global Exception Filter

**Location:** `src/common/filters/all-exceptions.filter.ts`

Automatically catches ALL errors from:
- Controllers
- Services
- Guards
- Interceptors
- Pipes

**Handles:**
- ✅ Custom `AppError` - Operational errors
- ✅ `HttpException` - NestJS exceptions
- ✅ Mongoose errors (CastError, ValidationError)
- ✅ MongoDB errors (duplicate keys)
- ✅ JWT errors (invalid/expired tokens)
- ✅ Unexpected errors

**Configuration:**
```typescript
// app.module.ts
{
  provide: APP_FILTER,
  useClass: AllExceptionsFilter,
}
```

### 2. Custom AppError

**Location:** `src/common/errors/app-error.ts`

For throwing operational errors with proper status codes:

```typescript
throw new AppError('User not found', HttpStatus.NOT_FOUND);
throw new AppError('Email already exists', HttpStatus.CONFLICT);
```

### 3. NestJS Built-in Exceptions

Use NestJS exceptions for common cases:

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

throw new UnauthorizedException('Invalid credentials');
throw new NotFoundException('User not found');
throw new ConflictException('Email already registered');
```

## Error Handling Patterns

### ❌ WRONG (Express.js style - DON'T USE)

```typescript
// DON'T use catchAsync wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// DON'T wrap controllers
@Get()
async getUsers() {
  try {
    return await this.usersService.findAll();
  } catch (error) {
    throw error; // Unnecessary
  }
}
```

### ✅ CORRECT (NestJS style - PRODUCTION READY)

```typescript
// Controllers - NO try/catch needed
@Get()
async getUsers() {
  return await this.usersService.findAll();
  // Errors automatically caught by AllExceptionsFilter
}

@Post('login')
async login(@Body() loginDto: LoginDto) {
  const user = await this.authService.login(loginDto);
  // If error thrown, AllExceptionsFilter handles it
  return { user };
}

// Services - Throw errors directly
async findUserById(id: string) {
  const user = await this.userModel.findById(id);
  
  if (!user) {
    throw new NotFoundException('User not found');
  }
  
  return user;
}
```

### ✅ When to Use try/catch

**Only use try/catch for:**

1. **Error transformation**
```typescript
async uploadFile(file: Express.Multer.File) {
  try {
    return await this.azureService.upload(file);
  } catch (error) {
    // Transform Azure error to user-friendly message
    throw new BadRequestException('File upload failed. Please try again');
  }
}
```

2. **Cleanup operations**
```typescript
async processPayment(data: PaymentDto) {
  const transaction = await this.db.startTransaction();
  
  try {
    await this.chargeCard(data);
    await this.updateOrder(data);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback(); // Cleanup
    throw error; // Re-throw for AllExceptionsFilter
  }
}
```

3. **Non-critical operations**
```typescript
async sendEmail(email: string) {
  try {
    await this.emailService.send(email);
  } catch (error) {
    // Don't fail request if email fails
    this.logger.error('Email failed:', error);
  }
}
```

## Error Response Format

### Development Environment
```json
{
  "status": "error",
  "message": "User not found",
  "timestamp": "2025-12-03T23:30:00.000Z",
  "path": "/api/v1/users/123",
  "error": { /* full error object */ },
  "stack": "Error: User not found\n    at ..."
}
```

### Production Environment
```json
{
  "status": "fail",
  "message": "User not found",
  "timestamp": "2025-12-03T23:30:00.000Z",
  "path": "/api/v1/users/123"
}
```

## Validation Errors

**Automatic validation** via `class-validator`:

```typescript
// DTO
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Request with invalid data automatically returns:
{
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ]
}
```

## Best Practices

### ✅ DO

1. **Throw errors directly** - Let AllExceptionsFilter handle them
2. **Use specific exceptions** - `NotFoundException`, `UnauthorizedException`, etc.
3. **Provide clear messages** - "User not found" > "Error occurred"
4. **Use appropriate status codes** - 400, 401, 403, 404, 409, 500
5. **Log errors properly** - Use NestJS Logger

### ❌ DON'T

1. **Don't wrap controllers in try/catch** - NestJS handles it
2. **Don't use catchAsync** - Not needed in NestJS
3. **Don't return errors in response** - Throw them
4. **Don't expose sensitive data** - Stack traces only in development
5. **Don't use console.log** - Use Logger

## Error Hierarchy

```
Exception
├── HttpException (NestJS)
│   ├── BadRequestException (400)
│   ├── UnauthorizedException (401)
│   ├── ForbiddenException (403)
│   ├── NotFoundException (404)
│   ├── ConflictException (409)
│   └── InternalServerErrorException (500)
├── AppError (Custom)
│   └── Operational errors with custom status codes
└── UnhandledException
    └── Caught by AllExceptionsFilter
```

## Monitoring & Logging

All errors are logged with:
- ✅ Request method & URL
- ✅ Status code
- ✅ Error message
- ✅ Timestamp
- ✅ Stack trace (development only)

```typescript
// Logs appear as:
[ERROR] POST /api/v1/auth/login - Invalid credentials
[ERROR] GET /api/v1/users/invalid-id - Invalid ID format
```

## Testing Error Handling

```typescript
describe('AuthController', () => {
  it('should throw UnauthorizedException for invalid credentials', async () => {
    await expect(
      controller.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

## Summary

**Your current error handling is production-ready!**

- ✅ No `catchAsync` needed - NestJS handles async errors automatically
- ✅ Global exception filter catches all errors
- ✅ Proper error transformation and logging
- ✅ Environment-aware error responses
- ✅ Validation errors handled automatically
- ✅ Clean controller code without try/catch clutter

**Continue using your current pattern - it's the NestJS best practice!**
