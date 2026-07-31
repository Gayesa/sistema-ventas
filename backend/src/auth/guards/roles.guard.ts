import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // If no roles are defined on the route, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // SECURITY: Read role from the verified JWT payload (set by JwtAuthGuard)
    // Never trust client-sent headers for authorization decisions.
    const userRole = request.user?.rol;

    if (!userRole) {
      throw new ForbiddenException('Rol de usuario no proporcionado en el token');
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Acceso denegado. Se requiere uno de los roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

