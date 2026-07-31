import { Component, HostListener, OnInit } from '@angular/core';
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
    private http: HttpClient
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
      if(v.metodo === 'EFECTIVO') ef += v.total;
      if(v.metodo === 'TARJETA') ta += v.total;
      if(v.metodo === 'NEQUI') ne += v.total;
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
    // Aquí iría el POST /api/ventas/cierre-z
    
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
      this.logout(); // Opcional: desconectar al usuario tras el cierre
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
      if(v.metodo === 'EFECTIVO') ef += v.total;
      if(v.metodo === 'TARJETA') ta += v.total;
      if(v.metodo === 'NEQUI') ne += v.total;
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
    // Usamos el mismo diseño del PDF del Cierre Z, pero indicando que es Reporte X
    this.exportService.exportarReporteXPDF(this.totalesReporteX);
    this.modalReporteXVisible = false;
  }

  // --- LÓGICA DEL MODAL DE COBRO ---
  modalCobroVisible: boolean = false;
  modalConfirmacionVentaVisible: boolean = false;
  metodoPagoSeleccionado: string = 'EFECTIVO';
  dineroRecibido: number = 0;
  ventaProcesadaExito: boolean = false;

  saldoAFavorTotal: number = 0;
  usarSaldoAFavor: boolean = false;

  abrirModalCobro() {
    this.modalCobroVisible = true;
    this.metodoPagoSeleccionado = 'EFECTIVO';
    this.saldoAFavorTotal = parseFloat(localStorage.getItem('saldo_a_favor') || '0');
    this.usarSaldoAFavor = false;
    this.dineroRecibido = this.totalAPagarFinal; // Por defecto sugerimos monto exacto
    this.ventaProcesadaExito = false;
  }

  cerrarModalCobro() {
    this.modalCobroVisible = false;
  }

  seleccionarMetodo(metodo: string) {
    this.metodoPagoSeleccionado = metodo;
    if (metodo !== 'EFECTIVO') {
      this.dineroRecibido = this.totalAPagarFinal;
    }
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
    if (this.faltante > 0 && this.metodoPagoSeleccionado === 'EFECTIVO') {
      alert('El dinero recibido es menor al total a pagar.');
      return;
    }

    // Procesar directamente sin mostrar el modal de confirmación (un solo clic)
    this.procesarVentaDefinitiva();
  }

  cancelarConfirmacionVenta() {
    this.modalConfirmacionVentaVisible = false;
  }

  procesarVentaDefinitiva() {
    this.modalConfirmacionVentaVisible = false;
    this.ventaProcesadaExito = true;
    
    const token = localStorage.getItem('token');
    
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

    const payload = {
      metodo_pago: this.metodoPagoSeleccionado,
      total: this.totalAPagarFinal,
      detalles: detalles
    };

    // Llamada al backend POST /api/ventas
    this.http.post(`${environment.apiUrl}/ventas`, payload).subscribe({
      next: (res: any) => {
        // Cargar ventas previas de esta sesión simulada para Reporte X y Cierre Z
        const ventasStorage = localStorage.getItem('ventas_turno_mock');
        if (ventasStorage) {
          this.ventasDelTurno = JSON.parse(ventasStorage);
        }

        const horaActual = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        this.ventasDelTurno.push({
          ticket: res.venta?.numero_ticket || `TKT-${Date.now()}`,
          hora: horaActual,
          metodo: this.metodoPagoSeleccionado,
          total: this.totalAPagarFinal,
          productos: detalles.map(d => `${d.nombre} (x${d.cantidad})`).join(', ')
        });
        
        localStorage.setItem('ventas_turno_mock', JSON.stringify(this.ventasDelTurno));
        
        // Notify ventas component to refresh products
        this.cartService.notificarVentaCompletada();
      },
      error: (err) => console.error('Error al registrar venta:', err)
    });

    // Si se usó saldo a favor, descontarlo del storage
    if (this.usarSaldoAFavor) {
      const descuentoAplicado = Math.min(this.cartService.calcularTotal(), this.saldoAFavorTotal);
      const nuevoSaldo = this.saldoAFavorTotal - descuentoAplicado;
      localStorage.setItem('saldo_a_favor', nuevoSaldo.toString());
      this.saldoAFavorTotal = nuevoSaldo;
    }

    // Simular tiempo de impresión o proceso
    setTimeout(() => {
      this.cartService.vaciarCarrito();
      this.modalCobroVisible = false;
      this.ventaProcesadaExito = false;
    }, 2500);
  }
}
