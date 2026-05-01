import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { APP_ROUTES } from '../constants/app-routes';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getUser();
  const requiredRole = route.data?.['role'];

  if (!user) {
    return router.createUrlTree([APP_ROUTES.LOGIN]);
  }

  if (requiredRole && user.role !== requiredRole) {
    return router.createUrlTree([APP_ROUTES.AFTER_AUTH.USER]);
  }

  return true;
};
