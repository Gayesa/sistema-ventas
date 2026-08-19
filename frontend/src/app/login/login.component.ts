import { Component } from '@angular/core';
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

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.error = '';
    const emailTrimmed = (this.email || '').trim();
    const passTrimmed = (this.pass || '').trim();

    if (!emailTrimmed || !passTrimmed) {
      this.error = 'Por favor ingresa correo y contraseña.';
      return;
    }
    
    this.loading = true;
    this.authService.login({ email: emailTrimmed, password: passTrimmed }).subscribe({
      next: (success) => {
        this.loading = false;
        if (!success) {
          this.error = 'Credenciales inválidas o acceso denegado.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Ocurrió un error al intentar iniciar sesión.';
      }
    });
  }
}
