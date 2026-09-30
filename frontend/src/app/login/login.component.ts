import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email: string = '';
  pass: string = '';
  error: string = '';

  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    this.error = '';
    const emailTrimmed = (this.email || '').trim();
    const passTrimmed = (this.pass || '').trim();

    if (!emailTrimmed || !passTrimmed) {
      this.error = 'Por favor ingresa correo y contraseña.';
      this.cdr.detectChanges();
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.authService.login({ email: emailTrimmed, password: passTrimmed }).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.error = res.message || 'Credenciales inválidas o acceso denegado.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'Ocurrió un error al intentar iniciar sesión.';
        this.cdr.detectChanges();
      }
    });
  }
}
