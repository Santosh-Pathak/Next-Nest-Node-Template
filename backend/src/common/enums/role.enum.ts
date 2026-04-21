export enum Role {
  SUPER_ADMIN = 'superAdmin',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 3,
  [Role.ADMIN]: 2,
  [Role.DEVELOPER]: 1,
};

// Export roles array for validation
export const roles = Object.values(Role);

// Check if a value is a valid role
export function isValidRole(value: string): value is Role {
  return roles.includes(value as Role);
}

/**
 * Check if a user role has sufficient permissions
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient permissions
 */
export function hasRolePermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has any of the required roles
 * @param userRole - The user's current role
 * @param requiredRoles - Array of acceptable roles
 * @returns true if user has any of the required roles
 */
export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}
