import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { RefreshService } from '../services/refresh.service';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

export interface Cliente {
  id?: string;
  empresa_id?: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  is_active: boolean;
  fecha_registro?: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Toast Notification -->
      <div *ngIf="toastMessage" 
           class="fixed top-24 right-6 z-[250] px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold flex items-center gap-3 transition-all transform animate-fade-in max-w-md border border-white/20"
           [ngClass]="toastType === 'success' ? 'bg-emerald-600 shadow-emerald-500/40' : 'bg-rose-600 shadow-rose-500/40'">
        <svg *ngIf="toastType === 'success'" class="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
        <svg *ngIf="toastType === 'error'" class="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        <span class="flex-1 leading-snug">{{ toastMessage }}</span>
        <button type="button" (click)="toastMessage = null" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer">✕</button>
      </div>

      <!-- Cabecera -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Directorio de Clientes</h2>
            <span class="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold border border-indigo-200">
              {{ clientes.length }} registros
            </span>
          </div>
          <p class="text-slate-500 text-sm mt-1">Registra, consulta y administra la información de contacto de tus clientes.</p>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Botones de Exportación -->
          <div class="flex items-center gap-2">
            <button (click)="exportarExcel()" class="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer" title="Exportar a Excel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Excel
            </button>
            <button (click)="exportarPDF()" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer" title="Exportar a PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF
            </button>
          </div>

          <button (click)="abrirModalCrear()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Contenedor Principal: Tabla y Herramientas -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        <!-- Barra de Búsqueda y Paginación -->
        <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-500">Mostrar</span>
            <select [(ngModel)]="itemsPerPage" (change)="currentPage = 1" class="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none shadow-sm cursor-pointer font-medium">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span class="text-sm font-medium text-slate-500">registros</span>
          </div>

          <div class="relative w-full sm:w-80">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 outline-none shadow-sm transition-all placeholder-slate-400" placeholder="Buscar por nombre, cédula o teléfono...">
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <th class="p-4">Cliente / Cédula</th>
                <th class="p-4">Teléfono</th>
                <th class="p-4">Correo Electrónico</th>
                <th class="p-4">Dirección</th>
                <th class="p-4">Fecha Registro</th>
                <th class="p-4 text-center">Estado</th>
                <th class="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let cliente of paginatedClientes" class="hover:bg-slate-50/60 transition-colors group">
                <!-- Cliente con Nombre primero y Cédula debajo -->
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase flex-shrink-0 shadow-2xs">
                      {{ getInitials(cliente.nombres, cliente.apellidos) }}
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 text-sm leading-snug">{{ cliente.nombres }} {{ cliente.apellidos }}</p>
                      <span class="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        C.C. {{ cliente.cedula }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="p-4 text-slate-600 text-sm font-medium">
                  <span *ngIf="cliente.telefono" class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    {{ cliente.telefono }}
                  </span>
                  <span *ngIf="!cliente.telefono" class="text-slate-400 italic text-xs">Sin teléfono</span>
                </td>
                <td class="p-4 text-slate-600 text-sm">
                  <span *ngIf="cliente.email" class="text-indigo-600 hover:underline">{{ cliente.email }}</span>
                  <span *ngIf="!cliente.email" class="text-slate-400 italic text-xs">Sin correo</span>
                </td>
                <td class="p-4 text-slate-600 text-sm">
                  <span *ngIf="cliente.direccion" class="truncate block max-w-xs" [title]="cliente.direccion">{{ cliente.direccion }}</span>
                  <span *ngIf="!cliente.direccion" class="text-slate-400 italic text-xs">Sin dirección</span>
                </td>
                <!-- Fecha de Registro -->
                <td class="p-4 text-slate-600 text-sm font-medium">
                  <span class="inline-flex items-center gap-1.5 text-slate-700 text-xs font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {{ formatearFecha(cliente.fecha_registro || cliente.created_at) }}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <span *ngIf="cliente.is_active" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Activo
                  </span>
                  <span *ngIf="!cliente.is_active" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span> Inactivo
                  </span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex justify-end items-center gap-1.5">
                    <!-- Ver Detalle -->
                    <button (click)="verCliente(cliente)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Ver Detalle Completo">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                    <!-- Editar -->
                    <button (click)="editarCliente(cliente)" class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Editar Cliente">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <!-- Toggle Activar/Desactivar -->
                    <button (click)="toggleEstado(cliente)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" [title]="cliente.is_active ? 'Inactivar' : 'Activar'">
                      <svg *ngIf="cliente.is_active" class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <svg *ngIf="!cliente.is_active" class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                    <!-- Eliminar -->
                    <button (click)="confirmarEliminar(cliente)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Cliente">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="paginatedClientes.length === 0">
                <td colspan="7" class="p-12 text-center text-slate-400">
                  <div class="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <p class="text-base font-bold text-slate-600">No se encontraron clientes</p>
                  <p class="text-sm mt-0.5">Intenta con otro término de búsqueda o crea un cliente nuevo.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginador -->
        <div class="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <span class="text-sm text-slate-600 font-medium">
            Mostrando <span class="font-bold text-slate-900">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> a 
            <span class="font-bold text-slate-900">{{ currentPage * itemsPerPage > filteredClientes.length ? filteredClientes.length : currentPage * itemsPerPage }}</span> de 
            <span class="font-bold text-slate-900">{{ filteredClientes.length }}</span> registros
          </span>

