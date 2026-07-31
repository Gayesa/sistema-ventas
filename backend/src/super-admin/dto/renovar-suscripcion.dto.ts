import { IsNumber, IsEnum, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export enum MetodoPagoSuscripcion {
  EFECTIVO = 'Efectivo',
  TRANSFERENCIA = 'Transferencia',
  TARJETA = 'Tarjeta',
}

export class RenovarSuscripcionDto {
  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsEnum(MetodoPagoSuscripcion)
  metodoPago: MetodoPagoSuscripcion;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  referencia?: string;
}
