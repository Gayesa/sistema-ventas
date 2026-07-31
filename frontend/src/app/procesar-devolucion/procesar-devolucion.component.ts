import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-procesar-devolucion',
  template: `
    <div class="min-h-full flex flex-col bg-slate-50 p-6 relative pb-40">
      <!-- Toasts -->
      <div *ngIf="mostrarMensajeExito" class="fixed top-24 right-6 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeExitoTxt }}</span>
      </div>
      <div *ngIf="mostrarMensajeError" class="fixed top-24 right-6 bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">{{ mensajeErrorTxt }}</span>
      </div>

      <div class="mb-6">
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Procesar Devolución</h2>
        <p class="text-sm text-slate-500 mt-1">Busca un ticket de venta y selecciona los artículos a retornar al inventario.</p>
      </div>

      <!-- Buscador de Ticket -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <form [formGroup]="buscarVentaForm" (ngSubmit)="buscarVenta()" class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-sm font-bold text-slate-700 mb-2">Número de Ticket o Factura <span class="text-rose-500">*</span></label>
            <div class="relative">
              <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input formControlName="venta_id" type="text" placeholder="Ej. TCK-001234" class="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 transition-all text-sm font-medium">
            </div>
          </div>
          <button type="submit" [disabled]="buscarVentaForm.invalid" class="w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Buscar Ticket
          </button>
        </form>
      </div>

      <!-- Contenido Devolución -->
      <div *ngIf="ventaEncontrada" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
        <div class="p-6 bg-slate-50 border-b border-slate-200">
          <div class="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 class="text-lg font-black text-slate-800">Detalles del Ticket #{{ ventaEncontrada.id }}</h3>
              <p class="text-sm text-slate-500 mt-1">Cliente: <span class="font-bold text-slate-700">{{ ventaEncontrada.cliente }}</span> | Fecha: {{ ventaEncontrada.fecha | date:'shortDate' }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Venta Original</p>
              <p class="text-xl font-black text-slate-800">{{ ventaEncontrada.total | currency:'COP':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <form [formGroup]="devolucionForm" class="flex flex-col flex-1">
          <div class="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Motivo General de la Devolución <span class="text-rose-500">*</span></label>
              <textarea formControlName="motivo_general" rows="2" placeholder="Ej. El cliente indica que el producto tiene defecto de fábrica..." class="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50 focus:bg-white transition-all resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Método de Reembolso <span class="text-rose-500">*</span></label>
              <div class="flex gap-3 h-[calc(100%-1.75rem)] pb-1.5">
                <label class="flex-1 cursor-pointer border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all" [class.bg-indigo-50]="devolucionForm.get('metodo_reembolso')?.value === 'DINERO'" [class.border-indigo-300]="devolucionForm.get('metodo_reembolso')?.value === 'DINERO'" [class.ring-2]="devolucionForm.get('metodo_reembolso')?.value === 'DINERO'" [class.ring-indigo-500]="devolucionForm.get('metodo_reembolso')?.value === 'DINERO'">
                  <input type="radio" formControlName="metodo_reembolso" value="DINERO" class="sr-only">
                  <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <span class="font-bold text-slate-700 text-xs text-center">Entregar<br>Dinero</span>
                </label>
                <label class="flex-1 cursor-pointer border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-all" [class.bg-indigo-50]="devolucionForm.get('metodo_reembolso')?.value === 'SALDO_A_FAVOR'" [class.border-indigo-300]="devolucionForm.get('metodo_reembolso')?.value === 'SALDO_A_FAVOR'" [class.ring-2]="devolucionForm.get('metodo_reembolso')?.value === 'SALDO_A_FAVOR'" [class.ring-indigo-500]="devolucionForm.get('metodo_reembolso')?.value === 'SALDO_A_FAVOR'">
                  <input type="radio" formControlName="metodo_reembolso" value="SALDO_A_FAVOR" class="sr-only">
                  <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span class="font-bold text-slate-700 text-xs text-center">Generar Saldo<br>A Favor</span>
                </label>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-100/50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <th class="p-4">Producto</th>
                  <th class="p-4 text-center w-32">Precio Unit.</th>
                  <th class="p-4 text-center w-32">Max. Devolución</th>
                  <th class="p-4 w-40">Cant. a Devolver</th>
                  <th class="p-4 w-48">Estado del Ítem</th>
                  <th class="p-4 text-right w-40">Subtotal</th>
                </tr>
              </thead>
              <tbody formArrayName="detalles" class="divide-y divide-slate-100">
                <tr *ngFor="let det of detalles.controls; let i = index" [formGroupName]="i" class="hover:bg-slate-50/50 transition-colors">
                  <td class="p-4">
                    <p class="font-bold text-slate-800">{{ det.get('nombre_display')?.value }}</p>
                    <p class="text-xs text-slate-400 font-mono mt-0.5">ID: {{ det.get('producto_id')?.value }}</p>
                  </td>
                  <td class="p-4 text-center font-medium text-slate-600">
                    {{ det.get('precio_venta')?.value | currency:'COP':'symbol':'1.0-0' }}
                  </td>
                  <td class="p-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold" [ngClass]="{'bg-emerald-50 text-emerald-700': det.get('max_disponible')?.value > 0, 'bg-rose-50 text-rose-700': det.get('max_disponible')?.value === 0}">
                      {{ det.get('max_disponible')?.value }} unid.
                    </span>
                  </td>
                  <td class="p-4">
                    <input formControlName="cantidad_devuelta" type="number" min="0" [max]="det.get('max_disponible')?.value" [class.opacity-50]="det.get('max_disponible')?.value === 0" [readOnly]="det.get('max_disponible')?.value === 0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-primary focus:border-primary text-sm font-bold bg-white disabled:bg-slate-100">
                  </td>
                  <td class="p-4">
                    <select formControlName="estado_producto" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white" [disabled]="det.get('cantidad_devuelta')?.value === 0">
                      <option value="BUEN_ESTADO">Apto para reventa</option>
                      <option value="DEFECTUOSO">Defectuoso / Dañado</option>
                    </select>
                  </td>
                  <td class="p-4 text-right">
                    <span class="font-black text-slate-800 text-lg" [class.text-slate-400]="det.get('subtotal_reembolsado')?.value === 0">{{ det.get('subtotal_reembolsado')?.value | currency:'COP':'symbol':'1.0-0' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </div>

      <!-- Footer Pegajoso de Devolución -->
      <div *ngIf="ventaEncontrada" class="fixed bottom-0 left-0 right-0 lg:left-[30%] bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 px-6 z-40 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4">
          <p class="text-sm text-slate-500 font-bold uppercase tracking-wider">Total a Reembolsar</p>
          <p class="text-3xl font-black text-rose-600">{{ totalReembolso | currency:'COP':'symbol':'1.0-0' }}</p>
        </div>
        <button type="button" (click)="procesarDevolucion()" [disabled]="totalReembolso === 0 || devolucionForm.invalid" class="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          Efectuar Reembolso
        </button>
      </div>

    </div>
  `
})
export class ProcesarDevolucionComponent implements OnInit, OnDestroy {
  buscarVentaForm!: FormGroup;
  devolucionForm!: FormGroup;
  
