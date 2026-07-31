import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { ProductoVariante } from './entities/producto-variante.entity';
import { Categoria } from './entities/categoria.entity';
import { RecetaDetalle } from './entities/receta-detalle.entity';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { AtributoGlobal } from './entities/atributo-global.entity';
import { AtributoValor } from './entities/atributo-valor.entity';
import { AtributosController } from './atributos.controller';
import { AtributosService } from './atributos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      ProductoVariante,
      Categoria,
      RecetaDetalle,
      AtributoGlobal,
      AtributoValor
    ])
  ],
  controllers: [CategoriasController, ProductosController, AtributosController],
  providers: [CategoriasService, ProductosService, AtributosService],
  exports: [CategoriasService, ProductosService, AtributosService]
})
export class CatalogoModule {}
