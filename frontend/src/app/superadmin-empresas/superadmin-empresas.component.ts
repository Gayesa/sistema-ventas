import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

export interface Empresa {
  id?: string;
  nombre: string;
  documento: string;
  is_active?: boolean;
  fecha_vencimiento?: Date;
  // added for info
  emailPropietario?: string;
  nombrePropietario?: string;
  fecha_creacion?: Date;
  administradores?: any[];
  telefono?: string;
  direccion?: string;
  correo?: string;
  logo?: string;
}

@Component({
  selector: 'app-superadmin-empresas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Gestión de Inquilinos (Empresas)</h2>
          <p class="text-textSecondary text-sm mt-1">Administra los inquilinos y sus suscripciones.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative">
            <svg class="w-5 h-5 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" [(ngModel)]="searchTerm" (input)="filterEmpresas()" placeholder="Buscar empresa o NIT..." class="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white w-64">
          </div>
          <div class="flex items-center gap-2 mr-4">
            <button (click)="exportarExcel()" class="bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" title="Exportar a Excel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Excel
            </button>
            <button (click)="exportarPDF()" class="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" title="Exportar a PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF
            </button>
          </div>
          <button (click)="abrirModal()" class="bg-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nueva Empresa
          </button>
        </div>
      </div>

      <!-- Tabla de Empresas -->
      <div class="bg-surface rounded-xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm text-textSecondary uppercase tracking-wider">
              <th class="p-4 font-medium">Empresa</th>
              <th class="p-4 font-medium">NIT / RUT</th>
              <th class="p-4 font-medium">Creación</th>
              <th class="p-4 font-medium">Vencimiento</th>
              <th class="p-4 font-medium">
                Estado
                <select [(ngModel)]="filterEstado" (change)="filterEmpresas()" class="ml-2 border border-slate-200 rounded text-xs bg-white font-normal text-textMain px-1 py-0.5">
                  <option value="">Todos</option>
                  <option value="activa">Activa</option>
                  <option value="vencida">Vencida</option>
                </select>
              </th>
              <th class="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let emp of paginatedEmpresas" class="hover:bg-slate-50/50 transition-colors group">
              <td class="p-4 font-medium text-textMain">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">{{ emp.nombre.charAt(0) }}</div>
                  {{ emp.nombre }}
                </div>
              </td>
              <td class="p-4 text-textSecondary text-sm">{{ emp.documento }}</td>
              <td class="p-4 text-textSecondary text-sm">{{ emp.fecha_creacion ? (emp.fecha_creacion | date:'dd/MMM/yyyy') : 'N/A' }}</td>
              <td class="p-4 text-textSecondary text-sm font-medium">{{ emp.fecha_vencimiento | date:'dd/MMM/yyyy' }}</td>
              <td class="p-4">
                <span *ngIf="emp.is_active" class="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200">Activa</span>
                <span *ngIf="!emp.is_active" class="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-200">Vencida</span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button (click)="abrirModalInfo(emp)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip-trigger" title="Ver Información">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                  <button (click)="abrirHistorialModal(emp)" class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors tooltip-trigger" title="Historial de Pagos">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                  <button (click)="editarEmpresa(emp)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Editar Empresa">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button (click)="eliminarEmpresa(emp)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger" title="Eliminar Empresa">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <button (click)="iniciarRenovacion(emp)" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip-trigger" title="Renovar Suscripción">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="paginatedEmpresas.length === 0">
              <td colspan="5" class="p-8 text-center text-textSecondary">
                No se encontraron empresas registradas.
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Paginación -->
        <div class="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-textSecondary">Mostrar</span>
              <select [(ngModel)]="pageSize" (change)="changePageSize()" class="border border-slate-200 rounded-lg text-sm px-2 py-1 focus:ring-primary focus:border-primary bg-white">
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
              </select>
            </div>
            <p class="text-sm text-textSecondary hidden sm:block">
              Mostrando <span class="font-medium">{{ filteredEmpresas.length > 0 ? startIndex + 1 : 0 }}</span> a <span class="font-medium">{{ endIndex }}</span> de <span class="font-medium">{{ filteredEmpresas.length }}</span> resultados
            </p>
          </div>
          <div class="flex items-center">
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="previousPage()" [disabled]="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-200 bg-white text-sm font-medium text-textSecondary hover:bg-slate-50 disabled:opacity-50">
                  <span class="sr-only">Anterior</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-200 bg-white text-sm font-medium text-textSecondary hover:bg-slate-50 disabled:opacity-50">
                  <span class="sr-only">Siguiente</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </nav>
            </div>
          </div>
        </div>

      <!-- Modal de Creación / Edición -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
            <h3 class="text-lg font-bold text-textMain">{{ modoEdicion ? 'Editar Empresa y Administrador' : 'Nueva Empresa y Administrador' }}</h3>
            <button (click)="cerrarModal()" class="text-textSecondary hover:text-textMain">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form [formGroup]="empresaForm" (ngSubmit)="guardar()" class="p-6 overflow-y-auto max-h-[80vh]">
            <div class="space-y-6">
              
              <!-- SECCION 1: EMPRESA Y LOGO -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Datos Empresa -->
                <div class="col-span-1 lg:col-span-8">
                  <h4 class="text-sm font-bold text-primary uppercase tracking-wider mb-3">1. Datos de la Empresa</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-textMain mb-1">Nombre (Razón Social)</label>
                      <input formControlName="nombreEmpresa" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-textMain mb-1">NIT / RUT</label>
                      <input formControlName="documentoEmpresa" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-textMain mb-1">Teléfono</label>
                      <input formControlName="telefono" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-textMain mb-1">Dirección</label>
                      <input formControlName="direccion" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-textMain mb-1">Correo Corporativo</label>
                      <input formControlName="correo" type="email" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                    </div>
                    
                    <div class="flex gap-4 sm:col-span-2 mt-2">
                      <div class="flex-1">
                        <label class="block text-sm font-medium text-textMain mb-1">Activar desde (Opcional)</label>
                        <input formControlName="fechaActivacion" type="date" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                      </div>
                      <div class="flex-1" *ngIf="modoEdicion">
                        <label class="block text-sm font-medium text-textMain mb-1">Estado</label>
                        <div class="flex items-center gap-2 mt-2">
                          <input formControlName="isActive" type="checkbox" id="estadoEmpresa" class="w-5 h-5 text-primary focus:ring-primary rounded border-slate-300">
                          <label for="estadoEmpresa" class="text-sm text-textSecondary font-medium select-none cursor-pointer">Suscripción Activa</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Logo -->
                <div class="col-span-1 lg:col-span-4">
                  <h4 class="text-sm font-bold text-primary uppercase tracking-wider mb-3">Logotipo</h4>
                  <div class="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 relative group overflow-hidden h-[240px]">
                    <input type="file" (change)="onLogoSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                    <div *ngIf="!logoPreview" class="text-center">
                      <div class="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-primary transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <p class="text-sm font-medium text-textMain mb-1">Subir logotipo</p>
                      <p class="text-xs text-textSecondary px-2">PNG, JPG hasta 2MB.<br>Haz clic o arrastra aquí.</p>
                    </div>
                    <div *ngIf="logoPreview" class="w-full h-full flex flex-col items-center justify-center">
                      <img [src]="logoPreview" alt="Logo preview" class="max-w-full max-h-[140px] object-contain mb-3 drop-shadow-sm rounded">
                      <p class="text-xs font-medium text-primary bg-indigo-50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Cambiar imagen</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECCION 2: ADMINISTRADOR -->
              <div class="pt-6 border-t border-slate-100">
                <div *ngIf="modoEdicion && empresaSeleccionada?.administradores?.length" class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <h5 class="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">Selecciona el Administrador a Editar:</h5>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div *ngFor="let adm of empresaSeleccionada?.administradores; let i = index" 
                         (click)="seleccionarAdminParaEditar(adm, i)"
                         class="p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between"
                         [ngClass]="{'border-primary bg-indigo-50 shadow-sm ring-1 ring-primary': adminEditandoIndex === i, 'border-slate-200 bg-white hover:border-slate-300': adminEditandoIndex !== i}">
                      <div class="flex flex-col overflow-hidden">
                        <span class="font-bold text-sm truncate" [ngClass]="{'text-primary': adminEditandoIndex === i, 'text-textMain': adminEditandoIndex !== i}">{{ adm.nombre }}</span>
                        <span class="text-xs text-textSecondary truncate">{{ adm.email }}</span>
                      </div>
                      <svg *ngIf="adminEditandoIndex === i" class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                </div>

                <h4 class="text-sm font-bold text-primary uppercase tracking-wider mb-4">{{ modoEdicion ? '2. Editar Datos del Administrador' : '2. Cuenta del Administrador Principal' }}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-textMain mb-1">Nombre Completo</label>
                    <input formControlName="nombrePropietario" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-textMain mb-1">Correo Electrónico (Login)</label>
                    <input formControlName="emailPropietario" type="email" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                  </div>
                  <div *ngIf="!modoEdicion">
                    <label class="block text-sm font-medium text-textMain mb-1">Contraseña</label>
                    <input formControlName="passwordPropietario" type="password" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                  </div>
                  <div *ngIf="modoEdicion">
                    <label class="block text-sm font-medium text-textMain mb-1">Nueva Contraseña <span class="text-xs text-textSecondary font-normal">(Opcional)</span></label>
                    <input formControlName="passwordPropietario" type="password" class="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50">
                  </div>
                </div>
              </div>

              <!-- SECCION 3: AÑADIR ADMIN -->
              <div class="pt-6 border-t border-slate-100" *ngIf="modoEdicion">
                <div class="flex items-center gap-2 mb-4">
                  <input formControlName="agregarAdminAdicional" type="checkbox" id="addAdmin" class="w-5 h-5 text-primary focus:ring-primary rounded border-slate-300">
                  <label for="addAdmin" class="text-sm font-bold text-primary uppercase tracking-wider select-none cursor-pointer">3. Añadir Administrador Adicional</label>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200" *ngIf="empresaForm.get('agregarAdminAdicional')?.value">
                  <div>
                    <label class="block text-sm font-medium text-textMain mb-1">Nombre</label>
                    <input formControlName="nuevoAdminNombre" type="text" class="w-full border border-slate-200 rounded-lg px-4 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-textMain mb-1">Correo</label>
                    <input formControlName="nuevoAdminEmail" type="email" class="w-full border border-slate-200 rounded-lg px-4 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-textMain mb-1">Contraseña</label>
                    <input formControlName="nuevoAdminPassword" type="password" class="w-full border border-slate-200 rounded-lg px-4 py-2">
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
              <button type="button" (click)="cerrarModal()" class="px-5 py-2.5 text-textMain bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancelar</button>
              <button type="submit" [disabled]="empresaForm.invalid" class="px-5 py-2.5 text-white bg-primary hover:bg-indigo-600 disabled:opacity-50 rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200">{{ modoEdicion ? 'Guardar Cambios' : 'Crear Empresa' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Información -->
      <div *ngIf="mostrarInfoModal && empresaSeleccionada" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md my-8">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 class="text-lg font-bold text-textMain">Detalles del Inquilino</h3>
            <button (click)="cerrarModalInfo()" class="text-textSecondary hover:text-textMain">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">{{ empresaSeleccionada.nombre.charAt(0) }}</div>
                <div>
                  <h4 class="font-bold text-textMain">{{ empresaSeleccionada.nombre }}</h4>
                  <p class="text-sm text-textSecondary">NIT: {{ empresaSeleccionada.documento }}</p>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-slate-200 pb-2">
                  <span class="text-textSecondary">Estado:</span>
                  <span *ngIf="empresaSeleccionada.is_active" class="text-green-600 font-semibold">Activa</span>
                  <span *ngIf="!empresaSeleccionada.is_active" class="text-red-600 font-semibold">Vencida</span>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-2 pt-1">
                  <span class="text-textSecondary">Vencimiento:</span>
                  <span class="font-medium text-textMain">{{ empresaSeleccionada.fecha_vencimiento | date:'longDate' }}</span>
                </div>
                <div class="pt-3 border-t border-slate-200 mt-2">
                  <span class="text-textSecondary font-bold mb-2 block text-xs uppercase">Todos los Administradores:</span>
                  <div *ngFor="let adm of empresaSeleccionada.administradores" class="bg-white p-2 rounded-lg border border-slate-200 mb-2 shadow-sm flex flex-col">
                    <span class="font-bold text-textMain text-sm">{{ adm.nombre }}</span>
                    <span class="text-xs text-textSecondary">{{ adm.email }}</span>
                  </div>
                  <div *ngIf="!empresaSeleccionada.administradores?.length" class="text-sm text-textSecondary italic">
                     No hay administradores adicionales
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="cerrarModalInfo()" class="px-4 py-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg font-medium">Aceptar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Renovación -->
      <div *ngIf="mostrarRenovarModal && empresaSeleccionada" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm my-8 animate-fade-in-up">
          <div class="p-6 text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-textMain mb-2">Confirmar Renovación</h3>
            <p class="text-textSecondary text-sm mb-6">
              ¿Deseas agregar 30 días a la suscripción de <span class="font-bold text-textMain">{{ empresaSeleccionada.nombre }}</span>?
            </p>
            <div class="flex flex-col gap-2">
              <button (click)="confirmarRenovacion()" class="w-full px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors shadow-sm">
                Sí, Renovar Ahora
              </button>
              <button (click)="cerrarRenovacion()" class="w-full px-4 py-2.5 text-textMain bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Historial Pagos -->
      <div *ngIf="mostrarHistorialModal && empresaSeleccionada" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-2xl my-8">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 class="text-lg font-bold text-textMain">Historial de Pagos: {{ empresaSeleccionada.nombre }}</h3>
            <div class="flex items-center gap-4">
              <div class="relative">
                <svg class="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" [(ngModel)]="searchPagoTerm" (input)="filterPagos()" placeholder="Buscar referencia..." class="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white w-48">
              </div>
              <button (click)="cerrarHistorialModal()" class="text-textSecondary hover:text-textMain">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
          <div class="p-0 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs text-textSecondary uppercase tracking-wider">
                  <th class="p-4 font-medium">Fecha</th>
                  <th class="p-4 font-medium">
                    Método
                    <select [(ngModel)]="filterMetodo" (change)="filterPagos()" class="ml-2 border border-slate-200 rounded text-xs bg-white font-normal text-textMain px-1 py-0.5">
                      <option value="">Todos</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </th>
                  <th class="p-4 font-medium">Referencia</th>
                  <th class="p-4 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let pago of paginatedPagos" class="hover:bg-slate-50 transition-colors">
                  <td class="p-4 text-textMain text-sm">{{ pago.fecha_pago | date:'dd/MMM/yyyy HH:mm' }}</td>
                  <td class="p-4 text-textSecondary text-sm">
                    <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">{{ pago.metodo_pago || 'General' }}</span>
                  </td>
                  <td class="p-4 text-textSecondary text-sm font-mono">{{ pago.referencia || 'N/A' }}</td>
                  <td class="p-4 text-textMain text-sm font-bold text-right">{{ pago.monto | currency:'COP':'symbol':'1.0-0' }}</td>
                </tr>
                <tr *ngIf="historialPagos.length === 0">
                  <td colspan="4" class="p-8 text-center text-textSecondary">
                    No hay registros de pagos para esta empresa.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Paginación Pagos -->
          <div class="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6 rounded-b-2xl">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-textSecondary">Mostrar</span>
                <select [(ngModel)]="pagosPageSize" (change)="changePagosPageSize()" class="border border-slate-200 rounded-lg text-sm px-2 py-1 focus:ring-primary focus:border-primary bg-white">
                  <option [ngValue]="5">5</option>
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="20">20</option>
                </select>
              </div>
              <p class="text-sm text-textSecondary hidden sm:block">
                Mostrando <span class="font-medium">{{ filteredHistorialPagos.length > 0 ? startPagosIndex + 1 : 0 }}</span> a <span class="font-medium">{{ endPagosIndex }}</span> de <span class="font-medium">{{ filteredHistorialPagos.length }}</span>
              </p>
            </div>
            <div class="flex items-center">
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button (click)="previousPagosPage()" [disabled]="pagosCurrentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-200 bg-white text-sm font-medium text-textSecondary hover:bg-slate-50 disabled:opacity-50">
                    <span class="sr-only">Anterior</span>
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button (click)="nextPagosPage()" [disabled]="pagosCurrentPage === totalPagosPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-200 bg-white text-sm font-medium text-textSecondary hover:bg-slate-50 disabled:opacity-50">
                    <span class="sr-only">Siguiente</span>
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Confirmación de Eliminación -->
      <div *ngIf="mostrarConfirmarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h3 class="text-lg font-bold text-center text-textMain mb-2">Eliminar Inquilino</h3>
          <p class="text-textSecondary text-center text-sm mb-6">¿Estás súper seguro que deseas ELIMINAR la empresa <span class="font-bold text-textMain">{{ empresaAEliminar?.nombre }}</span> y todos sus usuarios? Esta acción no se puede deshacer.</p>
          <div class="flex gap-3 justify-center">
            <button (click)="cancelarEliminacion()" class="px-5 py-2.5 rounded-xl border border-slate-200 text-textMain font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
            <button (click)="confirmarEliminacion()" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-sm">Sí, Eliminar</button>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoTxt }}</span>
      </div>
      <div *ngIf="mostrarMensajeError" class="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeErrorTxt }}</span>
      </div>
    </div>
  `
})
export class SuperadminEmpresasComponent implements OnInit {
  empresasList: Empresa[] = [];
  filteredEmpresas: Empresa[] = [];
  
  // Paginación
  currentPage = 1;
  pageSize = 10;
  filterEstado = '';
  
  // Modales y Estados
  mostrarModal = false;
  mostrarInfoModal = false;
  mostrarRenovarModal = false;
  mostrarHistorialModal = false;
  mostrarConfirmarModal = false;
  empresaAEliminar: Empresa | null = null;
  empresaSeleccionada: Empresa | null = null;
  historialPagos: any[] = [];
  filteredHistorialPagos: any[] = [];
  searchPagoTerm = '';
  pagosCurrentPage = 1;
  pagosPageSize = 5;
  filterMetodo = '';
  
  // Toasts
  mostrarMensajeExito = false;
  mostrarMensajeError = false;
  mensajeExitoTxt = '';
  mensajeErrorTxt = '';
  
  // Formulario
  empresaForm: FormGroup;
  searchTerm = '';
  logoPreview: string | ArrayBuffer | null = null;
  
  private readonly API_URL = `${environment.apiUrl}/super-admin`;

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef, private exportService: ExportService) {
    this.empresaForm = this.fb.group({
      nombreEmpresa: ['', Validators.required],
      documentoEmpresa: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      correo: [''],
      logo: [''],
      fechaActivacion: [''],
      isActive: [false],
      nombrePropietario: ['', Validators.required],
      emailPropietario: ['', [Validators.required, Validators.email]],
      passwordPropietario: ['', [Validators.required, Validators.minLength(6)]],
      agregarAdminAdicional: [false],
      nuevoAdminNombre: [''],
      nuevoAdminEmail: [''],
      nuevoAdminPassword: ['']
    });
  }

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.http.get<Empresa[]>(`${this.API_URL}/empresas`).subscribe({
      next: (data) => {
        this.actualizarEstado(data);
      },
      error: (err) => {
        console.error('Error cargando empresas:', err);
        this.mostrarError('No se pudieron cargar las empresas.');
      }
    });
  }

  actualizarEstado(data: any[]) {
    const ahora = new Date();
    this.empresasList = data.map(emp => {
      const rawDate = emp.fecha_vencimiento_suscripcion || emp.fecha_vencimiento;
      let v = new Date(rawDate);
      
      // Fallback si la fecha es inválida para evitar que el DatePipe crashee la fila
      if (isNaN(v.getTime())) {
        v = new Date(0); // Fecha muy antigua para que sea "Vencida" pero no rompa el UI
      }
      
      return { ...emp, fecha_vencimiento: v, is_active: v > ahora };
    });
    this.filterEmpresas();
    this.cdr.detectChanges();
  }

  filterEmpresas() {
    let source = this.empresasList;
    
    if (this.filterEstado) {
      const isActive = this.filterEstado === 'activa';
      source = source.filter(emp => emp.is_active === isActive);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      source = source.filter(emp => 
        emp.nombre.toLowerCase().includes(term) || 
        (emp.documento && emp.documento.toLowerCase().includes(term)) ||
        (emp.fecha_creacion && emp.fecha_creacion.toString().toLowerCase().includes(term)) ||
        (emp.fecha_vencimiento && emp.fecha_vencimiento.toString().toLowerCase().includes(term))
      );
    }
    this.filteredEmpresas = source;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get paginatedEmpresas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmpresas.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredEmpresas.length / this.pageSize) || 1;
  }

  get startIndex() {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex() {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredEmpresas.length ? this.filteredEmpresas.length : end;
  }

  changePageSize() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // --- PAGINACIÓN HISTORIAL DE PAGOS ---
  filterPagos() {
    let source = this.historialPagos;
    
    if (this.filterMetodo) {
      source = source.filter(pago => (pago.metodo_pago || '').toLowerCase() === this.filterMetodo.toLowerCase());
    }

    if (this.searchPagoTerm) {
      const term = this.searchPagoTerm.toLowerCase();
      source = source.filter(pago => 
        (pago.referencia || '').toLowerCase().includes(term) || 
        (pago.metodo_pago || '').toLowerCase().includes(term) ||
        (pago.monto || '').toString().includes(term) ||
        (pago.fecha_pago || '').toString().toLowerCase().includes(term)
      );
    }

    this.filteredHistorialPagos = source;
    this.pagosCurrentPage = 1;
    this.cdr.detectChanges();
  }

  get paginatedPagos() {
    const start = (this.pagosCurrentPage - 1) * this.pagosPageSize;
    return this.filteredHistorialPagos.slice(start, start + this.pagosPageSize);
  }

  get totalPagosPages() {
    return Math.ceil(this.filteredHistorialPagos.length / this.pagosPageSize) || 1;
  }

  get startPagosIndex() {
    return (this.pagosCurrentPage - 1) * this.pagosPageSize;
  }

  get endPagosIndex() {
    const end = this.pagosCurrentPage * this.pagosPageSize;
    return end > this.filteredHistorialPagos.length ? this.filteredHistorialPagos.length : end;
  }

  changePagosPageSize() {
    this.pagosCurrentPage = 1;
    this.cdr.detectChanges();
  }

  nextPagosPage() {
    if (this.pagosCurrentPage < this.totalPagosPages) this.pagosCurrentPage++;
  }

  previousPagosPage() {
    if (this.pagosCurrentPage > 1) this.pagosCurrentPage--;
  }

  modoEdicion = false;
  empresaIdEditando: string | null = null;
  adminIdEditando: string | null = null;
  adminEditandoIndex: number = 0;

  abrirModalInfo(emp: Empresa) {
    this.empresaSeleccionada = emp;
    this.mostrarInfoModal = true;
  }

  cerrarModalInfo() {
    this.mostrarInfoModal = false;
    this.empresaSeleccionada = null;
  }

  editarEmpresa(emp: Empresa) {
    this.modoEdicion = true;
    this.empresaIdEditando = emp.id || null;
    this.empresaSeleccionada = emp;
    
    this.adminIdEditando = emp.administradores && emp.administradores.length > 0 ? emp.administradores[0].id : null;
    this.adminEditandoIndex = 0;

    this.logoPreview = emp.logo || null;
    this.empresaForm.patchValue({
      nombreEmpresa: emp.nombre,
      documentoEmpresa: emp.documento,
      telefono: emp.telefono || '',
      direccion: emp.direccion || '',
      correo: emp.correo || '',
      logo: emp.logo || '',
      fechaActivacion: '',
      isActive: emp.is_active || false,
      nombrePropietario: emp.administradores && emp.administradores.length > 0 ? emp.administradores[0].nombre : (emp.nombrePropietario || ''),
      emailPropietario: emp.administradores && emp.administradores.length > 0 ? emp.administradores[0].email : (emp.emailPropietario || ''),
      passwordPropietario: '',
      agregarAdminAdicional: false,
      nuevoAdminNombre: '',
      nuevoAdminEmail: '',
      nuevoAdminPassword: ''
    });
    this.empresaForm.get('passwordPropietario')?.clearValidators();
    this.empresaForm.get('passwordPropietario')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  eliminarEmpresa(emp: Empresa) {
    this.empresaAEliminar = emp;
    this.mostrarConfirmarModal = true;
  }

  cancelarEliminacion() {
    this.mostrarConfirmarModal = false;
    this.empresaAEliminar = null;
  }

  confirmarEliminacion() {
    if (this.empresaAEliminar && this.empresaAEliminar.id) {
      this.http.delete(`${this.API_URL}/empresas/${this.empresaAEliminar.id}`).subscribe({
        next: () => {
          this.empresasList = this.empresasList.filter(e => e.id !== this.empresaAEliminar!.id);
          this.filterEmpresas();
          this.mostrarExito('Empresa y todos sus datos eliminados con éxito.');
          this.cancelarEliminacion();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.mostrarError('Error al eliminar la empresa. Inténtalo de nuevo.');
          this.cancelarEliminacion();
        }
      });
    }
  }

  iniciarRenovacion(emp: Empresa) {
    if (!emp.id || !emp.fecha_vencimiento) return;
    const ahora = new Date();
    const vencimiento = new Date(emp.fecha_vencimiento);

    if (vencimiento > ahora) {
      const diffTime = Math.abs(vencimiento.getTime() - ahora.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.mostrarError(`La suscripción de ${emp.nombre} aún está vigente. Faltan ${diffDays} días para que pueda ser renovada.`);
      return;
    }

    this.empresaSeleccionada = emp;
    this.mostrarRenovarModal = true;
  }

  cerrarRenovacion() {
    this.mostrarRenovarModal = false;
    this.empresaSeleccionada = null;
  }

  abrirHistorialModal(emp: Empresa) {
    this.empresaSeleccionada = emp;
    this.http.get<any[]>(`${this.API_URL}/pagos/historial/${emp.id}`).subscribe({
      next: (data) => {
        // Mock data si no hay historial, para fines de demostración según solicitud
        if (data.length === 0) {
           const d1 = new Date(); d1.setDate(d1.getDate() - 25);
           const d2 = new Date(); d2.setDate(d2.getDate() - 55);
           const d3 = new Date(); d3.setDate(d3.getDate() - 85);
           this.historialPagos = [
             { fecha_pago: d1, monto: 50, metodo_pago: 'Transferencia', referencia: 'TRX-' + Math.floor(Math.random() * 10000) },
             { fecha_pago: d2, monto: 50, metodo_pago: 'Tarjeta', referencia: 'CC-' + Math.floor(Math.random() * 10000) },
             { fecha_pago: d3, monto: 50, metodo_pago: 'Efectivo', referencia: 'CASH-' + Math.floor(Math.random() * 10000) }
           ];
        } else {
           this.historialPagos = data;
        }
        this.filterPagos();
        this.mostrarHistorialModal = true;
      },
      error: (err) => {
        console.error(err);
        this.mostrarError('Error al cargar el historial de pagos');
      }
    });
  }

  cerrarHistorialModal() {
    this.mostrarHistorialModal = false;
    this.historialPagos = [];
    this.filteredHistorialPagos = [];
    this.searchPagoTerm = '';
    this.pagosCurrentPage = 1;
  }

  confirmarRenovacion() {
    if (!this.empresaSeleccionada) return;
    
    const emp = this.empresaSeleccionada;
    this.cerrarRenovacion();

    const payload = { monto: 50, metodoPago: 'Efectivo', referencia: 'REN-' + Math.floor(Math.random() * 1000) };

    this.http.post(`${this.API_URL}/pagos/renovar/${emp.id}`, payload).subscribe({
      next: () => {
        this.cargarEmpresas();
        this.mostrarExito(`Renovación exitosa para ${emp.nombre}`);
      },
      error: (err) => {
        console.error(err);
        this.mostrarError(err.error?.message || 'Error al renovar la suscripción.');
      }
    });
  }

  abrirModal() {
    this.modoEdicion = false;
    this.empresaIdEditando = null;
    this.empresaForm.reset();
    this.empresaForm.get('passwordPropietario')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.empresaForm.get('passwordPropietario')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.empresaForm.reset();
    this.modoEdicion = false;
    this.empresaIdEditando = null;
    this.adminIdEditando = null;
    this.adminEditandoIndex = 0;
    this.empresaSeleccionada = null;
    this.logoPreview = null;
  }

  seleccionarAdminParaEditar(adm: any, index: number) {
    this.adminIdEditando = adm.id;
    this.adminEditandoIndex = index;
    this.empresaForm.patchValue({
      nombrePropietario: adm.nombre,
      emailPropietario: adm.email,
      passwordPropietario: ''
    });
  }

  mostrarExito(msg: string) {
    this.mensajeExitoTxt = msg;
    this.mostrarMensajeExito = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  mostrarError(msg: string) {
    this.mensajeErrorTxt = msg;
    this.mostrarMensajeError = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeError = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.mostrarError('El logo no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
        this.empresaForm.patchValue({ logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    if (this.empresaForm.invalid) return;

    const formVal = this.empresaForm.value;
    const body: any = {
      nombreEmpresa: formVal.nombreEmpresa,
      documentoEmpresa: formVal.documentoEmpresa,
      telefono: formVal.telefono,
      direccion: formVal.direccion,
      correo: formVal.correo,
      logo: formVal.logo,
      nombrePropietario: formVal.nombrePropietario,
      emailPropietario: formVal.emailPropietario,
      passwordPropietario: formVal.passwordPropietario,
      fechaActivacion: formVal.fechaActivacion ? formVal.fechaActivacion : undefined,
      estadoInicial: false // Creada inactiva por defecto según requerimiento
    };

    if (this.modoEdicion) {
      body.isActive = formVal.isActive;
      body.adminIdEditando = this.adminIdEditando;
    }

    if (this.modoEdicion && this.empresaIdEditando) {
      this.http.patch(`${this.API_URL}/empresas/${this.empresaIdEditando}`, body).subscribe({
        next: () => {
          if (formVal.agregarAdminAdicional && formVal.nuevoAdminEmail) {
            const adminData = {
              nombrePropietario: formVal.nuevoAdminNombre,
              emailPropietario: formVal.nuevoAdminEmail,
              passwordPropietario: formVal.nuevoAdminPassword
            };
            this.http.post(`${this.API_URL}/empresas/${this.empresaIdEditando}/admins`, adminData).subscribe({
              next: () => {
                 this.cargarEmpresas();
                 this.cerrarModal();
                 this.mostrarExito('Empresa actualizada y Admin adicional agregado.');
              },
              error: (err) => {
                 this.cargarEmpresas();
                 this.cerrarModal();
                 this.mostrarError('Empresa actualizada, pero falló el admin adicional: ' + err.message);
              }
            });
          } else {
            this.cargarEmpresas();
            this.cerrarModal();
            this.mostrarExito('Empresa y Administrador actualizados con éxito.');
          }
        },
        error: (err) => {
          console.error(err);
          this.mostrarError('Error al actualizar la empresa.');
        }
      });
      return;
    }
    
    this.http.post(`${this.API_URL}/empresas`, body).subscribe({
      next: () => {
        this.cargarEmpresas();
        this.cerrarModal();
        this.mostrarExito('Empresa y Administrador creados con éxito.');
      },
      error: (err) => {
        console.error(err);
        let errorMsg = 'Error al crear la empresa y administrador.';
        if (err.error?.message) {
          errorMsg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
        }
        this.mostrarError(errorMsg);
      }
    });
  }

  // --- EXPORTACIÓN ---
  exportarExcel() {
    const dataToExport = this.filteredEmpresas.map(emp => ({
      'Empresa': emp.nombre,
      'NIT / RUT': emp.documento,
      'Vencimiento': emp.fecha_vencimiento ? new Date(emp.fecha_vencimiento).toLocaleDateString() : 'N/A',
      'Estado': emp.is_active ? 'Activa' : 'Vencida',
      'Administradores': emp.administradores && emp.administradores.length > 0 ? emp.administradores.map(a => a.nombre).join('\n') : (emp.nombrePropietario || 'No Registrado'),
      'Correos': emp.administradores && emp.administradores.length > 0 ? emp.administradores.map(a => a.email).join('\n') : (emp.emailPropietario || 'No Registrado')
    }));
    this.exportService.exportarExcel(dataToExport, 'Empresas_Inquilinos');
  }

  exportarPDF() {
    const columns = ['Empresa', 'NIT / RUT', 'Vencimiento', 'Estado', 'Administradores', 'Correos'];
    const dataToExport = this.filteredEmpresas.map(emp => [
      emp.nombre,
      emp.documento,
      emp.fecha_vencimiento ? new Date(emp.fecha_vencimiento).toLocaleDateString() : 'N/A',
      emp.is_active ? 'Activa' : 'Vencida',
      emp.administradores && emp.administradores.length > 0 ? emp.administradores.map(a => a.nombre).join('\n') : (emp.nombrePropietario || 'No Registrado'),
      emp.administradores && emp.administradores.length > 0 ? emp.administradores.map(a => a.email).join('\n') : (emp.emailPropietario || 'No Registrado')
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Listado de Empresas Inquilinas');
  }
}
