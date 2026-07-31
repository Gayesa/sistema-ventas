const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Admin123',
  database: 'sistema_ventas'
});

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE empresa ADD COLUMN telefono VARCHAR;');
    console.log('Added telefono');
  } catch (e) { console.error('telefono:', e.message); }
  
  try {
    await client.query('ALTER TABLE empresa ADD COLUMN direccion VARCHAR;');
    console.log('Added direccion');
  } catch (e) { console.error('direccion:', e.message); }
  
  try {
    await client.query('ALTER TABLE empresa ADD COLUMN correo VARCHAR;');
    console.log('Added correo');
  } catch (e) { console.error('correo:', e.message); }

  await client.end();
}

run();
