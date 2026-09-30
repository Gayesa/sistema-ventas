const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas_db'
  });

  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_id UUID;
    ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_datos JSONB;
  `);

  console.log('Columns cliente_id and cliente_datos added/verified in table ventas.');

  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ventas';
  `);
  console.log('Current ventas columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
