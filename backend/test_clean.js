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
  await ds.query("DELETE FROM inventario_lotes WHERE numero_lote = '1' AND producto_id = 'dd9d3867-456c-49cb-8d15-7b1c1aa8db00'");
  await ds.query("DELETE FROM movimiento_inventario WHERE referencia_id = '6ba2edea-7efd-43b8-b0f1-6648b103e3ff'");
  await ds.query("DELETE FROM detalle_compra WHERE compra_id = '6ba2edea-7efd-43b8-b0f1-6648b103e3ff'");
  await ds.query("DELETE FROM compra WHERE id = '6ba2edea-7efd-43b8-b0f1-6648b103e3ff'");

  // Reset stocks of the 4 test products back
  await ds.query("UPDATE productos SET stock_total = 16 WHERE id = 'f1d27aa5-702b-4c5d-a632-be870db3bde2'");
  await ds.query("UPDATE producto_variantes SET stock_actual = 16 WHERE id = 'a85bf1ea-a7c0-4c27-a9eb-ac4a5de262f3'");
  await ds.query("UPDATE productos SET stock_total = 18 WHERE id = 'c58f3fa6-2b34-498e-8cf7-24fff5026e1d'");
  await ds.query("UPDATE producto_variantes SET stock_actual = 18 WHERE id = '2d44c44b-8556-42ba-9e72-ba63083c7a17'");
  await ds.query("UPDATE productos SET stock_total = 0 WHERE id = '42fded39-acb8-40ad-a42a-b45a8b120ddc'");
  await ds.query("UPDATE producto_variantes SET stock_actual = 0 WHERE id = '1e4e9af6-2e97-4afa-bcf5-b6c1d8eba45f'");
  await ds.query("UPDATE productos SET stock_total = 0 WHERE id = 'dd9d3867-456c-49cb-8d15-7b1c1aa8db00'");
  await ds.query("UPDATE producto_variantes SET stock_actual = 0 WHERE id = '2021e342-0379-48d9-b296-76d506285289'");

  console.log('Cleanup completed successfully.');
  await ds.destroy();
}

main().catch(console.error);
