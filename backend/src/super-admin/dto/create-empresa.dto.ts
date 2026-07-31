import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreEmpresa: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentoEmpresa: string;

  @IsString()
  @IsNotEmpty()
  nombrePropietario: string;

  @IsEmail()
  @IsNotEmpty()
  emailPropietario: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  passwordPropietario: string;

  @IsOptional()
  @IsDateString()
  fechaActivacion?: string;

  @IsOptional()
  @IsBoolean()
  estadoInicial?: boolean;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  correo?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
