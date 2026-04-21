# Theme Module

A comprehensive theme management system for NestJS applications with support for color palettes, light/dark modes, presets, and CSS generation.

## Features

- ✅ Complete color palette management with shades (50-950)
- ✅ Light and dark theme configurations
- ✅ Theme presets support
- ✅ CSV/JSON export functionality
- ✅ Theme validation and preview
- ✅ Usage statistics and analytics
- ✅ Clone existing themes
- ✅ SuperAdmin-only management
- ✅ Public theme access for active themes

## Structure

```
theme/
├── controllers/
│   └── theme.controller.ts       # REST API endpoints
├── services/
│   └── theme.service.ts          # Business logic (extends BaseService)
├── schema/
│   └── theme.schema.ts           # Mongoose schema
├── dtos/
│   ├── color-palette.dto.ts      # Color palette validation
│   ├── theme-config.dto.ts       # Theme configuration validation
│   ├── create-theme.dto.ts       # Create theme DTO
│   ├── update-theme.dto.ts       # Update theme DTO
│   ├── theme-preset.dto.ts       # Theme preset DTO
│   ├── theme-settings.dto.ts     # Theme settings DTO
│   ├── preview-theme.dto.ts      # Preview theme DTO
│   └── index.ts                  # Export all DTOs
└── theme.module.ts               # Module definition
```

## API Endpoints

### Public Routes (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/theme/active` | Get currently active theme |
| POST | `/api/v1/theme/preview` | Preview theme without saving |
| POST | `/api/v1/theme/validate` | Validate theme data |

### Authenticated Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/theme` | Get all themes (with pagination) |
| GET | `/api/v1/theme/:id` | Get specific theme by ID |
| GET | `/api/v1/theme/:id/export?format=json\|css&mode=light\|dark\|both` | Export theme |

### SuperAdmin Only Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/theme` | Create new theme |
| PUT | `/api/v1/theme/:id` | Update existing theme |
| DELETE | `/api/v1/theme/:id` | Delete theme |
| POST | `/api/v1/theme/import` | Import theme from JSON |
| PATCH | `/api/v1/theme/:id/activate` | Activate theme |
| PATCH | `/api/v1/theme/:id/default` | Set theme as default |
| POST | `/api/v1/theme/:id/clone` | Clone existing theme |
| GET | `/api/v1/theme/admin/stats` | Get theme statistics |

## Usage Examples

### Create a Theme

```typescript
POST /api/v1/theme
{
  "name": "Ocean Blue",
  "description": "A beautiful ocean-inspired theme",
  "version": "1.0.0",
  "colorPalette": {
    "primary": {
      "50": "#f0f9ff",
      "100": "#e0f2fe",
      // ... more shades
      "950": "#082f49"
    },
    "secondary": { /* ... */ },
    "neutral": { /* ... */ },
    "success": { "50": "#f0fdf4", "500": "#22c55e", "600": "#16a34a", "700": "#15803d" },
    "warning": { /* ... */ },
    "error": { /* ... */ },
    "info": { /* ... */ }
  },
  "lightTheme": {
    "background": {
      "primary": "#ffffff",
      "secondary": "#f8f9fa",
      "tertiary": "#e9ecef"
    },
    "foreground": {
      "primary": "#212529",
      "secondary": "#495057",
      "muted": "#6c757d"
    },
    "border": {
      "default": "#dee2e6",
      "muted": "#e9ecef",
      "strong": "#adb5bd"
    },
    "surface": {
      "default": "#ffffff",
      "elevated": "#f8f9fa",
      "overlay": "rgba(0, 0, 0, 0.5)"
    },
    "interactive": {
      "primary": "#0ea5e9",
      "primaryHover": "#0284c7",
      "primaryActive": "#0369a1",
      "secondary": "#6c757d",
      "secondaryHover": "#5a6268",
      "secondaryActive": "#545b62"
    }
  },
  "darkTheme": { /* similar structure */ }
}
```

### Get Active Theme (Public)

```typescript
GET /api/v1/theme/active

Response:
{
  "message": "Active theme retrieved successfully",
  "data": { /* theme object */ }
}
```

### Preview Theme (Public)

```typescript
POST /api/v1/theme/preview
{
  "colorPalette": { /* ... */ },
  "lightTheme": { /* ... */ },
  "darkTheme": { /* ... */ },
  "mode": "both"
}

Response:
{
  "message": "Theme preview generated successfully",
  "data": {
    "css": ":root { /* CSS variables */ }\n.dark { /* dark mode variables */ }",
    "preview": { /* theme data */ }
  }
}
```

### Export Theme

```typescript
// Export as JSON
GET /api/v1/theme/:id/export?format=json

// Export as CSS
GET /api/v1/theme/:id/export?format=css&mode=both
```

### Activate Theme (SuperAdmin)

```typescript
PATCH /api/v1/theme/:id/activate

Response:
{
  "message": "Theme activated successfully",
  "data": { /* theme object */ }
}
```

## Schema Features

### Pre-save Middleware
- Automatically ensures only one active theme
- Automatically ensures only one default theme

### Indexes
- `isActive` and `isDefault` for fast queries
- `createdBy` for user-based filtering
- `metadata.lastUsed` for sorting by usage
- `presets.isDefault` for preset queries

### Metadata Tracking
- Export count
- Usage count
- Last used timestamp

## Service Methods

The `ThemeService` extends `BaseService` and provides:

- `createTheme(dto, userId)` - Create with user tracking
- `updateTheme(id, dto, userId)` - Update with user tracking
- `getThemeById(id)` - Get with usage tracking
- `getAllThemes(query)` - Get all with pagination
- `getActiveTheme()` - Get currently active theme
- `getDefaultTheme()` - Get default theme
- `activateTheme(id)` - Activate a theme
- `setDefaultTheme(id)` - Set as default
- `deleteTheme(id)` - Delete with validation
- `cloneTheme(id, userId)` - Clone existing theme
- `exportThemeAsJson(id)` - Export as JSON
- `exportThemeAsCSS(id, mode)` - Export as CSS
- `importTheme(data, userId)` - Import from JSON
- `getThemeStats()` - Get usage statistics
- `validateThemeData(data)` - Validate theme
- `previewTheme(data)` - Preview without saving

## Integration

The module is automatically imported in `AppModule`:

```typescript
import { ThemeModule } from './modules/theme/theme.module';

@Module({
  imports: [
    // ...
    ThemeModule,
  ],
})
export class AppModule {}
```

## Notes

- All hex colors are validated with regex pattern
- SuperAdmin role required for management operations
- Active theme cannot be deleted
- Default theme cannot be deleted
- Only one theme can be active at a time
- Only one theme can be default at a time
