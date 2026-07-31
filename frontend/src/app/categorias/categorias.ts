import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  parent_id?: string | null;
  parent?: Categoria;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Gestión de Categorías</h2>
          <p class="text-textSecondary text-sm mt-1">Administra la jerarquía de categorías para tu catálogo de productos.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative">
            <svg class="w-5 h-5 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" [(ngModel)]="searchTerm" (input)="filterData()" placeholder="Buscar..." class="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white w-64">
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
            Nueva {{ activeTab === 'PADRES' ? 'Categoría' : 'Subcategoría' }}
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="mb-6 border-b border-slate-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button (click)="cambiarTab('PADRES')" [class.border-primary]="activeTab === 'PADRES'" [class.text-primary]="activeTab === 'PADRES'" [class.border-transparent]="activeTab !== 'PADRES'" [class.text-textSecondary]="activeTab !== 'PADRES'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Categorías Principales (Padres)
          </button>
          <button (click)="cambiarTab('HIJAS')" [class.border-primary]="activeTab === 'HIJAS'" [class.text-primary]="activeTab === 'HIJAS'" [class.border-transparent]="activeTab !== 'HIJAS'" [class.text-textSecondary]="activeTab !== 'HIJAS'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Subcategorías (Hijas)
          </button>
        </nav>
      </div>

      <!-- Tabla Estándar -->
      <div class="bg-surface rounded-xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm text-textSecondary uppercase tracking-wider">
              <th class="p-4 font-medium">Nombre</th>
              <th class="p-4 font-medium">Descripción</th>
              <th *ngIf="activeTab === 'HIJAS'" class="p-4 font-medium">
                Categoría Padre
                <select [(ngModel)]="filterParentId" (change)="filterData()" class="ml-2 border border-slate-200 rounded text-xs bg-white font-normal text-textMain px-1 py-0.5" style="max-width: 120px;">
                  <option value="">Todas</option>
                  <option *ngFor="let cat of categoriasPrincipales" [value]="cat.id">{{ cat.nombre }}</option>
                </select>
              </th>
              <th class="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let cat of paginatedData" class="hover:bg-slate-50/50 transition-colors group">
              <td class="p-4 font-medium text-textMain">
                {{ cat.nombre }}
              </td>
              <td class="p-4 text-textSecondary text-sm">{{ cat.descripcion || 'Sin descripción' }}</td>
              <td *ngIf="activeTab === 'HIJAS'" class="p-4 text-sm font-medium">
                <span [ngClass]="getColorClasses(cat.parent_id)" class="px-2 py-1 rounded-md border">
                  {{ getNombrePadre(cat.parent_id) }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button (click)="abrirModal(cat)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Editar">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button (click)="eliminar(cat.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger" title="Eliminar">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="paginatedData.length === 0">
              <td [colSpan]="activeTab === 'HIJAS' ? 4 : 3" class="p-8 text-center text-textSecondary">
                No se encontraron registros.
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
              Mostrando <span class="font-medium">{{ filteredData.length > 0 ? startIndex + 1 : 0 }}</span> a <span class="font-medium">{{ endIndex }}</span> de <span class="font-medium">{{ filteredData.length }}</span> resultados
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
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="text-lg font-bold text-textMain flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              {{ idEditando ? 'Editar' : 'Nueva' }} {{ isCreatingSubcategoria ? 'Subcategoría' : 'Categoría Principal' }}
            </h3>
            <button (click)="cerrarModal()" class="text-textSecondary hover:text-textMain p-1 rounded-full hover:bg-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form [formGroup]="categoriaForm" (ngSubmit)="guardar()" class="p-6 space-y-4">
            
            <div *ngIf="isCreatingSubcategoria || (idEditando && categoriaForm.get('parent_id')?.value)">
              <label class="block text-sm font-medium text-textMain mb-1">Pertenece a la Categoría Principal <span class="text-red-500">*</span></label>
              <select formControlName="parent_id" class="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white text-sm">
                <option [value]="null" disabled>Seleccione Categoría Padre...</option>
                <option *ngFor="let cat of categoriasPrincipales" [value]="cat.id">{{ cat.nombre }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-textMain mb-1">Nombre <span class="text-red-500">*</span></label>
              <input formControlName="nombre" type="text" 
                     [class.border-red-500]="categoriaForm.get('nombre')?.invalid && categoriaForm.get('nombre')?.touched"
                     class="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white text-sm" placeholder="Ej: Lácteos">
              <p *ngIf="categoriaForm.get('nombre')?.invalid && categoriaForm.get('nombre')?.touched" class="text-red-500 text-xs mt-1">El nombre es requerido.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-textMain mb-1">Descripción</label>
              <textarea formControlName="descripcion" rows="3" class="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white text-sm resize-none" placeholder="Breve descripción..."></textarea>
            </div>

            <div class="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <button type="button" (click)="cerrarModal()" [disabled]="guardando" class="px-5 py-2.5 text-textMain bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-sm">Cancelar</button>
              <button type="submit" [disabled]="categoriaForm.invalid || guardando" class="px-5 py-2.5 text-white bg-primary hover:bg-indigo-600 disabled:opacity-50 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
                <svg *ngIf="guardando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Modal de Confirmación de Eliminación -->
      <div *ngIf="mostrarModalEliminar" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
          <div class="p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-textMain mb-2">¿Eliminar registro?</h3>
            <p class="text-textSecondary text-sm mb-6">Esta acción no se puede deshacer. Si es una categoría principal, se eliminarán también sus subcategorías.</p>
            <div class="flex gap-3 justify-center">
              <button (click)="cancelarEliminar()" class="px-5 py-2.5 text-textMain bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-sm flex-1">Cancelar</button>
              <button (click)="confirmarEliminar()" class="px-5 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors shadow-sm flex-1">Sí, eliminar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast de Éxito -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoText }}</span>
      </div>

      <!-- Toast de Error -->
      <div *ngIf="mostrarMensajeError" class="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50 max-w-md">
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeError }}</span>
      </div>

    </div>
  `
})
export class CategoriasComponent implements OnInit {
  todasLasCategorias: Categoria[] = [];
  categoriasPrincipales: Categoria[] = [];
  
  // Paginación y Filtros
  activeTab: 'PADRES' | 'HIJAS' = 'PADRES';
  filteredData: Categoria[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  filterParentId = '';

  // Modal
  mostrarModal = false;
  idEditando: string | null = null;
  isCreatingSubcategoria = false;
  guardando = false;
  categoriaForm: FormGroup;
  mostrarMensajeExito = false;
  mensajeExitoText = 'Operación exitosa.';
  mostrarMensajeError = false;
  mensajeError = '';
  
  // Eliminación
  mostrarModalEliminar = false;
  idAEliminar: string | null = null;
  
  private readonly API_URL = `${environment.apiUrl}/categorias`;

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef, private exportService: ExportService) {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      parent_id: [null]
    });
  }

  ngOnInit() {
    this.cargarCategorias();
  }

  cambiarTab(tab: 'PADRES' | 'HIJAS') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.filterParentId = '';
    this.filterData();
  }

  cargarCategorias() {
    this.http.get<Categoria[]>(this.API_URL).subscribe({
      next: (data) => {
        this.todasLasCategorias = data;
        this.categoriasPrincipales = data.filter(c => !c.parent_id);
        this.filterData();
      },
      error: (err) => {
        console.error('Error cargando categorías', err);
      }
    });
  }

  filterData() {
    let source = this.activeTab === 'PADRES' 
      ? this.todasLasCategorias.filter(c => !c.parent_id) 
      : this.todasLasCategorias.filter(c => c.parent_id);

    if (this.filterParentId && this.activeTab === 'HIJAS') {
      source = source.filter(c => c.parent_id === this.filterParentId);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      source = source.filter(c => 
        c.nombre.toLowerCase().includes(term) || 
        (c.descripcion && c.descripcion.toLowerCase().includes(term)) ||
        (this.activeTab === 'HIJAS' && this.getNombrePadre(c.parent_id).toLowerCase().includes(term))
      );
    }

    this.filteredData = source;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // Paginación Helpers
  get paginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this.filteredData.length / this.pageSize) || 1; }
  get startIndex() { return (this.currentPage - 1) * this.pageSize; }
  get endIndex() { const end = this.currentPage * this.pageSize; return end > this.filteredData.length ? this.filteredData.length : end; }
  changePageSize() { this.currentPage = 1; this.cdr.detectChanges(); }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  previousPage() { if (this.currentPage > 1) this.currentPage--; }

  getNombrePadre(parentId?: string | null): string {
    if (!parentId) return '';
    return this.categoriasPrincipales.find(c => c.id === parentId)?.nombre || 'Desconocida';
  }

  // A palette of visually distinct colors for tags
  private readonly colorPalette = [
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-purple-50 text-purple-700 border-purple-100',
    'bg-cyan-50 text-cyan-700 border-cyan-100',
    'bg-orange-50 text-orange-700 border-orange-100',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    'bg-teal-50 text-teal-700 border-teal-100',
    'bg-indigo-50 text-indigo-700 border-indigo-100'
  ];

  getColorClasses(parentId?: string | null): string {
    if (!parentId) return 'bg-slate-50 text-slate-700 border-slate-100';
    
    // Hash string simple para asegurar que el mismo ID siempre retorne el mismo color
    let hash = 0;
    for (let i = 0; i < parentId.length; i++) {
      hash = parentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    return this.colorPalette[hash % this.colorPalette.length];
  }

  abrirModal(categoria?: Categoria) {
    if (categoria) {
      this.idEditando = categoria.id;
      this.isCreatingSubcategoria = !!categoria.parent_id;
      this.categoriaForm.patchValue({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        parent_id: categoria.parent_id || null
      });
      if (this.isCreatingSubcategoria) {
        this.categoriaForm.get('parent_id')?.setValidators(Validators.required);
      } else {
        this.categoriaForm.get('parent_id')?.clearValidators();
      }
      this.categoriaForm.get('parent_id')?.updateValueAndValidity();
    } else {
      this.idEditando = null;
      this.isCreatingSubcategoria = this.activeTab === 'HIJAS';
      this.categoriaForm.reset({ parent_id: null });
      
      if (this.isCreatingSubcategoria) {
        this.categoriaForm.get('parent_id')?.setValidators(Validators.required);
      } else {
        this.categoriaForm.get('parent_id')?.clearValidators();
      }
      this.categoriaForm.get('parent_id')?.updateValueAndValidity();
    }
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.idEditando = null;
  }

  guardar() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }
    
    this.guardando = true;
    const body = this.categoriaForm.value;
    
    if (this.idEditando) {
      this.http.put(`${this.API_URL}/${this.idEditando}`, body).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarCategorias();
          this.cerrarModal();
          this.mostrarExito();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarErrorBackend(err);
        }
      });
    } else {
      this.http.post(this.API_URL, body).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarCategorias();
          this.cerrarModal();
          this.mostrarExito();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarErrorBackend(err);
        }
      });
    }
  }

  eliminar(id: string) {
    this.idAEliminar = id;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
    this.idAEliminar = null;
  }

  confirmarEliminar() {
    if (!this.idAEliminar) return;
    
    this.http.delete(`${this.API_URL}/${this.idAEliminar}`).subscribe({
      next: () => {
        this.cargarCategorias();
        this.mostrarExito('Registro eliminado exitosamente.');
        this.cancelarEliminar();
      },
      error: (err) => {
        this.cancelarEliminar();
        this.mostrarErrorBackend(err);
      }
    });
  }

  mostrarExito(mensaje = 'Operación exitosa.') {
    this.mensajeExitoText = mensaje;
    this.mostrarMensajeExito = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  mostrarErrorBackend(err: any) {
    const msg = err.error?.message || err.message || 'Ocurrió un error inesperado';
    this.mensajeError = typeof msg === 'string' ? msg : JSON.stringify(msg);
    this.mostrarMensajeError = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeError = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // --- EXPORTACIÓN ---
  exportarExcel() {
    const dataToExport = this.filteredData.map(c => ({
      'ID': c.id,
      'Nombre': c.nombre,
      'Descripción': c.descripcion || 'Sin descripción',
      'Categoría Padre': this.activeTab === 'HIJAS' ? this.getNombrePadre(c.parent_id) : 'N/A'
    }));
    this.exportService.exportarExcel(dataToExport, 'Categorias');
  }

  exportarPDF() {
    const columns = ['Nombre', 'Descripción', 'Categoría Padre'];
    const dataToExport = this.filteredData.map(c => [
      c.nombre,
      c.descripcion || 'Sin descripción',
      this.activeTab === 'HIJAS' ? this.getNombrePadre(c.parent_id) : 'N/A'
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Listado de Categorías');
  }
}
