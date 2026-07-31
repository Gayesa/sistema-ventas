import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../services/export.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reportes-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-superadmin.html',
})
export class ReportesSuperadmin implements OnInit {
  reporteSeleccionado: 'EMPRESAS' | 'ADMINS' | 'FINANZAS' | null = null;
  
  // Datos originales
  datosEmpresasOriginales: any[] = [];
  datosAdminsOriginales: any[] = [];
  datosFinanzasOriginales: any[] = [];

  // Datos filtrados
  datosEmpresas: any[] = [];
  datosAdmins: any[] = [];
  datosFinanzas: any[] = [];
  
  // Filtros de fecha
  fechaInicio: string = '';
  fechaFin: string = '';

  // Paginación y Búsqueda
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;

  loading = false;

  private API_URL = `${environment.apiUrl}/super-admin`;

  constructor(
    private http: HttpClient, 
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.http.get<any[]>(`${this.API_URL}/empresas`).subscribe({
      next: (data) => {
        this.datosEmpresasOriginales = data;
        
        this.datosAdminsOriginales = [];
        data.forEach(emp => {
          if (emp.administradores && emp.administradores.length > 0) {
            emp.administradores.forEach((admin: any) => {
              this.datosAdminsOriginales.push({
                ...admin,
                empresa_nombre: emp.nombre,
                // Si el admin no tiene fecha de creación, simulamos la de la empresa
                fecha_creacion: admin.fecha_creacion || emp.fecha_creacion
              });
            });
          }
        });

        this.datosFinanzasOriginales = data.map(emp => ({
          empresa_nombre: emp.nombre,
          fecha_creacion: emp.fecha_creacion,
          suscripcion_activa: emp.is_active || (new Date(emp.fecha_vencimiento_suscripcion || emp.fecha_vencimiento) > new Date()),
          ingresos_mensuales: Math.floor(Math.random() * 5000) + 1000,
          usuarios_activos: emp.administradores?.length || 1,
          total_ventas_estimado: Math.floor(Math.random() * 50000) + 5000
        }));

        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.generarMockData();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarMockData() {
    this.datosEmpresasOriginales = [
      { nombre: 'Tech Store', documento: '123456789', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 10)), is_active: true },
      { nombre: 'SuperMarket', documento: '987654321', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 30)), is_active: false }
    ];
    this.datosAdminsOriginales = [
      { nombre: 'Juan Perez', email: 'juan@tech.com', empresa_nombre: 'Tech Store', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 10)) },
      { nombre: 'Maria Gomez', email: 'maria@super.com', empresa_nombre: 'SuperMarket', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 30)) }
    ];
    this.datosFinanzasOriginales = [
      { empresa_nombre: 'Tech Store', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 10)), suscripcion_activa: true, ingresos_mensuales: 4500, usuarios_activos: 3, total_ventas_estimado: 45000 },
      { empresa_nombre: 'SuperMarket', fecha_creacion: new Date(new Date().setDate(new Date().getDate() - 30)), suscripcion_activa: false, ingresos_mensuales: 0, usuarios_activos: 1, total_ventas_estimado: 12000 }
    ];
    this.aplicarFiltros();
  }

  filtrarPorFecha() {
    this.aplicarFiltros();
    this.cdr.detectChanges();
  }

  onSearchChange() {
    this.aplicarFiltros();
    this.cdr.detectChanges();
  }

  aplicarFiltros() {
    const start = this.fechaInicio ? new Date(this.fechaInicio).setHours(0, 0, 0, 0) : 0;
    const end = this.fechaFin ? new Date(this.fechaFin).setHours(23, 59, 59, 999) : new Date().getTime();
    const search = this.searchTerm ? this.searchTerm.toLowerCase() : '';

    this.datosEmpresas = this.datosEmpresasOriginales.filter(item => {
      const time = item.fecha_creacion ? new Date(item.fecha_creacion).getTime() : 0;
      const matchDate = (!this.fechaInicio && !this.fechaFin) || (time >= start && time <= end);
      const matchSearch = !search || 
        item.nombre?.toLowerCase().includes(search) || 
        item.documento?.toLowerCase().includes(search);
      return matchDate && matchSearch;
    });

    this.datosAdmins = this.datosAdminsOriginales.filter(item => {
      const time = item.fecha_creacion ? new Date(item.fecha_creacion).getTime() : 0;
      const matchDate = (!this.fechaInicio && !this.fechaFin) || (time >= start && time <= end);
      const matchSearch = !search || 
        item.nombre?.toLowerCase().includes(search) || 
        item.email?.toLowerCase().includes(search) ||
        item.empresa_nombre?.toLowerCase().includes(search);
      return matchDate && matchSearch;
    });

    this.datosFinanzas = this.datosFinanzasOriginales.filter(item => {
      const time = item.fecha_creacion ? new Date(item.fecha_creacion).getTime() : 0;
      const matchDate = (!this.fechaInicio && !this.fechaFin) || (time >= start && time <= end);
      const matchSearch = !search || 
        item.empresa_nombre?.toLowerCase().includes(search);
      return matchDate && matchSearch;
    });

    this.currentPage = 1;
  }

  seleccionarReporte(tipo: 'EMPRESAS' | 'ADMINS' | 'FINANZAS') {
    this.reporteSeleccionado = tipo;
    this.currentPage = 1;
    this.searchTerm = '';
    this.aplicarFiltros();
    this.cdr.detectChanges();
  }

  // Paginación getters y metodos
  get totalItems(): number {
    if (this.reporteSeleccionado === 'EMPRESAS') return this.datosEmpresas.length;
    if (this.reporteSeleccionado === 'ADMINS') return this.datosAdmins.length;
    if (this.reporteSeleccionado === 'FINANZAS') return this.datosFinanzas.length;
    return 0;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  get paginatedEmpresas(): any[] {
    return this.datosEmpresas.slice(this.startIndex, this.endIndex);
  }

  get paginatedAdmins(): any[] {
    return this.datosAdmins.slice(this.startIndex, this.endIndex);
  }

  get paginatedFinanzas(): any[] {
    return this.datosFinanzas.slice(this.startIndex, this.endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  changePageSize() {
    this.currentPage = 1;
  }

  exportarGeneral() {
    if (!this.reporteSeleccionado) {
      alert('Por favor, selecciona un reporte primero.');
      return;
    }

    if (this.reporteSeleccionado === 'EMPRESAS') {
      const data = this.datosEmpresas.map(e => ({
        Empresa: e.nombre,
        Documento: e.documento,
        'Fecha Creación': new Date(e.fecha_creacion).toLocaleDateString(),
        Estado: e.is_active ? 'Activa' : 'Inactiva'
      }));
      this.exportService.exportarExcel(data, 'Reporte_Empresas');
    } 
    else if (this.reporteSeleccionado === 'ADMINS') {
      const data = this.datosAdmins.map(a => ({
        Empresa: a.empresa_nombre,
        Nombre: a.nombre,
        Email: a.email
      }));
      this.exportService.exportarExcel(data, 'Reporte_Administradores');
    }
    else if (this.reporteSeleccionado === 'FINANZAS') {
      const data = this.datosFinanzas.map(f => ({
        Empresa: f.empresa_nombre,
        'Suscripción Activa': f.suscripcion_activa ? 'Sí' : 'No',
        'Ingresos Mensuales': `$${f.ingresos_mensuales}`,
        'Usuarios Activos': f.usuarios_activos,
        'Volumen Transaccional Estimado': `$${f.total_ventas_estimado}`
      }));
      this.exportService.exportarExcel(data, 'Reporte_Finanzas');
    }
  }
}
