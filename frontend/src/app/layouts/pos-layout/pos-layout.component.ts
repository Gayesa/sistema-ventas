import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ExportService } from '../../services/export.service';
import { CartService, ProductoCarrito } from '../../services/cart.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './pos-layout.component.html',
})
export class PosLayoutComponent implements OnInit {
  userRole: string = '';
  scannedCode: string = '';
  carrito$: Observable<ProductoCarrito[]>;

  constructor(
    private authService: AuthService,
    public cartService: CartService,
    private router: Router,
    private exportService: ExportService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.carrito$ = this.cartService.carrito$;
  }

  get isDevolucionesRoute(): boolean {
    return this.router.url.includes('/pos/devoluciones');
  }

  modalAperturaVisible = false;
  baseCaja: number = 0;

  ngOnInit() {
    this.userRole = this.authService.getRole() || 'VENDEDOR';
    this.verificarAperturaCaja();
  }

  verificarAperturaCaja() {
    const abierta = localStorage.getItem('caja_abierta');
    if (!abierta) {
      this.modalAperturaVisible = true;
    }
  }

  abrirCaja() {
    if (this.baseCaja < 0) this.baseCaja = 0;
    localStorage.setItem('caja_abierta', 'true');
    localStorage.setItem('base_caja', this.baseCaja.toString());
    this.modalAperturaVisible = false;
  }
  
  get saldoAFavorTotalGlobal(): number {
    return parseFloat(localStorage.getItem('saldo_a_favor') || '0');
  }
  
  get cantidadVentasDelDia(): number {
    const ventasStorage = localStorage.getItem('ventas_turno_mock');
    if (ventasStorage) {
      return JSON.parse(ventasStorage).length;
    }
    return 0;
  }
  
  @HostListener('window:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Si el usuario está escribiendo en un input, textarea o select, ignorar captura global del escáner
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    if (event.key === 'Enter') {
      if (this.scannedCode) {
        this.processScannedCode(this.scannedCode);
        this.scannedCode = '';
      }
    } else {
      // Basic filter for alphanumeric characters (adjust as needed for barcode type)
      if (event.key.length === 1) {
        this.scannedCode += event.key;
      }
    }
  }

  processScannedCode(code: string) {
    console.log('Scanned:', code);
    // Add logic to fetch product by code and add to ticket
  }

  logout() {
    this.authService.logout();
  }

  irADashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  // --- NAVEGACIÓN ---
  irADevoluciones() {
    this.router.navigate(['/pos/devoluciones']);
  }

  irAProveedores() {
    this.router.navigate(['/admin/proveedores']);
  }

  volverCaja() {
    this.router.navigate(['/pos/caja']);
  }

  // --- LÓGICA DEL CIERRE Z ---
  modalCierreZVisible: boolean = false;
  cierreZExito: boolean = false;
  totalesCierreZ = {
    base_caja: 0,
    efectivo: 0,
    tarjeta: 0,
    nequi: 0,
    total: 0,
    efectivo_en_caja: 0,
    operaciones: 0
  };

  abrirModalCierreZ() {
    // Calcular totales reales del turno mock
    const ventasStorage = localStorage.getItem('ventas_turno_mock');
    let ventas: any[] = [];
    if (ventasStorage) {
      ventas = JSON.parse(ventasStorage);
    }
    
    let ef = 0; let ta = 0; let ne = 0;
    ventas.forEach((v: any) => {
      if (v.desglose_pagos) {
        ef += Number(v.desglose_pagos.efectivo || 0);
        ta += Number(v.desglose_pagos.tarjeta || 0);
        ne += Number(v.desglose_pagos.nequi || 0);
      } else {
        if(v.metodo === 'EFECTIVO') ef += Number(v.total || 0);
        if(v.metodo === 'TARJETA') ta += Number(v.total || 0);
        if(v.metodo === 'NEQUI') ne += Number(v.total || 0);
      }
    });

    const baseCaja = parseFloat(localStorage.getItem('base_caja') || '0');

    this.totalesCierreZ = {
      base_caja: baseCaja,
      efectivo: ef,
      tarjeta: ta,
      nequi: ne,
      total: ef + ta + ne,
      efectivo_en_caja: baseCaja + ef,
      operaciones: ventas.length
    };
    
    this.modalCierreZVisible = true;
    this.cierreZExito = false;
  }

  cerrarModalCierreZ() {
    this.modalCierreZVisible = false;
  }

