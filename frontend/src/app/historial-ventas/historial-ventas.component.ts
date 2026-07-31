import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { RefreshService } from '../services/refresh.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

interface VentaResumen {
  id: string;
  numero_ticket: string;
  fecha: string;
  total: number;
  vendedor: string;
  metodo_pago: string;
  estado: string; // COMPLETADA, ANULADA
  detalles: any[];
  expandido?: boolean;
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Toast Notification -->
    <div *ngIf="toastMessage" class="fixed top-24 right-6 z-[200] animate-fade-in-down">
      <div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border"
        [ngClass]="toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'">
        <svg *ngIf="toastType === 'success'" class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <svg *ngIf="toastType === 'error'" class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-bold text-sm">{{ toastMessage }}</span>
      </div>
    </div>

    <div class="p-6 h-full flex flex-col bg-slate-50">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-black text-textMain tracking-tight">Historial de Ventas</h2>
          <p class="text-textSecondary text-sm mt-1">Consulta los tickets de venta y monitorea los ingresos.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <input type="date" [(ngModel)]="fechaInicio" class="border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer">
            <span class="text-slate-400 font-bold">-</span>
            <input type="date" [(ngModel)]="fechaFin" class="border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer">
            <button (click)="filtrarVentas()" class="bg-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors" title="Filtrar por fecha">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>
          <button (click)="abrirModalReporteX()" class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Ventas del Día
          </button>
          
          <button (click)="exportarPDF()" class="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Exportar PDF
          </button>
        </div>
      </div>

      <!-- Métricas Resumen -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Ingresos Totales</p>
            <p class="text-2xl font-black text-slate-800">{{ calcularIngresos() | currency:'COP':'symbol':'1.0-0' }}</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <p class="text-2xl font-black text-slate-800">{{ getVentasFiltradas().length }}</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
            <p class="text-2xl font-black text-slate-800">{{ (getVentasFiltradas().length > 0 ? calcularIngresos() / getVentasFiltradas().length : 0) | currency:'COP':'symbol':'1.0-0' }}</p>
          </div>
        </div>
      </div>

      <!-- Controles de Tabla -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <!-- Buscador -->
        <div class="relative w-full md:w-72">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" placeholder="Buscar ticket, método o vendedor..." class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm">
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

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden min-h-[400px]">
        <div class="overflow-y-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-slate-50 z-10">
              <tr class="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider shadow-sm">
                <th class="p-4 font-bold">Ticket</th>
                <th class="p-4 font-bold">Fecha de Venta</th>
                <th class="p-4 font-bold">Método de Pago</th>
                <th class="p-4 font-bold">Vendedor</th>
                <th class="p-4 font-bold text-right">Total</th>
                <th class="p-4 font-bold text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <ng-container *ngFor="let venta of getVentasPaginadas()">
                <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" (click)="toggleExpandir(venta)">
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-indigo-50 flex-shrink-0 flex items-center justify-center text-primary">
                        <svg class="w-4 h-4 transition-transform" [class.rotate-90]="venta.expandido" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                      <p class="font-bold text-slate-800 font-mono">{{ venta.numero_ticket }}</p>
                    </div>
                  </td>
                  <td class="p-4 text-slate-600 text-sm font-medium">{{ venta.fecha | date:'short' }}</td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
                          [class.bg-emerald-50]="venta.metodo_pago === 'EFECTIVO'"
                          [class.text-emerald-700]="venta.metodo_pago === 'EFECTIVO'"
                          [class.bg-blue-50]="venta.metodo_pago === 'TARJETA'"
                          [class.text-blue-700]="venta.metodo_pago === 'TARJETA'"
                          [class.bg-purple-50]="venta.metodo_pago === 'NEQUI'"
                          [class.text-purple-700]="venta.metodo_pago === 'NEQUI'">
                      {{ venta.metodo_pago }}
                    </span>
                  </td>
                  <td class="p-4 text-slate-600 text-sm font-medium">{{ venta.vendedor }}</td>
                  <td class="p-4 text-emerald-600 text-sm font-black text-right">{{ venta.total | currency:'COP':'symbol':'1.0-0' }}</td>
                  <td class="p-4 text-center">
                    <span class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                          [class.bg-green-100]="venta.estado === 'COMPLETADA'"
                          [class.text-green-700]="venta.estado === 'COMPLETADA'"
                          [class.bg-red-100]="venta.estado === 'ANULADA'"
                          [class.text-red-700]="venta.estado === 'ANULADA'">
                      {{ venta.estado }}
                    </span>
                  </td>
                </tr>
                
