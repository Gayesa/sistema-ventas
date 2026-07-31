import { DataSource } from 'typeorm';

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Admin123',
    database: 'sistema_ventas',
  });
  await ds.initialize();
  
  const tables = await ds.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log('\n=== ALL TABLES ===');
  console.log(tables.map((t: any) => t.tablename).sort().join('\n'));
  
  // Check remaining tables for old empresa_id data  
  const OLD_ID = '11111111-1111-1111-1111-111111111111';
  const toCheck = tables.map((t: any) => t.tablename);
  
  console.log('\n=== TABLES WITH OLD empresa_id DATA ===');
  for (const table of toCheck) {
    try {
      const result = await ds.query(`SELECT COUNT(*) as cnt FROM "${table}" WHERE empresa_id = $1`, [OLD_ID]);
      const count = parseInt(result[0].cnt);
      if (count > 0) {
        console.log(`  ${table}: ${count} rows still with old ID`);
      }
    } catch (e) {
      // table doesn't have empresa_id column, skip
    }
  }
  
  await ds.destroy();
}

main();
