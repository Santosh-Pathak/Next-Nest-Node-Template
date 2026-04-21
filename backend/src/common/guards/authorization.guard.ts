import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  ROLES_KEY,
  PERMISSIONS_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from '../decorators/authorization.decorator';
import { Role, hasAnyRole } from '../enums/role.enum';
import { Permission, hasAnyPermission, hasAllPermissions } from '../enums/permission.enum';

/**
 * Unified Authorization Guard
 *
 * This guard combines JWT authentication, role-based access control (RBAC),
 * and permission-based access control (PBAC) into a single, optimized guard.
 *
 * Features:
 * - JWT token validation
 * - Public route support (@Public decorator)
 * - Role-based access control (@Roles decorator)
 * - Permission-based access control (@RequirePermissions decorator)
 * - Hierarchical permission checking
 * - Efficient metadata reflection
 *
 * Usage:
 * - Apply globally in app.module.ts (APP_GUARD)
 * - Use @Public() for routes that don't require authentication
 * - Use @Roles() for role-based restrictions
 * - Use @RequirePermissions() for fine-grained access control
 */
@Injectable()
export class AuthorizationGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(AuthorizationGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Verify JWT token
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 3. Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 4. Check role-based access
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = hasAnyRole(user.role, requiredRoles);

      if (!hasRole) {
        this.logger.warn(
          `Access denied for user ${user.userId} with role ${user.role}. Required roles: ${requiredRoles.join(', ')}`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`,
        );
      }
    }

    // 5. Check permission-based access
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions && requiredPermissions.length > 0) {
      const requireAll = this.reflector.getAllAndOverride<boolean>(REQUIRE_ALL_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      const hasAccess = requireAll
        ? hasAllPermissions(user.role, requiredPermissions)
        : hasAnyPermission(user.role, requiredPermissions);

      if (!hasAccess) {
        this.logger.warn(
          `Access denied for user ${user.userId} with role ${user.role}. Required permissions: ${requiredPermissions.join(', ')}`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(requireAll ? ' and ' : ' or ')}`,
        );
      }
    }

    return true;
  }

  handleRequest<TUser = Express.User>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