                <!-- Detalles de la venta -->
                <tr *ngIf="venta.expandido" class="bg-slate-50/50 shadow-inner">
                  <td colspan="6" class="p-6 border-t border-slate-100">
                    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table class="w-full text-left">
                        <thead class="bg-slate-100/50 border-b border-slate-200">
                          <tr>
                            <th class="p-3 text-xs text-slate-500 uppercase font-bold">Producto</th>
                            <th class="p-3 text-xs text-slate-500 uppercase font-bold text-center">Cant.</th>
                            <th class="p-3 text-xs text-slate-500 uppercase font-bold text-right">Precio Unit.</th>
                            <th class="p-3 text-xs text-slate-500 uppercase font-bold text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          <tr *ngFor="let det of venta.detalles" class="hover:bg-slate-50 transition-colors">
                            <td class="p-3 text-sm text-slate-700 font-medium">{{ det.nombre_producto }}</td>
                            <td class="p-3 text-sm text-slate-700 text-center font-bold">{{ det.cantidad }}</td>
                            <td class="p-3 text-sm text-slate-500 text-right">{{ det.precio_unitario | currency:'COP':'symbol':'1.0-0' }}</td>
                            <td class="p-3 text-sm text-slate-800 font-bold text-right">{{ (det.cantidad * det.precio_unitario) | currency:'COP':'symbol':'1.0-0' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </ng-container>
              <tr *ngIf="getVentasPaginadas().length === 0">
                <td colspan="6" class="p-8 text-center text-slate-500">
                  No se encontraron ventas que coincidan con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 gap-4">
          <span class="text-sm text-slate-500 font-medium">
            Mostrando <span class="font-bold text-slate-700">{{ getPaginacionTexto() }}</span> de <span class="font-bold text-slate-700">{{ getVentasFiltradas().length }}</span> registros
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

    <!-- Modal de Reporte X (Ventas del Día) -->
    <div *ngIf="modalReporteXVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in-up p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        
        <div class="px-6 py-4 bg-indigo-600 border-b border-indigo-700 flex justify-between items-center text-white shrink-0">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Ventas en Curso (Reporte X)
          </h2>
          <button (click)="cerrarModalReporteX()" class="text-indigo-200 hover:text-white rounded-full p-1.5 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-slate-50/30">
          
          <!-- Columna Izquierda: Resumen -->
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Acumulado del Día</h3>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <span class="font-medium text-slate-700">Total Efectivo</span>
                </div>
                <span class="font-bold text-slate-800">{{ totalesReporteX.efectivo | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>
              
              <div class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  <span class="font-medium text-slate-700">Total Tarjeta</span>
                </div>
                <span class="font-bold text-slate-800">{{ totalesReporteX.tarjeta | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>

              <div class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                  <span class="font-medium text-slate-700">Total Nequi/Transferencia</span>
                </div>
                <span class="font-bold text-slate-800">{{ totalesReporteX.nequi | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>

              <div class="flex justify-between items-center p-4 bg-emerald-50 rounded-xl mt-4 border border-emerald-100">
                <span class="font-bold text-emerald-800 uppercase">Venta Parcial</span>
                <span class="font-black text-2xl text-emerald-900">{{ totalesReporteX.total | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>
              <p class="text-right text-xs text-slate-500 font-medium">{{ totalesReporteX.operaciones }} operaciones registradas hasta el momento.</p>
            </div>
          </div>

          <!-- Columna Derecha: Tabla -->
          <div class="flex flex-col h-full">
            <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Detalle de Operaciones</h3>
            <div class="flex-1 min-h-[250px] bg-white border border-slate-200 rounded-xl shadow-inner overflow-hidden flex flex-col">
              <div class="overflow-y-auto flex-1">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                    <tr>
                      <th class="p-3 font-bold text-slate-600">Ticket</th>
                      <th class="p-3 font-bold text-slate-600">Método</th>
                      <th class="p-3 font-bold text-slate-600">Productos</th>
                      <th class="p-3 font-bold text-slate-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr *ngFor="let det of totalesReporteX.detalles_ventas" class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-3 font-mono text-indigo-600 font-semibold align-top whitespace-nowrap">
                        {{ det.ticket }}<br>
                        <span class="text-[10px] text-slate-400 font-normal">{{ det.hora }}</span>
                      </td>
                      <td class="p-3 text-slate-600 align-top font-medium">{{ det.metodo }}</td>
                      <td class="p-3 text-slate-500 whitespace-pre-wrap leading-relaxed min-w-[150px] align-top">{{ det.productos }}</td>
                      <td class="p-3 font-bold text-emerald-600 text-right align-top whitespace-nowrap">{{ det.total | currency:'COP':'symbol':'1.0-0' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button (click)="cerrarModalReporteX()" class="px-6 py-3 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cerrar</button>
          <button (click)="exportarReporteX()" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-colors flex items-center gap-2 shadow-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Imprimir PDF
          </button>
        </div>

      </div>
    </div>
  `
})
export class HistorialVentasComponent implements OnInit {
  fechaInicio: string = '';
  fechaFin: string = '';

  // Datos simulados de ventas
  ventas: VentaResumen[] = [];
  
  // Tabla
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  refreshSub!: Subscription;

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  constructor(private exportService: ExportService, private http: HttpClient, private cdr: ChangeDetectorRef, private refreshService: RefreshService) {}

  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  ngOnInit() {
    const date = new Date();
    this.fechaInicio = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().substring(0, 10);
    this.fechaFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().substring(0, 10);
    this.cargarVentas();
    
    this.refreshSub = this.refreshService.refresh$.subscribe(route => {
      if (route === '/admin/historial-ventas') {
        this.cargarVentas();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  cargarVentas() {
    this.http.get<VentaResumen[]>(`${environment.apiUrl}/ventas`).subscribe({
      next: (data) => {
        this.ventas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando historial de ventas', err)
    });
  }

  filtrarVentas() {
    if (!this.fechaInicio || !this.fechaFin) {
      this.mostrarToast('Por favor, selecciona ambas fechas para filtrar.', 'error');
      return;
    }
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      this.mostrarToast('La fecha de inicio no puede ser mayor a la fecha de fin.', 'error');
      return;
    }
    this.currentPage = 1;
    this.mostrarToast('Filtro aplicado correctamente.', 'success');
  }

  toggleExpandir(venta: any) {
    venta.expandido = !venta.expandido;
    this.cdr.detectChanges();
  }

  // --- LÓGICA DEL REPORTE X (VENTAS DEL DÍA) ---
  modalReporteXVisible: boolean = false;
  totalesReporteX: any = {};

  abrirModalReporteX() {
    const hoy = new Date().toISOString().substring(0, 10);
    const ventasHoy = this.ventas.filter(v => v.fecha.startsWith(hoy) && v.estado === 'COMPLETADA');

    let ef = 0; let ta = 0; let ne = 0;
    
    const detalles_ventas = ventasHoy.map(v => {
      if(v.metodo_pago === 'EFECTIVO') ef += Number(v.total);
      if(v.metodo_pago === 'TARJETA') ta += Number(v.total);
      if(v.metodo_pago === 'NEQUI') ne += Number(v.total);

      return {
        ticket: v.numero_ticket,
        hora: new Date(v.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        metodo: v.metodo_pago,
        total: Number(v.total),
        productos: v.detalles.map(d => `${d.nombre_producto} (x${d.cantidad})`).join(', ')
      };
    });

    this.totalesReporteX = {
      efectivo: ef,
      tarjeta: ta,
      nequi: ne,
      total: ef + ta + ne,
      operaciones: ventasHoy.length,
      detalles_ventas: detalles_ventas
    };
    this.modalReporteXVisible = true;
  }

  cerrarModalReporteX() {
    this.modalReporteXVisible = false;
  }

  exportarReporteX() {
    this.exportService.exportarReporteXPDF(this.totalesReporteX);
    this.modalReporteXVisible = false;
  }

  calcularIngresos() {
    return this.getVentasFiltradas().reduce((sum, v) => sum + (v.estado === 'COMPLETADA' ? Number(v.total) : 0), 0);
  }

  exportarPDF() {
    const columns = ['Ticket', 'Fecha', 'Método', 'Vendedor', 'Productos', 'Total'];
    const dataToExport = this.ventas.map(v => {
      const productosStr = v.detalles.map(d => `- ${d.nombre_producto} (x${d.cantidad})`).join('\\n');
      return [
        v.numero_ticket,
        new Date(v.fecha).toLocaleDateString(),
        v.metodo_pago,
        v.vendedor,
        productosStr,
        `$ ${Number(v.total).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
      ];
    });

    const totalIngresos = this.calcularIngresos();
    dataToExport.push([
      '',
      '',
      '',
      '',
      'TOTAL GENERAL (COMPLETADAS):',
      `$ ${totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    ]);

    this.exportService.exportarPDF(columns, dataToExport, `Historial de Ventas (${this.fechaInicio} a ${this.fechaFin})`);
  }

  // --- MÉTODOS DE TABLA (FILTRADO Y PAGINACIÓN) ---
  getVentasFiltradas() {
    let filtrado = this.ventas;

    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio + 'T00:00:00');
      const fin = new Date(this.fechaFin + 'T23:59:59');
      filtrado = filtrado.filter(v => {
        const fechaVenta = new Date(v.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtrado = filtrado.filter(v => 
        (v.numero_ticket && v.numero_ticket.toLowerCase().includes(term)) ||
        (v.vendedor && v.vendedor.toLowerCase().includes(term)) ||
        (v.metodo_pago && v.metodo_pago.toLowerCase().includes(term))
      );
    }
    return filtrado;
  }

  getVentasPaginadas() {
    const filtrados = this.getVentasFiltradas();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtrados.slice(startIndex, startIndex + Number(this.itemsPerPage));
  }

  get totalPages(): number {
    return Math.ceil(this.getVentasFiltradas().length / this.itemsPerPage) || 1;
  }

  getPaginas(): number[] {
    const total = this.totalPages;
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
    const total = this.getVentasFiltradas().length;
    if (total === 0) return '0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    return `${start} a ${end}`;
  }
}
