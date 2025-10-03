#!/bin/bash

# Advanced Versioned Deployment Script for Ludo Backend
# Bu script versiyonlu deployment ve rollback desteği sunar

set -euo pipefail

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default değerler
REGISTRY="${REGISTRY:-ghcr.io}"
ORG="${ORG:-your-org}"
IMAGE_NAME="ludo-backend"
VERSION="${1:-latest}"
ENVIRONMENT="${2:-production}"
COMPOSE_FILE="docker-compose.versioned.yml"

# Yardım fonksiyonu
show_help() {
    echo -e "${BLUE}Usage:${NC} $0 [VERSION] [ENVIRONMENT]"
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 v1.0.0 production    # Deploy v1.0.0 to production"
    echo "  $0 latest staging        # Deploy latest to staging"
    echo "  $0 v1.2.0                # Deploy v1.2.0 to production (default)"
    echo "  $0 rollback               # Rollback to previous version"
    echo "  $0 status                 # Show deployment status"
    echo "  $0 logs                   # Show logs"
    echo "  $0 health                 # Health check"
}

# Logging fonksiyonu
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Versiyon kontrolü
validate_version() {
    local version=$1
    
    if [[ "$version" == "rollback" ]]; then
        return 0
    fi
    
    # Docker registry'de versiyon var mı kontrol et
    if ! docker manifest inspect "$REGISTRY/$ORG/$IMAGE_NAME:$version" > /dev/null 2>&1; then
        error "Version $version not found in registry!"
        error "Available versions:"
        docker run --rm gcr.io/go-containerregistry/crane ls "$REGISTRY/$ORG/$IMAGE_NAME" | head -10
        exit 1
    fi
    
    log "✅ Version $version validated"
}

# Environment kontrolü
setup_environment() {
    log "🔧 Setting up environment: $ENVIRONMENT"
    
    # Gerekli dizinleri oluştur
    mkdir -p logs uploads temp ssl redis-data
    
    # Environment dosyasını kontrol et
    if [[ ! -f ".env.$ENVIRONMENT" ]]; then
        warning ".env.$ENVIRONMENT not found, creating from template"
        cp env.production ".env.$ENVIRONMENT"
    fi
    
    # Environment değişkenlerini yükle
    set -a
    source ".env.$ENVIRONMENT"
    set +a
    
    # SSL sertifikalarını kontrol et
    if [[ ! -f "ssl/cert.pem" ]] || [[ ! -f "ssl/key.pem" ]]; then
        warning "SSL certificates not found, generating self-signed"
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=TR/ST=Istanbul/L=Istanbul/O=LudoGame/CN=your-domain.com"
    fi
    
    # Traefik ACME dosyasını oluştur
    touch acme.json
    chmod 600 acme.json
}

# Deployment öncesi kontroller
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks"
    
    # Docker daemon çalışıyor mu?
    if ! docker info > /dev/null 2>&1; then
        error "Docker daemon is not running!"
        exit 1
    fi
    
    # Network var mı?
    if ! docker network ls | grep -q "ludo-production-network"; then
        log "Creating Docker network"
        docker network create ludo-production-network
    fi
    
    # Database bağlantısını test et
    if ! docker run --rm --network ludo-production-network \
        mcr.microsoft.com/mssql-tools:latest \
        /opt/mssql-tools/bin/sqlcmd -S "$DB_SERVER" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_DATABASE" -Q "SELECT 1" > /dev/null 2>&1; then
        error "Database connection failed!"
        exit 1
    fi
    
    log "✅ Pre-deployment checks passed"
}

# Deployment işlemi
deploy() {
    local version=$1
    local environment=$2
    
    log "🚀 Starting deployment of version $version to $environment"
    
    # Versiyon bilgilerini ayarla
    export VERSION=$version
    export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # Mevcut deployment'ı yedekle
    backup_current_deployment
    
    # Yeni versiyonu deploy et
    log "📦 Deploying new version: $version"
    docker-compose -f "$COMPOSE_FILE" pull
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    # Health check bekle
    wait_for_health_check
    
    # Deployment başarılı mı?
    if check_deployment_health; then
        log "✅ Deployment successful!"
        update_deployment_record
        send_notification "success"
    else
        error "❌ Deployment failed!"
        rollback_deployment
        exit 1
    fi
}

# Backup al
backup_current_deployment() {
    log "💾 Creating backup of current deployment"
    
    local backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Mevcut versiyonu kaydet
    docker-compose -f "$COMPOSE_FILE" config > "$backup_dir/docker-compose.yml"
    
    # Environment dosyasını yedekle
    cp ".env.$ENVIRONMENT" "$backup_dir/"
    
    # Database backup (opsiyonel)
    if [[ "${BACKUP_DATABASE:-false}" == "true" ]]; then
        docker-compose -f "$COMPOSE_FILE" exec -T ludo-backend \
            /opt/mssql-tools/bin/sqlcmd -S "$DB_SERVER" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_DATABASE" \
            -Q "BACKUP DATABASE [$DB_DATABASE] TO DISK = '/tmp/backup.bak'" > /dev/null 2>&1 || true
    fi
    
    echo "$VERSION" > "$backup_dir/version"
    log "✅ Backup created: $backup_dir"
}

