const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Admin123',
  database: 'sistema_ventas_db',
  entities: [
    __dirname + '/dist/src/**/*.entity.js',
  ]
});

async function main() {
  await ds.initialize();
  console.log('Connected');

  const empresaId = '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6';
  const proveedorId = '3e3a2495-d662-4929-ae0e-59d1729e17e3';

  // Let's see what Crema de Leche is
  const prods = await ds.query(`
    SELECT p.id as prod_id, p.nombre, p.controla_lotes, pv.id as var_id, pv.sku
    FROM productos p
    JOIN producto_variantes pv ON pv.producto_id = p.id
    WHERE p.nombre ILIKE '%Crema de Leche%'
    LIMIT 1
  `);
  console.log('Crema de Leche:', prods[0]);

  // Simulate what frontend sends
  // In frontend:
  // producto_id: producto.id (which is variante.id if exists, otherwise p.id)
  // numero_lote: '1'
  // fecha_vencimiento: '2026-09-30'
  // cantidad: 20
  // costo_unitario: 2500
  // total_compra: 50000

  const dto = {
    proveedor_id: proveedorId,
    numero_factura_proveedor: 'F001-000249',
    total_compra: 300000,
    detalles: [
      {
        producto_id: '2d44c44b-8556-42ba-9e72-ba63083c7a17', // Limón Mandarino
        cantidad: 50,
        costo_unitario: 2000,
        numero_lote: '',
        fecha_vencimiento: ''
      },
      {
        producto_id: 'a85bf1ea-a7c0-4c27-a9eb-ac4a5de262f3', // Naranja
        cantidad: 100,
        costo_unitario: 1500,
        numero_lote: '',
        fecha_vencimiento: ''
      },
      {
        producto_id: '2021e342-0379-48d9-b296-76d506285289', // Crema de Leche
        cantidad: 20,
        costo_unitario: 2500,
        numero_lote: '1',
        fecha_vencimiento: '2026-09-30'
      },
      {
        producto_id: '1e4e9af6-2e97-4afa-bcf5-b6c1d8eba45f', // Carne de cerdo
        cantidad: 20,
        costo_unitario: 10000,
        numero_lote: '',
        fecha_vencimiento: ''
      }
    ]
  };

  // Run the exact ComprasService logic inside a transaction and rollback
  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const Compra = ds.getRepository('Compra').target;
    const DetalleCompra = ds.getRepository('DetalleCompra').target;
    const Producto = ds.getRepository('Producto').target;
    const ProductoVariante = ds.getRepository('ProductoVariante').target;
    const InventarioLote = ds.getRepository('InventarioLote').target;
    const MovimientoInventario = ds.getRepository('MovimientoInventario').target;

    const nuevaCompra = queryRunner.manager.create(Compra, {
      empresa_id: empresaId,
      proveedor_id: dto.proveedor_id,
      numero_factura_proveedor: dto.numero_factura_proveedor,
      fecha_compra: new Date(),
      total_compra: Math.round(Number(dto.total_compra)),
    });
    const compraGuardada = await queryRunner.manager.save(nuevaCompra);

    for (const detalle of dto.detalles) {
      const cantidadIngresada = Number(detalle.cantidad);
      const costoIngresado = Number(detalle.costo_unitario);

      const nuevoDetalle = queryRunner.manager.create(DetalleCompra, {
        compra_id: compraGuardada.id,
        producto_id: detalle.producto_id,
        cantidad: Math.round(cantidadIngresada),
        costo_unitario: Math.round(costoIngresado),
        subtotal: Math.round(cantidadIngresada * costoIngresado),
      });
      await queryRunner.manager.save(nuevoDetalle);

      let producto = null;
      let variante = await queryRunner.manager.findOne(ProductoVariante, {
        where: { id: detalle.producto_id, empresa_id: empresaId },
        relations: { producto: true },
      });

      if (variante && variante.producto) {
        producto = variante.producto;
      } else {
        producto = await queryRunner.manager.findOne(Producto, {
          where: { id: detalle.producto_id, empresa_id: empresaId },
        });
        if (producto) {
          variante = await queryRunner.manager.findOne(ProductoVariante, {
            where: { producto_id: producto.id, empresa_id: empresaId },
          });
        }
      }

      console.log('Found producto:', producto?.id, 'variante:', variante?.id);

      if (producto && producto.controla_lotes) {
        console.log('Producto controla lotes. lote:', detalle.numero_lote, 'vence:', detalle.fecha_vencimiento);
        const fechaVencimiento = new Date(detalle.fecha_vencimiento);
        const nuevoLote = queryRunner.manager.create(InventarioLote, {
          empresa_id: empresaId,
          producto_id: producto.id,
          numero_lote: String(detalle.numero_lote).trim(),
          fecha_vencimiento: fechaVencimiento,
          stock_actual: cantidadIngresada,
        });
        await queryRunner.manager.save(nuevoLote);
        console.log('Saved lote successfully');
      }

      producto.stock_total = Number(producto.stock_total || 0) + cantidadIngresada;
      await queryRunner.manager.save(producto);

      if (variante) {
        variante.stock_actual = Number(variante.stock_actual || 0) + cantidadIngresada;
        await queryRunner.manager.save(variante);
      }

      const movimiento = queryRunner.manager.create(MovimientoInventario, {
        empresa_id: empresaId,
        producto_id: variante ? variante.id : producto.id,
        tipo_movimiento: 'ENTRADA',
        motivo: 'COMPRA',
        cantidad: cantidadIngresada,
        referencia_id: compraGuardada.id,
      });
      await queryRunner.manager.save(movimiento);
    }

    console.log('SUCCESS IN SIMULATION!');
  } catch (err) {
    console.error('SIMULATION ERROR:', err);
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    await ds.destroy();
  }
}

main().catch(console.error);
