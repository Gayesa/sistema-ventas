const { DataSource } = require('typeorm');

async function testQuery() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas_db',
    entities: [
      __dirname + '/dist/compras/entities/*.entity.js',
      __dirname + '/dist/catalogo/entities/*.entity.js',
      __dirname + '/dist/inventario/entities/*.entity.js',
    ]
  });

  await ds.initialize();
  console.log('Datasource initialized.');

  try {
    const repo = ds.getRepository('Compra');
    console.log('Found Compra repo with table:', repo.metadata.tableName);
    const compras = await repo.createQueryBuilder('compra')
      .where('compra.empresa_id = :empresaId', { empresaId: '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6' })
      .orderBy('compra.fecha_compra', 'DESC')
      .getMany();
    console.log('Compras result:', compras);
  } catch (e) {
    console.error('ERROR IN COMPRA QUERY:', e);
  }

  await ds.destroy();
}

testQuery().catch(console.error);
