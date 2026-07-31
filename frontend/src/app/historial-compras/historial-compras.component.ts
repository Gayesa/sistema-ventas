import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

interface Compra {
  id: string;
  numero_factura_proveedor: string;
  proveedor_id: string;
  fecha_compra: string;
  total_compra: number;
  proveedor_nombre?: string;
  detalles?: any[];
  expandido?: boolean;
}

@Component({
  selector: 'app-historial-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Historial de Compras</h2>
          <p class="text-textSecondary text-sm mt-1">Consulta las órdenes de ingreso y genera reportes por fecha.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <input type="date" [(ngModel)]="fechaInicio" class="border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0">
            <span class="text-slate-400">a</span>
            <input type="date" [(ngModel)]="fechaFin" class="border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0">
            <button (click)="cargarCompras()" class="bg-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors" title="Filtrar por fecha">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <button (click)="exportarExcel()" class="bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" title="Exportar a Excel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Excel
            </button>
            <button (click)="exportarPDF()" class="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" title="Exportar a PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      <div class="bg-surface rounded-2xl shadow-soft border border-slate-200 flex flex-col flex-1 overflow-hidden min-h-0">
        <!-- Toolbar Tabla -->
        <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-500">Mostrar</span>
            <select [(ngModel)]="itemsPerPage" (change)="currentPage = 1" class="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none shadow-sm cursor-pointer font-medium">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-sm font-medium text-slate-500">registros</span>
          </div>
          
          <div class="relative w-full sm:w-72">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" class="bg-white border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 outline-none shadow-sm transition-all placeholder-slate-400" placeholder="Buscar por factura o proveedor...">
          </div>
        </div>

        <div class="overflow-y-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-slate-50 z-10">
              <tr class="border-b border-slate-200 text-xs text-textSecondary uppercase tracking-wider shadow-sm">
                <th class="p-4 font-bold">Nº Factura / Remisión</th>
                <th class="p-4 font-bold">Fecha de Ingreso</th>
                <th class="p-4 font-bold">Proveedor</th>
                <th class="p-4 font-bold text-right">Total Compra</th>
                <th class="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <ng-container *ngFor="let compra of paginatedCompras">
                <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" (click)="compra.expandido = !compra.expandido">
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-primary">
                        <svg class="w-5 h-5 transition-transform" [class.rotate-90]="compra.expandido" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                      <p class="font-bold text-textMain font-mono">{{ compra.numero_factura_proveedor }}</p>
                    </div>
                  </td>
                  <td class="p-4 text-textSecondary text-sm font-medium">{{ compra.fecha_compra | date:'mediumDate' }}</td>
                  <td class="p-4 text-textMain text-sm font-medium">{{ getNombreProveedor(compra.proveedor_id) }}</td>
                  <td class="p-4 text-emerald-600 text-sm font-black text-right">{{ compra.total_compra | currency:'COP':'symbol':'1.0-0' }}</td>
                  <td class="p-4 text-center">
                    <button (click)="$event.stopPropagation(); exportarFacturaPDF(compra)" class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Exportar Factura PDF">
                      <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </button>
                  </td>
                </tr>
                
                <!-- Detalles expandibles -->
                <tr *ngIf="compra.expandido" class="bg-slate-50/50">
                  <td colspan="5" class="p-4 border-t border-slate-100">
                    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th class="p-3 text-xs text-textSecondary uppercase font-bold">Producto</th>
                            <th class="p-3 text-xs text-textSecondary uppercase font-bold text-center">Cant.</th>
                            <th class="p-3 text-xs text-textSecondary uppercase font-bold text-right">Costo Unit.</th>
                            <th class="p-3 text-xs text-textSecondary uppercase font-bold text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          <tr *ngFor="let det of compra.detalles" class="hover:bg-slate-50 transition-colors">
                            <td class="p-3 text-sm text-textMain font-medium">{{ det.producto?.producto?.nombre || 'Producto Desconocido' }} <span class="text-xs text-slate-400 ml-2 font-mono">{{ det.producto?.sku }}</span></td>
                            <td class="p-3 text-sm text-textMain text-center font-bold">{{ det.cantidad }}</td>
                            <td class="p-3 text-sm text-slate-600 text-right">{{ det.costo_unitario | currency:'COP':'symbol':'1.0-0' }}</td>
                            <td class="p-3 text-sm text-emerald-600 font-bold text-right">{{ det.subtotal | currency:'COP':'symbol':'1.0-0' }}</td>
                          </tr>
                          <tr *ngIf="!compra.detalles?.length">
                            <td colspan="4" class="p-4 text-center text-sm text-slate-500">No hay detalles registrados para esta compra.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </ng-container>
              <tr *ngIf="paginatedCompras.length === 0">
                <td colspan="5" class="p-16 text-center text-textSecondary">
                  <div class="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                  </div>
                  <p class="text-lg font-medium text-slate-700">No hay órdenes de compra registradas</p>
                  <p class="text-sm mt-1">Ajusta las fechas o ingresa mercancía nueva.</p>
                </td>
              </tr>
            </tbody>
            <tfoot *ngIf="compras.length > 0" class="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colspan="3" class="p-4 text-right font-bold text-textMain uppercase text-xs">Total del Periodo:</td>
                <td class="p-4 text-right font-black text-primary text-lg">{{ calcularTotalPeriodo() | currency:'COP':'symbol':'1.0-0' }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <span class="text-sm text-slate-600 font-medium">
            Mostrando <span class="font-bold text-slate-900">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> a 
            <span class="font-bold text-slate-900">{{ currentPage * itemsPerPage > filteredCompras.length ? filteredCompras.length : currentPage * itemsPerPage }}</span> de 
            <span class="font-bold text-slate-900">{{ filteredCompras.length }}</span> registros
          </span>
          
          <div class="flex items-center gap-1">
            <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1 shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              Anterior
            </button>
            
            <div class="flex items-center gap-1 px-2">
              <span class="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{{ currentPage }} / {{ totalPages }}</span>
            </div>
            
            <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1 shadow-sm">
              Siguiente
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HistorialComprasComponent implements OnInit {
  compras: Compra[] = [];
  proveedores: any[] = [];
  fechaInicio: string = '';
  fechaFin: string = '';

  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private exportService: ExportService) {}

  ngOnInit() {
    const date = new Date();
    this.fechaInicio = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().substring(0, 10);
    this.fechaFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().substring(0, 10);
    
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.http.get<any[]>(`${environment.apiUrl}/proveedores`).subscribe({
      next: (data) => {
        this.proveedores = data;
        this.cdr.detectChanges();
        this.cargarCompras();
      },
      error: (err) => console.error('Error cargando proveedores', err)
    });
  }

  cargarCompras() {
    let url = `${environment.apiUrl}/compras`;
    const params = new URLSearchParams();
    if (this.fechaInicio) params.append('fechaInicio', this.fechaInicio);
    if (this.fechaFin) params.append('fechaFin', this.fechaFin);
    if (params.toString()) url += '?' + params.toString();

    this.http.get<Compra[]>(url).subscribe({
      next: (data) => {
        this.compras = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando historial de compras', err)
    });
  }

  getNombreProveedor(id: string) {
    return this.proveedores.find(p => p.id === id)?.razon_social || id;
  }

  get filteredCompras() {
    let result = this.compras;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c => 
        c.numero_factura_proveedor.toLowerCase().includes(term) ||
        this.getNombreProveedor(c.proveedor_id).toLowerCase().includes(term)
      );
    }
    return result;
  }

  get totalPages() {
    return Math.ceil(this.filteredCompras.length / this.itemsPerPage) || 1;
  }

  get paginatedCompras() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCompras.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  calcularTotalPeriodo() {
    return this.filteredCompras.reduce((acc, curr) => acc + Number(curr.total_compra), 0);
  }

  exportarExcel() {
    const dataToExport = this.compras.map(c => {
      const productosStr = c.detalles?.map(d => `${d.producto?.producto?.nombre || 'Producto'} (Cant: ${d.cantidad}, Costo: $ ${Number(d.costo_unitario).toLocaleString('es-CO', { maximumFractionDigits: 0 })})`).join(' | ') || 'Sin detalles';
      return {
        'Nº Factura': c.numero_factura_proveedor,
        'Fecha Ingreso': new Date(c.fecha_compra).toLocaleDateString(),
        'Proveedor': this.getNombreProveedor(c.proveedor_id),
        'Productos': productosStr,
        'Total Compra': c.total_compra
      };
    });
    this.exportService.exportarExcel(dataToExport, `Reporte_Compras_${this.fechaInicio}_${this.fechaFin}`);
  }

  exportarPDF() {
    const columns = ['Nº Factura', 'Fecha Ingreso', 'Proveedor', 'Productos', 'Total Compra'];
    const dataToExport = this.compras.map(c => {
      const productosStr = c.detalles?.map(d => {
        let nombreProd = d.producto?.producto?.nombre || 'Producto';
        
        // Formateo específico solicitado para nombres largos (Ej. separar después de Tipo 2)
        if (nombreProd.includes('Tipo 2 Dorado')) {
          nombreProd = nombreProd.replace('Tipo 2 Dorado', 'Tipo 2\n  Dorado');
        } else if (nombreProd.length > 35) {
          let splitIndex = nombreProd.lastIndexOf(' ', 35);
          if (splitIndex !== -1) {
            nombreProd = nombreProd.substring(0, splitIndex) + '\n  ' + nombreProd.substring(splitIndex + 1);
          }
        }
        
        return `- ${nombreProd} (x${d.cantidad})`;
      }).join('\n\n') || 'Sin detalles';

      return [
        c.numero_factura_proveedor,
        new Date(c.fecha_compra).toLocaleDateString(),
        this.getNombreProveedor(c.proveedor_id),
        productosStr,
        `$ ${Number(c.total_compra).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
      ];
    });
    this.exportService.exportarPDF(columns, dataToExport, `Reporte de Compras (${this.fechaInicio} a ${this.fechaFin})`);
  }

  exportarFacturaPDF(compra: Compra) {
    const compraConProveedor = {
      ...compra,
      proveedor_nombre: this.getNombreProveedor(compra.proveedor_id)
    };
    this.exportService.exportarFacturaComercialPDF(compraConProveedor);
  }
}