  ventaEncontrada: any = null;
  totalReembolso: number = 0;
  
  // Toasts
  mostrarMensajeExito = false;
  mostrarMensajeError = false;
  mensajeExitoTxt = '';
  mensajeErrorTxt = '';

  mostrarExito(msg: string) {
    this.mensajeExitoTxt = msg;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  mostrarError(msg: string) {
    this.mensajeErrorTxt = msg;
    this.mostrarMensajeError = true;
    setTimeout(() => this.mostrarMensajeError = false, 4000);
  }

  private formSub!: Subscription;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Formulario de Búsqueda de Ticket
    this.buscarVentaForm = this.fb.group({
      venta_id: ['', Validators.required]
    });

    // Formulario Maestro de Devolución
    this.devolucionForm = this.fb.group({
      venta_id: [''],
      motivo_general: ['', Validators.required],
      metodo_reembolso: ['DINERO', Validators.required],
      total_reembolsado: [0], // Calculado
      detalles: this.fb.array([])
    });

    // Evento Reactivo para matemáticas de la tabla
    this.formSub = this.detalles.valueChanges.subscribe(filas => {
      this.recalcularReembolso(filas);
    });
  }

  get detalles(): FormArray {
    return this.devolucionForm.get('detalles') as FormArray;
  }

  // --- 1. UX de Búsqueda ---
  buscarVenta() {
    const ventaId = this.buscarVentaForm.get('venta_id')?.value?.trim();
    
    // Aquí iría la petición real: this.ventasService.getVenta(ventaId).subscribe(...)
    
    // 1. Buscar en las ventas simuladas de la sesión actual (Caja Registradora)
    const ventasStorage = localStorage.getItem('ventas_turno_mock');
    let ventaReal = null;
    
    if (ventasStorage) {
      const ventas = JSON.parse(ventasStorage);
      ventaReal = ventas.find((v: any) => v.ticket === ventaId);
    }
    
    if (ventaReal) {
      // Reconstruir la lista de artículos a partir del string (ej: "Martillo (x1), Pintura (x2)")
      const detallesRaw = ventaReal.productos.split(', ');
      
      const detallesProcesados = detallesRaw.map((txt: string, idx: number) => {
        // Expresión regular para separar el nombre de la cantidad: "Nombre del Producto (x2)"
        const regex = /(.+) \(x(\d+)\)/;
        const match = txt.match(regex);
        
        const nombre = match ? match[1].trim() : txt.trim();
        const cantidad = match ? parseInt(match[2], 10) : 1;
        
        // Simular un precio unitario proporcional para que las matemáticas den exacto
        const precioUnitario = Math.floor(ventaReal.total / detallesRaw.length / cantidad);
        
        return {
           producto_id: `prod-TKT-${idx + 1}`,
           nombre: nombre,
           cantidad: cantidad,
           precio_venta: precioUnitario,
           devoluciones_previas: 0
        };
      });

      const mockVentaData = {
        id: ventaReal.ticket,
        fecha: new Date(),
        cliente: 'Cliente Mostrador',
        total: ventaReal.total,
        detalles: detallesProcesados
      };
      
      this.cargarDatosAlFormulario(mockVentaData);
      return;
    }

    // 2. Fallback de pruebas (Si ingresa un ticket no registrado)
    if (ventaId === 'TKT-001234') {
      const fallbackVentaData = {
        id: ventaId,
        fecha: new Date(),
        cliente: 'Juan Pérez',
        total: 100.00,
        detalles: [
          { producto_id: 'prod-A', nombre: 'Zapatos', cantidad: 2, precio_venta: 25.00, devoluciones_previas: 0 },
          { producto_id: 'prod-B', nombre: 'Camisa', cantidad: 1, precio_venta: 50.00, devoluciones_previas: 1 }
        ]
      };
      this.cargarDatosAlFormulario(fallbackVentaData);
      return;
    }

    // 3. Error si no se encuentra
    this.mostrarError(`No se encontró el ticket ${ventaId}. Asegúrate de haberlo registrado primero en la Caja.`);
  }

