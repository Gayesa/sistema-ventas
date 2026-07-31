import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getRole();
  const path = route.routeConfig?.path;

  // Basic RBAC (Role Based Access Control)
  const isAdminPath = path === 'admin';
  const isPosPath = path === 'pos';

  const allowedAdminRoles = ['ADMIN', 'SUPER_ADMIN', 'ADMIN_TIENDA'];
  const allowedPosRoles = ['VENDEDOR', 'ADMIN', 'ADMIN_TIENDA'];

  if (isAdminPath && !allowedAdminRoles.includes(role || '')) {
    return router.createUrlTree(['/pos/caja']);
  }

  if (isPosPath && !allowedPosRoles.includes(role || '')) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
