import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

export interface Producto {
  id?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
  stock: number;
  categoria_padre_id: string;
  subcategoria_id: string;
  proveedor_id?: string;
  unidad_medida: string;
  foto_url?: string;
  is_active: boolean;
  fecha_registro?: Date;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Gestión de Productos</h2>
          <p class="text-textSecondary text-sm mt-1">Administra tu inventario de productos y categorías.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative">
            <svg class="w-5 h-5 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" [(ngModel)]="searchTerm" (input)="filterProductos()" placeholder="Buscar producto o código..." class="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white w-64">
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
            Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Tabla de Productos -->
      <div class="bg-surface rounded-xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm text-textSecondary uppercase tracking-wider">
              <th class="p-4 font-medium">Producto</th>
              <th class="p-4 font-medium">Código</th>
              <th class="p-4 font-medium">
                Categoría
                <select [(ngModel)]="filterCategoriaId" (change)="filterProductos()" class="ml-2 border border-slate-200 rounded text-xs bg-white font-normal text-textMain px-1 py-0.5" style="max-width: 100px;">
                  <option value="">Todas</option>
                  <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.nombre }}</option>
                </select>
              </th>
              <th class="p-4 font-medium">Precio Venta</th>
              <th class="p-4 font-medium">Stock</th>
              <th class="p-4 font-medium">Estado</th>
              <th class="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let prod of paginatedProductos" class="hover:bg-slate-50/50 transition-colors group">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img *ngIf="prod.foto_url" [src]="prod.foto_url" class="w-full h-full object-cover">
                    <svg *ngIf="!prod.foto_url" class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p class="font-medium text-textMain">{{ prod.nombre }}</p>
                    <p class="text-xs text-textSecondary truncate w-40">{{ prod.descripcion || 'Sin descripción' }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4 text-textSecondary text-sm font-mono">{{ prod.codigo }}</td>
              <td class="p-4 text-textSecondary text-sm">
                <div class="flex flex-col">
                  <span>{{ getNombreCategoria(prod.categoria_padre_id) }}</span>
                  <span class="text-xs text-slate-400">{{ getNombreSubcategoria(prod.categoria_padre_id, prod.subcategoria_id) }}</span>
                </div>
              </td>
              <td class="p-4 text-textMain text-sm font-medium">{{ prod.precio_venta | currency:'COP':'symbol':'1.0-0' }}</td>
              <td class="p-4">
                <span [class]="prod.stock > 10 ? 'text-green-600 font-semibold' : (prod.stock > 0 ? 'text-orange-500 font-semibold' : 'text-red-500 font-bold')">
                  {{ prod.stock }} {{ prod.unidad_medida || 'Unidad' }}
                </span>
              </td>
              <td class="p-4">
                <span *ngIf="prod.is_active" class="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200">Activo</span>
                <span *ngIf="!prod.is_active" class="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-200">Inactivo</span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button (click)="verDetalle(prod)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger" title="Ver Detalle">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  </button>
                  <button (click)="editarProducto(prod)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Editar Producto">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button (click)="toggleEstado(prod)" class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors tooltip-trigger" [title]="prod.is_active ? 'Desactivar' : 'Activar'">
                    <svg *ngIf="prod.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                    <svg *ngIf="!prod.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  <button (click)="eliminarProducto(prod)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger" title="Eliminar Producto">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="paginatedProductos.length === 0">
              <td colspan="7" class="p-8 text-center text-textSecondary">
                No se encontraron productos registrados.
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
              Mostrando <span class="font-medium">{{ filteredProductos.length > 0 ? startIndex + 1 : 0 }}</span> a <span class="font-medium">{{ endIndex }}</span> de <span class="font-medium">{{ filteredProductos.length }}</span> resultados
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

      <!-- Modal Grande de Creación / Edición -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
          
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl flex-shrink-0">
            <h3 class="text-xl font-bold text-textMain flex items-center gap-2">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              {{ modoEdicion ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <button (click)="cerrarModal()" class="text-textSecondary hover:text-textMain bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto flex-1">
            <form [formGroup]="productoForm" class="space-y-8">
              
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Columna Izquierda: Foto y Estado -->
                <div class="space-y-6">
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <label class="block text-sm font-bold text-textMain mb-3 text-left">Fotografía del Producto</label>
                    <div class="w-full aspect-square bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary transition-colors cursor-pointer" (click)="fileInput.click()">
                      <img *ngIf="imagePreview" [src]="imagePreview" class="w-full h-full object-cover">
                      
                      <div *ngIf="!imagePreview" class="p-6 flex flex-col items-center">
                        <svg class="w-12 h-12 text-slate-300 mb-2 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span class="text-sm font-medium text-textSecondary group-hover:text-primary">Subir Imagen</span>
                        <span class="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</span>
                      </div>
                      
                      <div *ngIf="imagePreview" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="text-white font-medium flex items-center gap-2">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                          Cambiar Foto
                        </span>
                      </div>
                      
                      <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
                    </div>
                  </div>

                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label class="flex items-center gap-3 cursor-pointer">
                      <div class="relative">
                        <input formControlName="is_active" type="checkbox" class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      <div>
                        <span class="text-sm font-bold text-textMain">Estado del Producto</span>
                        <p class="text-xs text-textSecondary mt-0.5">Visibilidad en el sistema</p>
                      </div>
                    </label>
                  </div>
                  
                  <div *ngIf="modoEdicion" class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <div class="flex justify-between mb-2"><span class="text-textSecondary">Fecha Registro:</span> <span class="font-medium text-textMain">{{ prodEditando?.fecha_registro | date:'mediumDate' }}</span></div>
                  </div>
                </div>

                <!-- Columna Derecha: Formulario Principal -->
                <div class="lg:col-span-2 space-y-6">
                  
                  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 class="text-sm font-bold text-primary uppercase tracking-wider border-b border-slate-100 pb-2">Información Básica</h4>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div class="sm:col-span-1">
                        <label class="block text-sm font-medium text-textMain mb-1">Código / SKU <span class="text-red-500">*</span></label>
                        <input formControlName="codigo" type="text" readonly 
                               [class.border-red-500]="isInvalid('codigo')"
                               class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed font-mono text-sm">
                        <p *ngIf="isInvalid('codigo')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                      <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-textMain mb-1">Nombre del Producto <span class="text-red-500">*</span></label>
                        <input formControlName="nombre" type="text" placeholder="Ej. Leche Deslactosada 1L" 
                               [class.border-red-500]="isInvalid('nombre')"
                               class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                        <p *ngIf="isInvalid('nombre')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-textMain mb-1">Descripción</label>
                      <textarea formControlName="descripcion" rows="3" placeholder="Detalles, características, marca..." class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none"></textarea>
                    </div>
                  </div>

                  <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 class="text-sm font-bold text-primary uppercase tracking-wider border-b border-slate-100 pb-2">Categorización (Listas Dependientes)</h4>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Categoría Principal <span class="text-red-500">*</span></label>
                        <select formControlName="categoria_padre_id" (change)="onCategoriaChange()" 
                                [class.border-red-500]="isInvalid('categoria_padre_id')"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                          <option value="">Seleccione Categoría...</option>
                          <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.nombre }}</option>
                        </select>
                        <p *ngIf="isInvalid('categoria_padre_id')" class="text-red-500 text-xs mt-1">Seleccione una categoría.</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Subcategoría <span class="text-red-500">*</span></label>
                        <select formControlName="subcategoria_id" 
                                [class.border-red-500]="isInvalid('subcategoria_id')"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:bg-slate-100 disabled:text-slate-400">
                          <option value="">Seleccione Subcategoría...</option>
                          <option *ngFor="let sub of subcategoriasActivas" [value]="sub.id">{{ sub.nombre }}</option>
                        </select>
                        <p *ngIf="isInvalid('subcategoria_id')" class="text-red-500 text-xs mt-1">Seleccione una subcategoría.</p>
                        <p *ngIf="productoForm.get('categoria_padre_id')?.value && subcategoriasActivas.length === 0" class="text-xs text-orange-500 mt-1">Esta categoría no tiene subcategorías.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Sección Full Width: Precios e Inventario -->
              <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 class="text-sm font-bold text-primary uppercase tracking-wider border-b border-slate-100 pb-2">Precios e Inventario</h4>
                    
                    <div class="mb-4">
                      <label class="block text-sm font-medium text-textMain mb-1">Proveedor Principal (Opcional)</label>
                      <select formControlName="proveedor_id" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                        <option value="">Seleccione Proveedor...</option>
                        <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
                      </select>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Unidad <span class="text-red-500">*</span></label>
                        <select formControlName="unidad_medida" 
                                [class.border-red-500]="isInvalid('unidad_medida')"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                          <option value="Unidad">Unidad</option>
                          <optgroup *ngFor="let atr of atributosGlobales" [label]="atr.nombre">
                            <option *ngFor="let val of atr.valores" [value]="val.valor">{{ val.valor }}</option>
                          </optgroup>
                        </select>
                        <p *ngIf="isInvalid('unidad_medida')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Costo Inicial ($) <span class="text-red-500">*</span></label>
                        <input formControlName="precio_compra" type="number" min="0" step="0.01" 
                               [class.border-red-500]="isInvalid('precio_compra')"
                               class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                        <p *ngIf="isInvalid('precio_compra')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Precio Venta ($) <span class="text-red-500">*</span></label>
                        <input formControlName="precio_venta" type="number" min="0" step="0.01" 
                               [class.border-red-500]="isInvalid('precio_venta')"
                               class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                        <p *ngIf="isInvalid('precio_venta')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-textMain mb-1">Stock Mínimo <span class="text-red-500">*</span></label>
                        <input formControlName="stock_minimo" type="number" min="0" 
                               [class.border-red-500]="isInvalid('stock_minimo')"
                               class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-bold transition-colors">
                        <p *ngIf="isInvalid('stock_minimo')" class="text-red-500 text-xs mt-1">Requerido.</p>
                      </div>
                    </div>
                    <div *ngIf="rentabilidad > 0" class="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800 flex justify-between">
                      <span class="font-medium">Rentabilidad Estimada:</span>
                      <span class="font-bold">{{ rentabilidad | percent:'1.1-2' }} ({{ rentabilidadMonto | currency:'COP':'symbol':'1.0-0' }})</span>
                    </div>
                  </div>


              
            </form>
          </div>
          
          <div class="px-6 py-4 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
            <button type="button" (click)="cerrarModal()" [disabled]="guardando" class="px-6 py-2.5 text-textMain bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-sm">Cancelar</button>
            <button type="button" (click)="guardar()" [disabled]="guardando" class="px-6 py-2.5 text-white bg-primary hover:bg-indigo-600 disabled:opacity-50 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
              <svg *ngIf="guardando" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg *ngIf="!guardando" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              {{ guardando ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Registrar Producto') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Ver Detalle -->
      <div *ngIf="mostrarDetalle" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-3xl flex flex-col animate-fade-in-up">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 class="text-xl font-bold text-textMain flex items-center gap-2">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              Detalle del Producto
            </h3>
            <button (click)="cerrarDetalle()" class="text-textSecondary hover:text-textMain bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="p-6">
            <div class="flex flex-col md:flex-row gap-8">
              <div class="w-full md:w-1/3 flex flex-col items-center">
                <div class="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                  <img *ngIf="prodEditando?.foto_url" [src]="prodEditando?.foto_url" class="w-full h-full object-cover">
                  <svg *ngIf="!prodEditando?.foto_url" class="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div class="mt-4 w-full flex justify-center">
                  <span *ngIf="prodEditando?.is_active" class="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 shadow-sm">Estado: Activo</span>
                  <span *ngIf="!prodEditando?.is_active" class="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold border border-red-200 shadow-sm">Estado: Inactivo</span>
                </div>
              </div>
              <div class="w-full md:w-2/3 space-y-6">
                <div>
                  <p class="text-xs font-bold text-primary uppercase tracking-wider mb-1">Información Básica</p>
                  <h4 class="text-2xl font-black text-textMain">{{ prodEditando?.nombre }}</h4>
                  <p class="text-sm font-mono text-slate-500 mt-1 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    {{ prodEditando?.codigo }}
                  </p>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p class="text-xs text-textSecondary uppercase font-semibold">Categoría</p>
                    <p class="text-sm font-medium text-textMain mt-0.5">{{ getNombreCategoria(prodEditando?.categoria_padre_id || '') }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-textSecondary uppercase font-semibold">Subcategoría</p>
                    <p class="text-sm font-medium text-textMain mt-0.5">{{ getNombreSubcategoria(prodEditando?.categoria_padre_id || '', prodEditando?.subcategoria_id || '') }}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-xs text-textSecondary uppercase font-semibold">Descripción</p>
                    <p class="text-sm text-slate-700 mt-0.5">{{ prodEditando?.descripcion || 'No hay descripción disponible' }}</p>
                  </div>
                </div>
                <div>
                  <p class="text-xs font-bold text-primary uppercase tracking-wider mb-2">Precios e Inventario</p>
                  <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                      <p class="text-[10px] text-textSecondary font-bold uppercase mb-1">Costo</p>
                      <p class="font-black text-textMain">{{ prodEditando?.precio_compra | currency:'COP':'symbol':'1.0-0' }}</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                      <p class="text-[10px] text-textSecondary font-bold uppercase mb-1">P. Venta</p>
                      <p class="font-black text-emerald-600">{{ prodEditando?.precio_venta | currency:'COP':'symbol':'1.0-0' }}</p>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                      <p class="text-[10px] text-textSecondary font-bold uppercase mb-1">Stock</p>
                      <p class="font-black text-textMain">{{ prodEditando?.stock }} <span class="text-xs font-normal text-slate-500">{{ prodEditando?.unidad_medida || 'Unidad' }}</span></p>
                    </div>
                  </div>
                  
                  <div *ngIf="$any(prodEditando)?.rentabilidad_mensaje" class="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-green-800 uppercase tracking-wider">Métrica de Rentabilidad</p>
                      <p class="text-sm text-green-700 mt-0.5 font-medium">{{ $any(prodEditando)?.rentabilidad_mensaje }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
             <button (click)="exportarFichaTecnicaPDF(prodEditando)" class="px-4 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               Generar Ficha Técnica
             </button>
             <button (click)="cerrarDetalle()" class="px-6 py-2.5 text-white bg-primary hover:bg-indigo-600 rounded-xl font-medium transition-colors shadow-sm">Cerrar Detalle</button>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoTxt }}</span>
      </div>
      <div *ngIf="mostrarMensajeError" class="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50 max-w-md">
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeErrorTxt }}</span>
      </div>
    </div>
  `
})
export class ProductosComponent implements OnInit {
  productosList: Producto[] = [];
  filteredProductos: Producto[] = [];
  
  // Categorías (cargadas desde la API en ngOnInit)
  categorias: { id: string; nombre: string; subcategorias: any[] }[] = [];
  subcategoriasActivas: any[] = [];
  
  // Proveedores cargados desde la API
  proveedores: any[] = [];

  // Paginación
  currentPage = 1;
  pageSize = 5;
  searchTerm = '';
  filterCategoriaId = '';
  
  // Modal y Formulario
  mostrarModal = false;
  mostrarDetalle = false;
  modoEdicion = false;
  prodEditando: Producto | null = null;
  productoForm: FormGroup;
  imagePreview: string | null = null;
  
  // Feedback
  mostrarMensajeExito = false;
  mensajeExitoTxt = '';
  mostrarMensajeError = false;
  mensajeErrorTxt = '';
  guardando = false;
  
  // Atributos dinámicos
  atributosGlobales: any[] = [];

  private readonly API_URL = `${environment.apiUrl}/productos`;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private http: HttpClient, private exportService: ExportService) {
    this.productoForm = this.fb.group({
      codigo: [{value: '', disabled: true}, Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [10, [Validators.required, Validators.min(0)]],
      unidad_medida: ['Unidad', Validators.required],
      categoria_padre_id: ['', Validators.required],
      subcategoria_id: [{value: '', disabled: true}, Validators.required],
      is_active: [true],
      proveedor_id: ['']
    });
  }

  ngOnInit() {
    this.cargarCategoriasParaSelects();
    this.cargarProveedores();
    this.cargarAtributos();
    this.cargarProductos();
    
    // Escuchar cambios de precios para rentabilidad
    this.productoForm.get('precio_compra')?.valueChanges.subscribe(() => this.cdr.detectChanges());
    this.productoForm.get('precio_venta')?.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  get rentabilidad() {
    const pc = this.productoForm.get('precio_compra')?.value || 0;
    const pv = this.productoForm.get('precio_venta')?.value || 0;
    if (pc === 0 || pv === 0) return 0;
    return (pv - pc) / pv;
  }

  get rentabilidadMonto() {
    const pc = this.productoForm.get('precio_compra')?.value || 0;
    const pv = this.productoForm.get('precio_venta')?.value || 0;
    return pv - pc;
  }

  cargarAtributos() {
    this.http.get<any[]>(`${environment.apiUrl}/atributos`).subscribe({
      next: (data) => {
        this.atributosGlobales = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando atributos', err)
    });
  }

  cargarCategoriasParaSelects() {
    this.http.get<any[]>(`${environment.apiUrl}/categorias`).subscribe({
      next: (data) => {
        const principales = data.filter(c => !c.parent_id);
        this.categorias = principales.map(p => ({
          id: p.id,
          nombre: p.nombre,
          subcategorias: data.filter(c => c.parent_id === p.id)
        }));
      },
      error: (err) => console.error('Error cargando categorías para selects', err)
    });
  }

  cargarProveedores() {
    this.http.get<any[]>(`${environment.apiUrl}/proveedores`).subscribe({
      next: (data) => {
        this.proveedores = data.filter(p => p.is_active);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando proveedores', err)
    });
  }

  onCategoriaChange() {
    const catId = this.productoForm.get('categoria_padre_id')?.value;
    if (catId) {
      const cat = this.categorias.find(c => c.id === catId);
      this.subcategoriasActivas = cat ? cat.subcategorias : [];
      this.productoForm.get('subcategoria_id')?.enable();
    } else {
      this.subcategoriasActivas = [];
      this.productoForm.get('subcategoria_id')?.disable();
    }
    this.productoForm.get('subcategoria_id')?.setValue('');
  }

  cargarProductos() {
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (data) => {
        // Mapear desde el formato del backend (Producto + Variante) al formato de la tabla
        this.productosList = data.map(p => {
          const variante = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
          return {
            id: p.id,
            codigo: variante ? variante.sku : '',
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio_compra: variante ? Number(variante.precio_compra) : 0,
            precio_venta: variante ? Number(variante.precio_venta) : 0,
            stock: variante ? Number(variante.stock_actual) : 0,
            stock_minimo: variante ? Number(variante.stock_minimo) : 10,
            categoria_padre_id: p.categoria?.parent_id || '',
            subcategoria_id: p.categoria?.id || '',
            proveedor_id: p.proveedor_id || '',
            unidad_medida: p.unidad_medida || 'Unidad',
            foto_url: p.imagen_url,
            is_active: p.is_active,
            fecha_registro: p.created_at,
            rentabilidad_mensaje: variante ? variante.rentabilidad_mensaje : null
          };
        });
        this.filterProductos();
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  filterProductos() {
    let source = this.productosList;
    
    if (this.filterCategoriaId) {
      source = source.filter(p => p.categoria_padre_id === this.filterCategoriaId);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      source = source.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        (p.codigo && p.codigo.toLowerCase().includes(term)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
        this.getNombreCategoria(p.categoria_padre_id).toLowerCase().includes(term) ||
        this.getNombreSubcategoria(p.categoria_padre_id, p.subcategoria_id).toLowerCase().includes(term)
      );
    }

    this.filteredProductos = source;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get paginatedProductos() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProductos.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this.filteredProductos.length / this.pageSize) || 1; }
  get startIndex() { return (this.currentPage - 1) * this.pageSize; }
  get endIndex() { const end = this.currentPage * this.pageSize; return end > this.filteredProductos.length ? this.filteredProductos.length : end; }
  changePageSize() { this.currentPage = 1; this.cdr.detectChanges(); }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  previousPage() { if (this.currentPage > 1) this.currentPage--; }

  getNombreCategoria(id: string) {
    return this.categorias.find(c => c.id === id)?.nombre || 'Desconocida';
  }
  getNombreSubcategoria(padreId: string, id: string) {
    const padre = this.categorias.find(c => c.id === padreId);
    return padre?.subcategorias.find(s => s.id === id)?.nombre || 'Desconocida';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  abrirModal() {
    this.modoEdicion = false;
    this.prodEditando = null;
    this.productoForm.get('stock')?.enable();
    this.productoForm.reset({ 
      codigo: this.generarSiguienteCodigoProducto(),
      is_active: true, 
      precio_compra: 0, 
      precio_venta: 0, 
      stock_minimo: 10,
      unidad_medida: 'Unidad'
    });
    this.imagePreview = null;
    this.subcategoriasActivas = [];
    this.productoForm.get('subcategoria_id')?.disable();
    this.mostrarModal = true;
  }

  verDetalle(prod: Producto) {
    this.prodEditando = prod;
    this.mostrarDetalle = true;
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.prodEditando = null;
  }

  editarProducto(prod: Producto) {
    this.modoEdicion = true;
    this.prodEditando = prod;
    
    // El stock ahora es editable en modo edición
    this.productoForm.get('stock')?.enable();
    
    this.productoForm.patchValue({
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio_compra: prod.precio_compra,
      precio_venta: prod.precio_venta,
      stock_minimo: prod.stock_minimo !== undefined ? prod.stock_minimo : 10,
      unidad_medida: prod.unidad_medida || 'Unidad',
      categoria_padre_id: prod.categoria_padre_id,
      proveedor_id: prod.proveedor_id || '',
      is_active: prod.is_active
    });
    
    // Cargar subcategorias
    this.onCategoriaChange();
    this.productoForm.patchValue({ subcategoria_id: prod.subcategoria_id });
    
    this.imagePreview = prod.foto_url || null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  toggleEstado(prod: Producto) {
    const nuevoEstado = !prod.is_active;
    this.http.patch(`${this.API_URL}/${prod.id}`, { is_active: nuevoEstado }).subscribe({
      next: () => {
        prod.is_active = nuevoEstado;
        this.mostrarExito(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: (err) => {
        console.error('Error al cambiar el estado del producto', err);
        this.mostrarError('Error al cambiar el estado del producto');
      }
    });
  }

  eliminarProducto(prod: Producto) {
    if (confirm(`¿Estás seguro de eliminar el producto ${prod.codigo} - ${prod.nombre}?`)) {
      this.http.delete(`${this.API_URL}/${prod.id}`).subscribe({
        next: () => {
          this.cargarProductos();
          this.mostrarExito('Producto eliminado con éxito.');
        },
        error: (err) => console.error(err)
      });
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.productoForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  generarSiguienteCodigoProducto(): string {
    let max = 0;
    for (const p of this.productosList) {
      if (p.codigo && p.codigo.startsWith('PROD-')) {
        const numStr = p.codigo.replace('PROD-', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > max) {
          max = num;
        }
      }
    }
    const nextNum = max + 1;
    return `PROD-${nextNum.toString().padStart(3, '0')}`;
  }

  guardar() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }
    
    this.guardando = true;
    
    // Preparar mensaje de rentabilidad
    const pc = this.productoForm.get('precio_compra')?.value || 0;
    const pv = this.productoForm.get('precio_venta')?.value || 0;
    let rentabilidad_mensaje = null;
    if (pc > 0 && pv > pc) {
      const pje = ((pv - pc) / pv * 100).toFixed(2);
      const monto = (pv - pc).toLocaleString('es-CO', {style: 'currency', currency: 'COP'});
      rentabilidad_mensaje = `Rentabilidad Estimada: ${pje}% (${monto})`;
    }

    const rawValue = this.productoForm.getRawValue();

    const body = {
      ...rawValue,
      foto_url: this.imagePreview,
      rentabilidad_mensaje
    };
    
    if (this.modoEdicion && this.prodEditando) {
      this.http.patch(`${this.API_URL}/${this.prodEditando.id}`, body).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarProductos();
          this.mostrarExito('Producto actualizado correctamente.');
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarError(err);
        }
      });
    } else {
      this.http.post(this.API_URL, body).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarProductos();
          this.mostrarExito('Producto registrado exitosamente.');
          this.cerrarModal();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarError(err);
        }
      });
    }
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

  mostrarError(err: any) {
    const msg = err.error?.message || err.message || 'Ocurrió un error inesperado';
    this.mensajeErrorTxt = typeof msg === 'string' ? msg : JSON.stringify(msg);
    this.mostrarMensajeError = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeError = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // --- EXPORTACIÓN ---
  exportarExcel() {
    const dataToExport = this.filteredProductos.map(p => ({
      'Código/SKU': p.codigo,
      'Nombre': p.nombre,
      'Categoría': this.getNombreCategoria(p.categoria_padre_id),
      'Subcategoría': this.getNombreSubcategoria(p.categoria_padre_id, p.subcategoria_id),
      'Precio Venta': p.precio_venta,
      'Precio Compra': p.precio_compra,
      'Stock': p.stock,
      'Estado': p.is_active ? 'Activo' : 'Inactivo'
    }));
    this.exportService.exportarExcel(dataToExport, 'Inventario_Productos');
  }

  exportarPDF() {
    const columns = ['Código', 'Nombre', 'Categoría', 'Precio Venta', 'Stock', 'Estado'];
    const dataToExport = this.filteredProductos.map(p => [
      p.codigo,
      p.nombre,
      `${this.getNombreCategoria(p.categoria_padre_id)} - ${this.getNombreSubcategoria(p.categoria_padre_id, p.subcategoria_id)}`,
      `$${p.precio_venta.toFixed(2)}`,
      p.stock.toString(),
      p.is_active ? 'Activo' : 'Inactivo'
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Inventario de Productos');
  }

  exportarFichaTecnicaPDF(prod: any) {
    if (!prod) return;
    const cat = this.getNombreCategoria(prod.categoria_padre_id);
    const subcat = this.getNombreSubcategoria(prod.categoria_padre_id, prod.subcategoria_id);
    this.exportService.exportarFichaTecnicaPDF(prod, cat, subcat);
  }
}
