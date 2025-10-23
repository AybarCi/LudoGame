#!/bin/bash

# 🚀 Ludo Backend 502 Error Fix Script
# This script fixes the 502 Bad Gateway error on the production server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Ludo Backend 502 Error Fix${NC}"
echo "=========================================="

# Server configuration
SSH_HOST="81.8.108.222"
SSH_USER="root"
BACKEND_DIR="/root/Ludo/backend"

# Function to run remote commands
run_remote() {
    ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$1"
}

# Function to check service health
check_health() {
    echo "🏥 Checking health endpoint..."
    if curl -f -s "https://ludoturcoapi.istekbilisim.com/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
}

echo "📋 Deployment Plan:"
echo "1. Create proper Docker networks"
echo "2. Deploy fixed docker-compose.yml"
echo "3. Verify container connectivity"
echo "4. Test health endpoint"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo -e "${YELLOW}🚀 Starting deployment...${NC}"

# Create networks on remote server
echo "🌐 Creating Docker networks on remote server..."
run_remote "docker network ls | grep nginx-proxy-network || docker network create nginx-proxy-network"
run_remote "docker network ls | grep web-network || docker network create web-network"
run_remote "docker network ls | grep ludo-network || docker network create ludo-network"

# Copy the fixed docker-compose.yml to server
echo "📤 Copying fixed configuration to server..."
scp -o StrictHostKeyChecking=no docker-compose.production.yml "$SSH_USER@$SSH_HOST:$BACKEND_DIR/docker-compose.yml"

# Stop existing containers
echo "🛑 Stopping existing containers..."
run_remote "cd $BACKEND_DIR && docker-compose down || true"

# Start containers with new configuration
echo "▶️ Starting containers with fixed network configuration..."
run_remote "cd $BACKEND_DIR && docker-compose up -d"

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 15

# Check container status
echo "📊 Checking container status..."
run_remote "cd $BACKEND_DIR && docker-compose ps"

# Check container logs
echo "📜 Checking container logs..."
run_remote "cd $BACKEND_DIR && docker-compose logs --tail=20 ludo-backend"

# Test connectivity
echo "🔗 Testing container connectivity..."
run_remote "docker exec ludo-backend curl -f http://localhost:3001/health || echo 'Health check failed'"

# Final health check
echo "🔍 Final health check..."
sleep 5

if check_health; then
    echo -e "${GREEN}🎉 SUCCESS: 502 error has been fixed!${NC}"
    echo -e "${GREEN}✅ Backend is now accessible at https://ludoturcoapi.istekbilisim.com${NC}"
else
    echo -e "${RED}❌ ISSUE: 502 error still persists${NC}"
    echo ""
    echo "Next troubleshooting steps:"
    echo "1. Check Nginx/Traefik configuration on server"
    echo "2. Verify firewall rules"
    echo "3. Check if reverse proxy is on the same network"
    echo "4. Verify SSL certificate configuration"
    echo ""
    echo "Run this command to check server logs:"
    echo "ssh root@81.8.108.222 'cd /root/Ludo/backend && docker-compose logs -f'"
fi

echo ""
echo -e "${BLUE}Deployment completed!${NC}"
echo "=========================================="