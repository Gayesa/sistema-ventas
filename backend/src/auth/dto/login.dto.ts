import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  // Propiedades opcionales por retrocompatibilidad con clientes antiguos
  @IsOptional()
  correo?: string;

  @IsOptional()
  pass?: string;
}
