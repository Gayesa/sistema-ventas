import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { ProductoVariante } from './entities/producto-variante.entity';
import { Categoria } from './entities/categoria.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productosRepo: Repository<Producto>,
    @InjectRepository(ProductoVariante)
    private variantesRepo: Repository<ProductoVariante>,
    @InjectRepository(Categoria)
    private categoriasRepo: Repository<Categoria>,
    private readonly cls: ClsService,
    private dataSource: DataSource
  ) {}

  async create(data: any) {
    const empresa_id = this.cls.get('empresa_id');
    
    // Validaciones de campos requeridos
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new BadRequestException('El nombre del producto es requerido');
    }
    if (!data.codigo || data.codigo.trim().length === 0) {
      throw new BadRequestException('El código/SKU del producto es requerido');
    }
    if (data.precio_venta === undefined || data.precio_venta === null || Number(data.precio_venta) < 0) {
      throw new BadRequestException('El precio de venta debe ser un número positivo');
    }
    if (data.precio_compra === undefined || data.precio_compra === null || Number(data.precio_compra) < 0) {
      throw new BadRequestException('El precio de compra debe ser un número positivo');
    }

    // Validar que el SKU no esté duplicado dentro de la empresa
    const skuDuplicado = await this.variantesRepo.findOne({
      where: { empresa_id, sku: data.codigo.trim() }
    });
    if (skuDuplicado) {
      throw new ConflictException(`Ya existe un producto con el código "${data.codigo}" en esta empresa`);
    }

    // Validar que la categoría (subcategoría) existe y pertenece a la empresa
    if (data.subcategoria_id) {
      const categoria = await this.categoriasRepo.findOne({
        where: { id: data.subcategoria_id, empresa_id }
      });
      if (!categoria) {
        throw new BadRequestException('La subcategoría seleccionada no existe');
      }
    }

    // 1. Create the main Producto
    const producto = this.productosRepo.create({
      empresa_id,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      categoria_id: data.subcategoria_id || null,
      proveedor_id: data.proveedor_id || null,
      unidad_medida: data.unidad_medida || 'Unidad',
      imagen_url: data.foto_url || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      es_compuesto: false
    });
    const savedProducto = await this.productosRepo.save(producto);

    // 2. Create the default ProductoVariante (Simple product has 1 variant)
    const variante = this.variantesRepo.create({
      empresa_id,
      producto_id: savedProducto.id,
      sku: data.codigo.trim(),
      precio_compra: data.precio_compra,
      precio_venta: data.precio_venta,
      stock_actual: 0, // In creation, stock_actual should be 0 because we just define the minimum, or maybe they want to start with 0
      stock_minimo: data.stock_minimo !== undefined ? data.stock_minimo : 10,
      atributos: null,
      rentabilidad_mensaje: data.rentabilidad_mensaje || null
    });
    await this.variantesRepo.save(variante);

    return this.findOne(savedProducto.id);
  }

  async findAll() {
    const empresa_id = this.cls.get('empresa_id');
    const productos = await this.productosRepo.find({
      where: { empresa_id },
      relations: {
        variantes: true,
        categoria: {
          parent: true
        }
      },
      order: { created_at: 'DESC' }
    });

    // Fetch aggregate sales data per variant
    const salesData = await this.dataSource.query(`
      SELECT 
        dv.variante_id,
        MAX(v.fecha) as last_sale_date,
        SUM(dv.cantidad) as total_sold
      FROM detalles_venta dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE v.empresa_id = $1
      GROUP BY dv.variante_id
    `, [empresa_id]);

    // Map sales data to products
    const salesMap = new Map();
    salesData.forEach(s => {
      salesMap.set(s.variante_id, {
        last_sale_date: s.last_sale_date,
        total_sold: Number(s.total_sold) || 0
      });
    });

    return productos.map(p => {
      const pData: any = { ...p };
      if (p.variantes && p.variantes.length > 0) {
        const vId = p.variantes[0].id;
        const sData = salesMap.get(vId);
        pData.variantes[0].last_sale_date = sData?.last_sale_date || null;
        pData.variantes[0].total_sold = sData?.total_sold || 0;
      }
      return pData;
    });
  }

  async findOne(id: string) {
    const empresa_id = this.cls.get('empresa_id');
    const producto = await this.productosRepo.findOne({
      where: { id, empresa_id },
      relations: {
        variantes: true,
        categoria: {
          parent: true
        }
      }
    });
    if (!producto) throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    return producto;
  }

  async getKardex(id: string) {
    const empresa_id = this.cls.get('empresa_id');
    const producto = await this.findOne(id);
    const variante = producto.variantes && producto.variantes.length > 0 ? producto.variantes[0] : null;
    if (!variante) return { compras: [], ventas: [] };

    // Buscar compras de esta variante
    const comprasRaw = await this.dataSource.query(`
      SELECT 
        c.numero_factura_proveedor as factura,
        c.fecha_compra as fecha,
        dc.cantidad as cantidad,
        dc.costo_unitario as valor_unitario,
        dc.subtotal as total
      FROM detalle_compra dc
      JOIN compra c ON c.id::varchar = dc.compra_id
      WHERE dc.producto_id = $1 AND c.empresa_id = $2
      ORDER BY c.fecha_compra DESC
    `, [variante.id, empresa_id]);

    // Buscar ventas de esta variante
    const ventasRaw = await this.dataSource.query(`
      SELECT 
        v.numero_ticket as factura,
        v.fecha as fecha,
        dv.cantidad as cantidad,
        dv.precio_unitario as valor_unitario,
        dv.subtotal as total
      FROM detalles_venta dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE dv.variante_id = $1 AND v.empresa_id = $2
      ORDER BY v.fecha DESC
    `, [variante.id, empresa_id]);

    return {
      compras: comprasRaw,
      ventas: ventasRaw
    };
  }

  async update(id: string, data: any) {
    const empresa_id = this.cls.get('empresa_id');
    const producto = await this.findOne(id);

    // Validar nombre si se envía
    if (data.nombre !== undefined) {
      if (!data.nombre || data.nombre.trim().length === 0) {
        throw new BadRequestException('El nombre del producto es requerido');
      }
      producto.nombre = data.nombre.trim();
    }

    // Update Producto
    if (data.descripcion !== undefined) producto.descripcion = data.descripcion?.trim() || null;
    if (data.subcategoria_id !== undefined) {
      // Validar que la categoría existe
      if (data.subcategoria_id) {
        const categoria = await this.categoriasRepo.findOne({
          where: { id: data.subcategoria_id, empresa_id }
        });
        if (!categoria) {
          throw new BadRequestException('La subcategoría seleccionada no existe');
        }
      }
      producto.categoria_id = data.subcategoria_id;
    }
    if (data.foto_url !== undefined) producto.imagen_url = data.foto_url;
    if (data.unidad_medida !== undefined) producto.unidad_medida = data.unidad_medida;
    if (data.is_active !== undefined) producto.is_active = data.is_active;
    if (data.proveedor_id !== undefined) producto.proveedor_id = data.proveedor_id || null;

    await this.productosRepo.save(producto);

    // Update Variante (assuming simple product for now)
    if (producto.variantes && producto.variantes.length > 0) {
      const variante = producto.variantes[0];

      // Validar SKU duplicado si se cambia
      if (data.codigo !== undefined && data.codigo !== variante.sku) {
        const skuDuplicado = await this.variantesRepo
          .createQueryBuilder('v')
          .where('v.empresa_id = :empresa_id', { empresa_id })
          .andWhere('v.sku = :sku', { sku: data.codigo.trim() })
          .andWhere('v.id != :id', { id: variante.id })
          .getOne();
        if (skuDuplicado) {
          throw new ConflictException(`Ya existe un producto con el código "${data.codigo}" en esta empresa`);
        }
        variante.sku = data.codigo.trim();
      }

      if (data.precio_compra !== undefined) {
        if (Number(data.precio_compra) < 0) throw new BadRequestException('El precio de compra no puede ser negativo');
        variante.precio_compra = data.precio_compra;
      }
      if (data.precio_venta !== undefined) {
        if (Number(data.precio_venta) < 0) throw new BadRequestException('El precio de venta no puede ser negativo');
        variante.precio_venta = data.precio_venta;
      }
      if (data.stock_minimo !== undefined) variante.stock_minimo = data.stock_minimo;
      if (data.rentabilidad_mensaje !== undefined) variante.rentabilidad_mensaje = data.rentabilidad_mensaje;
      
      await this.variantesRepo.save(variante);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const empresa_id = this.cls.get('empresa_id');
    const producto = await this.findOne(id);
    
    // First remove variants
    if (producto.variantes && producto.variantes.length > 0) {
      await this.variantesRepo.remove(producto.variantes);
    }
    
    // Then remove product
    await this.productosRepo.remove(producto);
    return { success: true, message: 'Producto eliminado' };
  }
}
