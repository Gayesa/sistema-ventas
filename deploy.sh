#!/usr/bin/env bash
# ==============================================================================
# SISTEMA VENTAS SaaS (Mercurio) — Production Deployment Script (Hetzner)
# ==============================================================================
set -euo pipefail

echo "=================================================="
echo "🚀 Starting Production Deployment — Mercurio SaaS"
echo "=================================================="

# 1. Pull latest changes from git
echo "📥 Pulling latest repository changes..."
git pull origin main

# 2. Verify production environment file
if [ ! -f "backend/.env.production" ]; then
    echo "❌ Error: backend/.env.production not found! Please create it before deploying."
    exit 1
fi

# 3. Clean and rebuild containers
echo "🐳 Building and spinning up containers (forcing recreation)..."
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# 4. Connect to Nginx Proxy Manager network if needed
# If NPM runs in a separate Docker network (e.g., 'npm-network'), ensure connectivity:
# docker network connect saas-network nginx-proxy-manager-app-1 2>/dev/null || true

# 5. Clean up dangling builder images
echo "🧹 Pruning dangling Docker build cache..."
docker image prune -f

# 6. Verify container health status
echo "🔍 Checking container status..."
docker compose -f docker-compose.prod.yml ps

echo "=================================================="
echo "✅ Deployment completed successfully!"
echo "=================================================="