# Health check bekle
wait_for_health_check() {
    log "⏳ Waiting for health check (max 5 minutes)"
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if check_deployment_health; then
            log "✅ Health check passed"
            return 0
        fi
        
        log "⏳ Health check attempt $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Deployment health kontrolü
check_deployment_health() {
    # Container'lar çalışıyor mu?
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        error "Containers are not running"
        return 1
    fi
    
    # Health check endpoint'i çalışıyor mu?
    if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
        error "Health check endpoint failed"
        return 1
    fi
    
    # Database bağlantısı var mı?
    if ! docker-compose -f "$COMPOSE_FILE" exec -T ludo-backend \
        curl -f http://localhost:3001/health/db > /dev/null 2>&1; then
        error "Database health check failed"
        return 1
    fi
    
    return 0
}

# Deployment kaydını güncelle
update_deployment_record() {
    local record_file="deployment-history.json"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # JSON dosyasını güncelle
    if [[ -f "$record_file" ]]; then
        jq --arg version "$VERSION" \
           --arg timestamp "$timestamp" \
           --arg environment "$ENVIRONMENT" \
           --arg commit "$GIT_COMMIT" \
           '.deployments += [{"version": $version, "timestamp": $timestamp, "environment": $environment, "commit": $commit}]' \
           "$record_file" > temp.json && mv temp.json "$record_file"
    else
        echo '{"deployments": []}' | jq --arg version "$VERSION" \
           --arg timestamp "$timestamp" \
           --arg environment "$ENVIRONMENT" \
           --arg commit "$GIT_COMMIT" \
           '.deployments += [{"version": $version, "timestamp": $timestamp, "environment": $environment, "commit": $commit}]' \
           > "$record_file"
    fi
    
    log "✅ Deployment record updated"
}

# Rollback işlemi
rollback_deployment() {
    error "🔄 Rolling back to previous version"
    
    # En son başarılı deployment'ı bul
    local latest_backup=$(ls -t backups/*/version 2>/dev/null | head -1)
    if [[ -n "$latest_backup" ]]; then
        local previous_version=$(cat "$latest_backup")
        local backup_dir=$(dirname "$latest_backup")
        
        log "Rolling back to version: $previous_version"
        
        # Eski versiyonu geri yükle
        export VERSION=$previous_version
        docker-compose -f "$COMPOSE_FILE" down
        cp "$backup_dir/.env.$ENVIRONMENT" ".env.$ENVIRONMENT"
        docker-compose -f "$COMPOSE_FILE" up -d
        
        log "✅ Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Bildirim gönder
send_notification() {
    local status=$1
    local message="Ludo Backend deployment $status - Version: $VERSION, Environment: $ENVIRONMENT"
    
    # Slack webhook (opsiyonel)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    # Email (opsiyonel)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "Deployment $status" "$NOTIFICATION_EMAIL" > /dev/null 2>&1 || true
    fi
}

# Status kontrolü
show_status() {
    log "📊 Deployment Status"
    
    echo -e "${BLUE}Version:${NC} $VERSION"
    echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
    echo -e "${BLUE}Registry:${NC} $REGISTRY/$ORG/$IMAGE_NAME"
    
    echo -e "\n${BLUE}Container Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\n${BLUE}Health Check:${NC}"
    if check_deployment_health; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Unhealthy${NC}"
    fi
    
    echo -e "\n${BLUE}Recent Deployments:${NC}"
    if [[ -f "deployment-history.json" ]]; then
        jq -r '.deployments[-5:] | .[] | "\(.timestamp) - \(.version) (\(.environment))"' deployment-history.json
    fi
}

# Log görüntüleme
show_logs() {
    local service=${1:-ludo-backend}
    local lines=${2:-50}
    
    log "📋 Showing logs for $service (last $lines lines)"
    docker-compose -f "$COMPOSE_FILE" logs --tail="$lines" -f "$service"
}

# Main execution
main() {
    case "${1:-deploy}" in
        "help"|"-h"|"--help")
            show_help
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-ludo-backend}" "${3:-50}"
            ;;
        "health")
            if check_deployment_health; then
                echo -e "${GREEN}✅ Deployment is healthy${NC}"
                exit 0
            else
                echo -e "${RED}❌ Deployment is unhealthy${NC}"
                exit 1
            fi
            ;;
        "rollback")
            rollback_deployment
            ;;
        *)
            # Normal deployment
            VERSION=${1:-latest}
            ENVIRONMENT=${2:-production}
            
            log "🚀 Starting deployment process"
            log "📦 Version: $VERSION"
            log "🌍 Environment: $ENVIRONMENT"
            log "📄 Compose File: $COMPOSE_FILE"
            
            validate_version "$VERSION"
            setup_environment
            pre_deployment_checks
            deploy "$VERSION" "$ENVIRONMENT"
            
            log "🎉 Deployment completed successfully!"
            log "🔗 Access your application at: https://api.your-domain.com"
            log "📊 Monitor at: http://localhost:8080 (Traefik Dashboard)"
            ;;
    esac
}

# Script'i çalıştır
main "$@"