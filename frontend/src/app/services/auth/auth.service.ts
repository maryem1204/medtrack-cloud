import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ROLE_PERMISSIONS, Role, Module, Action } from '../../config/permissions.config';

export interface LoginResponse { token: string; nom: string; prenom: string; role: string; id: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${API_BASE_URL}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, motDePasse: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, motDePasse }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/signin']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getUser(): LoginResponse | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
  isLoggedIn(): boolean { return !!this.getToken(); }
    redirectionParRole(role: string): string {
    const routes: Record<string, string> = {
      ADMIN: '/dashboard',
      COMMERCIAL: '/espace-client',
      TECHNICIEN: '/espace-client',
      CLIENT: '/espace-client',
    };
    return routes[role] || '/dashboard';
  }
  hasPermission(module: Module, action: Action): boolean {
  const role = this.getUser()?.role as Role | null; 
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.[module]?.includes(action) ?? false;
}

forgotPassword(email: string, recaptchaToken: string) {
  return this.http.post(`${this.apiUrl}/forgot-password`, {
    email,
    recaptchaToken
  });
}
  verifyToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-token/${token}`);
  }
  setPassword(token: string, motDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/set-password`, { token, motDePasse });
  }
  
}