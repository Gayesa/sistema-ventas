import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <!-- Toast Notification -->
    <div *ngIf="toastMessage" class="fixed top-24 right-6 z-[200] animate-fade-in-down">
      <div [class]="'px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ' + 
        (toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800')">
        <svg *ngIf="toastType === 'success'" class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <svg *ngIf="toastType === 'error'" class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-bold text-sm">{{ toastMessage }}</span>
      </div>
    </div>

    <div class="space-y-6 animate-fade-in-up">

      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Vendedores</h1>
          <p class="text-sm text-slate-500 mt-1">Gestiona los accesos y cajeros de tu empresa</p>
        </div>
        <button (click)="abrirModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Nuevo Vendedor
        </button>
      </div>

      <!-- Controles de Tabla -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Buscador -->
        <div class="relative w-full md:w-72">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" placeholder="Buscar por nombre, email o rol..." class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm">
        </div>
        
        <!-- Mostrar Registros -->
        <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-sm font-medium text-slate-500">Mostrar</span>
          <select [(ngModel)]="itemsPerPage" (ngModelChange)="currentPage = 1" class="border-none bg-transparent py-1 pl-2 pr-6 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>
          <span class="text-sm font-medium text-slate-500">registros</span>
        </div>
      </div>

      <!-- Tabla de Vendedores -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <th class="p-4">Nombre</th>
                <th class="p-4">Email</th>
                <th class="p-4">Rol</th>
                <th class="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let vendedor of getVendedoresPaginados()" class="hover:bg-slate-50/50 transition-colors">
                <td class="p-4 font-bold text-slate-800">{{ vendedor.nombre }}</td>
                <td class="p-4 text-slate-600">{{ vendedor.email }}</td>
                <td class="p-4">
                  <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">{{ vendedor.rol }}</span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="editarVendedor(vendedor)" class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button (click)="eliminarVendedor(vendedor.id)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="getVendedoresPaginados().length === 0">
                <td colspan="4" class="p-8 text-center text-slate-500">
                  No se encontraron vendedores que coincidan con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 gap-4">
          <span class="text-sm text-slate-500 font-medium">
            Mostrando <span class="font-bold text-slate-700">{{ getPaginacionTexto() }}</span> de <span class="font-bold text-slate-700">{{ getVendedoresFiltrados().length }}</span> registros
          </span>
          <div class="flex items-center gap-2">
            <button (click)="cambiarPagina(currentPage - 1)" [disabled]="currentPage === 1" class="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <div class="flex items-center gap-1 hidden sm:flex">
               <button *ngFor="let page of getPaginas()" (click)="cambiarPagina(page)" [class.bg-indigo-600]="currentPage === page" [class.text-white]="currentPage === page" [class.shadow-md]="currentPage === page" [class.bg-white]="currentPage !== page" [class.text-slate-600]="currentPage !== page" [class.hover:bg-slate-100]="currentPage !== page" class="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-sm font-bold transition-all">
                 {{ page }}
               </button>
            </div>
            <button (click)="cambiarPagina(currentPage + 1)" [disabled]="currentPage === totalPages" class="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar -->
    <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 class="text-xl font-bold text-slate-800">{{ esEdicion ? 'Editar' : 'Nuevo' }} Vendedor</h3>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form [formGroup]="vendedorForm" (ngSubmit)="guardarVendedor()" class="p-6 flex-1 overflow-y-auto space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1.5">Nombre <span class="text-rose-500">*</span></label>
              <input formControlName="nombre" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm outline-none bg-slate-50 focus:bg-white" placeholder="Ej. Juan Pérez">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1.5">Email (Usuario) <span class="text-rose-500">*</span></label>
              <input formControlName="email" type="email" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm outline-none bg-slate-50 focus:bg-white" placeholder="Ej. juan@empresa.com">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1.5">Contraseña {{ !esEdicion ? '*' : '(Opcional)' }}</label>
              <input formControlName="password" type="password" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm outline-none bg-slate-50 focus:bg-white" placeholder="••••••••">
              <p *ngIf="esEdicion" class="text-xs text-slate-500 mt-1">Déjalo en blanco si no deseas cambiarla.</p>
            </div>
            <div class="pt-4 flex gap-3">
              <button type="button" (click)="cerrarModal()" class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm">Cancelar</button>
              <button type="submit" [disabled]="vendedorForm.invalid || isSubmitting" class="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm text-sm flex justify-center items-center gap-2">
                <svg *ngIf="isSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ esEdicion ? 'Actualizar' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    <!-- Modal Confirmación Eliminar -->
    <div *ngIf="mostrarModalEliminar" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col animate-fade-in-up">
          <div class="p-6 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">¿Eliminar Vendedor?</h3>
            <p class="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer. El vendedor perderá el acceso al sistema inmediatamente.</p>
            
            <div class="flex gap-3 w-full">
              <button (click)="cancelarEliminacion()" class="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button (click)="confirmarEliminacion()" class="flex-1 px-4 py-2.5 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
  `
})
export class VendedoresComponent implements OnInit {
  vendedores: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  mostrarModal = false;
  esEdicion = false;
  isSubmitting = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  vendedorIdEnEdicion: string | null = null;
  vendedorForm: FormGroup;
  
  // Modal Eliminación
  mostrarModalEliminar = false;
  vendedorAEliminarId: string | null = null;

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.vendedorForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.cargarVendedores();
  }

  cargarVendedores() {
    this.http.get<any[]>(`${environment.apiUrl}/vendedores`).subscribe({
      next: (data) => {
        this.vendedores = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando vendedores', err);
      }
    });
  }

  abrirModal() {
    this.esEdicion = false;
    this.vendedorIdEnEdicion = null;
    this.vendedorForm.reset();
    this.vendedorForm.get('password')?.setValidators(Validators.required);
    this.vendedorForm.get('password')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  editarVendedor(vendedor: any) {
    this.esEdicion = true;
    this.vendedorIdEnEdicion = vendedor.id;
    this.vendedorForm.reset({
      nombre: vendedor.nombre,
      email: vendedor.email,
      password: ''
    });
    this.vendedorForm.get('password')?.clearValidators();
    this.vendedorForm.get('password')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarVendedor() {
    if (this.vendedorForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const data = this.vendedorForm.value;
    if (this.esEdicion && !data.password) {
      delete data.password; // No actualizar si está vacío
    }

    if (this.esEdicion) {
      this.http.put(`${environment.apiUrl}/vendedores/${this.vendedorIdEnEdicion}`, data).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.mostrarToast('Vendedor actualizado con éxito', 'success');
          this.cargarVendedores();
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          let errorMsg = 'Error al actualizar el vendedor';
          if (err.error?.message) errorMsg = err.error.message;
          this.mostrarToast(errorMsg, 'error');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/vendedores`, data).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.mostrarToast('Vendedor registrado con éxito', 'success');
          this.cargarVendedores();
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          let errorMsg = 'Error al registrar el vendedor';
          if (err.error?.message) errorMsg = typeof err.error.message === 'string' ? err.error.message : JSON.stringify(err.error.message);
          this.mostrarToast(errorMsg, 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  eliminarVendedor(id: string) {
    this.vendedorAEliminarId = id;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminacion() {
    this.mostrarModalEliminar = false;
    this.vendedorAEliminarId = null;
  }

  confirmarEliminacion() {
    if (this.vendedorAEliminarId) {
      this.http.delete(`${environment.apiUrl}/vendedores/${this.vendedorAEliminarId}`).subscribe({
        next: () => {
          this.mostrarToast('Vendedor eliminado con éxito', 'success');
          this.cargarVendedores();
          this.cancelarEliminacion();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.mostrarToast('Error al eliminar el vendedor', 'error');
          this.cancelarEliminacion();
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- MÉTODOS DE TABLA (FILTRADO Y PAGINACIÓN) ---
  getVendedoresFiltrados() {
    let filtrado = this.vendedores;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtrado = filtrado.filter(v => 
        (v.nombre && v.nombre.toLowerCase().includes(term)) || 
        (v.email && v.email.toLowerCase().includes(term)) ||
        (v.rol && v.rol.toLowerCase().includes(term))
      );
    }
    return filtrado;
  }

  getVendedoresPaginados() {
    const filtrados = this.getVendedoresFiltrados();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtrados.slice(startIndex, startIndex + Number(this.itemsPerPage));
  }

  get totalPages(): number {
    return Math.ceil(this.getVendedoresFiltrados().length / this.itemsPerPage) || 1;
  }

  getPaginas(): number[] {
    const total = this.totalPages;
    // Mostrar hasta 5 páginas para no desbordar
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPaginacionTexto(): string {
    const total = this.getVendedoresFiltrados().length;
    if (total === 0) return '0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    return `${start} a ${end}`;
  }
}
