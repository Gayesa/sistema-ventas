import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from '../ventas/entities/venta.entity';
import { DetalleVenta } from '../ventas/entities/detalle-venta.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from '../compras/entities/compra.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly ventaDetalleRepository: Repository<DetalleVenta>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
  ) {}

  async obtenerCierreCaja(empresaId: string, fecha: string) {
    return await this.ventaRepository
      .createQueryBuilder('venta')
      .select('venta.metodo_pago', 'metodo_pago')
      .addSelect('SUM(venta.total)', 'total')
      .where('venta.empresa_id = :empresaId', { empresaId })
      .andWhere('DATE(venta.fecha_creacion) = :fecha', { fecha })
      .groupBy('venta.metodo_pago')
      .getRawMany();
  }

  async obtenerVentasHistoricas(empresaId: string, fechaInicio: string, fechaFin: string) {
    return await this.ventaRepository
      .createQueryBuilder('venta')
      .leftJoin('venta.detalles', 'detalle')
      .select('DATE(venta.fecha_creacion)', 'fecha')
      .addSelect('SUM(detalle.precio_venta * detalle.cantidad)', 'total_ingresos')
      .addSelect('SUM(detalle.precio_compra * detalle.cantidad)', 'total_costos')
      .addSelect('SUM((detalle.precio_venta - detalle.precio_compra) * detalle.cantidad)', 'ganancia_neta')
      .where('venta.empresa_id = :empresaId', { empresaId })
      .andWhere('DATE(venta.fecha_creacion) BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
      .groupBy('DATE(venta.fecha_creacion)')
      .orderBy('DATE(venta.fecha_creacion)', 'ASC')
      .getRawMany();
  }

  async obtenerTopProductos(empresaId: string) {
    return await this.ventaDetalleRepository
      .createQueryBuilder('detalle')
      .innerJoin('detalle.venta', 'venta')
      .select('detalle.nombre_producto', 'producto')
      .addSelect('detalle.variante_id', 'sku')
      .addSelect('SUM(detalle.cantidad)', 'cantidad_vendida')
      .addSelect('SUM(detalle.precio_venta * detalle.cantidad)', 'ingresos_generados')
      .where('venta.empresa_id = :empresaId', { empresaId })
      .groupBy('detalle.producto_id, detalle.nombre_producto, detalle.variante_id')
      .orderBy('SUM(detalle.cantidad)', 'DESC')
      .limit(10)
      .getRawMany();
  }

  // ---- MÉTODOS SUPER_ADMIN ----
  
  async obtenerListadoEmpresas() {
    return await this.empresaRepository.find();
  }

  async obtenerDirectorioAdministradores() {
    return await this.usuarioRepository.find({
      where: { rol: 'ADMIN_TIENDA' }
    });
  }

  async obtenerFinanzasGlobales() {
    // Calculamos ventas, compras, etc por empresa
    const ventas = await this.ventaRepository
      .createQueryBuilder('venta')
      .select('venta.empresa_id', 'empresa_id')
      .addSelect('SUM(venta.total)', 'total_ventas')
      .groupBy('venta.empresa_id')
      .getRawMany();

    const compras = await this.compraRepository
      .createQueryBuilder('compra')
      .select('compra.empresa_id', 'empresa_id')
      .addSelect('SUM(compra.total_compra)', 'total_compras')
      .groupBy('compra.empresa_id')
      .getRawMany();

    const empresas = await this.empresaRepository.find();

    return empresas.map(emp => {
      const v = ventas.find(v => v.empresa_id === emp.id);
      const c = compras.find(c => c.empresa_id === emp.id);
      const totalVentas = v ? Number(v.total_ventas) : 0;
      const totalCompras = c ? Number(c.total_compras) : 0;
      return {
        empresa_id: emp.id,
        nombre: emp.nombre,
        total_ventas: totalVentas,
        inversion_compras: totalCompras,
        ganancia_bruta: totalVentas - totalCompras
      };
    });
  }

  async obtenerDashboardStats() {
    const empresasCount = await this.empresaRepository.count();
    const adminsCount = await this.usuarioRepository.count({ where: { rol: 'ADMIN_TIENDA' } });
    
    const { totalIngresos } = await this.ventaRepository
      .createQueryBuilder('venta')
      .select('SUM(venta.total)', 'totalIngresos')
      .getRawOne();
      
    const { totalGastos } = await this.compraRepository
      .createQueryBuilder('compra')
      .select('SUM(compra.total_compra)', 'totalGastos')
      .getRawOne();

    const ingresos = Number(totalIngresos) || 0;
    const gastos = Number(totalGastos) || 0;

    return {
      empresas: empresasCount,
      admins: adminsCount,
      ingresos: ingresos,
      gastos: gastos,
      ganancias: ingresos - gastos
    };
  }

  async obtenerDashboardStatsAdmin(empresaId: string) {
    const { totalIngresos, countVentas } = await this.ventaRepository
      .createQueryBuilder('venta')
      .select('SUM(venta.total)', 'totalIngresos')
      .addSelect('COUNT(venta.id)', 'countVentas')
      .where('venta.empresa_id = :empresaId', { empresaId })
      .getRawOne();
      
    const { totalGastos, countCompras } = await this.compraRepository
      .createQueryBuilder('compra')
      .select('SUM(compra.total_compra)', 'totalGastos')
      .addSelect('COUNT(compra.id)', 'countCompras')
      .where('compra.empresa_id = :empresaId', { empresaId })
      .getRawOne();

    const ingresos = Number(totalIngresos) || 0;
    const gastos = Number(totalGastos) || 0;

    return {
      empresas: Number(countVentas) || 0, // Reutilizamos el campo para mostrar el contador de ventas
      admins: Number(countCompras) || 0,  // Reutilizamos el campo para mostrar el contador de compras
      ingresos: ingresos,
      gastos: gastos,
      ganancias: ingresos - gastos
    };
  }

  async obtenerTopProductosGlobales() {
    return await this.ventaDetalleRepository
      .createQueryBuilder('detalle')
      .innerJoin('detalle.venta', 'venta')
      .innerJoin(Empresa, 'empresa', 'empresa.id::text = venta.empresa_id::text')
      .select('detalle.nombre_producto', 'producto')
      .addSelect("'General'", 'categoria')
      .addSelect('empresa.nombre', 'empresa')
      .addSelect('detalle.variante_id', 'sku')
      .addSelect('SUM(detalle.cantidad)', 'cantidad_vendida')
      .addSelect('SUM(detalle.precio_venta * detalle.cantidad)', 'ingresos_generados')
      .groupBy('detalle.producto_id, detalle.nombre_producto, empresa.nombre, detalle.variante_id')
      .orderBy('SUM(detalle.cantidad)', 'DESC')
      .limit(10)
      .getRawMany();
  }

  // ---- MÉTODOS EMPRESA (ADICIONALES) ----
  
  async obtenerReporteCompras(empresaId: string, fechaInicio: string, fechaFin: string) {
    const query = this.compraRepository.createQueryBuilder('compra')
      .where('compra.empresa_id = :empresaId', { empresaId });

    if (fechaInicio && fechaFin) {
      query.andWhere('DATE(compra.fecha_compra) BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin });
    }

    return await query.getMany();
  }
}
