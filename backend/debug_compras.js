const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { ComprasService } = require('./dist/compras/compras.service');

async function debugCompras() {
  const app = await NestFactory.createApplicationContext(AppModule.AppModule);
  const comprasService = app.get(ComprasService.ComprasService);

  const empresaId = '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6';
  try {
    const res = await comprasService.listarCompras(empresaId);
    console.log('Result:', res);
  } catch (e) {
    console.error('ERROR IN LISTAR COMPRAS:', e);
  }

  await app.close();
}

debugCompras().catch(console.error);
