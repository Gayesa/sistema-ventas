import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls'; // Librería clave para Contexto Request-Scoped
import { AuditoriaLog, AuditoriaAccion } from '../entities/auditoria-log.entity';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService // Inyección de ALS (AsyncLocalStorage)
  ) {
    this.dataSource.subscribers.push(this);
  }

  // Este subscriber escuchará todas las tablas de tu base de datos
  listenTo() {
    return 'all'; 
  }

  private async createLog(
    manager: any,
    accion: AuditoriaAccion,
    tableName: string,
    registroId: string,
    valoresAnteriores: any,
    valoresNuevos: any
  ) {
    // Evitar auditoría cíclica infinita sobre la propia tabla de logs
    if (tableName === 'auditoria_logs') return; 

    // Aquí está el truco: TypeORM Subscribers NO tienen acceso al objeto 'req' de Express.
    // Usamos nestjs-cls (AsyncLocalStorage) para jalar el contexto inyectado previamente por tu JWT Guard
    const empresaId = this.cls.get('empresa_id');
    const usuarioId = this.cls.get('usuario_id');
    const ip = this.cls.get('ip');

    // Procesos en Background (Ej. Cronjobs) no dispararán auditoría de usuario a menos que los falsifiquemos
    if (!empresaId || !usuarioId) return;

    const auditLog = manager.create(AuditoriaLog, {
      empresa_id: empresaId,
      usuario_id: usuarioId,
      accion,
      tabla_afectada: tableName,
      registro_id: registroId,
      valores_anteriores: valoresAnteriores,
      valores_nuevos: valoresNuevos,
      direccion_ip: ip
    });

    await manager.save(AuditoriaLog, auditLog);
  }

  async afterInsert(event: InsertEvent<any>) {
    if (!event.entity || !event.metadata) return;
    const tableName = event.metadata.tableName;
    const registroId = this.getId(event.entity, event.metadata);

    await this.createLog(event.manager, AuditoriaAccion.CREATE, tableName, registroId, null, event.entity);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (!event.entity || !event.databaseEntity) return;
    const tableName = event.metadata.tableName;
    
    // Fallback: A veces el ID viene en la entidad en memoria, a veces en la de DB
    const registroId = this.getId(event.entity, event.metadata) || this.getId(event.databaseEntity, event.metadata);

    await this.createLog(
      event.manager,
      AuditoriaAccion.UPDATE,
      tableName,
      registroId,
      event.databaseEntity, // Valores Viejos limpios desde DB
      event.entity // Valores Mutados en memoria
    );
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (!event.databaseEntity) return;
    const tableName = event.metadata.tableName;
    const registroId = this.getId(event.databaseEntity, event.metadata);

    await this.createLog(event.manager, AuditoriaAccion.DELETE, tableName, registroId, event.databaseEntity, null);
  }

  private getId(entity: any, metadata: any): string {
    if (!entity) return 'UNKNOWN';
    const primaryColumns = metadata.primaryColumns;
    if (primaryColumns.length === 1) {
      const propertyName = primaryColumns[0].propertyName;
      return String(entity[propertyName]);
    }
    return 'COMPOSITE_ID'; // Manejo si usas llaves primarias compuestas
  }
}
