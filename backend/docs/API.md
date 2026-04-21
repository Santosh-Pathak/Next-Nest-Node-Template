# API Usage Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Users Endpoints

### Create User
```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "+1234567890"
}
```

### Get All Users (with query features)
```http
GET /users?page=1&limit=10&sort=-createdAt&search=john&searchFields=["name","email"]
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 100)
- `sort` - Sort fields (prefix with `-` for descending)
- `fields` - Select specific fields
- `search` - Search term
- `searchFields` - Fields to search in (JSON array string)

**Filtering:**
```http
GET /users?role=admin&isActive=true
GET /users?createdAt[gte]=2024-01-01
```

**Response:**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "results": 10,
    "limit": 10,
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

### Get User by ID
```http
GET /users/:id
```

### Update User
```http
PATCH /users/:id
Content-Type: application/json

{
  "name": "John Updated",
  "isActive": false
}
```

### Delete User
```http
DELETE /users/:id
```

## Advanced Query Examples

### Pagination
```http
GET /users?page=2&limit=20
```

### Sorting
```http
# Single field ascending
GET /users?sort=name

# Single field descending
GET /users?sort=-createdAt

# Multiple fields
GET /users?sort=role,-createdAt
```

### Field Selection
```http
# Select specific fields
GET /users?fields=name,email,role

# Exclude fields (use -)
GET /users?fields=-password,-__v
```

### Filtering with Operators
```http
# Greater than or equal
GET /users?age[gte]=18

# Less than
GET /users?age[lt]=65

# Range query
GET /users?createdAt[gte]=2024-01-01&createdAt[lte]=2024-12-31

# Multiple filters
GET /users?role=admin&isActive=true
```

### Search
```http
# Search in specific fields
GET /users?search=john&searchFields=["name","email"]

# The search supports:
# - String fields: case-insensitive regex
# - Number fields: exact match
# - Boolean fields: true/false parsing
# - ObjectId fields: exact ObjectId match
```

### Complex Query
```http
GET /users?page=1&limit=10&sort=-createdAt&role=user&isActive=true&search=john&searchFields=["name","email"]&fields=name,email,role,createdAt
```

## Error Responses

### Validation Error
```json
{
  "status": "fail",
  "message": "Validation error message",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

### Not Found
```json
{
  "status": "fail",
  "message": "Document not found with that ID",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "path": "/api/v1/users/123"
}
```

### Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (Delete)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/v1/docs
```

This provides:
- Complete endpoint listing
- Request/response schemas
- Try-it-out functionality
- Model definitions
