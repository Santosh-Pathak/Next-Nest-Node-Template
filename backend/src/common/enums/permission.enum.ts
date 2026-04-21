/**
 * Permission-based access control
 * Define granular permissions for specific features/actions
 */
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Profile Management
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',

  // File Management
  FILE_UPLOAD = 'file:upload',
  FILE_DELETE = 'file:delete',
  FILE_READ = 'file:read',

  // Auth Management
  AUTH_MANAGE_TOKENS = 'auth:manage-tokens',
  AUTH_VERIFY_EMAIL = 'auth:verify-email',

  // Admin Features
  ADMIN_ACCESS = 'admin:access',
  ADMIN_SETTINGS = 'admin:settings',
}

// Map roles to their default permissions
import { Role } from './role.enum';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Super Admin - Full system access
  [Role.SUPER_ADMIN]: Object.values(Permission),

  // Admin - Administrative operations
  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_LIST,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
    Permission.FILE_READ,
    Permission.AUTH_MANAGE_TOKENS,
    Permission.ADMIN_ACCESS,
  ],

  // Developer - Development and user management
  [Role.DEVELOPER]: [
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.FILE_UPLOAD,
    Permission.FILE_READ,
    Permission.AUTH_VERIFY_EMAIL,
  ],
};

// Export as Map for efficient lookups (similar to roleRights pattern)
export const roleRights = new Map(Object.entries(ROLE_PERMISSIONS));

// Get permissions for a specific role
export function getRolePermissions(role: Role): Permission[] {
  return roleRights.get(role) || [];
}

/**
 * Check if a role has any of the required permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if a role has all of the required permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every((permission) => rolePermissions.includes(permission));
}
