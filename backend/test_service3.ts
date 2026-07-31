const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./src/app.module');
const { CategoriasService } = require('./src/catalogo/categorias.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriasService = app.get(CategoriasService);

  try {
    await categoriasService.cls.run(async () => {
      categoriasService.cls.set('empresa_id', '4267f67e-cea4-42a3-b59c-9383f182f7d4');
      await categoriasService.delete('9b384f52-5610-4d6f-88dd-80e20d6de9fa'); // Herramientas Manuales (Parent with products)
      console.log('Deleted successfully');
    });
  } catch (err) {
    console.error('Delete failed:', err);
  }

  await app.close();
}
bootstrap();
