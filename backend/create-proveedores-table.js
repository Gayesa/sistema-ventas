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
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS proveedores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        razon_social VARCHAR(255) NOT NULL,
        documento VARCHAR(255) NOT NULL,
        contacto_nombre VARCHAR(255),
        telefono_principal VARCHAR(255),
        telefono_alternativo VARCHAR(255),
        email VARCHAR(255),
        direccion VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);
    console.log('Proveedores table created successfully.');
  } catch (e) { 
    console.error('Error creating table:', e.message); 
  }
  
  await client.end();
}

run();