          <div class="flex items-center gap-1">
            <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1 shadow-sm cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              Anterior
            </button>
            <div class="flex items-center gap-1 px-2">
              <span class="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{{ currentPage }} / {{ totalPages }}</span>
            </div>
            <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1 shadow-sm cursor-pointer">
              Siguiente
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL FORMULARIO: CREAR / EDITAR CLIENTE   -->
      <!-- ========================================== -->
      <div *ngIf="modalFormVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
          
          <!-- Encabezado Modal -->
          <div class="px-6 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ esEdicion ? 'Editar Información de Cliente' : 'Registrar Nuevo Cliente' }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Completa los campos requeridos para el registro del cliente.</p>
            </div>
            <button (click)="cerrarModalForm()" class="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Alerta de Error en Form -->
          <div *ngIf="formError" class="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{{ formError }}</span>
          </div>

          <!-- Cuerpo con Formulario -->
          <form [formGroup]="clienteForm" (ngSubmit)="guardarCliente()" class="p-6 overflow-y-auto space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombres -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombres <span class="text-rose-500">*</span>
                </label>
                <input type="text" formControlName="nombres" placeholder="Ej: Juan Carlos" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
                <p *ngIf="clienteForm.get('nombres')?.touched && clienteForm.get('nombres')?.invalid" class="text-xs text-rose-500 mt-1 font-semibold">
                  Los nombres son requeridos.
                </p>
              </div>

              <!-- Apellidos -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Apellidos <span class="text-rose-500">*</span>
                </label>
                <input type="text" formControlName="apellidos" placeholder="Ej: Pérez Rodríguez" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
                <p *ngIf="clienteForm.get('apellidos')?.touched && clienteForm.get('apellidos')?.invalid" class="text-xs text-rose-500 mt-1 font-semibold">
                  Los apellidos son requeridos.
                </p>
              </div>

              <!-- Cédula -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cédula / Documento <span class="text-rose-500">*</span>
                </label>
                <input type="text" formControlName="cedula" placeholder="Ej: 1098765432" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
                <p *ngIf="clienteForm.get('cedula')?.touched && clienteForm.get('cedula')?.invalid" class="text-xs text-rose-500 mt-1 font-semibold">
                  La cédula es requerida.
                </p>
              </div>

              <!-- Fecha de Registro -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    Fecha de Registro
                    <svg *ngIf="esEdicion" class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </span>
                  <span *ngIf="esEdicion" class="text-[11px] font-semibold text-slate-400 lowercase italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">No modificable</span>
                </label>
                <div [class.cursor-not-allowed]="esEdicion" class="w-full">
                  <input type="date" formControlName="fecha_registro" 
                         [readonly]="esEdicion"
                         class="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                         [ngClass]="esEdicion 
                           ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed pointer-events-none select-none opacity-85' 
                           : 'bg-slate-50 border border-slate-300 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none'">
                </div>
              </div>

              <!-- Teléfono -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teléfono / Móvil
                </label>
                <input type="text" formControlName="telefono" placeholder="Ej: 310 123 4567" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
              </div>

