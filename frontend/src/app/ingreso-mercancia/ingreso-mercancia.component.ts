import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-ingreso-mercancia',
  template: `
    <div class="p-6 flex flex-col bg-slate-50 min-h-[calc(100vh-64px)] relative pb-32">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-textMain tracking-tight">Ingreso de Inventario</h2>
        <p class="text-textSecondary text-sm mt-1">Registra la llegada de nueva mercancía y actualiza el stock y costos.</p>
      </div>

      <form [formGroup]="compraForm" class="flex-1 flex flex-col gap-6">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          
          <!-- Columna Izquierda: Captura de Datos (1/3) -->
          <div class="w-full lg:w-1/3 flex flex-col gap-6">
            
            <!-- Cabecera de la Factura -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 class="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos del Proveedor y Factura</h3>
              <div class="grid grid-cols-1 gap-5">
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
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <h3 class="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Buscar Producto</h3>
              <div class="relative">
                <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" [(ngModel)]="searchProductoTerm" [ngModelOptions]="{standalone: true}" name="searchProductoTerm" (keyup)="onSearchKeyup($event)" (focus)="showAutocomplete = true" (blur)="onSearchBlur()" placeholder="Escanear o buscar producto..." class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-700 transition-all text-sm font-medium">
              </div>
              
              <!-- Autocomplete Dropdown -->
              <div *ngIf="showAutocomplete && filteredProductosAutocomplete.length > 0" class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto left-0">
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
              <div *ngIf="showAutocomplete && searchProductoTerm.trim().length > 0 && filteredProductosAutocomplete.length === 0" class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center left-0">
                <p class="text-sm text-slate-500">No se encontraron productos con ese término.</p>
              </div>
            </div>
            
          </div>

          <!-- Columna Derecha: Detalle de Mercancía (2/3) -->
          <div class="w-full lg:w-2/3 flex flex-col h-full min-h-[500px]">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 class="text-sm font-bold text-textMain uppercase tracking-wider">2. Lista de Mercancía Ingresada</h3>
                <span class="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{{ detalles.length }} Ítems</span>
              </div>
              
              <div class="overflow-x-auto flex-1">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100/50 border-b border-slate-200 text-xs text-textSecondary uppercase tracking-wider">
                      <th class="p-4 font-semibold w-1/3">Producto</th>
                      <th class="p-4 font-semibold text-center w-24">Stock Actual</th>
                      <th class="p-4 font-semibold text-center w-24">Stock Min.</th>
                      <th class="p-4 font-semibold w-32 min-w-[100px]">Cant.</th>
                      <th class="p-4 font-semibold w-40 min-w-[140px]">Nuevo Costo</th>
                      <th class="p-4 font-semibold text-right w-28">Subtotal</th>
                      <th class="p-4 font-semibold text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody formArrayName="detalles" class="divide-y divide-slate-100">
                    <tr *ngFor="let det of detalles.controls; let i = index" [formGroupName]="i" class="hover:bg-slate-50/50 transition-colors group">
                      <td class="p-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {{ i + 1 }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="font-bold text-textMain text-sm whitespace-normal break-words leading-tight">{{ det.get('nombre_producto')?.value }}</p>
                            <p class="text-[10px] text-textSecondary font-mono mt-1">{{ det.get('sku')?.value }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="p-4 text-center">
                        <span class="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-bold">{{ det.get('stock_actual')?.value }}</span>
                      </td>
                      <td class="p-4 text-center">
                        <span class="inline-block bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-xs font-bold">{{ det.get('stock_minimo')?.value }}</span>
                      </td>
                      <td class="p-4">
                        <input formControlName="cantidad" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-primary focus:border-primary text-sm font-bold">
                      </td>
                      <td class="p-4">
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">$</span>
                          <input formControlName="costo_unitario" type="number" min="0" step="0.01" class="w-full border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-bold text-slate-700">
                        </div>
                      </td>
                      <td class="p-4 text-right">
                        <span class="font-black text-textMain text-base whitespace-nowrap">{{ det.get('subtotal')?.value | currency:'COP':'symbol':'1.0-0' }}</span>
                      </td>
                      <td class="p-4 text-center">
                        <button type="button" (click)="removerDetalle(i)" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar fila">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="detalles.length === 0">
                      <td colspan="7" class="p-16 text-center">
                        <div class="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                        </div>
                        <p class="text-textSecondary font-medium text-base">No hay productos agregados.</p>
                        <p class="text-sm text-slate-400 mt-2">Busca o escanea un producto en la columna izquierda para comenzar.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Footer Pegajoso -->
      <div class="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 px-6 z-40 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-6">
          <div>
            <p class="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">Total Artículos</p>
            <p class="text-xl font-black text-slate-700">{{ totalArticulos }}</p>
          </div>
          <div class="h-10 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <p class="text-xs text-textSecondary uppercase tracking-wider font-bold mb-1">Total a Pagar</p>
            <p class="text-2xl font-black text-emerald-600">{{ totalGeneral | currency:'COP':'symbol':'1.0-0' }}</p>
          </div>
        </div>
        <button type="button" (click)="guardarCompra()" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Procesar Ingreso de Mercancía
        </button>
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
            stock_minimo: variante ? Number(variante.stock_minimo) : 10
          };
        });
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  // Getter de conveniencia para acceder al FormArray
  get detalles(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  agregarDetalleConProducto(producto: any) {
    // Verificar si ya existe en la tabla para solo sumar cantidad
    const indexExistente = this.detalles.controls.findIndex(ctrl => ctrl.get('producto_id')?.value === producto.id);
    if (indexExistente >= 0) {
      const formControl = this.detalles.at(indexExistente);
      const cantActual = formControl.get('cantidad')?.value;
      formControl.get('cantidad')?.setValue(cantActual + 1);
      return;
    }

    const detalleForm = this.fb.group({
      producto_id: [producto.id, Validators.required],
      sku: [producto.sku],
      nombre_producto: [producto.nombre],
      stock_actual: [producto.stock],
      stock_minimo: [producto.stock_minimo],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      costo_unitario: [producto.costo, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }] 
    });
    
    this.detalles.push(detalleForm);
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
        this.mostrarError('Error técnico: no fue posible procesar el ingreso. Verifique su conexión e intente nuevamente.');
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
