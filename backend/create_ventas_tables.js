const { Client } = require('pg');
const client = new Client({ user: 'postgres', password: 'Admin123', host: 'localhost', port: 5432, database: 'sistema_ventas' });
client.connect().then(() => {
  return client.query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      empresa_id uuid NOT NULL,
      numero_ticket varchar NOT NULL,
      metodo_pago varchar NOT NULL,
      total decimal(10,2) NOT NULL,
      fecha timestamp DEFAULT CURRENT_TIMESTAMP,
      estado varchar DEFAULT 'COMPLETADA',
      vendedor varchar
    );
    CREATE TABLE IF NOT EXISTS detalles_venta (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      venta_id uuid NOT NULL,
      variante_id uuid,
      producto_id uuid,
      nombre_producto varchar NOT NULL,
      cantidad int NOT NULL,
      precio_unitario decimal(10,2) NOT NULL,
      precio_venta decimal(10,2),
      subtotal decimal(10,2) NOT NULL,
      CONSTRAINT fk_venta FOREIGN KEY(venta_id) REFERENCES ventas(id) ON DELETE CASCADE
    );
  `);
}).then(() => {
  console.log('Tablas de ventas creadas correctamente');
  client.end();
}).catch(e => console.error('DB Error:', e.message));
