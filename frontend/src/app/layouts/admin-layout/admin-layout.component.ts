import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RefreshService } from '../../services/refresh.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  adminName: string = 'Super Administrador';
  companyName: string = 'Mi Empresa S.A.';
  companyLogo: string = ''; // Can be updated with input file preview
  isSidebarCollapsed = false;
  userRole: string = 'SUPER_ADMIN'; // Default for demo

  constructor(private authService: AuthService, private router: Router, private refreshService: RefreshService) {}

  ngOnInit() {
    this.userRole = this.authService.getRole() || 'SUPER_ADMIN';
    this.adminName = this.authService.currentUser()?.name || 'Super Administrador';
    
    // Simulate loading the associated company if they are a Tienda Admin
    if (this.userRole === 'ADMIN_TIENDA') {
      const empresaNombre = this.authService.currentUser()?.empresa_nombre || 'Mi Empresa S.A.';
      this.companyName = empresaNombre;
      const logoName = encodeURIComponent(empresaNombre);
      this.companyLogo = `https://ui-avatars.com/api/?name=${logoName}&background=EBF4FF&color=3B82F6&size=128&font-size=0.33`;
    } else {
      this.companyName = 'MERCURIO';
      this.companyLogo = '/assets/images/logo-mercurio.png';
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  checkRefresh(event: Event, path: string) {
    if (this.router.url === path) {
      event.preventDefault();
      this.refreshService.triggerRefresh(path);
    }
  }

  onLogoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  logout() {
    this.authService.logout();
  }
}
