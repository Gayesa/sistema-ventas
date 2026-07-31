import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly cls: ClsService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token inválido');
    }

    // ── Verify JWT cryptographically ──
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado. Inicia sesión nuevamente.');
      }
      throw new UnauthorizedException('Token inválido o corrupto');
    }

    // Extract the validated empresa_id and rol from the verified JWT payload
    const empresaIdFromToken = payload.empresa_id;

    // Set the empresa_id in the CLS context from the TOKEN (authoritative source)
    // This is the authoritative source of truth for multi-tenant isolation.
    if (empresaIdFromToken) {
      this.cls.set('empresa_id', empresaIdFromToken);
    }

    // Attach full user info to request (from verified JWT, not headers)
    request.user = {
      sub: payload.sub,
      empresa_id: empresaIdFromToken,
      rol: payload.rol,
    };

    return true;
  }
}

