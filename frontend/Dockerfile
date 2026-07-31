# ── Stage 1: Builder ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for Docker layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular for production
RUN npx ng build --configuration production


# ── Stage 2: Production Runner (Nginx) ──
FROM nginx:alpine AS runner

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx runs as PID 1 by default
CMD ["nginx", "-g", "daemon off;"]
