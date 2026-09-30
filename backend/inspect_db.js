const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas_db',
  });
  await client.connect();

  console.log('=== DATABASES ===');
  const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
  console.table(dbs.rows);

  console.log('=== TESTING FAILING QUERY ===');
  try {
    const qRes = await client.query(`
      SELECT d.cantidad, d.costo_unitario, d.subtotal, pv.sku, p.nombre
      FROM detalle_compra d
      LEFT JOIN producto_variantes pv ON pv.id::varchar = d.producto_id
      LEFT JOIN productos p ON p.id = pv.producto_id
      LIMIT 1
    `);
    console.table(qRes.rows);
  } catch (e) {
    console.error('BINGO! Query error:', e.message);
  }

  console.log('=== TESTING QUERY DIRECTLY ===');
  try {
    const qRes = await client.query(`
      SELECT d.cantidad, d.costo_unitario, d.subtotal, pv.sku, p.nombre
      FROM detalle_compra d
      LEFT JOIN producto_variantes pv ON pv.id::varchar = d.producto_id::varchar
      LEFT JOIN productos p ON p.id = pv.producto_id
      LIMIT 5
    `);
    console.table(qRes.rows);
  } catch (e) {
    console.log('Raw query error:', e.message);
  }

  console.log('=== COMPRAS ROWS ===');
  const comprasRows = await client.query("SELECT * FROM compra LIMIT 5");
  console.table(comprasRows.rows);

  console.log('=== PRODUCTOS BY EMPRESA ===');
  const resProds = await client.query('SELECT empresa_id, COUNT(*) as count FROM productos GROUP BY empresa_id');
  console.table(resProds.rows);

  console.log('=== SAMPLE PRODUCTOS ===');
  const resSample = await client.query('SELECT id, nombre, empresa_id, is_active FROM productos LIMIT 5');
  console.table(resSample.rows);

  console.log('=== COLUMNS OF PRODUCTOS ===');
  const prodCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'productos'");
  console.table(prodCols.rows);

  await client.end();
}

main().catch(console.error);
