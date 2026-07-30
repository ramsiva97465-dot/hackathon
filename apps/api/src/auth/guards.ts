import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { auth } from './better-auth'

// ─── Custom Decorators ────────────────────────────────────────────────────────

export const PERMISSIONS_KEY = 'permissions'
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions)

// ─── Types & Matrices ─────────────────────────────────────────────────────────

export type Permission =
  | 'SETTINGS_MANAGE'
  | 'APPLICATIONS_REVIEW'
  | 'JUDGES_EMAILS_MANAGE'
  | 'LEADERBOARD_ADMIN'
  | 'EVALUATIONS_SUBMIT'
  | 'ASSIGNED_TEAMS_VIEW'

const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'SETTINGS_MANAGE',
    'APPLICATIONS_REVIEW',
    'JUDGES_EMAILS_MANAGE',
    'LEADERBOARD_ADMIN',
  ],
  ADMIN: [
    'SETTINGS_MANAGE', // Added so Admin can resolve help requests and update bonus points
    'APPLICATIONS_REVIEW',
    'JUDGES_EMAILS_MANAGE',
    'LEADERBOARD_ADMIN',
  ],
  JUDGE: [
    'EVALUATIONS_SUBMIT',
    'ASSIGNED_TEAMS_VIEW',
  ],
}

// ─── Guards ──────────────────────────────────────────────────────────────────

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    
    // Parse better-auth session from request headers
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      throw new UnauthorizedException('Session invalid or expired')
    }

    request.user = session.user
    request.session = session.session
    return true
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no permission metadata is set, allow access (defaults to authenticated check)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.role) {
      throw new UnauthorizedException('Session user role is missing')
    }

    const permissions = rolePermissions[user.role] ?? []
    
    // Check if user has ALL of the required permissions (or ANY depending on choice, let's require ANY of them)
    const hasPermission = requiredPermissions.some((p) => permissions.includes(p))

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to access this resource')
    }

    return true
  }
}
