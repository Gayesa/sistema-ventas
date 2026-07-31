import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BarcodeScannerService } from '../barcode-scanner.service';
import { CartService } from '../services/cart.service';
import { environment } from '../../environments/environment';

interface ProductoCatalogo {
  id: string;
  variante_id?: string;
  sku: string;
  nombre: string;
  precio_venta: number;
  stock: number;
  imagen?: string;
  categoria_id?: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-ventas',
  template: `
    <div class="h-full flex flex-col bg-slate-50 p-6">
      <!-- Search and Filter Header -->
      <div class="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 class="text-2xl font-black text-textMain tracking-tight">Punto de Venta</h2>
          <p class="text-sm text-textSecondary mt-1">Selecciona productos o escanea el código de barras.</p>
        </div>
        
        <div class="relative w-full md:w-80">
          <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filtrarProductos()"
            placeholder="Buscar por nombre o SKU..." 
            class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all"
          >
        </div>
      </div>

      <!-- Categories Pills -->
      <div class="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
        <button 
          (click)="seleccionarCategoria('')"
          [class.bg-primary]="categoriaSeleccionada === ''"
          [class.text-white]="categoriaSeleccionada === ''"
          [class.bg-white]="categoriaSeleccionada !== ''"
          [class.text-slate-600]="categoriaSeleccionada !== ''"
          class="px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm border border-slate-200 hover:border-primary"
        >
          Todos
        </button>
        <button 
          *ngFor="let cat of categorias"
          (click)="seleccionarCategoria(cat.id)"
          [class.bg-primary]="categoriaSeleccionada === cat.id"
          [class.text-white]="categoriaSeleccionada === cat.id"
          [class.bg-white]="categoriaSeleccionada !== cat.id"
          [class.text-slate-600]="categoriaSeleccionada !== cat.id"
          class="px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm border border-slate-200 hover:border-primary"
        >
          {{ cat.nombre }}
        </button>
      </div>
      
      <!-- Product Grid -->
      <div class="flex-1 overflow-y-auto pr-2">
        <div *ngIf="cargando" class="flex justify-center items-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div *ngIf="!cargando && productosFiltrados.length === 0" class="text-center py-16">
          <div class="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <p class="text-lg font-bold text-slate-700">No se encontraron productos</p>
          <p class="text-sm text-slate-500 mt-1">Intenta con otra búsqueda o categoría.</p>
        </div>

        <div *ngIf="!cargando && productosFiltrados.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
          <div 
            *ngFor="let prod of productosFiltrados" 
            (click)="getStockDisponible(prod) > 0 ? agregar(prod) : null"
            [class.opacity-50]="getStockDisponible(prod) === 0"
            [class.cursor-not-allowed]="getStockDisponible(prod) === 0"
            [class.cursor-pointer]="getStockDisponible(prod) > 0"
            class="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-primary/50 transition-all hover:-translate-y-1 group flex flex-col overflow-hidden relative">
            
            <div *ngIf="getStockDisponible(prod) === 0" class="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">Agotado</span>
            </div>

            <div class="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden relative p-4">
              <img *ngIf="prod.imagen" [src]="prod.imagen" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300">
              <svg *ngIf="!prod.imagen" class="w-12 h-12 text-slate-300 group-hover:text-primary/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            
            <div class="p-4 flex-1 flex flex-col">
              <p class="text-xs font-mono text-slate-400 mb-1 truncate">{{ prod.sku }}</p>
              <h3 class="text-sm font-bold text-slate-700 leading-tight line-clamp-2 mb-2">{{ prod.nombre }}</h3>
              <div class="mt-auto flex justify-between items-end">
                <p class="text-lg font-black text-emerald-600">{{ prod.precio_venta | currency:'COP':'symbol':'1.0-0' }}</p>
                <p class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{{ getStockDisponible(prod) }} unid.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class VentasComponent implements OnInit, OnDestroy {
  private scannerSub!: Subscription; 
  private cartSub!: Subscription;
  private ventaSub!: Subscription;

  productosBackend: ProductoCatalogo[] = [];
  productosFiltrados: ProductoCatalogo[] = [];
  categorias: Categoria[] = [];
  
  searchTerm: string = '';
  categoriaSeleccionada: string = '';
  cargando: boolean = true;

  constructor(
    private barcodeScanner: BarcodeScannerService,
    private cartService: CartService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();

    this.scannerSub = this.barcodeScanner.scannedCode$.subscribe({
      next: (sku: string) => {
        const prod = this.productosBackend.find(p => p.sku === sku);
        if (prod) {
          if (prod.stock > 0) {
            this.agregar(prod);
          } else {
            alert(`El producto \${prod.nombre} no tiene stock disponible.`);
          }
        } else {
          console.warn('Producto no encontrado en catálogo rápido:', sku);
        }
      }
    });

    this.cartSub = this.cartService.carrito$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.ventaSub = this.cartService.ventaCompletada$.subscribe(() => {
      this.cargarProductos();
    });
  }

  cargarCategorias() {
    this.http.get<any[]>(`${environment.apiUrl}/categorias`).subscribe({
      next: (data) => {
        // Solo tomar categorías principales (sin parent_id)
        this.categorias = data.filter(c => !c.parent_id).map(c => ({ id: c.id, nombre: c.nombre }));
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  cargarProductos() {
    this.cargando = true;
    this.http.get<any[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (data) => {
        this.productosBackend = data
          .filter(p => p.is_active)
          .map(p => {
            const variante = p.variantes && p.variantes.length > 0 ? p.variantes[0] : null;
            return {
              id: p.id,
              variante_id: variante ? variante.id : undefined,
              sku: variante ? variante.sku : '',
              nombre: p.nombre,
              precio_venta: variante ? Number(variante.precio_venta) : 0,
              stock: variante ? Number(variante.stock_actual) : 0,
              imagen: p.imagen_url,
              categoria_id: p.categoria?.parent_id || p.categoria?.id || ''
            };
          });
        this.filtrarProductos();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarCategoria(id: string) {
    this.categoriaSeleccionada = id;
    this.filtrarProductos();
  }

  filtrarProductos() {
    let filtrados = this.productosBackend;

    if (this.categoriaSeleccionada) {
      filtrados = filtrados.filter(p => p.categoria_id === this.categoriaSeleccionada);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term)
      );
    }

    this.productosFiltrados = filtrados;
  }

  agregar(producto: ProductoCatalogo) {
    this.cartService.agregarProducto({
      sku: producto.sku,
      nombre: producto.nombre,
      precio: producto.precio_venta,
      variante_id: producto.variante_id,
      stock: producto.stock
    });
  }

  getStockDisponible(prod: ProductoCatalogo): number {
    const enCarrito = this.cartService.getCantidadEnCarrito(prod.sku);
    return Math.max(0, prod.stock - enCarrito);
  }

  ngOnDestroy() {
    if (this.scannerSub) {
      this.scannerSub.unsubscribe();
    }
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
    if (this.ventaSub) {
      this.ventaSub.unsubscribe();
    }
  }
}
