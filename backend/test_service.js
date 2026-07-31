const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./src/app.module');
const { CategoriasService } = require('./src/catalogo/categorias.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriasService = app.get(CategoriasService);

  // Set context
  categoriasService.cls.set('empresa_id', '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6');

  try {
    await categoriasService.delete('e7c18833-a5b5-4e73-84a9-7885c49a1e5b'); // Bebidas (Parent)
    console.log('Deleted successfully');
  } catch (err) {
    console.error('Delete failed:', err);
  }

  await app.close();
}
bootstrap();
