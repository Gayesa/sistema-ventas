import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

export interface Proveedor {
  id?: string;
  razon_social: string;
  documento: string; // NIT
  contacto_nombre?: string;
  telefono_principal?: string;
  telefono_alternativo?: string;
  email?: string;
  direccion?: string;
  is_active: boolean;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Cabecera -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Proveedores</h2>
          <p class="text-slate-500 text-sm mt-1">Administra el directorio de empresas que surten tu negocio.</p>
        </div>
        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="relative w-full md:w-64">
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" [(ngModel)]="searchTerm" (input)="filterProveedores()" placeholder="Buscar por NIT o Nombre..." class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white shadow-sm">
          </div>
          <div class="flex items-center gap-2">
            <button (click)="exportarExcel()" class="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2" title="Exportar a Excel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Excel
            </button>
            <button (click)="exportarPDF()" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2" title="Exportar a PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF
            </button>
          </div>

          <button (click)="abrirModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <!-- Tabla de Proveedores -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <th class="p-4">Razón Social / Empresa</th>
                <th class="p-4">NIT / Documento</th>
                <th class="p-4">Contacto</th>
                <th class="p-4">Teléfono</th>
                <th class="p-4">Correo</th>
                <th class="p-4 text-center">Estado</th>
                <th class="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let prov of paginatedProveedores" class="hover:bg-slate-50/50 transition-colors group">
                <td class="p-4">
                  <p class="font-bold text-slate-800">{{ prov.razon_social }}</p>
                  <p class="text-xs text-slate-400 mt-0.5 truncate w-48" *ngIf="prov.direccion">{{ prov.direccion }}</p>
                </td>
                <td class="p-4 text-slate-600 font-mono text-sm">{{ prov.documento }}</td>
                <td class="p-4 text-slate-700 font-medium text-sm">{{ prov.contacto_nombre || '-' }}</td>
                <td class="p-4 text-slate-600 text-sm">{{ prov.telefono_principal || '-' }}</td>
                <td class="p-4 text-slate-600 text-sm">{{ prov.email || '-' }}</td>
                <td class="p-4 text-center">
                  <span *ngIf="prov.is_active" class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Activo
                  </span>
                  <span *ngIf="!prov.is_active" class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span> Inactivo
                  </span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button (click)="editarProveedor(prov)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button (click)="toggleEstado(prov)" class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" [title]="prov.is_active ? 'Desactivar' : 'Activar'">
                      <svg *ngIf="prov.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                      <svg *ngIf="!prov.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button (click)="eliminarProveedor(prov)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- Empty State -->
              <tr *ngIf="filteredProveedores.length === 0">
                <td colspan="7" class="p-16 text-center">
                  <div class="mx-auto w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <h3 class="text-lg font-bold text-slate-700">No hay proveedores registrados aún</h3>
                  <p class="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Agrega las empresas que surten tu negocio para usarlas en las compras y recepción de mercancía.</p>
                  <button (click)="abrirModal()" class="mt-6 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                    Agregar el primer proveedor
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-500">Mostrar</span>
              <select [(ngModel)]="pageSize" (change)="changePageSize()" class="border border-slate-200 rounded-lg text-sm px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option [ngValue]="5">5</option>
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
              </select>
            </div>
            <p class="text-sm text-slate-500 hidden sm:block">
              Mostrando <span class="font-medium">{{ filteredProveedores.length > 0 ? startIndex + 1 : 0 }}</span> a <span class="font-medium">{{ endIndex }}</span> de <span class="font-medium">{{ filteredProveedores.length }}</span>
            </p>
          </div>
          <div class="flex items-center">
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button (click)="previousPage()" [disabled]="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </nav>
          </div>
        </div>

      </div>

      <!-- Modal de Confirmación de Eliminación -->
      <div *ngIf="mostrarConfirmarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-rose-100 rounded-full mb-4">
            <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h3 class="text-lg font-bold text-center text-slate-800 mb-2">Eliminar Proveedor</h3>
          <p class="text-slate-500 text-center text-sm mb-6">¿Estás seguro que deseas eliminar al proveedor <span class="font-bold text-slate-800">{{ proveedorAEliminar?.razon_social }}</span>? Esta acción no se puede deshacer.</p>
          <form (ngSubmit)="confirmarEliminacion()">
            <div class="flex gap-3 justify-center">
              <button type="button" (click)="cancelarEliminacion()" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors shadow-sm">Sí, Eliminar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Nuevo / Editar Proveedor -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col animate-fade-in-up my-auto">
          
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
            <h3 class="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              {{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
            </h3>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-full p-1.5 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form [formGroup]="proveedorForm" (ngSubmit)="guardarProveedor()" class="flex flex-col">
            <div class="p-6 space-y-6">
              
