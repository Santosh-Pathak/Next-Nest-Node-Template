import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

// Metadata keys
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

/**
 * Mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Require specific roles to access this route
 * User must have at least one of the specified roles
 * @param roles - Array of acceptable roles
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Require specific permissions to access this route
 * By default, user needs ANY of the specified permissions
 * Use @RequireAllPermissions() to require ALL permissions
 * @param permissions - Array of required permissions
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * When used with @RequirePermissions(), user must have ALL specified permissions
 * instead of just ANY permission
 */
export const RequireAllPermissions = () => SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, true);

/**
 * Shorthand decorators for common role combinations
 */
export const SuperAdminOnly = () => Roles(Role.SUPER_ADMIN);
export const AdminOnly = () => Roles(Role.SUPER_ADMIN, Role.ADMIN);
export const AdminAndDeveloper = () => Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DEVELOPER);
export const AdminAndSuperAdmin = () => Roles(Role.SUPER_ADMIN, Role.ADMIN);
