import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[];
  const user = auth.getUser();

  if (!user || !allowedRoles.includes(user.role)) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};