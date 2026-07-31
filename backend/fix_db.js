const { Client } = require('pg'); 
const client = new Client({ 
  user: 'postgres', 
  host: 'localhost', 
  database: 'sistema_ventas', 
  password: 'Admin123', 
  port: 5432 
}); 
client.connect()
  .then(() => client.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(50) DEFAULT 'Unidad'"))
  .then(() => {
    console.log('Column added successfully'); 
    client.end();
  })
  .catch(e => {
    console.error('Error adding column:', e); 
    client.end();
  });
