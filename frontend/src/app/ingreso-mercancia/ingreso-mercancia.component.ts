import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-ingreso-mercancia',
  template: `
    <div class="flex flex-col h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] max-h-full overflow-hidden">
      
      <!-- Cabecera Superior: Título a la izquierda, Totales y Acción a la derecha (Como en la imagen) -->
      <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-textMain tracking-tight">Ingreso de Inventario</h2>
          <p class="text-textSecondary text-sm mt-0.5">Registra la llegada de nueva mercancía y actualiza el stock y costos.</p>
        </div>

        <div class="flex items-center gap-6 self-end md:self-auto">
          <!-- Total Artículos -->
          <div class="text-right">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL ARTÍCULOS</p>
            <p class="text-xl font-black text-slate-800 leading-tight mt-0.5">{{ totalArticulos }}</p>
          </div>

          <!-- Total a Pagar -->
          <div class="text-right">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL A PAGAR</p>
            <p class="text-2xl font-black text-emerald-600 leading-tight mt-0.5">{{ totalGeneral | currency:'COP':'symbol':'1.0-0' }}</p>
          </div>

          <!-- Botón Procesar Ingreso -->
          <button type="button" (click)="guardarCompra()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm sm:text-base">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            Procesar Ingreso de Mercancía
          </button>
        </div>
      </div>

      <form [formGroup]="compraForm" class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden items-start lg:items-stretch">
        
        <!-- Columna Izquierda: Captura de Datos (Fija) -->
        <div class="w-full lg:w-80 xl:w-96 flex flex-col gap-4 flex-shrink-0">
          
          <!-- Cabecera de la Factura -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-sm font-bold text-primary uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">1. Datos del Proveedor y Factura</h3>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-textMain mb-1">Proveedor <span class="text-red-500">*</span></label>
                <select formControlName="proveedor_id" class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50">
                  <option value="">Seleccione un proveedor...</option>
                  <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-textMain mb-1">Nº Ingreso / Remisión <span class="text-red-500">*</span></label>
                <input formControlName="numero_factura_proveedor" type="text" readonly class="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100 text-slate-500 cursor-not-allowed text-sm font-mono shadow-inner">
              </div>
              <div>
                <label class="block text-sm font-medium text-textMain mb-1">Fecha de Ingreso <span class="text-red-500">*</span></label>
                <input formControlName="fecha_ingreso" type="date" class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50">
              </div>
            </div>
          </div>

          <!-- Buscador de Productos -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative">
            <h3 class="text-sm font-bold text-primary uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Buscar Producto</h3>
            <div class="relative">
              <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                [(ngModel)]="searchProductoTerm" 
                [ngModelOptions]="{standalone: true}" 
                name="searchProductoTerm" 
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                (keyup)="onSearchKeyup($event)" 
                (focus)="showAutocomplete = true" 
                (blur)="onSearchBlur()" 
                placeholder="Escanear o buscar producto..." 
                class="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-700 transition-all text-sm font-medium">
            </div>
            
            <!-- Autocomplete Dropdown -->
            <div *ngIf="showAutocomplete && filteredProductosAutocomplete.length > 0" class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto left-0">
              <ul class="py-1">
                <li *ngFor="let prod of filteredProductosAutocomplete" (mousedown)="seleccionarProductoAutocomplete(prod)" class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors">
                  <div>
                    <p class="text-sm font-bold text-textMain">{{ prod.nombre }}</p>
                    <p class="text-xs text-textSecondary font-mono mt-0.5">{{ prod.sku }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Stock: {{ prod.stock }}</span>
                  </div>
                </li>
              </ul>
            </div>
            <div *ngIf="showAutocomplete && searchProductoTerm.trim().length > 0 && filteredProductosAutocomplete.length === 0" class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center left-0">
              <p class="text-sm text-slate-500">No se encontraron productos con ese término.</p>
            </div>
          </div>
          
        </div>

        <!-- Columna Derecha: Detalle de Mercancía (Único contenedor con scroll vertical) -->
        <div class="flex-1 min-w-0 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <!-- Cabecera de la Sección (Estática) -->
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h3 class="text-sm font-bold text-textMain uppercase tracking-wider">2. Lista de Mercancía Ingresada</h3>
            <span class="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{{ detalles.length }} Ítems</span>
          </div>
          
          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            <!-- Cabecera de Columnas (Estática) -->
            <div class="hidden md:flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              <div class="flex-1 min-w-[220px]">PRODUCTO / LOTE</div>
              <div class="flex items-center gap-6 flex-shrink-0">
                <div class="w-28 sm:w-32 text-center">CANTIDAD</div>
                <div class="w-36 sm:w-40 text-left pl-3">VALOR COMPRA</div>
                <div class="w-32 sm:w-36 text-right pr-6">SUBTOTAL</div>
              </div>
            </div>

            <!-- Lista de Productos (SCROLL EXCLUSIVO: flex-1 overflow-y-auto min-h-0) -->
            <div #listaDetallesContainer formArrayName="detalles" class="divide-y divide-slate-100 flex-1 overflow-y-auto min-h-0">
              
              <div *ngFor="let det of detalles.controls; let i = index" [formGroupName]="i" 
                class="p-4 sm:p-5 px-6 hover:bg-slate-50/60 transition-colors">
                
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6">
                  
                  <!-- Columna Izquierda: Información del Producto (Número, Nombre, SKU, Badges) -->
                  <div class="flex items-start gap-3.5 flex-1 min-w-[220px]">
                    <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {{ i + 1 }}
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-base font-bold text-slate-900 leading-snug">
                        {{ det.get('nombre_producto')?.value }}
                      </h4>
                      <p class="text-xs font-mono text-slate-400 mt-0.5">
                        {{ det.get('sku')?.value }}
                      </p>
                      <div class="flex items-center gap-2 mt-2 flex-wrap">
                        <span *ngIf="det.get('stock_minimo')?.value !== null && det.get('stock_minimo')?.value !== undefined" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                          Mín: {{ det.get('stock_minimo')?.value }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/70">
                          Stock: {{ det.get('stock_actual')?.value ?? 0 }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Columna Derecha: Inputs y Lotes alineados -->
                  <div class="flex flex-col gap-3 flex-shrink-0">
                    
                    <!-- Fila 1: Cantidad, Valor Compra, Subtotal y Botón Eliminar -->
                    <div class="flex items-center gap-4 sm:gap-6">
                      <!-- Input Cantidad -->
                      <div class="w-28 sm:w-32">
                        <input 
                          type="number" 
                          formControlName="cantidad" 
                          min="1" 
                          class="w-full px-3 py-2 text-base font-bold text-center border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60 rounded-xl bg-white text-slate-800 transition-all outline-none"
                          placeholder="1">
                      </div>

                      <!-- Input Valor Compra (Inhabilitado / Solo lectura) -->
                      <div class="w-36 sm:w-40 relative">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">$</span>
                        <input 
                          type="number" 
                          formControlName="costo_unitario" 
                          readonly
                          tabindex="-1"
                          class="w-full pl-8 pr-3 py-2 text-base font-semibold border border-slate-200 rounded-xl bg-slate-100/80 text-slate-600 cursor-not-allowed select-none outline-none focus:outline-none focus:ring-0 focus:border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0">
                      </div>

                      <!-- Subtotal y Acción -->
                      <div class="w-32 sm:w-36 flex items-center justify-end gap-3">
                        <span class="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight whitespace-nowrap">
                          {{ det.get('subtotal')?.value | currency:'COP':'symbol':'1.0-0' }}
                        </span>
                        <button 
                          type="button" 
                          (click)="solicitarEliminarDetalle(i)" 
                          class="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0" 
                          title="Eliminar producto">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Fila 2: Lote y Vencimiento (Cajones suaves como en la imagen) -->
                    <div *ngIf="det.get('controla_lotes')?.value" class="flex flex-wrap items-center gap-3 sm:gap-4">
                      <!-- Contenedor N° Lote -->
                      <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-1.5 px-3">
                        <span class="text-xs font-bold text-indigo-700 tracking-wider whitespace-nowrap">N° LOTE *</span>
                        <input 
                          type="text" 
                          formControlName="numero_lote" 
                          placeholder="1" 
                          class="w-24 sm:w-28 px-2.5 py-1 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800">
                      </div>

                      <!-- Contenedor Vence -->
                      <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-1.5 px-3">
                        <span class="text-xs font-bold text-indigo-700 tracking-wider whitespace-nowrap">VENCE *</span>
                        <input 
                          type="date" 
                          formControlName="fecha_vencimiento" 
                          class="w-36 sm:w-40 px-2.5 py-1 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-700">
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              <!-- Estado Vacío -->
              <div *ngIf="detalles.length === 0" class="p-16 text-center flex flex-col items-center justify-center h-full">
                <div class="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                </div>
                <p class="text-slate-600 font-medium text-base">No hay productos agregados.</p>
                <p class="text-sm text-slate-400 mt-2">Busca o escanea un producto en la columna izquierda para comenzar.</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Modal de Confirmación para Eliminar Producto -->
      <div *ngIf="mostrarModalEliminar" 
           class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
           (click)="cancelarEliminarDetalle()">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden transform transition-all p-6 text-center animate-fade-in-up"
             (click)="$event.stopPropagation()">
          <!-- Icono de advertencia / eliminación -->
          <div class="w-14 h-14 mx-auto mb-4 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>

          <h3 class="text-lg font-bold text-slate-900 mb-1">
            ¿Eliminar producto?
          </h3>
          <p class="text-xs text-slate-500 mb-4">
            ¿Estás seguro de que deseas quitar este producto de la lista de mercancía ingresada?
          </p>

          <!-- Resumen del Producto a Eliminar -->
          <div *ngIf="itemAEliminar" class="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-5 flex items-center justify-between text-left">
            <div class="min-w-0 pr-2">
              <span class="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">{{ itemAEliminar.sku || 'PRODUCTO' }}</span>
              <span class="text-sm font-bold text-slate-800 truncate block">{{ itemAEliminar.nombre }}</span>
            </div>
            <div class="text-right flex-shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Cant</span>
              <span class="text-sm font-black text-indigo-600">{{ itemAEliminar.cantidad }}</span>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              (click)="cancelarEliminarDetalle()" 
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition-colors focus:outline-none">
              Cancelar
            </button>
            <button 
              type="button" 
              (click)="confirmarEliminarDetalle()" 
              class="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl text-sm shadow-lg shadow-rose-600/30 transition-all focus:outline-none">
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-20 right-6 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-[60]">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoTxt }}</span>
      </div>
      <div *ngIf="mostrarMensajeError" class="fixed top-20 right-6 bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-[60]">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeErrorTxt }}</span>
      </div>

    </div>
  `
})
export class IngresoMercanciaComponent implements OnInit, OnDestroy {
  compraForm!: FormGroup;
  totalGeneral: number = 0;
  totalArticulos: number = 0;
  searchProductoTerm: string = '';
  showAutocomplete: boolean = false;

