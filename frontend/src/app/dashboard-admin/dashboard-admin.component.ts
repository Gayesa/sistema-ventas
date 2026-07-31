import { BaseChartDirective } from 'ng2-charts';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReportesService } from '../reportes.service';
import { ExportService } from '../services/export.service';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BaseChartDirective],
  selector: 'app-dashboard-admin',
  template: `
    <div class="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{{ isSuperAdmin ? 'Dashboard Global' : 'Mi Dashboard' }}</h2>
          <p class="text-slate-500 text-sm sm:text-base mt-1">{{ isSuperAdmin ? 'Resumen de actividad y métricas financieras de todo el sistema SaaS.' : 'Resumen de actividad y métricas de tu empresa.' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span class="text-sm font-semibold text-slate-700">Hoy: {{ fechaActual | date:'longDate' }}</span>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Empresas Registradas -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">{{ isSuperAdmin ? 'Empresas' : 'Total Ventas' }}</p>
              <h3 class="text-3xl font-black text-slate-800">{{ stats.empresas }}</h3>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <span class="text-emerald-500 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  12%
                </span>
                <span class="text-slate-400">vs mes anterior</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
          </div>
        </div>

        <!-- Administradores -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">{{ isSuperAdmin ? 'Administradores' : 'Total Compras' }}</p>
              <h3 class="text-3xl font-black text-slate-800">{{ stats.admins }}</h3>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <span class="text-emerald-500 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  5%
                </span>
                <span class="text-slate-400">vs mes anterior</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Ingresos -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Ingresos</p>
              <h3 class="text-3xl font-black text-slate-800">{{ stats.ingresos | currency:'COP':'symbol':'1.0-0' }}</h3>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <span class="text-emerald-500 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  18%
                </span>
                <span class="text-slate-400">vs mes anterior</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Ganancias Neta -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-xl transition-transform group-hover:scale-125"></div>
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-1">Ganancias Neta</p>
              <h3 class="text-3xl font-black text-white">{{ stats.ganancias | currency:'COP':'symbol':'1.0-0' }}</h3>
              <div class="flex items-center gap-1 mt-2 text-sm">
                <span class="text-emerald-400 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                  24%
                </span>
                <span class="text-slate-400">vs mes anterior</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-inner backdrop-blur-sm border border-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- Bar Chart: Ingresos vs Gastos vs Ganancias -->
        <div [class.lg:col-span-3]="!isSuperAdmin" [class.lg:col-span-2]="isSuperAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Flujo Financiero</h3>
              <p class="text-sm text-slate-500">{{ isSuperAdmin ? 'Comparativa por Empresa (Ingresos, Gastos, Ganancias)' : 'Ingresos vs Gastos vs Ganancias (Últimos 7 meses)' }}</p>
            </div>
            <select class="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2">
              <option>Últimos 7 meses</option>
              <option>Este Año</option>
            </select>
          </div>
          <div class="flex-grow relative h-72 w-full">
             <canvas baseChart
              [datasets]="barChartData"
              [labels]="barChartLabels"
              [options]="barChartOptions"
              [legend]="true"
              [type]="'bar'">
            </canvas>
          </div>
        </div>

        <!-- Doughnut Chart: Artículos por Empresa -->
        <div *ngIf="isSuperAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
           <div class="mb-4">
              <h3 class="text-lg font-bold text-slate-800">Artículos por Empresa</h3>
              <p class="text-sm text-slate-500">Distribución de inventario top</p>
            </div>
          <div class="flex-grow relative flex items-center justify-center h-64 w-full">
            <canvas baseChart
              [datasets]="doughnutChartData"
              [labels]="doughnutChartLabels"
              [options]="doughnutChartOptions"
              [legend]="true"
              [type]="'doughnut'">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Top Productos Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Top 10 Artículos Más Vendidos</h3>
            <p class="text-sm text-slate-500">{{ isSuperAdmin ? 'Los productos con mejor rendimiento en todas las empresas.' : 'Tus productos con mejor rendimiento.' }}</p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative w-full sm:w-64">
              <svg class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Buscar producto..." [(ngModel)]="searchTerm" (input)="currentPage = 1" class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50">
            </div>
            <button (click)="exportarExcel()" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2" title="Exportar a Excel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Excel
            </button>
            <button (click)="exportarPDF()" class="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2" title="Exportar a PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              PDF
            </button>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                <th class="p-4 font-semibold">Producto</th>
                <th *ngIf="isSuperAdmin" class="p-4 font-semibold">
                  Empresa
                  <select [(ngModel)]="filterEmpresa" (change)="currentPage = 1" class="ml-2 border border-slate-200 rounded text-xs bg-white font-normal text-slate-700 px-1 py-0.5">
                    <option value="">Todas</option>
                    <option *ngFor="let emp of getEmpresasUnicas()" [value]="emp">{{ emp }}</option>
                  </select>
                </th>
                <th class="p-4 font-semibold">SKU</th>
                <th class="p-4 font-semibold text-right">Cant. Vendida</th>
                <th class="p-4 font-semibold text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of paginatedProductos; let i = index" class="hover:bg-slate-50/50 transition-colors group">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm border border-indigo-100">
                       {{ i + 1 + startIndex }}
                    </div>
                    <div>
                      <p class="font-bold text-slate-800">{{ item.producto }}</p>
                      <p class="text-xs text-slate-500">{{ item.categoria || 'General' }}</p>
                    </div>
                  </div>
                </td>
                <td *ngIf="isSuperAdmin" class="p-4 text-slate-600 text-sm font-medium">
                  <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">{{ item.empresa || 'SaaS Default' }}</span>
                </td>
                <td class="p-4 text-slate-500 text-sm font-mono">{{ item.sku }}</td>
                <td class="p-4 text-slate-800 text-sm font-bold text-right">{{ item.cantidad_vendida | number }}</td>
                <td class="p-4 text-emerald-600 text-sm font-bold text-right">{{ item.ingresos_generados | currency:'COP':'symbol':'1.0-0' }}</td>
              </tr>
              <tr *ngIf="paginatedProductos.length === 0">
                <td colspan="5" class="p-12 text-center text-slate-500">
                  <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  <p class="text-lg font-medium text-slate-600">No se encontraron productos.</p>
                  <p class="text-sm">Intenta con otros términos de búsqueda.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="bg-white border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-500">Mostrar</span>
            <select [(ngModel)]="pageSize" (change)="changePageSize()" class="border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-700 outline-none">
              <option [ngValue]="5">5</option>
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
            </select>
            <p class="text-sm text-slate-500 hidden sm:block">
              Mostrando <span class="font-semibold text-slate-700">{{ filteredProductos.length > 0 ? startIndex + 1 : 0 }}</span> a <span class="font-semibold text-slate-700">{{ endIndex }}</span> de <span class="font-semibold text-slate-700">{{ filteredProductos.length }}</span>
            </p>
          </div>
          
          <nav class="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
            <button (click)="previousPage()" [disabled]="currentPage === 1" class="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <span class="sr-only">Anterior</span>
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <span class="sr-only">Siguiente</span>
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `
})
export class DashboardAdminComponent implements OnInit {
  fechaActual = new Date();
  
