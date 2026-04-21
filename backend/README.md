# Mail Service Backend - NestJS

A production-level NestJS backend application with MongoDB, featuring proper project structure, linting, testing, and Git hooks.

## 🚀 Features

- **NestJS Framework** - Progressive Node.js framework
- **MongoDB & Mongoose** - Database with ODM
- **TypeScript** - Type-safe development
- **Validation** - Class-validator and class-transformer
- **API Documentation** - Swagger/OpenAPI
- **Linting & Formatting** - ESLint and Prettier
- **Git Hooks** - Husky with lint-staged and commitlint
- **Testing** - Jest for unit and e2e tests
- **Security** - Helmet, CORS, compression
- **Environment Configuration** - Joi validation
- **Generic CRUD Factory** - Reusable service with pagination, filtering, search
- **Global Error Handling** - Comprehensive error filter
- **Response Interceptor** - Standardized API responses

## 📁 Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
│
├── config/                          # Configuration
│   ├── configuration.ts             # Configuration factory
│   ├── validation.ts                # Environment validation schema
│   └── configuration.module.ts     # Configuration module
│
├── common/                          # Common utilities
│   ├── interceptors/
│   │   └── transform-response.interceptor.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── api-pagination.decorator.ts
│   ├── errors/
│   │   └── app-error.ts
│   └── constants.ts
│
├── modules/                         # Feature modules
│   └── users/
│       ├── controllers/
│       │   └── users.controller.ts
│       ├── dtos/
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       ├── entities/
│       │   └── user.entity.ts
│       ├── services/
│       │   └── users.service.ts
│       └── users.module.ts
│
├── database/                        # Database configuration
│   ├── database.module.ts
│   └── mongoose.config.ts
│
├── shared/                          # Shared utilities
│   ├── utils/
│   │   ├── api-features.ts         # Advanced query features
│   │   ├── report-generator.ts     # PDF/CSV generation
│   │   ├── date.utils.ts
│   │   ├── string.utils.ts
│   │   └── validation.utils.ts
│   ├── services/
│   │   └── base.service.ts         # Generic CRUD service
│   └── response/
│       └── response.interface.ts
│
└── test/                            # Test files
    ├── unit/
    └── app.e2e-spec.ts
```

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mail-service
JWT_SECRET=your-secret-key
# ... other variables
```

4. **Initialize Husky**
```bash
npm run prepare
```

## 🚀 Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🔍 Linting & Formatting

### Lint Code
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npm run format
```

## 📦 API Features

### Generic CRUD Factory

The `BaseService` provides reusable CRUD operations:

```typescript
export class UsersService extends BaseService<UserDocument> {
  constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
    super(userModel);
  }
}
```

### Advanced Query Features

The API supports powerful querying:

**Pagination**
```
GET /users?page=1&limit=10
```

**Sorting**
```
GET /users?sort=-createdAt,name
```

**Field Selection**
```
GET /users?fields=name,email
```

**Filtering**
```
GET /users?role=admin&isActive=true
GET /users?age[gte]=18&age[lte]=65
```

**Search**
```
GET /users?search=john&searchFields=["name","email"]
```

### Response Format

All API responses follow a standard format:

**Success Response**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "results": 10,
    "limit": 100,
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 450
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Response**
```json
{
  "status": "fail",
  "message": "Validation error",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT secret key | Required |
| `API_PREFIX` | API route prefix | `api/v1` |

## 📚 API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api/v1/docs
```

## 🎯 Git Commit Convention

This project uses conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
perf: performance improvements
test: add tests
build: build system changes
ci: CI configuration changes
chore: other changes
```

## 🔧 Utilities

### Report Generation

Generate PDF or CSV reports:

```typescript
import { downloadReport } from '@shared/utils/report-generator';

const report = await downloadReport({
  model: UserModel,
  condition: { isActive: true },
  format: 'pdf',
  fields: ['name', 'email', 'createdAt'],
  heading: 'Active Users Report',
});
```

### Date Utilities

```typescript
import { formatDateTime, addDays } from '@shared/utils/date.utils';

const formatted = formatDateTime(new Date());
const futureDate = addDays(new Date(), 7);
```

### String Utilities

```typescript
import { slugify, generateOTP, maskEmail } from '@shared/utils/string.utils';

const slug = slugify('Hello World'); // 'hello-world'
const otp = generateOTP(6); // '123456'
const masked = maskEmail('john@example.com'); // 'j**n@example.com'
```

## 📄 License

MIT

## 👥 Author

Your Name

---

**Happy Coding! 🚀**