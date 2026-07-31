import { Routes } from '@angular/router';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { VentasComponent } from './ventas/ventas.component';
import { IngresoMercanciaComponent } from './ingreso-mercancia/ingreso-mercancia.component';
import { ProcesarDevolucionComponent } from './procesar-devolucion/procesar-devolucion.component';
import { MonitorAuditoriaComponent } from './monitor-auditoria/monitor-auditoria.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { PosLayoutComponent } from './layouts/pos-layout/pos-layout.component';
import { MiEmpresaComponent } from './mi-empresa/mi-empresa.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Admin Routes (Wrapped in AdminLayout)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardAdminComponent },
      { path: 'mi-empresa', component: MiEmpresaComponent },
      { path: 'ingreso', component: IngresoMercanciaComponent },
      { path: 'historial-compras', loadComponent: () => import('./historial-compras/historial-compras.component').then(m => m.HistorialComprasComponent) },
      { path: 'historial-ventas', loadComponent: () => import('./historial-ventas/historial-ventas.component').then(m => m.HistorialVentasComponent) },
      { path: 'inventario-general', loadComponent: () => import('./inventario-general/inventario-general').then(m => m.InventarioGeneralComponent) },
      { path: 'productos', loadComponent: () => import('./productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'proveedores', loadComponent: () => import('./proveedores/proveedores.component').then(m => m.ProveedoresComponent) },
      { path: 'vendedores', loadComponent: () => import('./vendedores/vendedores.component').then(m => m.VendedoresComponent) },
      { path: 'categorias', loadComponent: () => import('./categorias/categorias').then(m => m.CategoriasComponent) },
      { path: 'superadmin/empresas', loadComponent: () => import('./superadmin-empresas/superadmin-empresas.component').then(m => m.SuperadminEmpresasComponent) },
      { path: 'reportes-superadmin', loadComponent: () => import('./reportes-superadmin/reportes-superadmin').then(m => m.ReportesSuperadmin) },
      { path: 'reportes-empresa', loadComponent: () => import('./reportes-empresa/reportes-empresa').then(m => m.ReportesEmpresa) },
      { path: 'auditoria', component: MonitorAuditoriaComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // POS Routes (Wrapped in PosLayout)
  {
    path: 'pos',
    component: PosLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'caja', component: VentasComponent },
      { path: 'devoluciones', component: ProcesarDevolucionComponent },
      { path: '', redirectTo: 'caja', pathMatch: 'full' }
    ]
  },
  // Default Redirect
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