  isSuperAdmin = false;

  // KPI Stats
  stats = {
    empresas: 0,
    admins: 0,
    ingresos: 0,
    gastos: 0,
    ganancias: 0
  };

  topProductos: any[] = [];
  
  // Paginación y Búsqueda
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  filterEmpresa = '';

  getEmpresasUnicas() {
    const empresas = this.topProductos.map(p => p.empresa);
    return Array.from(new Set(empresas));
  }
  
  get filteredProductos() {
    let source = this.topProductos;

    if (this.filterEmpresa) {
      source = source.filter(p => p.empresa === this.filterEmpresa);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      source = source.filter(p => 
        p.producto.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term) ||
        (p.categoria && p.categoria.toLowerCase().includes(term)) ||
        (p.empresa && p.empresa.toLowerCase().includes(term)) ||
        p.cantidad_vendida.toString().includes(term) ||
        p.ingresos_generados.toString().includes(term)
      );
    }
    
    return source;
  }
  
  get paginatedProductos() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProductos.slice(start, start + this.pageSize);
  }

  get totalPages() { return Math.ceil(this.filteredProductos.length / this.pageSize) || 1; }
  get startIndex() { return (this.currentPage - 1) * this.pageSize; }
  get endIndex() { const end = this.currentPage * this.pageSize; return end > this.filteredProductos.length ? this.filteredProductos.length : end; }
  
  changePageSize() { this.currentPage = 1; }
  previousPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  
  // --- CHART CONFIGURATION (V2 SYNTAX) ---
  
  // Flujo Financiero Chart (Bar)
  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  };

  public barChartLabels: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
  public barChartData: any[] = [
    { data: [45000, 52000, 48000, 61000, 59000, 65000, 72000], label: 'Ingresos', backgroundColor: '#10b981' },
    { data: [18000, 20000, 19000, 22000, 21000, 24000, 26000], label: 'Gastos', backgroundColor: '#f43f5e' },
    { data: [27000, 32000, 29000, 39000, 38000, 41000, 46000], label: 'Ganancias', backgroundColor: '#6366f1' }
  ];

  // Artículos por Empresa Chart (Doughnut)
  public doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
  };

  public doughnutChartLabels: string[] = ['Tech Store', 'FarmaSalud', 'SuperMarket', 'Moda Center', 'Otros'];
  public doughnutChartData: any[] = [
    {
      data: [4500, 3200, 2800, 2100, 1500],
      backgroundColor: ['#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#94a3b8']
    }
  ];

  constructor(private reportesService: ReportesService, private exportService: ExportService, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.role === 'SUPER_ADMIN') {
      this.isSuperAdmin = true;
    }
    this.cargarDatosReales();
  }

  cargarDatosReales() {
    if (this.isSuperAdmin) {
      this.reportesService.getSuperAdminDashboardStats().subscribe({
        next: (data) => {
          if (data) {
            this.stats = data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching dashboard stats', err)
      });

      this.reportesService.getSuperAdminTopProductos().subscribe({
        next: (data) => {
          if (data) {
            this.topProductos = data;
            
            // Actualizar Doughnut Chart
            let obj: any = {};
            data.forEach((p: any) => {
              const emp = p.empresa || 'SaaS Default';
              obj[emp] = (obj[emp] || 0) + Number(p.cantidad_vendida);
            });
            this.doughnutChartLabels = Object.keys(obj);
            this.doughnutChartData = [{
              data: Object.values(obj),
              backgroundColor: ['#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#94a3b8']
            }];
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching top products', err)
      });

      this.reportesService.getSuperAdminFinanzasGlobales().subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.barChartLabels = data.map(d => d.nombre);
            this.barChartData = [
              { data: data.map(d => d.total_ventas), label: 'Ingresos', backgroundColor: '#10b981' },
              { data: data.map(d => d.inversion_compras), label: 'Gastos', backgroundColor: '#f43f5e' },
              { data: data.map(d => d.ganancia_bruta), label: 'Ganancias', backgroundColor: '#6366f1' }
            ];
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching global finances', err)
      });
    } else {
      this.reportesService.getAdminDashboardStats().subscribe({
        next: (data) => {
          if (data) {
            this.stats = data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching dashboard stats admin', err)
      });

      this.reportesService.getTopProductos().subscribe({
        next: (data) => {
          if (data) {
            this.topProductos = data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching top products admin', err)
      });
    }
  }

  // --- EXPORTACIÓN ---
  exportarExcel() {
    const dataToExport = this.filteredProductos.map(item => ({
      'Producto': item.producto,
      'Empresa': item.empresa || 'SaaS Default',
      'SKU': item.sku,
      'Cantidad Vendida': item.cantidad_vendida,
      'Ingresos Generados': `$${Number(item.ingresos_generados).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    }));
    this.exportService.exportarExcel(dataToExport, 'Top_Articulos_Mas_Vendidos');
  }

  exportarPDF() {
    const columns = ['Producto', 'Empresa', 'SKU', 'Cantidad', 'Ingresos'];
    const dataToExport = this.filteredProductos.map(item => [
      item.producto,
      item.empresa || 'SaaS Default',
      item.sku,
      item.cantidad_vendida.toString(),
      `$${Number(item.ingresos_generados).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Top Artículos Más Vendidos Global');
  }
}