              <!-- Correo Electrónico -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <input type="email" formControlName="email" placeholder="cliente@example.com" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
              </div>

              <!-- Dirección -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dirección de Residencia / Entrega
                </label>
                <input type="text" formControlName="direccion" placeholder="Ej: Calle 15 # 4-30 Barrio Centro" 
                       class="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all">
              </div>

              <!-- Estado Activo -->
              <div class="sm:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p class="text-sm font-bold text-slate-800">Estado del Cliente</p>
                  <p class="text-xs text-slate-500">Los clientes activos pueden ser asignados a ventas y comprobantes.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="is_active" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <!-- Botones Modal -->
            <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" (click)="cerrarModalForm()" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" [disabled]="isSaving" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer">
                <span *ngIf="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ esEdicion ? 'Actualizar Cliente' : 'Guardar Cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL VER DETALLE CLIENTE                  -->
      <!-- ========================================== -->
      <div *ngIf="modalVerVisible && clienteSeleccionado" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
          
          <div class="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
            <button (click)="cerrarModalVer()" class="absolute top-4 right-4 text-indigo-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white border border-white/30 shadow-inner">
                {{ getInitials(clienteSeleccionado.nombres, clienteSeleccionado.apellidos) }}
              </div>
              <div>
                <h3 class="text-xl font-bold leading-tight">{{ clienteSeleccionado.nombres }} {{ clienteSeleccionado.apellidos }}</h3>
                <span class="inline-block mt-1 px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-white/20 text-white border border-white/30">
                  C.C. {{ clienteSeleccionado.cedula }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-3.5 bg-slate-50/50">
            <!-- Fecha Registro -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Registro</span>
                <span class="text-sm font-bold text-slate-800">{{ formatearFecha(clienteSeleccionado.fecha_registro || clienteSeleccionado.created_at) }}</span>
              </div>
            </div>

            <!-- Teléfono -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teléfono / Celular</span>
                <span class="text-sm font-bold text-slate-800">{{ clienteSeleccionado.telefono || 'No registrado' }}</span>
              </div>
            </div>

            <!-- Correo -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</span>
                <span class="text-sm font-bold text-slate-800">{{ clienteSeleccionado.email || 'No registrado' }}</span>
              </div>
            </div>

            <!-- Dirección -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <div class="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dirección</span>
                <span class="text-sm font-bold text-slate-800">{{ clienteSeleccionado.direccion || 'No registrada' }}</span>
              </div>
            </div>

            <!-- Estado -->
            <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado en el Sistema</span>
              <span *ngIf="clienteSeleccionado.is_active" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Activo
              </span>
              <span *ngIf="!clienteSeleccionado.is_active" class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Inactivo
              </span>
            </div>
          </div>

          <div class="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button (click)="cerrarModalVer()" class="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
              Cerrar
            </button>
            <button (click)="editarCliente(clienteSeleccionado); cerrarModalVer()" class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              Editar
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL CONFIRMAR ELIMINAR CLIENTE           -->
      <!-- ========================================== -->
      <div *ngIf="modalEliminarVisible && clienteAEliminar" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 flex flex-col items-center text-center">
          <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800">¿Eliminar Cliente?</h3>
          <p class="text-sm text-slate-500 mt-2">
            ¿Estás seguro de que deseas eliminar a <strong class="text-slate-800">{{ clienteAEliminar.nombres }} {{ clienteAEliminar.apellidos }}</strong> con cédula <strong class="text-slate-800">{{ clienteAEliminar.cedula }}</strong>? Esta acción no se puede deshacer.
          </p>

          <div class="flex items-center gap-3 w-full mt-6">
            <button (click)="cerrarModalEliminar()" class="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="ejecutarEliminar()" [disabled]="isSaving" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <span *ngIf="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Sí, Eliminar
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  // Estados de Modales
  modalFormVisible: boolean = false;
  modalVerVisible: boolean = false;
  modalEliminarVisible: boolean = false;

  esEdicion: boolean = false;
  clienteSeleccionado: Cliente | null = null;
  clienteAEliminar: Cliente | null = null;

  clienteForm!: FormGroup;
  isSaving: boolean = false;
  formError: string | null = null;

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  private refreshSub!: Subscription;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private exportService: ExportService,
    private refreshService: RefreshService
  ) {}

