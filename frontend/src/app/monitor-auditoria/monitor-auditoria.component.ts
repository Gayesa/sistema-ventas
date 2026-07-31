import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ExportService } from '../services/export.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-monitor-auditoria',
  templateUrl: './monitor-auditoria.component.html'
})
export class MonitorAuditoriaComponent implements OnInit {
  constructor(private exportService: ExportService) {}
  
  logs: any[] = [];
  filteredLogs: any[] = [];
  
  searchTerm: string = '';
  filtroAccion: string = '';

  // Estado UI
  isModalOpen: boolean = false;
  selectedLog: any = null;

  ngOnInit() {
    // Aquí iría tu: this.auditoriaService.getLogs().subscribe(res => ...)
    this.logs = [
      {
        id: 'uuid-1',
        usuario_id: 'usr-admin-1',
        accion: 'UPDATE',
        tabla_afectada: 'producto_variantes',
        fecha: new Date(),
        valores_anteriores: { precio_venta: 500, stock_actual: 10, es_compuesto: false },
        valores_nuevos: { precio_venta: 200, stock_actual: 10, es_compuesto: false }
      },
      {
        id: 'uuid-2',
        usuario_id: 'usr-vendedor-2',
        accion: 'DELETE',
        tabla_afectada: 'clientes',
        fecha: new Date(),
        valores_anteriores: { nombre: 'Juan', adeudo: 1500 },
        valores_nuevos: null
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let source = this.logs;

    if (this.filtroAccion) {
      source = source.filter(log => log.accion === this.filtroAccion);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      source = source.filter(log => 
        log.usuario_id.toLowerCase().includes(term) ||
        log.tabla_afectada.toLowerCase().includes(term) ||
        log.accion.toLowerCase().includes(term) ||
        (log.fecha && log.fecha.toString().toLowerCase().includes(term))
      );
    }
    
    this.filteredLogs = source;
    this.currentPage = 1;
  }

  // Paginacion
  currentPage = 1;
  pageSize = 10;
  
  get paginatedLogs() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredLogs.length / this.pageSize) || 1;
  }

  get startIndex() {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex() {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredLogs.length ? this.filteredLogs.length : end;
  }

  changePageSize() {
    this.currentPage = 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // --- Modal Logic ---
  abrirModalComparacion(log: any) {
    this.selectedLog = log;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedLog = null;
  }

  // --- Algoritmo de extracción de diferencias (Diffing) ---
  getCambiosVisuales(viejos: any, nuevos: any): { key: string, old: any, new: any }[] {
    if (!viejos || !nuevos) return [];
    
    // Hacemos un Set con todas las llaves posibles de ambos objetos
    const keys = new Set([...Object.keys(viejos), ...Object.keys(nuevos)]);
    const cambios = [];
    
    for (const key of keys) {
      // Comparamos stringificados. Si hay mutación, lo mandamos al HTML.
      if (JSON.stringify(viejos[key]) !== JSON.stringify(nuevos[key])) {
        cambios.push({ key, old: viejos[key], new: nuevos[key] });
      }
    }
    
    return cambios;
  }

  // --- EXPORTACIÓN ---
  exportarExcel() {
    const dataToExport = this.filteredLogs.map(log => ({
      'Fecha': new Date(log.fecha).toLocaleString(),
      'Usuario (Autor)': log.usuario_id,
      'Tabla Afectada': log.tabla_afectada,
      'Acción Realizada': log.accion
    }));
    this.exportService.exportarExcel(dataToExport, 'Logs_Auditoria');
  }

  exportarPDF() {
    const columns = ['Fecha', 'Usuario (Autor)', 'Tabla Afectada', 'Acción'];
    const dataToExport = this.filteredLogs.map(log => [
      new Date(log.fecha).toLocaleString(),
      log.usuario_id,
      log.tabla_afectada,
      log.accion
    ]);
    this.exportService.exportarPDF(columns, dataToExport, 'Monitor de Auditoría y Control Interno');
  }
}
