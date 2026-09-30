const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Admin123@localhost:5432/sistema_ventas_db'
});

async function run() {
  await client.connect();
  const res = await client.query("UPDATE ventas SET vendedor = 'Juanita Acosta' WHERE numero_ticket = 'TKT-1790131193956'");
  console.log('Filas actualizadas:', res.rowCount);
  const verify = await client.query("SELECT id, numero_ticket, vendedor, total FROM ventas WHERE numero_ticket = 'TKT-1790131193956'");
  console.log('Ticket actualizado:', verify.rows);
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
