import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getUser();
  if (auth.isLoggedIn() && user) {
    router.navigate([auth.redirectionParRole(user.role)]);
    return false;
  }
  return true;
};