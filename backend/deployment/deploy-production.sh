#!/bin/bash

# Production Deployment Script for Ludo Backend
# Bu script production ortamında uygulamayı başlatmak için kullanılır

set -e  # Hata durumunda script'i durdur

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Ludo Backend Production Deployment Başlatılıyor...${NC}"

# Gerekli dizinleri oluştur
echo -e "${YELLOW}📁 Gerekli dizinler oluşturuluyor...${NC}"
mkdir -p logs uploads temp ssl

# Environment dosyasını kontrol et
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, env.production dosyası kopyalanıyor...${NC}"
    cp env.production .env
    echo -e "${RED}❌ Lütfen .env dosyasını düzenleyin ve gerekli değerleri girin!${NC}"
    exit 1
fi



# SSL sertifikalarını kontrol et
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL sertifikaları bulunamadı, self-signed sertifika oluşturuluyor...${NC}"
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=TR/ST=Istanbul/L=Istanbul/O=LudoGame/CN=your-domain.com"
fi

# Telefon doğrulama tabloları kontrolü
echo -e "${YELLOW}📱 Telefon doğrulama tabloları kontrol ediliyor...${NC}"
echo -e "${YELLOW}💡 Telefon doğrulama tabloları için ../create_phone_verification_tables.sql script'ini çalıştırmayı unutmayın!${NC}"

# Docker network'ünü kontrol et
if ! docker network ls | grep -q "ludo-production-network"; then
    echo -e "${YELLOW}🔧 Docker network oluşturuluyor...${NC}"
    docker network create ludo-production-network
fi

# Eski container'ları durdur ve kaldır
echo -e "${YELLOW}🛑 Eski container'lar durduruluyor...${NC}"
docker-compose -f docker-compose.production.yml down --remove-orphans

# Docker image'larını build et
echo -e "${YELLOW}🔨 Docker image'ları build ediliyor...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache

# Yeni container'ları başlat
echo -e "${YELLOW}▶️  Yeni container'lar başlatılıyor...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Container'ların başlamasını bekle
echo -e "${YELLOW}⏳ Container'ların başlaması bekleniyor...${NC}"
sleep 30

# Health check kontrolü
echo -e "${YELLOW}🏥 Health check kontrolü yapılıyor...${NC}"
for i in {1..10}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health check başarılı!${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Health check bekleniyor... Deneme $i/10${NC}"
        sleep 10
    fi
done

# Logları göster
echo -e "${GREEN}📋 Container logları:${NC}"
docker-compose -f docker-compose.production.yml logs --tail=50

# Servis durumlarını göster
echo -e "${GREEN}📊 Servis durumları:${NC}"
docker-compose -f docker-compose.production.yml ps

echo -e "${GREEN}🎉 Production deployment tamamlandı!${NC}"
echo -e "${GREEN}📡 Backend URL: https://your-domain.com${NC}"
echo -e "${GREEN}🔍 Health Check: https://your-domain.com/health${NC}"
echo -e "${YELLOW}💡 Logları görüntülemek için: docker-compose -f docker-compose.production.yml logs -f${NC}"
echo -e "${YELLOW}💡 Container'ları durdurmak için: docker-compose -f docker-compose.production.yml down${NC}"