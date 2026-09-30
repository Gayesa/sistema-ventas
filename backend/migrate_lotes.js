const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas_db',
  });
  await client.connect();

  console.log('--- Applying schema migrations ---');

  // 1. Add controla_lotes and stock_total to productos table
  await client.query(`
    ALTER TABLE productos 
    ADD COLUMN IF NOT EXISTS controla_lotes BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log('✅ Added column controla_lotes to productos');

  await client.query(`
    ALTER TABLE productos 
    ADD COLUMN IF NOT EXISTS stock_total NUMERIC(12,2) NOT NULL DEFAULT 0;
  `);
  console.log('✅ Added column stock_total to productos');

  // Initialize stock_total from existing producto_variantes if needed
  await client.query(`
    UPDATE productos p
    SET stock_total = COALESCE((
      SELECT SUM(stock_actual) 
      FROM producto_variantes pv 
      WHERE pv.producto_id = p.id
    ), 0);
  `);
  console.log('✅ Initialized stock_total from existing variants');

  // 2. Create inventario_lotes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS inventario_lotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID NOT NULL,
      producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
      numero_lote VARCHAR(100),
      fecha_vencimiento DATE NOT NULL,
      stock_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Created table inventario_lotes');

  // 3. Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_lotes_empresa_id ON inventario_lotes(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_lotes_producto_id ON inventario_lotes(producto_id);
    CREATE INDEX IF NOT EXISTS idx_lotes_fecha_vencimiento ON inventario_lotes(fecha_vencimiento);
    CREATE INDEX IF NOT EXISTS idx_lotes_empresa_producto ON inventario_lotes(empresa_id, producto_id);
    CREATE INDEX IF NOT EXISTS idx_lotes_empresa_venc ON inventario_lotes(empresa_id, fecha_vencimiento);
    CREATE INDEX IF NOT EXISTS idx_lotes_producto_venc ON inventario_lotes(producto_id, fecha_vencimiento);
  `);
  console.log('✅ Created indexes on inventario_lotes');

  // Verify
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name IN ('controla_lotes', 'stock_total');
  `);
  console.log('Verifying productos columns:', cols.rows);

  const lotesTable = await client.query(`
    SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'inventario_lotes';
  `);
  console.log('Verifying inventario_lotes table exists:', lotesTable.rows[0].count === '1');

  await client.end();
  console.log('Migration completed successfully.');
}

migrate().catch(console.error);
