import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly API_URL = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  getCierreCaja(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/cierre-caja?fecha=${fecha}`);
  }

  getVentasHistoricas(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ventas-historicas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
  }

  getTopProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/top-productos`);
  }

  getSuperAdminDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/superadmin/dashboard-stats`);
  }

  getAdminDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/admin/dashboard-stats`);
  }

  getSuperAdminTopProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/superadmin/top-productos`);
  }

  getSuperAdminFinanzasGlobales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/superadmin/finanzas-globales`);
  }
}
