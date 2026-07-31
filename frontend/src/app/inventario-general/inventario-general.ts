import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { RefreshService } from '../services/refresh.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

interface InventarioItem {
  id: string;
  sku: string;
  nombre_producto: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  cantidad_vendida: number;
  stock_minimo: number;
  stock_actual: number;
  valor_compra: number;
  valor_venta: number;
}

interface MovimientoKardex {
  factura: string;
  fecha: string;
  cantidad: number;
  valor_unitario: number;
  total: number;
}

@Component({
  selector: 'app-inventario-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Inventario General</h2>
          <p class="text-textSecondary text-sm mt-1">Control total de stock, movimientos y valorización de la mercancía.</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Búsqueda -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (input)="filtrarInventario()"
              placeholder="Buscar por nombre o SKU..." 
              class="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm w-64"
            >
          </div>
          
          <!-- Mostrar Registros -->
          <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-sm font-medium text-slate-500">Mostrar</span>
            <select [(ngModel)]="itemsPerPage" (ngModelChange)="currentPage = 1; paginarInventario()" class="border-none bg-transparent py-1 pl-2 pr-6 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-sm font-medium text-slate-500">registros</span>
          </div>
          
          <!-- Filtro Agotándose -->
          <button (click)="toggleFiltroAgotandose()" 
                  [class.bg-rose-50]="mostrarAgotandoseSolo" 
                  [class.text-rose-700]="mostrarAgotandoseSolo"
                  [class.border-rose-300]="mostrarAgotandoseSolo"
                  [class.bg-white]="!mostrarAgotandoseSolo"
                  [class.text-slate-600]="!mostrarAgotandoseSolo"
                  [class.border-slate-200]="!mostrarAgotandoseSolo"
                  class="border px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm whitespace-nowrap" title="Ver solo productos agotándose">
            <svg class="w-4 h-4" [class.animate-pulse]="mostrarAgotandoseSolo" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Agotándose
          </button>
          
          <!-- Botones de Exportación -->
          <button (click)="exportarExcel()" class="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm" title="Exportar a Excel">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Excel
          </button>
          <button (click)="exportarPDF()" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm" title="Exportar a PDF">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            PDF
          </button>
        </div>
      </div>

      <!-- Tabla de Datos -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-4 py-3">Código (SKU)</th>
                <th class="px-4 py-3 w-1/4">Producto</th>
                <th class="px-4 py-3 text-center">Últ. Ingreso</th>
                <th class="px-4 py-3 text-center">Últ. Salida</th>
                <th class="px-4 py-3 text-center">Stock Mín.</th>
                <th class="px-4 py-3 text-center">Stock Act.</th>
                <th class="px-4 py-3 text-center">Cant. Vendida</th>
                <th class="px-4 py-3 text-right">V. Compra</th>
                <th class="px-4 py-3 text-right">V. Venta</th>
                <th class="px-4 py-3 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of inventarioPaginado" (click)="abrirKardex(item)" class="hover:bg-slate-50/80 transition-colors text-sm cursor-pointer group">
                <td class="px-4 py-3 font-mono text-indigo-600 font-bold bg-indigo-50/50 rounded-l-lg group-hover:bg-indigo-100/50 transition-colors">{{ item.sku }}</td>
                <td class="px-4 py-3 font-bold text-textMain whitespace-normal break-words leading-tight min-w-[200px]">
                  <div>{{ item.nombre_producto }}</div>
                  <div *ngIf="item.stock_actual <= item.stock_minimo" class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shadow-sm">
                    <svg class="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    ¡Agotándose!
                  </div>
                </td>
                <td class="px-4 py-3 text-center text-slate-600">{{ item.fecha_ingreso | date:'dd/MM/yyyy' }}</td>
                <td class="px-4 py-3 text-center text-slate-600">
                  <span *ngIf="item.fecha_salida">{{ item.fecha_salida | date:'dd/MM/yyyy' }}</span>
                  <span *ngIf="!item.fecha_salida" class="text-slate-400 italic">Sin salidas</span>
                </td>
                <td class="px-4 py-3 text-center text-slate-600">{{ item.stock_minimo }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2.5 py-1 rounded-lg font-bold text-xs" 
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': item.stock_actual > item.stock_minimo,
                          'bg-amber-100 text-amber-700': item.stock_actual === item.stock_minimo,
                          'bg-rose-100 text-rose-700': item.stock_actual < item.stock_minimo
                        }">
                    {{ item.stock_actual }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ item.cantidad_vendida }}</td>
                <td class="px-4 py-3 text-right text-slate-600">{{ item.valor_compra | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-semibold text-textMain">{{ item.valor_venta | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-indigo-600">{{ (item.valor_venta * item.cantidad_vendida) | currency:'COP':'symbol':'1.0-0' }}</td>
              </tr>
              <tr *ngIf="inventarioPaginado.length === 0">
                <td colspan="9" class="px-4 py-12 text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  </div>
                  <h3 class="text-lg font-medium text-slate-900">No se encontraron productos</h3>
                  <p class="text-slate-500 mt-1">El inventario está vacío o no coincide con la búsqueda.</p>
                </td>
              </tr>
            </tbody>
            <!-- Footer con Totales -->
            <tfoot *ngIf="inventarioPaginado.length > 0" class="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colspan="5" class="px-4 py-3 text-right font-bold text-xs uppercase text-slate-500">Valorización Total (Filtro):</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ totalArticulos }} und</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ totalVendidos }} und</td>
                <td class="px-4 py-3 text-right font-bold text-slate-700">{{ valorizacionCompra | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-slate-700">{{ valorizacionVenta | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-indigo-700">{{ valorTotalVendido | currency:'COP':'symbol':'1.0-0' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 gap-4">
          <span class="text-sm text-slate-500 font-medium">
            Mostrando <span class="font-bold text-slate-700">{{ getPaginacionTexto() }}</span> de <span class="font-bold text-slate-700">{{ inventarioFiltrado.length }}</span> registros
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

    <!-- Modal de Kardex -->
    <div *ngIf="modalKardexVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="cerrarKardex()"></div>
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col relative z-10 animate-fade-in-up">
        
        <!-- Header del Modal -->
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div>
            <div class="flex items-center gap-3">
              <span class="bg-indigo-100 text-indigo-700 font-mono font-bold px-3 py-1 rounded-lg text-sm">{{ productoSeleccionado?.sku }}</span>
              <h3 class="text-xl font-bold text-textMain">{{ productoSeleccionado?.nombre_producto }}</h3>
            </div>
            <p class="text-sm text-slate-500 mt-1">Historial de movimientos: Entradas y Salidas</p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="exportarKardexPDF()" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Exportar PDF
            </button>
            <button (click)="cerrarKardex()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <!-- Cuerpo del Modal (2 Columnas) -->
        <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          
          <!-- Indicador de Stock Actual -->
          <div class="mb-6 flex items-center">
            <div class="inline-flex items-center gap-3 bg-white border border-slate-200 shadow-sm px-4 py-2.5 rounded-xl">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" 
                   [ngClass]="{
                     'bg-emerald-100 text-emerald-600': productoSeleccionado?.stock_actual! > productoSeleccionado?.stock_minimo!,
                     'bg-amber-100 text-amber-600': productoSeleccionado?.stock_actual! === productoSeleccionado?.stock_minimo!,
                     'bg-rose-100 text-rose-600': productoSeleccionado?.stock_actual! < productoSeleccionado?.stock_minimo!
                   }">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Stock Actual</span>
                <span class="text-xl font-black leading-tight"
                      [ngClass]="{
                        'text-emerald-700': productoSeleccionado?.stock_actual! > productoSeleccionado?.stock_minimo!,
                        'text-amber-700': productoSeleccionado?.stock_actual! === productoSeleccionado?.stock_minimo!,
                        'text-rose-700': productoSeleccionado?.stock_actual! < productoSeleccionado?.stock_minimo!
                      }">
                  {{ productoSeleccionado?.stock_actual }} und
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Columna Compras (Entradas) -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="bg-emerald-50 border-b border-emerald-100 px-5 py-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                </div>
                <h4 class="font-bold text-emerald-800 text-lg">Compras (Ingresos)</h4>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                  <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th class="px-4 py-3">Factura</th>
                      <th class="px-4 py-3">Fecha Ent.</th>
                      <th class="px-4 py-3 text-center">Cant.</th>
                      <th class="px-4 py-3 text-right">V. Unitario</th>
                      <th class="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr *ngFor="let c of comprasKardex" class="hover:bg-emerald-50/30 transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-600">{{ c.factura }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-4 py-3 text-center font-bold text-emerald-600">+{{ c.cantidad }}</td>
                      <td class="px-4 py-3 text-right text-slate-600">{{ c.valor_unitario | currency:'COP':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-emerald-700">{{ c.total | currency:'COP':'symbol':'1.0-0' }}</td>
                    </tr>
                    <tr *ngIf="comprasKardex.length === 0">
                      <td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">No hay ingresos registrados</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Columna Ventas (Salidas) -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="bg-indigo-50 border-b border-indigo-100 px-5 py-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path></svg>
                </div>
                <h4 class="font-bold text-indigo-800 text-lg">Ventas (Salidas)</h4>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                  <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th class="px-4 py-3">Factura/Ticket</th>
                      <th class="px-4 py-3">Fecha Sal.</th>
                      <th class="px-4 py-3 text-center">Cant.</th>
                      <th class="px-4 py-3 text-right">V. Venta U.</th>
                      <th class="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr *ngFor="let v of ventasKardex" class="hover:bg-indigo-50/30 transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-600">{{ v.factura }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ v.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-4 py-3 text-center font-bold text-rose-500">-{{ v.cantidad }}</td>
                      <td class="px-4 py-3 text-right text-slate-600">{{ v.valor_unitario | currency:'COP':'symbol':'1.0-0' }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-indigo-700">{{ v.total | currency:'COP':'symbol':'1.0-0' }}</td>
                    </tr>
                    <tr *ngIf="ventasKardex.length === 0">
                      <td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">No hay salidas registradas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class InventarioGeneralComponent implements OnInit {
  searchTerm: string = '';
  mostrarAgotandoseSolo: boolean = false;
  inventarioOriginal: InventarioItem[] = [];
  inventarioFiltrado: InventarioItem[] = [];
  inventarioPaginado: InventarioItem[] = [];
  
  // Paginación
  itemsPerPage: number = 10;
  currentPage: number = 1;

  // Totales
  totalArticulos: number = 0;
  totalVendidos: number = 0;
  valorizacionCompra: number = 0;
  valorizacionVenta: number = 0;
  valorTotalVendido: number = 0;

  // Kardex Modal State
  modalKardexVisible: boolean = false;
  productoSeleccionado: InventarioItem | null = null;
  comprasKardex: MovimientoKardex[] = [];
  ventasKardex: MovimientoKardex[] = [];
  refreshSub!: Subscription;

  constructor(private exportService: ExportService, private http: HttpClient, private cdr: ChangeDetectorRef, private refreshService: RefreshService) {}

  ngOnInit() {
    this.cargarInventario();
    
    this.refreshSub = this.refreshService.refresh$.subscribe(route => {
      if (route === '/admin/inventario-general') {
        this.cargarInventario();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  cargarInventario() {
    this.http.get<any[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (data) => {
        this.inventarioOriginal = data.map(p => {
          const variante = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
          return {
            id: p.id,
            sku: variante ? variante.sku : '',
            nombre_producto: p.nombre,
            fecha_ingreso: p.created_at || new Date().toISOString(),
            fecha_salida: variante && variante.last_sale_date ? variante.last_sale_date : null,
            cantidad_vendida: variante && variante.total_sold ? Number(variante.total_sold) : 0,
            stock_minimo: variante ? Number(variante.stock_minimo) : 10,
            stock_actual: variante ? Number(variante.stock_actual) : 0,
            valor_compra: variante ? Number(variante.precio_compra) : 0,
            valor_venta: variante ? Number(variante.precio_venta) : 0
          };
        });
        this.filtrarInventario();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando inventario general', err)
    });
  }

  toggleFiltroAgotandose() {
    this.mostrarAgotandoseSolo = !this.mostrarAgotandoseSolo;
    this.filtrarInventario();
  }

  filtrarInventario() {
    let filtrado = this.inventarioOriginal;

    if (this.mostrarAgotandoseSolo) {
      filtrado = filtrado.filter(item => item.stock_actual <= item.stock_minimo);
    }

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      filtrado = filtrado.filter(item => 
        item.nombre_producto.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term)
      );
    }
    
    this.inventarioFiltrado = filtrado;
    this.calcularTotales();
    
    this.currentPage = 1;
    this.paginarInventario();
  }

  paginarInventario() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.inventarioPaginado = this.inventarioFiltrado.slice(startIndex, startIndex + Number(this.itemsPerPage));
    this.cdr.detectChanges();
  }

  get totalPages(): number {
    return Math.ceil(this.inventarioFiltrado.length / this.itemsPerPage) || 1;
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
      this.paginarInventario();
    }
  }

  getPaginacionTexto(): string {
    const total = this.inventarioFiltrado.length;
    if (total === 0) return '0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    return `${start} a ${end}`;
  }

  calcularTotales() {
    this.totalArticulos = 0;
    this.totalVendidos = 0;
    this.valorizacionCompra = 0;
    this.valorizacionVenta = 0;
    this.valorTotalVendido = 0;

    this.inventarioFiltrado.forEach(item => {
      this.totalArticulos += item.stock_actual;
      this.totalVendidos += item.cantidad_vendida;
      this.valorizacionCompra += (item.valor_compra * item.stock_actual);
      this.valorizacionVenta += (item.valor_venta * item.stock_actual);
      this.valorTotalVendido += (item.valor_venta * item.cantidad_vendida);
    });
  }

  exportarExcel() {
    const dataToExport = this.inventarioFiltrado.map(item => ({
      'Código (SKU)': item.sku,
      'Producto': item.nombre_producto,
      'Último Ingreso': new Date(item.fecha_ingreso).toLocaleDateString(),
      'Última Salida': item.fecha_salida ? new Date(item.fecha_salida).toLocaleDateString() : 'Sin salidas',
      'Stock Mínimo': item.stock_minimo,
      'Stock Actual': item.stock_actual,
      'Cant. Vendida': item.cantidad_vendida,
      'Valor Compra Unit.': item.valor_compra,
      'Valor Venta Unit.': item.valor_venta,
      'Valor Total (Vendido)': item.valor_venta * item.cantidad_vendida,
      'Valorización (Costo)': item.valor_compra * item.stock_actual,
      'Valorización (Venta)': item.valor_venta * item.stock_actual
    }));
    
    this.exportService.exportarExcel(dataToExport, 'Reporte_Inventario_General');
  }

  exportarPDF() {
    const columns = [
      'SKU', 
      'Producto', 
      'Últ. Ing.', 
      'Últ. Sal.', 
      'S. Mín.',
      'S.Act.',
      'C. Vendida', 
      'V.Compra', 
      'V.Venta',
      'V.Total'
    ];
    
    const dataToExport = this.inventarioFiltrado.map(item => [
      item.sku,
      item.nombre_producto.length > 25 
        ? item.nombre_producto.substring(0, 25) + '...\n' + item.nombre_producto.substring(25, 50) 
        : item.nombre_producto,
      new Date(item.fecha_ingreso).toLocaleDateString(),
      item.fecha_salida ? new Date(item.fecha_salida).toLocaleDateString() : '-',
      item.stock_minimo.toString(),
      item.stock_actual.toString(),
      item.cantidad_vendida.toString(),
      `$ ${item.valor_compra.toLocaleString('es-CO')}`,
      `$ ${item.valor_venta.toLocaleString('es-CO')}`,
      `$ ${(item.valor_venta * item.cantidad_vendida).toLocaleString('es-CO')}`
    ]);
    
    this.exportService.exportarPDF(columns, dataToExport, 'Inventario General Valorizado');
  }

  // --- KARDEX MODAL LOGIC ---
  abrirKardex(item: InventarioItem) {
    this.productoSeleccionado = item;
    
    this.http.get<any>(`${environment.apiUrl}/productos/${item.id}/kardex`).subscribe({
      next: (kardex) => {
        this.comprasKardex = kardex.compras.map((c: any) => ({
          factura: c.factura,
          fecha: c.fecha,
          cantidad: Number(c.cantidad),
          valor_unitario: Number(c.valor_unitario),
          total: Number(c.total)
        }));
        
        this.ventasKardex = kardex.ventas.map((v: any) => ({
          factura: v.factura,
          fecha: v.fecha,
          cantidad: Number(v.cantidad),
          valor_unitario: Number(v.valor_unitario),
          total: Number(v.total)
        }));
        
        this.modalKardexVisible = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching kardex', err);
        this.comprasKardex = [];
        this.ventasKardex = [];
        this.modalKardexVisible = true;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarKardex() {
    this.modalKardexVisible = false;
    this.productoSeleccionado = null;
  }

  exportarKardexPDF() {
    if (!this.productoSeleccionado) return;
    this.exportService.exportarKardexPDF(this.productoSeleccionado, this.comprasKardex, this.ventasKardex);
  }
}
