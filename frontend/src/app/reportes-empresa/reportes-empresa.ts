import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reportes-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-empresa.html',
})
export class ReportesEmpresa implements OnInit {
  empresaNombre: string = 'Cargando...';
  empresaLogo: string = '';
  empresaNit: string = '';

  activeReport: 'ventas' | 'compras' | 'inventarios' | null = null;
  activeReportTitle: string = '';
  reportData: any[] = [];
  fechaInicio: string = '';
  fechaFin: string = '';
  isLoading: boolean = false;

  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;

  constructor(
    private authService: AuthService, 
    private http: HttpClient,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const date = new Date();
    this.fechaInicio = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().substring(0, 10);
    this.fechaFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().substring(0, 10);
    const user = this.authService.currentUser();
    if (user && user.empresa_id) {
      this.http.get<any>(`${environment.apiUrl}/empresa/${user.empresa_id}`).subscribe({
        next: (empresa) => {
          this.empresaNombre = empresa.nombre || 'Mi Empresa';
          this.empresaNit = empresa.documento || '';
          if (empresa.logo) {
            this.empresaLogo = empresa.logo;
          } else {
            const logoName = encodeURIComponent(this.empresaNombre);
            this.empresaLogo = `https://ui-avatars.com/api/?name=${logoName}&background=EBF4FF&color=3B82F6&size=128&font-size=0.33`;
          }
        },
        error: (err) => console.error('Error fetching empresa:', err)
      });
    } else {
      this.empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa';
      this.empresaLogo = localStorage.getItem('empresa_logo') || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.empresaNombre)}&background=EBF4FF&color=3B82F6&size=128`;
    }
  }

  setReporte(type: 'ventas' | 'compras' | 'inventarios') {
    this.activeReport = type;
    this.searchTerm = '';
    this.currentPage = 1;
    if (type === 'ventas') this.activeReportTitle = 'Ventas Generadas';
    if (type === 'compras') this.activeReportTitle = 'Compras Realizadas';
    if (type === 'inventarios') this.activeReportTitle = 'Inventario Actual';
    this.loadData();
  }

  loadData() {
    if (!this.activeReport) return;
    this.isLoading = true;
    this.reportData = [];
    this.cdr.detectChanges();

    if (this.activeReport === 'ventas') {
      let url = `${environment.apiUrl}/ventas`;
      this.http.get<any[]>(url).subscribe({
        next: (data) => {
          let ventas = Array.isArray(data) ? data : [];
          // Filtrado local por fecha (como en el historial original)
          if (this.fechaInicio && this.fechaFin) {
            const start = new Date(this.fechaInicio + 'T00:00:00');
            const end = new Date(this.fechaFin + 'T23:59:59');
            ventas = ventas.filter(v => {
              const d = new Date(v.fecha);
              return d >= start && d <= end;
            });
          }
          this.reportData = ventas;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading ventas:', err);
          this.reportData = [];
          this.isLoading = false; 
          this.cdr.detectChanges();
        }
      });
    } else if (this.activeReport === 'compras') {
      let url = `${environment.apiUrl}/compras`;
      this.http.get<any[]>(url).subscribe({
        next: (data) => {
          let compras = Array.isArray(data) ? data : [];
          if (this.fechaInicio && this.fechaFin) {
            const start = new Date(this.fechaInicio + 'T00:00:00');
            const end = new Date(this.fechaFin + 'T23:59:59');
            compras = compras.filter(c => {
              const d = new Date(c.fecha_compra);
              return d >= start && d <= end;
            });
          }
          this.reportData = compras;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading compras:', err);
          this.reportData = [];
          this.isLoading = false; 
          this.cdr.detectChanges();
        }
      });
    } else if (this.activeReport === 'inventarios') {
      let url = `${environment.apiUrl}/productos`;
      this.http.get<any[]>(url).subscribe({
        next: (data) => {
          const arr = Array.isArray(data) ? data : [];
          this.reportData = arr.map(p => {
            const v = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
            return {
              sku: v ? v.sku : '',
              nombre: p.nombre,
              stock: v ? v.stock_actual : 0,
              precio_compra: v ? v.precio_compra : 0,
              precio_venta: v ? v.precio_venta : 0
            };
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading inventarios:', err);
          this.reportData = [];
          this.isLoading = false; 
          this.cdr.detectChanges();
        }
      });
    }
  }

  get filteredData() {
    let result = this.reportData;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      if (this.activeReport === 'ventas') {
        result = result.filter(v => 
          (v.numero_ticket && v.numero_ticket.toLowerCase().includes(term)) ||
          (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(term)) ||
          (v.vendedor_nombre && v.vendedor_nombre.toLowerCase().includes(term))
        );
      } else if (this.activeReport === 'compras') {
        result = result.filter(c => 
          (c.numero_factura_proveedor && c.numero_factura_proveedor.toLowerCase().includes(term))
        );
      } else if (this.activeReport === 'inventarios') {
        result = result.filter(i => 
          (i.sku && i.sku.toLowerCase().includes(term)) ||
          (i.nombre && i.nombre.toLowerCase().includes(term))
        );
      }
    }
    return result;
  }

  get totalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredData.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  exportarActualExcel() {
    if (!this.activeReport || this.filteredData.length === 0) {
      alert("Seleccione un reporte y asegúrese de que haya datos para exportar.");
      return;
    }

    if (this.activeReport === 'ventas') {
      const dataToExport = this.filteredData.map(v => ({
        'Ticket': v.numero_ticket,
        'Fecha': new Date(v.fecha).toLocaleString(),
        'Cliente': v.cliente_nombre || 'Cliente General',
        'Vendedor': v.vendedor_nombre,
        'Método Pago': v.metodo_pago,
        'Total': v.total
      }));
      this.exportService.exportarExcel(dataToExport, `Reporte_Ventas_${this.fechaInicio}_al_${this.fechaFin}`);
    } else if (this.activeReport === 'compras') {
      const dataToExport = this.filteredData.map(c => ({
        'Factura': c.numero_factura_proveedor,
        'Fecha': new Date(c.fecha_compra).toLocaleDateString(),
        'Total': c.total_compra
      }));
      this.exportService.exportarExcel(dataToExport, `Reporte_Compras_${this.fechaInicio}_al_${this.fechaFin}`);
    } else if (this.activeReport === 'inventarios') {
      const dataToExport = this.filteredData.map(i => ({
        'SKU': i.sku,
        'Producto': i.nombre,
        'Stock Actual': i.stock,
        'Valor Compra': i.precio_compra,
        'Valor Venta': i.precio_venta
      }));
      this.exportService.exportarExcel(dataToExport, `Reporte_Inventario`);
    }
  }

  exportarActualPDF() {
    if (!this.activeReport || this.filteredData.length === 0) {
      alert("Seleccione un reporte y asegúrese de que haya datos para exportar.");
      return;
    }

    if (this.activeReport === 'ventas') {
      const columns = ['Ticket', 'Fecha', 'Cliente', 'Vendedor', 'Total'];
      const dataToExport = this.filteredData.map(v => [
        v.numero_ticket,
        new Date(v.fecha).toLocaleString(),
        v.cliente_nombre || 'Cliente General',
        v.vendedor_nombre,
        `$ ${Number(v.total).toLocaleString('es-CO')}`
      ]);
      this.exportService.exportarPDF(columns, dataToExport, `Reporte de Ventas (${this.fechaInicio} al ${this.fechaFin})`);
    } else if (this.activeReport === 'compras') {
      const columns = ['Factura', 'Fecha', 'Total'];
      const dataToExport = this.filteredData.map(c => [
        c.numero_factura_proveedor,
        new Date(c.fecha_compra).toLocaleDateString(),
        `$ ${Number(c.total_compra).toLocaleString('es-CO')}`
      ]);
      this.exportService.exportarPDF(columns, dataToExport, `Reporte de Compras (${this.fechaInicio} al ${this.fechaFin})`);
    } else if (this.activeReport === 'inventarios') {
      const columns = ['SKU', 'Producto', 'Stock Actual', 'Valor Venta'];
      const dataToExport = this.filteredData.map(i => [
        i.sku,
        i.nombre,
        i.stock,
        `$ ${Number(i.precio_venta).toLocaleString('es-CO')}`
      ]);
      this.exportService.exportarPDF(columns, dataToExport, `Reporte General de Inventario`);
    }
  }
}