  ngOnInit() {
    this.initForm();
    this.cargarClientes();

    this.refreshSub = this.refreshService.refresh$.subscribe(route => {
      if (route === '/admin/clientes') {
        this.cargarClientes();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  getFechaLocalHoy(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  initForm() {
    const hoy = this.getFechaLocalHoy();
    this.clienteForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.minLength(3)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      fecha_registro: [hoy],
      is_active: [true]
    });
  }

  toastTimeout: any = null;

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = mensaje;
    this.toastType = tipo;
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 4500);
  }

  cargarClientes() {
    this.http.get<Cliente[]>(`${environment.apiUrl}/clientes`).subscribe({
      next: (data) => {
        this.clientes = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando clientes', err);
        this.mostrarToast('No se pudo cargar el listado de clientes', 'error');
      }
    });
  }

  formatearFecha(fechaStr?: string): string {
    if (!fechaStr) return 'N/A';
    const str = String(fechaStr);
    const soloFecha = str.substring(0, 10);
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return new Date(fechaStr).toLocaleDateString('es-CO');
  }

  get filteredClientes(): Cliente[] {
    if (!this.searchTerm.trim()) {
      return this.clientes;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.clientes.filter(c => 
      c.cedula.toLowerCase().includes(term) ||
      c.nombres.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClientes.length / this.itemsPerPage) || 1;
  }

  get paginatedClientes(): Cliente[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredClientes.slice(start, start + Number(this.itemsPerPage));
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getInitials(nombres: string, apellidos: string): string {
    const n = nombres ? nombres.trim().charAt(0) : '';
    const a = apellidos ? apellidos.trim().charAt(0) : '';
    return `${n}${a}`.toUpperCase() || 'CL';
  }

  // --- MODAL CREAR / EDITAR ---
  abrirModalCrear() {
    this.esEdicion = false;
    this.clienteSeleccionado = null;
    this.formError = null;
    this.clienteForm.get('fecha_registro')?.enable();
    const hoy = this.getFechaLocalHoy();
    this.clienteForm.reset({ is_active: true, fecha_registro: hoy });
    this.modalFormVisible = true;
  }

  editarCliente(cliente: Cliente) {
    this.esEdicion = true;
    this.clienteSeleccionado = cliente;
    this.formError = null;

    let fReg = cliente.fecha_registro;
    if (!fReg && cliente.created_at) {
      const d = new Date(cliente.created_at);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        fReg = `${y}-${m}-${day}`;
      } else {
        fReg = cliente.created_at.substring(0, 10);
      }
    }
    if (!fReg) {
      fReg = this.getFechaLocalHoy();
    }

    this.clienteForm.patchValue({
      cedula: cliente.cedula,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      fecha_registro: fReg,
      is_active: cliente.is_active
    });
    this.clienteForm.get('fecha_registro')?.disable();
    this.modalFormVisible = true;
  }

  cerrarModalForm() {
    this.modalFormVisible = false;
    this.formError = null;
    this.clienteSeleccionado = null;
    this.clienteForm.get('fecha_registro')?.enable();
  }

  guardarCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.clienteForm.get('nombres')?.invalid) faltantes.push('Nombres');
      if (this.clienteForm.get('apellidos')?.invalid) faltantes.push('Apellidos');
      if (this.clienteForm.get('cedula')?.invalid) faltantes.push('Cédula / Documento');
      if (this.clienteForm.get('email')?.invalid) faltantes.push('Correo electrónico válido');

      const detalle = faltantes.length > 0 ? `: ${faltantes.join(', ')}` : '.';
      const errorMsg = `Faltan campos por diligenciar${detalle}`;
      this.formError = errorMsg;
      this.mostrarToast(errorMsg, 'error');
      this.cdr.detectChanges();
      return;
    }

    this.isSaving = true;
    this.formError = null;

    const data = this.clienteForm.getRawValue();

