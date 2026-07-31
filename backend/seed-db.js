const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
  const client = new Client({
    host: 'localhost', // Run this from outside docker but mapped to... wait, no. The DB is not exposed to host in docker-compose.
    // Ah, wait! The user said: "Ejecuta el script de Seed (semilla) para crear la empresa...".
    // I can execute this INSIDE the backend container using `docker exec saas-backend node seed-db.js`.
    host: 'postgres',
    port: 5432,
    user: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas'
  });

  try {
    await client.connect();
    console.log('Connected to DB...');

    // 1. Create Empresa (Fruteria)
    const empresaRes = await client.query(`
      INSERT INTO empresa (nombre, documento, fecha_vencimiento_suscripcion, fecha_creacion)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `, ['Frutería Lorena', '123456789', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);
    
    const empresaId = empresaRes.rows[0].id;
    console.log(`Empresa created with ID: ${empresaId}`);

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('lorena123', salt);

    // 3. Create Admin Tienda User
    await client.query(`
      INSERT INTO usuario (empresa_id, nombre, email, password, rol)
      VALUES ($1, $2, $3, $4, $5)
    `, [empresaId, 'Lorena', 'lorena@fruteria.com', hash, 'ADMIN_TIENDA']);
    
    console.log('User lorena@fruteria.com created (role: ADMIN_TIENDA, pass: lorena123)');

    // 4. Create Super Admin User (for management)
    const superHash = await bcrypt.hash('admin', salt);
    await client.query(`
      INSERT INTO usuario (empresa_id, nombre, email, password, rol)
      VALUES ($1, $2, $3, $4, $5)
    `, [empresaId, 'Super Admin', 'admin@erp.com', superHash, 'SUPER_ADMIN']);
    
    console.log('User admin@erp.com created (role: SUPER_ADMIN, pass: admin)');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.end();
  }
}

seed();
