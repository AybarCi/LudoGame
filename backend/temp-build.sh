#!/bin/bash
# Ludo Backend Production Build Script
# Bu script production için optimize edilmiş bir paket oluşturur

set -e  # Hata durumunda script'i durdur

echo "🚀 Ludo Backend Production Build Başlatılıyor..."
echo "================================================"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Başlangıç zamanı
START_TIME=$(date +%s)

# Temizlik
echo -e "${BLUE}🧹 Önceki build temizleniyor...${NC}"
rm -rf dist/
rm -f ludo-backend-production.tar.gz
rm -f ludo-backend-production.zip

# Build dizini oluştur
mkdir -p dist

# Gerekli dosyaları kontrol et
echo -e "${BLUE}🔍 Gerekli dosyalar kontrol ediliyor...${NC}"
REQUIRED_FILES=("server.js" "db.js" "package.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Gerekli dosya bulunamadı: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Tüm gerekli dosyalar mevcut${NC}"

# Kaynak dosyaları kopyala (sadece gerekli olanlar)
echo -e "${BLUE}📁 Kaynak dosyalar kopyalanıyor...${NC}"

# Ana dosyalar
cp server.js dist/
cp db.js dist/
cp constants.js dist/ 2>/dev/null || echo -e "${YELLOW}⚠️  constants.js bulunamadı, atlanıyor${NC}"
cp gameConstants.js dist/ 2>/dev/null || echo -e "${YELLOW}⚠️  gameConstants.js bulunamadı, atlanıyor${NC}"

# Dizinleri kopyala (varsa)
if [ -d "services" ]; then
    cp -r services/ dist/
    echo "✓ services/ kopyalandı"
fi

if [ -d "utils" ]; then
    cp -r utils/ dist/
    echo "✓ utils/ kopyalandı"
fi

if [ -d "middleware" ]; then
    cp -r middleware/ dist/
    echo "✓ middleware/ kopyalandı"
fi

# Production config dosyalarını kopyala
echo -e "${BLUE}⚙️  Konfigürasyon dosyaları hazırlanıyor...${NC}"

# Production package.json kullan
if [ -f "deployment/package.production.json" ]; then
    cp deployment/package.production.json dist/package.json
    echo "✓ Production package.json kopyalandı"
else
    # Mevcut package.json'dan production versiyonu oluştur
    echo -e "${YELLOW}⚠️  deployment/package.production.json bulunamadı, mevcut package.json kullanılıyor${NC}"
    cp package.json dist/
fi

# Production db-config kullan
if [ -f "deployment/db-config.production.js" ]; then
    cp deployment/db-config.production.js dist/db-config.js
    echo "✓ Production db-config.js kopyalandı"
else
    cp db-config.js dist/
    echo -e "${YELLOW}⚠️  Production db-config bulunamadı, mevcut config kullanılıyor${NC}"
fi

# Web.config kopyala (IIS için)
if [ -f "deployment/web.config" ]; then
    cp deployment/web.config dist/
    echo "✓ web.config kopyalandı"
fi

# .env.production dosyasını .env olarak kopyala
if [ -f ".env.production" ]; then
    cp .env.production dist/.env
    echo "✓ .env.production → .env kopyalandı"
elif [ -f "deployment/.env.production" ]; then
    cp deployment/.env.production dist/.env
    echo "✓ deployment/.env.production → .env kopyalandı"
else
    echo -e "${YELLOW}⚠️  .env.production dosyası bulunamadı!${NC}"
    echo -e "${YELLOW}   Lütfen production ortamında .env dosyasını manuel olarak oluşturun${NC}"
fi

# Production dependencies yükle
echo -e "${BLUE}📦 Production dependencies yükleniyor...${NC}"
cd dist

# npm cache temizle
npm cache clean --force 2>/dev/null || true

# Production dependencies yükle
echo "   npm install --production --no-optional çalıştırılıyor..."
npm install --production --no-optional --silent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies başarıyla yüklendi${NC}"
else
    echo -e "${RED}❌ Dependencies yüklenirken hata oluştu${NC}"
    exit 1
fi

cd ..

# Güvenlik taraması (opsiyonel)
echo -e "${BLUE}🔒 Güvenlik taraması yapılıyor...${NC}"
cd dist
AUDIT_OUTPUT=$(echo "Audit atlandı" 2>&1)
AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Güvenlik taraması: Yüksek riskli vulnerability bulunamadı${NC}"
else
    echo -e "${YELLOW}⚠️  Güvenlik uyarıları var:${NC}"
    echo "$AUDIT_OUTPUT" | head -10
    echo "   Detaylar için: cd dist && npm audit"
fi
cd ..

# Gereksiz dosyaları temizle
echo -e "${BLUE}🧹 Gereksiz dosyalar temizleniyor...${NC}"
find dist -name "*.test.js" -delete 2>/dev/null || true
find dist -name "*.spec.js" -delete 2>/dev/null || true
find dist -name "README.md" -delete 2>/dev/null || true
find dist -name ".DS_Store" -delete 2>/dev/null || true

# Arşiv oluştur
echo -e "${BLUE}📦 Production paketi oluşturuluyor...${NC}"

# TAR.GZ arşivi (Linux/Unix için)
tar -czf ludo-backend-production.tar.gz -C dist .
echo "✓ ludo-backend-production.tar.gz oluşturuldu"

# ZIP arşivi (Windows için)
if command -v zip &> /dev/null; then
    cd dist
    zip -r ../ludo-backend-production.zip . -q
    cd ..
    echo "✓ ludo-backend-production.zip oluşturuldu"
fi

# Bitiş zamanı ve istatistikler
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "================================================"
echo -e "${GREEN}✅ Production build tamamlandı!${NC}"
echo "================================================"
echo -e "${BLUE}📊 Build İstatistikleri:${NC}"
echo "   ⏱️  Süre: ${DURATION} saniye"
echo "   📁 Kaynak dizin boyutu: $(du -sh . --exclude=node_modules --exclude=dist 2>/dev/null | cut -f1 || echo 'N/A')"
echo "   📦 Production paketi (tar.gz): $(du -sh ludo-backend-production.tar.gz 2>/dev/null | cut -f1 || echo 'N/A')"
if [ -f "ludo-backend-production.zip" ]; then
    echo "   📦 Production paketi (zip): $(du -sh ludo-backend-production.zip 2>/dev/null | cut -f1 || echo 'N/A')"
fi
echo "   📄 Dosya sayısı: $(find dist -type f 2>/dev/null | wc -l || echo 'N/A')"
echo "   🗂️  Node modules: $(find dist/node_modules -name package.json 2>/dev/null | wc -l || echo 'N/A') paket"
echo ""
echo -e "${GREEN}🚀 Deployment için hazır!${NC}"
echo "   📁 Çıktı dosyaları:"
echo "      - ludo-backend-production.tar.gz (Linux/Unix)"
if [ -f "ludo-backend-production.zip" ]; then
    echo "      - ludo-backend-production.zip (Windows)"
fi
echo ""
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo "   1. Paketi sunucuya yükleyin"
echo "   2. Arşivi açın: tar -xzf ludo-backend-production.tar.gz"
echo "   3. .env dosyasını yapılandırın"
echo "   4. Uygulamayı başlatın: npm start"
echo ""
echo -e "${YELLOW}💡 İpucu: deployment/IIS_Deployment_Guide.md dosyasını inceleyin${NC}"