  // --- 2. Carga Dinámica al FormArray ---
  cargarDatosAlFormulario(ventaData: any) {
    this.ventaEncontrada = ventaData;
    this.devolucionForm.patchValue({ venta_id: ventaData.id });
    
    this.detalles.clear();
    
    ventaData.detalles.forEach((item: any) => {
      // Determinamos el máximo que aún puede devolver
      const disponibleParaDevolver = item.cantidad - item.devoluciones_previas;
      
      const fila = this.fb.group({
        producto_id: [item.producto_id],
        nombre_display: [item.nombre], // Auxiliar UX
        precio_venta: [item.precio_venta], // Auxiliar Cálculo
        max_disponible: [disponibleParaDevolver], // Auxiliar Validación
        
        // Campos que el usuario interviene
        cantidad_devuelta: [0, [Validators.required, Validators.min(0), Validators.max(disponibleParaDevolver)]],
        estado_producto: ['BUEN_ESTADO', Validators.required],
        
        subtotal_reembolsado: [{ value: 0, disabled: true }]
      });
      
      this.detalles.push(fila);
    });
  }

  // --- 3. Matemáticas Reactivas ---
  recalcularReembolso(filas: any[]) {
    let acumulado = 0;
    
    filas.forEach((fila, index) => {
      const cantidad = Number(fila.cantidad_devuelta) || 0;
      const precioUnitario = Number(this.detalles.at(index).get('precio_venta')?.value) || 0;
      
      const subtotalFila = cantidad * precioUnitario;
      
      // Patch sin emitEvent para no causar loops de RxJS
      this.detalles.at(index).get('subtotal_reembolsado')?.setValue(subtotalFila, { emitEvent: false });
      acumulado += subtotalFila;
    });
    
    this.totalReembolso = acumulado;
    this.devolucionForm.get('total_reembolsado')?.setValue(this.totalReembolso, { emitEvent: false });
  }

  // --- 4. Submit ---
  procesarDevolucion() {
    if (this.devolucionForm.invalid) {
       this.devolucionForm.markAllAsTouched();
       return;
    }
    
    if (this.totalReembolso === 0) {
       this.mostrarError("Debes seleccionar al menos un artículo para devolver.");
       return;
    }
    
    // Obtenemos los datos brutos y filtramos las filas cuya cantidad devuelta sea 0 (no se envían)
    const payloadRaw = this.devolucionForm.getRawValue();
    const payloadLimpio = {
      ...payloadRaw,
      detalles: payloadRaw.detalles.filter((d: any) => Number(d.cantidad_devuelta) > 0)
    };
    
    console.log('Enviando a NestJS (Transacción Fuerte):', payloadLimpio);
    
    // Si eligió Saldo a Favor, guardarlo en localStorage
    if (this.devolucionForm.get('metodo_reembolso')?.value === 'SALDO_A_FAVOR') {
      const saldoPrevio = parseFloat(localStorage.getItem('saldo_a_favor') || '0');
      const nuevoSaldo = saldoPrevio + this.totalReembolso;
      localStorage.setItem('saldo_a_favor', nuevoSaldo.toString());
      this.mostrarExito(`Devolución registrada. Se generó un SALDO A FAVOR de $${this.totalReembolso.toLocaleString('es-CO')}.`);
    } else {
      this.mostrarExito("Devolución procesada y registrada en inventario correctamente (Dinero devuelto).");
    }
    
    // Limpiar después de éxito simulado
    setTimeout(() => {
      this.ventaEncontrada = null;
      this.buscarVentaForm.reset();
      this.devolucionForm.reset({ total_reembolsado: 0 });
      this.detalles.clear();
      this.totalReembolso = 0;
    }, 2000);
  }

  ngOnDestroy() {
    if (this.formSub) this.formSub.unsubscribe();
  }
}
