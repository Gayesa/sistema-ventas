# --- ETAPA 1: Builder (Compilación) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (necesarias para compilar TypeScript)
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar NestJS (Esto genera la carpeta /dist)
RUN npm run build

# --- ETAPA 2: Runner (Ejecución) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm install --only=production

# ¡CLAVE! Copiar la carpeta dist compilada desde la etapa "builder"
COPY --from=builder /app/dist ./dist

# Exponer el puerto de NestJS
EXPOSE 3000

# Comando para iniciar la aplicación (ruta corregida a dist/src/main.js)
CMD ["node", "dist/src/main.js"]
