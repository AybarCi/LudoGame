#!/bin/bash

# 🛠️ Ludo Backend Network Fix Script
# This script fixes the 502 Bad Gateway error by ensuring proper network connectivity

set -e

echo "🔧 Fixing Docker Network Issues for Ludo Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is running
if ! command_exists docker || ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running or not installed${NC}"
    exit 1
fi

echo "✅ Docker is running"

# Create required networks if they don't exist
echo "🌐 Creating Docker networks..."

# Create nginx-proxy-network if it doesn't exist
if ! docker network ls | grep -q "nginx-proxy-network"; then
    echo "Creating nginx-proxy-network..."
    docker network create nginx-proxy-network
else
    echo "✅ nginx-proxy-network already exists"
fi

# Create web-network if it doesn't exist
if ! docker network ls | grep -q "web-network"; then
    echo "Creating web-network..."
    docker network create web-network
else
    echo "✅ web-network already exists"
fi

# Create ludo-network if it doesn't exist
if ! docker network ls | grep -q "ludo-network"; then
    echo "Creating ludo-network..."
    docker network create ludo-network
else
    echo "✅ ludo-network already exists"
fi

# Function to test container connectivity
test_connectivity() {
    local container_name=$1
    local target_ip=$2
    local target_port=$3
    
    echo "Testing connectivity from $container_name to $target_ip:$target_port..."
    
    if docker exec "$container_name" nc -zv "$target_ip" "$target_port" 2>/dev/null; then
        echo -e "${GREEN}✅ Connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Connection failed${NC}"
        return 1
    fi
}

# Function to check container health
check_container_health() {
    local container_name=$1
    
    if docker ps | grep -q "$container_name"; then
        echo "✅ $container_name is running"
        
        # Check health status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no health check")
        echo "Health status: $health_status"
        
        if [ "$health_status" = "unhealthy" ]; then
            echo -e "${YELLOW}⚠️ Container is unhealthy, checking logs...${NC}"
            docker logs --tail=20 "$container_name"
        fi
    else
        echo -e "${RED}❌ $container_name is not running${NC}"
    fi
}

# Check current containers
echo ""
echo "🔍 Checking current containers..."
docker-compose ps

# Check network connectivity between containers
echo ""
echo "🌐 Checking network connectivity..."

# Get container IPs
BACKEND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ludo-backend 2>/dev/null || echo "")
REDIS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ludo-redis 2>/dev/null || echo "")

if [ -n "$BACKEND_IP" ]; then
    echo "Backend IP: $BACKEND_IP"
fi

if [ -n "$REDIS_IP" ]; then
    echo "Redis IP: $REDIS_IP"
fi

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
if docker exec ludo-backend curl -f http://localhost:3001/health 2>/dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Check if containers are on the same networks
echo ""
echo "🔗 Checking network connections..."
docker network inspect nginx-proxy-network 2>/dev/null | grep -E "(ludo-backend|nginx)" || echo "No containers found in nginx-proxy-network"
docker network inspect web-network 2>/dev/null | grep -E "(ludo-backend|ludo-web)" || echo "No containers found in web-network"

# Restart containers with new network configuration
echo ""
echo "🔄 Restarting containers with proper network configuration..."
docker-compose down
docker-compose up -d

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 10

# Final health check
echo ""
echo "🔍 Final health check..."
check_container_health ludo-backend
check_container_health ludo-redis

# Test external connectivity
echo ""
echo "🌍 Testing external connectivity..."
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com || echo "")
if [ -n "$EXTERNAL_IP" ]; then
    echo "External IP: $EXTERNAL_IP"
    echo "Testing health endpoint from external..."
    if curl -f http://$EXTERNAL_IP:3001/health 2>/dev/null; then
        echo -e "${GREEN}✅ External health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️ External health check failed - check firewall/router${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Network fix completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check if the 502 error is resolved"
echo "2. If still having issues, check nginx/reverse proxy configuration"
echo "3. Ensure firewall allows traffic on port 3001"
echo ""
echo "Useful commands:"
echo "docker-compose logs -f    # View logs"
echo "docker-compose ps       # Check container status"
echo "docker network ls       # List networks"