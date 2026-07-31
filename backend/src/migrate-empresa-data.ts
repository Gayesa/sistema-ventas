/**
 * ONE-TIME MIGRATION SCRIPT v2
 * Migrates all data from fallback empresa_id to real empresa.
 */
import { DataSource } from 'typeorm';

const OLD_ID = '11111111-1111-1111-1111-111111111111';
const NEW_ID = '4267f67e-cea4-42a3-b59c-9383f182f7d4'; // Ferreteria La Primera

async function migrate() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas',
  });

  await ds.initialize();

  // Use actual table names from the database
  const tables = [
    'categorias',
    'productos',
    'producto_variantes',
    'compra',
    'movimiento_inventario',
    'venta',
  ];

  for (const table of tables) {
    try {
      const result = await ds.query(
        `UPDATE "${table}" SET empresa_id = $1 WHERE empresa_id = $2`,
        [NEW_ID, OLD_ID]
      );
      console.log(`✅ ${table}: ${result[1]} rows migrated`);
    } catch (e: any) {
      console.log(`⚠️  ${table}: skipped (${e.message.substring(0, 80)})`);
    }
  }

  // Do NOT migrate usuarios - those vendedores under old ID are test data  
  // and should not override real empresa's users
  
  // Verify
  console.log('\n=== VERIFICATION ===');
  for (const table of tables) {
    try {
      const [newCount] = await ds.query(`SELECT COUNT(*) as cnt FROM "${table}" WHERE empresa_id = $1`, [NEW_ID]);
      const [oldCount] = await ds.query(`SELECT COUNT(*) as cnt FROM "${table}" WHERE empresa_id = $1`, [OLD_ID]);
      console.log(`  ${table}: ${newCount.cnt} (new) / ${oldCount.cnt} (old remaining)`);
    } catch (e) {
      // skip
    }
  }

  await ds.destroy();
  console.log('\n🎉 Done!');
}

migrate();