    if (this.esEdicion && this.clienteSeleccionado?.id) {
      this.http.patch<Cliente>(`${environment.apiUrl}/clientes/${this.clienteSeleccionado.id}`, data).subscribe({
        next: (actualizado) => {
          this.isSaving = false;
          const index = this.clientes.findIndex(c => c.id === actualizado.id);
          if (index !== -1) {
            this.clientes[index] = actualizado;
          }
          this.cerrarModalForm();
          this.mostrarToast('¡Cliente actualizado con éxito!', 'success');
        },
        error: (err) => {
          this.isSaving = false;
          const backendMsg = err.error?.message;
          const msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : (backendMsg || 'Error al actualizar el cliente en el sistema.');
          this.formError = msg;
          this.mostrarToast(msg, 'error');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.http.post<Cliente>(`${environment.apiUrl}/clientes`, data).subscribe({
        next: (nuevo) => {
          this.isSaving = false;
          this.clientes.unshift(nuevo);
          this.cerrarModalForm();
          this.mostrarToast('¡Cliente registrado con éxito!', 'success');
        },
        error: (err) => {
          this.isSaving = false;
          const backendMsg = err.error?.message;
          const msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : (backendMsg || 'Error al registrar el cliente en el sistema.');
          this.formError = msg;
          this.mostrarToast(msg, 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- VER CLIENTE ---
  verCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.modalVerVisible = true;
  }

  cerrarModalVer() {
    this.modalVerVisible = false;
    this.clienteSeleccionado = null;
  }

  // --- TOGGLE ESTADO ---
  toggleEstado(cliente: Cliente) {
    if (!cliente.id) return;
    const nuevoEstado = !cliente.is_active;
    this.http.patch<Cliente>(`${environment.apiUrl}/clientes/${cliente.id}`, { is_active: nuevoEstado }).subscribe({
      next: (actualizado) => {
        cliente.is_active = actualizado.is_active;
        this.mostrarToast(`Cliente ${nuevoEstado ? 'activado' : 'inactivado'} correctamente`, 'success');
      },
      error: (err) => {
        console.error('Error toggling estado', err);
        this.mostrarToast('No se pudo cambiar el estado del cliente', 'error');
      }
    });
  }

  // --- ELIMINAR CLIENTE ---
  confirmarEliminar(cliente: Cliente) {
    this.clienteAEliminar = cliente;
    this.modalEliminarVisible = true;
  }

  cerrarModalEliminar() {
    this.modalEliminarVisible = false;
    this.clienteAEliminar = null;
  }

  ejecutarEliminar() {
    if (!this.clienteAEliminar?.id) return;
    this.isSaving = true;

    this.http.delete(`${environment.apiUrl}/clientes/${this.clienteAEliminar.id}`).subscribe({
      next: () => {
        this.isSaving = false;
        this.clientes = this.clientes.filter(c => c.id !== this.clienteAEliminar!.id);
        this.cerrarModalEliminar();
        this.mostrarToast('Cliente eliminado del sistema', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error eliminando cliente', err);
        this.mostrarToast(err.error?.message || 'No se pudo eliminar el cliente', 'error');
      }
    });
  }

  // --- EXPORTAR EXCEL Y PDF ---
  exportarExcel() {
    const dataToExport = this.filteredClientes.map(c => ({
      'Cliente': `${c.nombres} ${c.apellidos}`,
      'Cédula': c.cedula,
      'Teléfono': c.telefono || 'N/A',
      'Correo Electrónico': c.email || 'N/A',
      'Dirección': c.direccion || 'N/A',
      'Fecha Registro': this.formatearFecha(c.fecha_registro || c.created_at),
      'Estado': c.is_active ? 'Activo' : 'Inactivo'
    }));

    const fechaStr = this.getFechaLocalHoy();
    this.exportService.exportarExcel(dataToExport, `Reporte_Clientes_${fechaStr}`);
  }

  exportarPDF() {
    const columns = ['Cliente', 'Cédula', 'Teléfono', 'Correo', 'Dirección', 'Fecha Reg.', 'Estado'];
    const dataToExport = this.filteredClientes.map(c => [
      `${c.nombres} ${c.apellidos}`,
      c.cedula,
      c.telefono || 'N/A',
      c.email || 'N/A',
      c.direccion || 'N/A',
      this.formatearFecha(c.fecha_registro || c.created_at),
      c.is_active ? 'Activo' : 'Inactivo'
    ]);

    this.exportService.exportarPDF(columns, dataToExport, 'Directorio de Clientes');
  }
}
