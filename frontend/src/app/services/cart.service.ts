import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ProductoCarrito {
  sku: string;
  nombre: string;
  precio: number;
  cantidad: number;
  variante_id?: string;
  stock?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private carrito = new BehaviorSubject<ProductoCarrito[]>([]);
  carrito$ = this.carrito.asObservable();

  private ventaCompletada = new Subject<void>();
  ventaCompletada$ = this.ventaCompletada.asObservable();

  constructor() {}

  notificarVentaCompletada() {
    this.ventaCompletada.next();
  }

  agregarProducto(producto: Omit<ProductoCarrito, 'cantidad'>) {
    const current = this.carrito.getValue();
    const existe = current.find(item => item.sku === producto.sku);

    if (existe) {
      if (producto.stock !== undefined && existe.cantidad >= producto.stock) {
        alert(`No hay stock suficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`);
        return;
      }
      existe.cantidad++;
      this.carrito.next([...current]);
    } else {
      if (producto.stock !== undefined && producto.stock < 1) {
        alert(`No hay stock suficiente para ${producto.nombre}.`);
        return;
      }
      this.carrito.next([...current, { ...producto, cantidad: 1 }]);
    }
  }

  eliminarProducto(sku: string) {
    const current = this.carrito.getValue().filter(item => item.sku !== sku);
    this.carrito.next(current);
  }

  getCantidadEnCarrito(sku: string): number {
    const item = this.carrito.getValue().find(i => i.sku === sku);
    return item ? item.cantidad : 0;
  }

  vaciarCarrito() {
    this.carrito.next([]);
  }

  calcularSubtotal(): number {
    return this.carrito.getValue().reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }

  calcularImpuestos(tasa: number = 0.10): number {
    return this.calcularSubtotal() * tasa;
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularImpuestos();
  }
}
