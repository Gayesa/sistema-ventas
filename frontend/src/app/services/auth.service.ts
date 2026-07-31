import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<{ role: string, token: string, name: string, empresa_id?: string, empresa_nombre?: string, empresa_documento?: string, empresa_logo?: string } | null>(null);
  private API_URL = `${environment.apiUrl}/super-admin`;

  constructor(private router: Router, private http: HttpClient) {
    this.checkSession();
  }

  checkSession() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    let empresa_id = localStorage.getItem('empresa_id');
    const empresa_nombre = localStorage.getItem('empresa_nombre');
    const empresa_documento = localStorage.getItem('empresa_documento');
    const empresa_logo = localStorage.getItem('empresa_logo');

    // FIX: Force remove any residual empresa_id for SUPER_ADMIN to avoid 401 Unauthorized errors
    if (role === 'SUPER_ADMIN' && empresa_id) {
      localStorage.removeItem('empresa_id');
      empresa_id = null;
    }

    if (token && role && name) {
      this.currentUser.set({ role, token, name, empresa_id: empresa_id || undefined, empresa_nombre: empresa_nombre || undefined, empresa_documento: empresa_documento || undefined, empresa_logo: empresa_logo || undefined });
    }
  }

  login(credentials: { email: string, pass: string }): Observable<boolean> {
    // All authentication goes through the backend — no hardcoded credentials
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        if (response && response.success) {
          const session = { 
            role: response.role, 
            token: response.token, 
            name: response.name,
            empresa_id: response.empresa_id,
            empresa_nombre: response.empresa_nombre,
            empresa_documento: response.empresa_documento,
            empresa_logo: response.empresa_logo
          };
          this.setSession(session);
          
          if (response.role === 'VENDEDOR') {
            this.router.navigate(['/pos/caja']);
          } else {
            this.router.navigate(['/admin/dashboard']);
          }
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('Error en login:', err);
        return of(false);
      })
    );
  }

  private setSession(session: any) {
    localStorage.setItem('token', session.token);
    localStorage.setItem('role', session.role);
    localStorage.setItem('name', session.name);
    
    if (session.empresa_id) {
      localStorage.setItem('empresa_id', session.empresa_id);
    } else {
      localStorage.removeItem('empresa_id');
    }
    
    if (session.empresa_nombre) {
      localStorage.setItem('empresa_nombre', session.empresa_nombre);
    } else {
      localStorage.removeItem('empresa_nombre');
    }
    
    if (session.empresa_documento) {
      localStorage.setItem('empresa_documento', session.empresa_documento);
    } else {
      localStorage.removeItem('empresa_documento');
    }
    
    if (session.empresa_logo) {
      localStorage.setItem('empresa_logo', session.empresa_logo);
    } else {
      localStorage.removeItem('empresa_logo');
    }
    
    this.currentUser.set(session);
  }

  logout() {
    localStorage.clear();
    this.currentUser.set(null);
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}

