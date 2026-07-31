import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ConfiguracionAtributosComponent } from '../configuracion-atributos/configuracion-atributos.component';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-mi-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfiguracionAtributosComponent],
  templateUrl: './mi-empresa.component.html',
})
export class MiEmpresaComponent implements OnInit {
  empresaForm!: FormGroup;
  companyLogo: string = '';
  isSaving: boolean = false;
  savedSuccessfully: boolean = false;
  saveError: string = '';

  constructor(
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.empresaForm = this.fb.group({
      razonSocial: ['', Validators.required],
      nit: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      correo: ['', Validators.email]
    });

    this.cargarDatosEmpresa();
  }

  cargarDatosEmpresa() {
    const user = this.authService.currentUser();
    if (user && user.empresa_id) {
      this.http.get<any>(`${environment.apiUrl}/empresa/${user.empresa_id}`).subscribe({
        next: (empresa) => {
          this.empresaForm.patchValue({
            razonSocial: empresa.nombre || '',
            nit: empresa.documento || '',
            telefono: empresa.telefono || '',
            direccion: empresa.direccion || '',
            correo: empresa.correo || ''
          });
          if (empresa.logo) {
            this.companyLogo = empresa.logo;
          } else {
            const logoName = encodeURIComponent(empresa.nombre || 'Mi Empresa');
            this.companyLogo = `https://ui-avatars.com/api/?name=${logoName}&background=EBF4FF&color=3B82F6&size=128&font-size=0.33`;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error fetching empresa:', err)
      });
    } else if (user && user.empresa_nombre) {
       this.empresaForm.patchValue({
         razonSocial: user.empresa_nombre || '',
         nit: user.empresa_documento || ''
       });
       const logoName = encodeURIComponent(user.empresa_nombre || 'Mi Empresa');
       this.companyLogo = `https://ui-avatars.com/api/?name=${logoName}&background=EBF4FF&color=3B82F6&size=128&font-size=0.33`;
       this.cdr.detectChanges();
    } else {
      // Fallback
      this.empresaForm.patchValue({
        razonSocial: 'Tecnología Global S.A.S',
        nit: '900.123.456-7'
      });
      this.companyLogo = 'https://ui-avatars.com/api/?name=Tecnologia+Global&background=EBF4FF&color=3B82F6&size=128&font-size=0.33';
      this.cdr.detectChanges();
    }
  }

  onLogoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogo = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    if (this.empresaForm.invalid) return;
    
    this.isSaving = true;
    this.savedSuccessfully = false;
    this.saveError = '';
    this.cdr.detectChanges();

    const user = this.authService.currentUser();
    if (!user || !user.empresa_id) {
      this.isSaving = false;
      return;
    }

    const payload = {
      nombre: this.empresaForm.value.razonSocial,
      documento: this.empresaForm.value.nit,
      telefono: this.empresaForm.value.telefono,
      direccion: this.empresaForm.value.direccion,
      correo: this.empresaForm.value.correo,
      logo: this.companyLogo
    };

    this.http.put(`${environment.apiUrl}/empresa/${user.empresa_id}`, payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res && res.success) {
          this.savedSuccessfully = true;
          // Update localStorage
          localStorage.setItem('empresa_nombre', payload.nombre);
          if (payload.logo) {
            localStorage.setItem('empresa_logo', payload.logo);
          }
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.savedSuccessfully = false;
            this.cdr.detectChanges();
          }, 3000);
        } else {
          this.saveError = res.message || 'Error desconocido al guardar';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error saving:', err);
        this.isSaving = false;
        this.saveError = 'Error de conexión. Intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }
}
