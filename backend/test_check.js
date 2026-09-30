const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Admin123',
  database: 'sistema_ventas_db'
});

async function main() {
  await ds.initialize();
  console.log('Connected to DB');

  const lotes = await ds.query(`
    SELECT il.*, p.nombre 
    FROM inventario_lotes il
    JOIN productos p ON p.id = il.producto_id
  `);
  console.log('All lotes:', lotes);

  const existingLotes = await ds.query(`
    SELECT * FROM inventario_lotes LIMIT 5
  `);
  console.log('Existing lotes:', existingLotes);

  const checkFactura = await ds.query(`
    SELECT * FROM compra WHERE numero_factura_proveedor ILIKE '%000249%'
  `);
  console.log('Factura F001-000249 check:', checkFactura);

  const colsMov = await ds.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'movimiento_inventario'
  `);
  console.log('Columns of movimiento_inventario:', colsMov);

  // Check foreign keys of detalle_compra
  const fks = await ds.query(`
    SELECT
        tc.table_name, kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('detalle_compra', 'inventario_lotes', 'movimientos_inventario', 'compra');
  `);
  console.log('Foreign keys:', fks);

  // Check all products
  const prods = await ds.query(`
    SELECT p.id, p.nombre, p.controla_lotes, p.stock_total, pv.id as variante_id, pv.sku, pv.stock_actual
    FROM productos p
    LEFT JOIN producto_variantes pv ON pv.producto_id = p.id
    WHERE p.empresa_id = '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6'
  `);
  console.log('All company products:', prods);

  await ds.destroy();
}

main().catch(console.error);