  procesarCierreZ() {
    // Generar e Imprimir PDF
    this.exportService.exportarCierreZPDF(this.totalesCierreZ);

    this.cierreZExito = true;
    
    // Limpiar el turno actual al cerrar
    localStorage.removeItem('caja_abierta');
    localStorage.removeItem('base_caja');
    localStorage.removeItem('ventas_turno_mock');

    setTimeout(() => {
      this.modalCierreZVisible = false;
      this.cierreZExito = false;
      this.logout();
    }, 3000);
  }

  // --- LÓGICA DEL REPORTE X (VENTAS DEL DÍA) ---
  modalReporteXVisible: boolean = false;
  totalesReporteX: any = {};
  
  // Array en memoria para simular las ventas del turno actual
  ventasDelTurno: any[] = [];

  abrirModalReporteX() {
    // Cargar desde localStorage para simular DB compartida
    const ventasStorage = localStorage.getItem('ventas_turno_mock');
    if (ventasStorage) {
      this.ventasDelTurno = JSON.parse(ventasStorage);
    } else {
      this.ventasDelTurno = [];
    }

    let ef = 0; let ta = 0; let ne = 0;
    this.ventasDelTurno.forEach((v: any) => {
      if (v.desglose_pagos) {
        ef += Number(v.desglose_pagos.efectivo || 0);
        ta += Number(v.desglose_pagos.tarjeta || 0);
        ne += Number(v.desglose_pagos.nequi || 0);
      } else {
        if(v.metodo === 'EFECTIVO') ef += Number(v.total || 0);
        if(v.metodo === 'TARJETA') ta += Number(v.total || 0);
        if(v.metodo === 'NEQUI') ne += Number(v.total || 0);
      }
    });

    this.totalesReporteX = {
      efectivo: ef,
      tarjeta: ta,
      nequi: ne,
      total: ef + ta + ne,
      operaciones: this.ventasDelTurno.length,
      detalles_ventas: this.ventasDelTurno
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

  // --- LÓGICA DEL MODAL DE COBRO ---
  modalCobroVisible: boolean = false;
  modalConfirmacionVentaVisible: boolean = false;
  metodoPagoSeleccionado: string = 'EFECTIVO';
  dineroRecibido: number = 0;
  ventaProcesadaExito: boolean = false;

  // Variables específicas para Pago Mixto / Combinado
  montoEfectivo: number = 0;
  montoTarjeta: number = 0;
  montoNequi: number = 0;
  dineroRecibidoEfectivoMixto: number = 0;

  saldoAFavorTotal: number = 0;
  usarSaldoAFavor: boolean = false;

  // --- CLIENTE EN VENTA ---
  busquedaClienteCedula: string = '';
  buscandoCliente: boolean = false;
  clienteSeleccionado: any = null;
  mensajeBusquedaCliente: string | null = null;
  tipoMensajeCliente: 'success' | 'warning' | 'error' = 'success';

  // Última venta procesada (para Factura PDF y WhatsApp)
  ultimaVentaRealizada: any = null;
  ultimoCliente: any = null;
  enlaceWhatsApp: string | null = null;

  abrirModalCobro() {
    this.modalCobroVisible = true;
    this.metodoPagoSeleccionado = 'EFECTIVO';
    this.saldoAFavorTotal = parseFloat(localStorage.getItem('saldo_a_favor') || '0');
    this.usarSaldoAFavor = false;
    this.dineroRecibido = this.totalAPagarFinal; // Por defecto sugerimos monto exacto
    this.ventaProcesadaExito = false;
    this.buscandoCliente = false;
    this.mensajeBusquedaCliente = null;
    this.limpiarMontosMixtos();
    this.cdr.detectChanges();
  }

  cerrarModalCobro() {
    this.modalCobroVisible = false;
    this.buscandoCliente = false;
    if (this.ventaProcesadaExito) {
      this.finalizarVentaYLimpiar();
    }
    this.cdr.detectChanges();
  }

  buscarClientePorCedula() {
    const cedula = this.busquedaClienteCedula ? this.busquedaClienteCedula.trim() : '';
    if (!cedula) {
      this.mensajeBusquedaCliente = 'Ingresa un número de cédula para buscar.';
      this.tipoMensajeCliente = 'warning';
      this.cdr.detectChanges();
      return;
    }

    this.buscandoCliente = true;
    this.mensajeBusquedaCliente = null;
    this.cdr.detectChanges();

    this.http.get<any[]>(`${environment.apiUrl}/clientes`).subscribe({
      next: (clientes) => {
        this.buscandoCliente = false;
        const lista = Array.isArray(clientes) ? clientes : [];
        const encontrado = lista.find(c => String(c.cedula || '').trim().toLowerCase() === cedula.toLowerCase());
        
        if (encontrado) {
          if (!encontrado.is_active) {
            this.clienteSeleccionado = null;
            this.mensajeBusquedaCliente = `El cliente ${encontrado.nombres} ${encontrado.apellidos} está inactivo.`;
            this.tipoMensajeCliente = 'error';
          } else {
            this.clienteSeleccionado = encontrado;
            this.mensajeBusquedaCliente = `Cliente vinculado: ${encontrado.nombres} ${encontrado.apellidos}`;
            this.tipoMensajeCliente = 'success';
          }
        } else {
          this.clienteSeleccionado = null;
          this.mensajeBusquedaCliente = `No existe ningún cliente registrado con la cédula "${cedula}". La venta se procesará como Consumidor Final.`;
          this.tipoMensajeCliente = 'warning';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.buscandoCliente = false;
        console.error('Error buscando cliente:', err);
        const errMsg = err.error?.message || 'Error al consultar la base de datos de clientes.';
        this.mensajeBusquedaCliente = typeof errMsg === 'string' ? errMsg : 'Error al consultar el cliente.';
        this.tipoMensajeCliente = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  quitarCliente() {
    this.clienteSeleccionado = null;
    this.busquedaClienteCedula = '';
    this.mensajeBusquedaCliente = null;
    this.buscandoCliente = false;
    this.cdr.detectChanges();
  }

  imprimirFacturaUltimaVenta() {
    if (this.ultimaVentaRealizada) {
      this.exportService.exportarFacturaVentaPDF(this.ultimaVentaRealizada, this.ultimoCliente);
    }
  }

  enviarWhatsAppUltimaVenta() {
    if (this.enlaceWhatsApp) {
      window.open(this.enlaceWhatsApp, '_blank');
    }
  }

  finalizarVentaYLimpiar() {
    this.cartService.vaciarCarrito();
    this.modalCobroVisible = false;
    this.ventaProcesadaExito = false;
    this.limpiarMontosMixtos();
    this.clienteSeleccionado = null;
    this.busquedaClienteCedula = '';
    this.mensajeBusquedaCliente = null;
    this.ultimaVentaRealizada = null;
    this.ultimoCliente = null;
    this.enlaceWhatsApp = null;
  }

  seleccionarMetodo(metodo: string) {
    this.metodoPagoSeleccionado = metodo;
    if (metodo === 'MIXTO') {
      this.limpiarMontosMixtos();
    } else if (metodo !== 'EFECTIVO') {
      this.dineroRecibido = this.totalAPagarFinal;
    } else {
      this.dineroRecibido = this.totalAPagarFinal;
    }
  }

  // --- MÉTODOS Y GETTERS PARA PAGO MIXTO ---
  get totalPagadoMixto(): number {
    return (Number(this.montoEfectivo) || 0) + (Number(this.montoTarjeta) || 0) + (Number(this.montoNequi) || 0);
  }

  get faltanteMixto(): number {
    const diff = this.totalAPagarFinal - this.totalPagadoMixto;
    return diff > 0 ? diff : 0;
  }

  get excedenteMixto(): number {
    const diff = this.totalPagadoMixto - this.totalAPagarFinal;
    return diff > 0 ? diff : 0;
  }

  get cambioEfectivoMixto(): number {
    if ((Number(this.montoEfectivo) || 0) <= 0) return 0;
    const entregado = Number(this.dineroRecibidoEfectivoMixto) || Number(this.montoEfectivo);
    const diff = entregado - Number(this.montoEfectivo);
    return diff > 0 ? diff : 0;
  }

  asignarRestante(metodo: 'EFECTIVO' | 'TARJETA' | 'NEQUI') {
    const restante = this.faltanteMixto;
    if (restante <= 0) return;

    if (metodo === 'EFECTIVO') {
      this.montoEfectivo = (Number(this.montoEfectivo) || 0) + restante;
      this.dineroRecibidoEfectivoMixto = this.montoEfectivo;
    } else if (metodo === 'TARJETA') {
      this.montoTarjeta = (Number(this.montoTarjeta) || 0) + restante;
    } else if (metodo === 'NEQUI') {
      this.montoNequi = (Number(this.montoNequi) || 0) + restante;
    }
  }

  limpiarMontosMixtos() {
    this.montoEfectivo = 0;
    this.montoTarjeta = 0;
    this.montoNequi = 0;
    this.dineroRecibidoEfectivoMixto = 0;
  }

  establecerEfectivoRapido(monto: number) {
    this.dineroRecibido = monto;
  }

  get totalAPagarFinal(): number {
    let total = this.cartService.calcularTotal();
    if (this.usarSaldoAFavor) {
      total = Math.max(0, total - this.saldoAFavorTotal);
    }
    return total;
  }

  toggleSaldoAFavor() {
    this.usarSaldoAFavor = !this.usarSaldoAFavor;
    this.dineroRecibido = this.totalAPagarFinal;
    if (this.metodoPagoSeleccionado === 'MIXTO') {
      this.limpiarMontosMixtos();
    }
  }

  get cambio(): number {
    if (this.metodoPagoSeleccionado !== 'EFECTIVO') return 0;
    const diff = this.dineroRecibido - this.totalAPagarFinal;
    return diff > 0 ? diff : 0;
  }

  get faltante(): number {
    const diff = this.totalAPagarFinal - this.dineroRecibido;
    return diff > 0 ? diff : 0;
  }

  procesarVenta() {
    if (this.metodoPagoSeleccionado === 'EFECTIVO') {
      if (this.faltante > 0) {
        alert('El dinero recibido es menor al total a pagar.');
        return;
      }
    } else if (this.metodoPagoSeleccionado === 'MIXTO') {
      if (this.totalPagadoMixto !== this.totalAPagarFinal) {
        if (this.faltanteMixto > 0) {
          alert(`Falta asignar $${this.faltanteMixto.toLocaleString('es-CO')} para completar el total de la venta.`);
        } else {
          alert(`La suma asignada ($${this.totalPagadoMixto.toLocaleString('es-CO')}) excede el total a pagar.`);
        }
        return;
      }
      if (this.montoEfectivo > 0 && this.dineroRecibidoEfectivoMixto < this.montoEfectivo) {
        alert('El dinero recibido en efectivo es menor al monto asignado para pago en efectivo.');
        return;
      }
    }

    // Procesar directamente sin mostrar el modal de confirmación (un solo clic)
    this.procesarVentaDefinitiva();
  }

  cancelarConfirmacionVenta() {
    this.modalConfirmacionVentaVisible = false;
  }

  procesarVentaDefinitiva() {
    this.modalConfirmacionVentaVisible = false;
    
    // Preparar el payload
    let detalles: any[] = [];
    this.cartService.carrito$.subscribe(items => {
      detalles = items.map(i => ({
        variante_id: i.variante_id || null,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.precio
      }));
    }).unsubscribe();

    if (detalles.length === 0) {
      alert('El carrito de compras está vacío.');
      return;
    }

    let metodoFinal = this.metodoPagoSeleccionado;
    let desglose: any = null;

    if (this.metodoPagoSeleccionado === 'MIXTO') {
      const partes: string[] = [];
      if (this.montoEfectivo > 0) partes.push(`Efectivo: $${Number(this.montoEfectivo).toLocaleString('es-CO')}`);
      if (this.montoTarjeta > 0) partes.push(`Tarjeta: $${Number(this.montoTarjeta).toLocaleString('es-CO')}`);
      if (this.montoNequi > 0) partes.push(`Nequi: $${Number(this.montoNequi).toLocaleString('es-CO')}`);
      metodoFinal = `MIXTO (${partes.join(', ')})`;
      desglose = {
        tipo: 'MIXTO',
        efectivo: Number(this.montoEfectivo) || 0,
        tarjeta: Number(this.montoTarjeta) || 0,
        nequi: Number(this.montoNequi) || 0,
        dinero_recibido_efectivo: Number(this.dineroRecibidoEfectivoMixto) || Number(this.montoEfectivo) || 0,
        cambio: this.cambioEfectivoMixto
      };
    } else {
      desglose = {
        tipo: this.metodoPagoSeleccionado,
        efectivo: this.metodoPagoSeleccionado === 'EFECTIVO' ? this.totalAPagarFinal : 0,
        tarjeta: this.metodoPagoSeleccionado === 'TARJETA' ? this.totalAPagarFinal : 0,
        nequi: this.metodoPagoSeleccionado === 'NEQUI' ? this.totalAPagarFinal : 0,
        dinero_recibido_efectivo: this.metodoPagoSeleccionado === 'EFECTIVO' ? Number(this.dineroRecibido) : 0,
        cambio: this.cambio
      };
    }

    const payload = {
      metodo_pago: this.metodoPagoSeleccionado === 'MIXTO' ? 'MIXTO' : this.metodoPagoSeleccionado,
      total: this.totalAPagarFinal,
      detalles: detalles,
      pagos_detalle: desglose,
      cliente_id: this.clienteSeleccionado ? this.clienteSeleccionado.id : null,
      cliente_datos: this.clienteSeleccionado ? {
        id: this.clienteSeleccionado.id,
        cedula: this.clienteSeleccionado.cedula,
        nombres: this.clienteSeleccionado.nombres,
        apellidos: this.clienteSeleccionado.apellidos,
        telefono: this.clienteSeleccionado.telefono || null,
        email: this.clienteSeleccionado.email || null,
        direccion: this.clienteSeleccionado.direccion || null
      } : null,
      vendedor: localStorage.getItem('name') || 'Vendedor'
    };

    // Llamada al backend POST /api/ventas
    this.http.post(`${environment.apiUrl}/ventas`, payload).subscribe({
      next: (res: any) => {
        this.ventaProcesadaExito = true;

        const ticketGenerado = res.venta?.numero_ticket || `TKT-${Date.now()}`;
        const ventaGuardada = res.venta || {
          numero_ticket: ticketGenerado,
          fecha: new Date(),
          metodo_pago: this.metodoPagoSeleccionado,
          total: this.totalAPagarFinal,
          vendedor: localStorage.getItem('name') || 'Vendedor'
        };

        this.ultimaVentaRealizada = {
          ...ventaGuardada,
          numero_ticket: ticketGenerado,
          detalles: detalles,
          pagos_detalle: desglose,
          total: this.totalAPagarFinal,
          metodo_pago: metodoFinal,
          cliente_datos: payload.cliente_datos
        };
        this.ultimoCliente = this.clienteSeleccionado ? { ...this.clienteSeleccionado } : null;

        if (this.ultimoCliente && this.ultimoCliente.telefono) {
          const resWa = this.exportService.generarEnlaceWhatsAppVenta(this.ultimaVentaRealizada, this.ultimoCliente);
          this.enlaceWhatsApp = resWa.url;
        } else {
          this.enlaceWhatsApp = null;
        }

        // Cargar ventas previas de esta sesión simulada para Reporte X y Cierre Z
        const ventasStorage = localStorage.getItem('ventas_turno_mock');
        if (ventasStorage) {
          this.ventasDelTurno = JSON.parse(ventasStorage);
        }

        const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.ventasDelTurno.push({
          ticket: ticketGenerado,
          hora: horaActual,
          metodo: this.metodoPagoSeleccionado,
          metodo_detalle: metodoFinal,
          desglose_pagos: desglose,
          total: this.totalAPagarFinal,
          cliente: this.ultimoCliente ? `${this.ultimoCliente.nombres} ${this.ultimoCliente.apellidos}` : 'Consumidor Final',
          productos: detalles.map(d => `${d.nombre} (x${d.cantidad})`).join(', ')
        });
        
        localStorage.setItem('ventas_turno_mock', JSON.stringify(this.ventasDelTurno));
        
        // Si se usó saldo a favor, descontarlo del storage
        if (this.usarSaldoAFavor) {
          const descuentoAplicado = Math.min(this.cartService.calcularTotal(), this.saldoAFavorTotal);
          const nuevoSaldo = this.saldoAFavorTotal - descuentoAplicado;
          localStorage.setItem('saldo_a_favor', nuevoSaldo.toString());
          this.saldoAFavorTotal = nuevoSaldo;
        }

        // Notificar al componente de ventas para refrescar catálogo y stock
        this.cartService.notificarVentaCompletada();

        // Vaciar carrito
        this.cartService.vaciarCarrito();
      },
      error: (err) => {
        console.error('Error al registrar venta:', err);
        const backendMsg = err.error?.message;
        const msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : (backendMsg || 'Error al procesar la venta');
        alert(`No se pudo procesar la venta: ${msg}`);
      }
    });
  }
}
