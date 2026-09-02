import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  if (token && !req.url.includes('/api/auth/')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error) => {
    if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/') && !req.url.includes('/api/public/')) {        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/signin']);
      }
      return throwError(() => error);
    })
  );
};