              <!-- Datos de la Empresa -->
              <div>
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Datos de la Empresa</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Razón Social / Empresa <span class="text-rose-500">*</span></label>
                    <input formControlName="razon_social" type="text" placeholder="Ej. Distribuidora del Pacífico S.A." 
                           [class.border-rose-500]="isInvalid('razon_social')"
                           class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none">
                    <p *ngIf="isInvalid('razon_social')" class="text-rose-500 text-xs mt-1 font-medium">La Razón Social es requerida.</p>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">NIT / Documento <span class="text-rose-500">*</span></label>
                    <input formControlName="documento" type="text" placeholder="Ej. 900.123.456-7" 
                           [class.border-rose-500]="isInvalid('documento')"
                           class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono transition-all bg-slate-50 focus:bg-white outline-none">
                    <p *ngIf="isInvalid('documento')" class="text-rose-500 text-xs mt-1 font-medium">El NIT / Documento es requerido.</p>
                  </div>
                </div>
              </div>

              <!-- Datos de Contacto -->
              <div>
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-t border-slate-100 pt-6">Información de Contacto</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nombre de Contacto</label>
                    <input formControlName="contacto_nombre" type="text" placeholder="Ej. Juan Pérez" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono Principal</label>
                    <input formControlName="telefono_principal" type="tel" placeholder="Ej. 300 123 4567" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono Alternativo <span class="text-slate-400 font-normal">(Opcional)</span></label>
                    <input formControlName="telefono_alternativo" type="tel" placeholder="Opcional" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none">
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
                    <input formControlName="email" type="email" placeholder="Ej. ventas@distribuidora.com" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none">
                  </div>
                </div>
              </div>

              <!-- Ubicación y Estado -->
              <div>
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-t border-slate-100 pt-6">Ubicación y Estado</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1.5">Dirección Física</label>
                    <textarea formControlName="direccion" rows="2" placeholder="Ej. Calle 123 #45-67, Bodega 4" class="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50 focus:bg-white outline-none resize-none"></textarea>
                  </div>
                  <div class="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h5 class="text-sm font-bold text-slate-800">Estado del Proveedor</h5>
                      <p class="text-xs text-slate-500 mt-0.5">Si está inactivo, no aparecerá en las opciones de compras.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" formControlName="is_active" class="sr-only peer">
                      <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-sm border border-slate-200"></div>
                    </label>
                  </div>
                </div>
              </div>
              
            </div>
            
