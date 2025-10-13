# 🚀 Portainer Deployment Guide

Bu dokümantasyon, Ludo Game projesinin otomatik deploy edilmesi için gereken adımları açıklar.

## 📋 Gereksinimler

- Portainer erişimi
- GitHub repository yönetici hakları
- Docker ve Docker Compose bilgisi

## 🔧 GitHub Secrets Ayarları

GitHub repository'nizde aşağıdaki secrets'ları ekleyin:

### Required Secrets:
1. `PORTAINER_WEBHOOK_URL` - Portainer webhook URL'iniz
2. `PORTAINER_ENDPOINT` - Portainer API endpoint (opsiyonel)
3. `PORTAINER_API_KEY` - Portainer API anahtarı (opsiyonel)

### GitHub'da Secrets Ekleme:
1. GitHub repository'nize gidin
2. Settings → Secrets and variables → Actions
3. "New repository secret" butonuna tıklayın
4. Secret adını ve değerini girin

## 🐳 Portainer Yapılandırması

### 1. Stack Oluşturma

Portainer'da yeni bir stack oluşturun:

```bash
# Stack Name: ludo-game
# Repository: https://github.com/aybarci/ludogame
# Repository reference: refs/heads/main
# Compose path: web/docker-compose.yml
# Auto update: Enabled
# Pull latest image: Enabled
```

### 2. Environment Variables

Portainer'da aşağıdaki environment değişkenlerini tanımlayın:

```env
# JWT Secret (güçlü bir anahtar kullanın)
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars

# Database
DATABASE_URL=file:./database.db

# Redis
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=http://localhost:3002
```

### 3. Webhook URL Oluşturma

Portainer'da webhook oluşturmak için:

1. Stack'i seçin
2. "Webhooks" sekmesine gidin
3. "Create Webhook" butonuna tıklayın
4. Webhook adı: "ludo-game-deploy"
5. Service filter: Tüm servisleri seçin
6. Webhook URL'ini kopyalayın
7. Bu URL'yi GitHub Secrets'da `PORTAINER_WEBHOOK_URL` olarak ekleyin

### 4. Network Yapılandırması

Eğer mevcut bir network kullanmak istiyorsanız:

```bash
# External network oluşturma (opsiyonel)
docker network create ludo-network
```

## 🔄 Otomatik Deploy Akışı

### GitHub Actions Workflow

Her push işlemi şu adımları tetikler:

1. **Backend Build**: 
   - Backend Dockerfile'ı build eder
   - GitHub Container Registry'e push eder
   
2. **Web Build**: 
   - Web frontend Dockerfile'ı build eder
   - GitHub Container Registry'e push eder
   
3. **Deploy**: 
   - Her iki image'ın build edilmesini bekler
   - Portainer webhook'u tetikler
   - Stack otomatik olarak güncellenir

### Manuel Deploy

Gerekirse manuel deploy da yapabilirsiniz:

```bash
# Docker Compose ile manuel deploy
cd web
docker-compose -f docker-compose.yml up -d

# Sadece web servisini güncelleme
docker-compose -f docker-compose.yml up -d ludo-web

# Log kontrolü
docker-compose -f docker-compose.yml logs -f
```

## 🏥 Health Check

Servislerin sağlıklı çalıştığını kontrol edin:

```bash
# Backend health check
curl http://localhost:3001/health

# Web health check
curl http://localhost:3002/api/health

# Redis kontrolü
docker exec ludo-redis redis-cli ping
```

## 🔍 Troubleshooting

### Yaygın Problemler

1. **Build Başarısızlığı**
   - GitHub Actions log'larını kontrol edin
   - Dockerfile syntax'ını kontrol edin
   - Dependencies'leri kontrol edin

2. **Deploy Başarısızlığı**
   - Portainer log'larını kontrol edin
   - Environment değişkenlerini kontrol edin
   - Network bağlantılarını kontrol edin

3. **Servis Başlatılamıyor**
   - Docker log'larını kontrol edin: `docker logs <container_name>`
   - Port çakışmalarını kontrol edin
   - Volume izinlerini kontrol edin

### Log Kontrolü

```bash
# Tüm servislerin log'ları
docker-compose -f web/docker-compose.yml logs

# Belirli bir servisin log'ları
docker-compose -f web/docker-compose.yml logs ludo-web

# Real-time log takibi
docker-compose -f web/docker-compose.yml logs -f ludo-backend
```

## 📞 Destek

Problemler için:
- GitHub Issues: [aybarci/ludogame/issues](https://github.com/aybarci/ludogame/issues)
- Portainer Dokümantasyonu: [docs.portainer.io](https://docs.portainer.io)
- Docker Dokümantasyonu: [docs.docker.com](https://docs.docker.com)