  // Modal confirmación eliminar producto
  mostrarModalEliminar: boolean = false;
  itemAEliminar: { index: number; nombre: string; sku?: string; cantidad?: number } | null = null;
  
  // Toasts
  mostrarMensajeExito = false;
  mostrarMensajeError = false;
  mensajeExitoTxt = '';
  mensajeErrorTxt = '';

  private timeoutExito: any;
  private timeoutError: any;

  mostrarExito(msg: string) {
    if (this.timeoutExito) clearTimeout(this.timeoutExito);
    this.mensajeExitoTxt = msg;
    this.mostrarMensajeExito = true;
    this.timeoutExito = setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  mostrarError(msg: string) {
    if (this.timeoutError) clearTimeout(this.timeoutError);
    this.mensajeErrorTxt = msg;
    this.mostrarMensajeError = true;
    this.timeoutError = setTimeout(() => {
      this.mostrarMensajeError = false;
      this.cdr.detectChanges();
    }, 5000);
  }
  
  proveedores: any[] = [];
  productosCat: any[] = [];

  private formSubscription!: Subscription;

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarProveedores();
    this.cargarProductos();

    this.compraForm = this.fb.group({
      proveedor_id: ['', Validators.required],
      numero_factura_proveedor: [this.generarSiguienteFactura(), Validators.required],
      fecha_ingreso: [this.getLocalDate(), Validators.required],
      total_compra: [0], 
      detalles: this.fb.array([])
    });

    this.formSubscription = this.detalles.valueChanges.subscribe(filas => {
      this.recalcularTotales(filas);
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

  cargarProductos() {
    this.http.get<any[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (data) => {
        this.productosCat = data
          .filter(p => p.is_active)
          .map(p => {
          const variante = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
          return {
            id: variante ? variante.id : p.id, // ID real de la variante
            sku: variante ? variante.sku : p.id,
            db_id: p.id, // ID real en base de datos del producto maestro
            nombre: p.nombre,
            costo: variante ? Number(variante.precio_compra) : 0,
            stock: variante ? Number(variante.stock_actual) : 0,
            stock_minimo: variante ? Number(variante.stock_minimo) : 10,
            controla_lotes: p.controla_lotes || false
          };
        });
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  @ViewChild('listaDetallesContainer') listaDetallesContainer?: ElementRef<HTMLDivElement>;

  // Getter de conveniencia para acceder al FormArray
  get detalles(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  agregarDetalleConProducto(producto: any) {
    const controlaLotes = Boolean(producto.controla_lotes);

    // Si NO controla lotes, incrementamos la cantidad del ítem existente y lo movemos a la primera posición
    if (!controlaLotes) {
      const indexExistente = this.detalles.controls.findIndex(ctrl => ctrl.get('producto_id')?.value === producto.id);
      if (indexExistente >= 0) {
        const formControl = this.detalles.at(indexExistente);
        const cantActual = formControl.get('cantidad')?.value;
        formControl.get('cantidad')?.setValue(cantActual + 1);

        if (indexExistente > 0) {
          const item = this.detalles.at(indexExistente);
          this.detalles.removeAt(indexExistente);
          this.detalles.insert(0, item);
        }

        this.scrollToTopDetalles();
        return;
      }
    }

    const detalleForm = this.fb.group({
      producto_id: [producto.id, Validators.required],
      sku: [producto.sku],
      nombre_producto: [producto.nombre],
      stock_actual: [producto.stock],
      stock_minimo: [producto.stock_minimo],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      costo_unitario: [producto.costo, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }],
      controla_lotes: [controlaLotes],
      numero_lote: ['', controlaLotes ? [Validators.required] : []],
      fecha_vencimiento: ['', controlaLotes ? [Validators.required] : []]
    });
    
    // Insertar en la primera posición (index 0) para que aparezca arriba de todo
    this.detalles.insert(0, detalleForm);
    this.scrollToTopDetalles();
  }

  private scrollToTopDetalles() {
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.listaDetallesContainer?.nativeElement) {
        this.listaDetallesContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  get filteredProductosAutocomplete() {
    if (!this.searchProductoTerm.trim()) return [];
    const term = this.searchProductoTerm.toLowerCase();
    return this.productosCat.filter(p => p.nombre.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term))).slice(0, 5);
  }

  onSearchKeyup(event: KeyboardEvent) {
    this.showAutocomplete = true;
    if (event.key === 'Enter') {
      const match = this.filteredProductosAutocomplete[0];
      if (match) {
        this.seleccionarProductoAutocomplete(match);
      } else {
        this.mostrarError('Producto no encontrado.');
      }
    }
  }

  onSearchBlur() {
    // Timeout para permitir que el click en mousedown se ejecute antes de ocultar
    setTimeout(() => {
      this.showAutocomplete = false;
    }, 200);
  }

  seleccionarProductoAutocomplete(producto: any) {
    this.agregarDetalleConProducto(producto);
    this.searchProductoTerm = '';
    this.showAutocomplete = false;
  }

  buscarYAgregarProducto() {
    // Mantenido por compatibilidad pero el flujo principal usa seleccionarProductoAutocomplete
    if (!this.searchProductoTerm.trim()) return;
    
    const term = this.searchProductoTerm.toLowerCase();
    const prod = this.productosCat.find(p => p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    
    if (prod) {
      this.agregarDetalleConProducto(prod);
      this.searchProductoTerm = '';
    } else {
      this.mostrarError('Producto no encontrado en el catálogo.');
    }
  }

  solicitarEliminarDetalle(index: number) {
    const item = this.detalles.at(index);
    if (!item) return;
    this.itemAEliminar = {
      index,
      nombre: item.get('nombre_producto')?.value || 'Producto',
      sku: item.get('sku')?.value || '',
      cantidad: item.get('cantidad')?.value || 1
    };
    this.mostrarModalEliminar = true;
  }

  cancelarEliminarDetalle() {
    this.mostrarModalEliminar = false;
    this.itemAEliminar = null;
  }

  confirmarEliminarDetalle() {
    if (this.itemAEliminar !== null && this.itemAEliminar.index >= 0) {
      this.removerDetalle(this.itemAEliminar.index);
      this.cancelarEliminarDetalle();
    }
  }

  removerDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  private recalcularTotales(filas: any[]) {
    let acumuladorTotal = 0;
    let acumuladorArticulos = 0;

    filas.forEach((fila, index) => {
      const cantidad = Number(fila.cantidad) || 0;
      const costo = Number(fila.costo_unitario) || 0;
      const subtotalFila = cantidad * costo;
      
      this.detalles.at(index).get('subtotal')?.setValue(subtotalFila, { emitEvent: false });
      
      acumuladorTotal += subtotalFila;
      acumuladorArticulos += cantidad;
    });

    this.totalGeneral = acumuladorTotal;
    this.totalArticulos = acumuladorArticulos;
    this.compraForm.get('total_compra')?.setValue(this.totalGeneral, { emitEvent: false });
  }

  guardarCompra() {
    if (this.detalles.length === 0) {
      this.mostrarError('Debe agregar al menos un producto a la factura.');
      return;
    }
    
    if (this.compraForm.invalid) {
      this.compraForm.markAllAsTouched();
      let invalidFields = [];
      const controls = this.compraForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) invalidFields.push(name);
      }
      this.detalles.controls.forEach((det, idx) => {
        if (det.invalid) {
          const detControls = (det as FormGroup).controls;
          for (const name in detControls) {
            if (detControls[name].invalid) invalidFields.push(`Detalle ${idx + 1} - ${name}`);
          }
        }
      });
      this.mostrarError('Por favor complete los campos obligatorios. Campos inválidos: ' + invalidFields.join(', '));
      return;
    }

    const payload = this.compraForm.getRawValue();
    this.http.post(`${environment.apiUrl}/compras`, payload).subscribe({
      next: (res: any) => {
        this.mostrarExito('Ingreso registrado exitosamente en la base de datos.');
        // Resetear formulario manteniendo el proveedor
        const proveedorActual = this.compraForm.get('proveedor_id')?.value;
        this.compraForm.reset({
          proveedor_id: proveedorActual,
          fecha_ingreso: this.getLocalDate(),
          numero_factura_proveedor: this.generarSiguienteFactura(),
          total_compra: 0
        });
        this.detalles.clear();
      },
      error: (err) => {
        console.error('Error registrando compra', err);
        const backendMsg = err.error?.message;
        const msg = Array.isArray(backendMsg)
          ? backendMsg.join(', ')
          : (backendMsg || err.message || 'Error técnico al registrar la compra.');
        this.mostrarError(msg);
      }
    });
  }

  ngOnDestroy() {
    // Evitar fugas de memoria del Observable valueChanges
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  generarSiguienteFactura(): string {
    let lastNum = parseInt(localStorage.getItem('last_invoice_num') || '234', 10);
    lastNum++;
    localStorage.setItem('last_invoice_num', lastNum.toString());
    return `F001-${lastNum.toString().padStart(6, '0')}`;
  }

  getLocalDate(): string {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().substring(0, 10);
  }
}