            <!-- Footer del Modal -->
            <div class="px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button type="button" (click)="cerrarModal()" class="px-6 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all shadow-sm w-full sm:w-auto text-center">
                Cancelar
              </button>
              <button type="submit" class="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-sm transition-all shadow-sm w-full sm:w-auto text-center flex justify-center items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Guardar Proveedor
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Toasts -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-[100]">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoTxt }}</span>
      </div>
      <div *ngIf="mostrarMensajeError" class="fixed top-6 right-6 bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-[100]">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeErrorTxt }}</span>
      </div>

    </div>
  `
})
export class ProveedoresComponent implements OnInit {
  proveedoresList: Proveedor[] = [];
  
  filteredProveedores: Proveedor[] = [];
  searchTerm: string = '';
  
  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  
  mostrarModal: boolean = false;
  mostrarConfirmarModal: boolean = false;
  isEditing: boolean = false;
  editingId: string | null = null;
  proveedorAEliminar: Proveedor | null = null;
  proveedorForm!: FormGroup;

  // Toasts
  mostrarMensajeExito = false;
  mostrarMensajeError = false;
  mensajeExitoTxt = '';
  mensajeErrorTxt = '';

  private timeoutExito: any;
  private timeoutError: any;

  apiUrl = `${environment.apiUrl}/proveedores`;

  constructor(private fb: FormBuilder, private exportService: ExportService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  mostrarExito(msg: string) {
    if (this.timeoutExito) clearTimeout(this.timeoutExito);
    this.mensajeExitoTxt = msg;
    this.mostrarMensajeExito = true;
    this.cdr.detectChanges();
    this.timeoutExito = setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  mostrarError(msg: string) {
    if (this.timeoutError) clearTimeout(this.timeoutError);
    this.mensajeErrorTxt = msg;
    this.mostrarMensajeError = true;
    this.cdr.detectChanges();
    this.timeoutError = setTimeout(() => {
      this.mostrarMensajeError = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  ngOnInit() {
    this.proveedorForm = this.fb.group({
      razon_social: ['', Validators.required],
      documento: ['', Validators.required],
      contacto_nombre: [''],
      telefono_principal: [''],
      telefono_alternativo: [''],
      email: [''],
      direccion: [''],
      is_active: [true]
    });
    
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.http.get<Proveedor[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.proveedoresList = data;
        this.filterProveedores();
        this.cdr.detectChanges();
      },
      error: (err) => this.mostrarError('Error cargando proveedores')
    });
  }

  filterProveedores() {
    if (!this.searchTerm.trim()) {
      this.filteredProveedores = [...this.proveedoresList];
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredProveedores = this.proveedoresList.filter(p => 
      p.razon_social.toLowerCase().includes(term) || 
      p.documento.toLowerCase().includes(term) ||
      (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // Métodos de Paginación
  get paginatedProveedores() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProveedores.slice(start, start + this.pageSize);
  }
  
  get totalPages() { return Math.ceil(this.filteredProveedores.length / this.pageSize) || 1; }
  get startIndex() { return (this.currentPage - 1) * this.pageSize; }
  get endIndex() { 
    const end = this.currentPage * this.pageSize; 
    return end > this.filteredProveedores.length ? this.filteredProveedores.length : end; 
  }
  
  changePageSize() { this.currentPage = 1; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  previousPage() { if (this.currentPage > 1) this.currentPage--; }

  abrirModal() {
    this.isEditing = false;
    this.editingId = null;
    this.proveedorForm.reset({ is_active: true });
    this.mostrarModal = true;
  }

  editarProveedor(prov: Proveedor) {
    this.isEditing = true;
    this.editingId = prov.id || null;
    this.proveedorForm.patchValue({
      razon_social: prov.razon_social,
      documento: prov.documento,
      contacto_nombre: prov.contacto_nombre,
      telefono_principal: prov.telefono_principal,
      telefono_alternativo: prov.telefono_alternativo,
      email: prov.email,
      direccion: prov.direccion,
      is_active: prov.is_active
    });
    this.mostrarModal = true;
  }

  toggleEstado(prov: Proveedor) {
    const nuevoEstado = !prov.is_active;
    this.http.patch(`${this.apiUrl}/${prov.id}`, { is_active: nuevoEstado }).subscribe({
      next: () => {
        prov.is_active = nuevoEstado;
        this.mostrarExito(`Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: (err) => this.mostrarError('Error al cambiar el estado del proveedor.')
    });
  }

  eliminarProveedor(prov: Proveedor) {
    this.proveedorAEliminar = prov;
    this.mostrarConfirmarModal = true;
  }

  cancelarEliminacion() {
    this.mostrarConfirmarModal = false;
    this.proveedorAEliminar = null;
  }

  confirmarEliminacion() {
    if (this.proveedorAEliminar && this.proveedorAEliminar.id) {
      this.http.delete(`${this.apiUrl}/${this.proveedorAEliminar.id}`).subscribe({
        next: () => {
          this.mostrarExito('Proveedor eliminado exitosamente.');
          this.cargarProveedores();
          this.cancelarEliminacion();
          this.cdr.detectChanges();
        },
        error: (err) => this.mostrarError('Error al eliminar el proveedor.')
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  isInvalid(controlName: string): boolean {
    const control = this.proveedorForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  guardarProveedor() {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      this.mostrarError('Por favor complete los campos obligatorios correctamente.');
      return;
    }

    const formData = this.proveedorForm.value;
    
    if (this.isEditing && this.editingId) {
      this.http.patch(`${this.apiUrl}/${this.editingId}`, formData).subscribe({
        next: () => {
          this.mostrarExito('Información del proveedor actualizada con éxito.');
          this.cargarProveedores();
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.message) {
            this.mostrarError(err.error.message);
          } else {
            this.mostrarError('Error al actualizar el proveedor.');
          }
        }
      });
    } else {
      this.http.post(this.apiUrl, formData).subscribe({
        next: () => {
          this.mostrarExito('Proveedor creado con éxito.');
          this.cargarProveedores();
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.message) {
            this.mostrarError(err.error.message);
          } else {
            this.mostrarError('Error al crear el proveedor.');
          }
        }
      });
    }
  }

  exportarExcel() {
    const dataToExport = this.filteredProveedores.map(p => ({
      'Razón Social / Empresa': p.razon_social,
      'NIT / Documento': p.documento,
      'Contacto': p.contacto_nombre || '-',
      'Teléfono': p.telefono_principal || '-',
      'Correo': p.email || '-',
      'Dirección': p.direccion || '-',
      'Estado': p.is_active ? 'Activo' : 'Inactivo'
    }));
    this.exportService.exportarExcel(dataToExport, 'Directorio_Proveedores');
  }

  exportarPDF() {
    const columns = ['Razón Social', 'NIT', 'Contacto', 'Teléfono', 'Correo', 'Estado'];
    const dataToExport = this.filteredProveedores.map(p => [
      p.razon_social,
      p.documento,
      p.contacto_nombre || '-',
      p.telefono_principal || '-',
      p.email || '-',
      p.is_active ? 'Activo' : 'Inactivo'
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Directorio de Proveedores');
  }
}
