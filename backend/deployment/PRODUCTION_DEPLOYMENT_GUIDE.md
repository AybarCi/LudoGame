# 🚀 Production Deployment Guide - Ludo Backend

Bu doküman, Ludo Backend uygulamasını production ortamına deploy etmek için gereken adımları içerir.

## 📋 Gereksinimler

- Docker ve Docker Compose kurulu olmalı
- Domain adı ve SSL sertifikası
- Production SQL Server erişimi
- Minimum 2GB RAM, 2 CPU çekirdeği

## 🔧 Production Konfigürasyon Dosyaları

### 1. Environment Variables (.env)
```bash
# .env dosyasını oluşturun
cp env.production .env

# Aşağıdaki değerleri güncelleyin:
- JWT_SECRET: Güçlü bir JWT anahtarı
- CORS_ORIGIN: Frontend domain'iniz
- SSL_CERT_PATH ve SSL_KEY_PATH: SSL sertifikalarınız
```

### 2. Database Configuration
- **Server**: mssql.istekbilisim.com
- **Database**: ludoturcodb
- **User**: sa
- **Password**: SeKo153759++

### 3. SSL Sertifikaları
```bash
# SSL dizinini oluşturun
mkdir -p ssl

# Sertifikalarınızı kopyalayın
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

## 🚀 Deployment Adımları

### 1. Depolama Alanını Hazırlayın
```bash
cd /Users/cihanaybar/Projects/Ludo/backend/deployment
chmod +x deploy-production.sh
```

### 2. Deployment'ı Başlatın
```bash
./deploy-production.sh
```

### 3. Health Check Kontrolü
```bash
# Backend health check
curl -f http://localhost:3001/health

# Tüm servislerin durumunu kontrol edin
docker-compose -f docker-compose.production.yml ps
```

## 🔍 Log İzleme

```bash
# Tüm logları görüntüleme
docker-compose -f docker-compose.production.yml logs -f

# Sadece backend logları
docker-compose -f docker-compose.production.yml logs -f ludo-backend

# Nginx logları
docker-compose -f docker-compose.production.yml logs -f nginx
```

## 🔄 Güncelleme İşlemi

```bash
# Yeni versiyonu deploy et
./deploy-production.sh

# Eski versiyona geri dön (gerekirse)
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

## 🛑 Durdurma ve Kaldırma

```bash
# Container'ları durdur
docker-compose -f docker-compose.production.yml down

# Tüm verileri de kaldır
docker-compose -f docker-compose.production.yml down -v
```

## 🔒 Güvenlik Önerileri

### 1. Environment Variables
- JWT_SECRET en az 32 karakter olmalı
- DB_PASSWORD'ü düzenli olarak değiştirin
- .env dosyasını git'e eklemeyin

### 2. Network Güvenliği
- Sadece gerekli portları açın (80, 443)
- Firewall kurallarını yapılandırın
- VPN üzerinden SQL Server'a erişin

### 3. SSL/TLS
- Let's Encrypt ile otomatik yenewal kurun
- TLS 1.2 ve üzeri kullanın
- Güçlü şifreleme algoritmaları kullanın

### 4. Monitoring
- Health check endpoint'ini düzenli kontrol edin
- Logları merkezi bir sisteme gönderin
- Alert sistemleri kurun

## 📊 Performans Optimizasyonu

### 1. Connection Pooling
```javascript
// db-config.production.js'de ayarlanmıştır
pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
}
```

### 2. Rate Limiting
- API endpoint'leri: 10 istek/saniye
- Login endpoint'i: 1 istek/saniye

### 3. Caching (Opsiyonel Redis)
- Session yönetimi
- Sık kullanılan veriler
- Rate limiting

## 🚨 Hata Ayıklama

### Yaygın Hatalar

1. **Bağlantı Hatası**
```bash
# SQL Server bağlantısını test et
telnet mssql.istekbilisim.com 1433
```

2. **SSL Hatası**
```bash
# SSL sertifikalarını kontrol et
openssl x509 -in ssl/cert.pem -text -noout
```

3. **Port Çakışması**
```bash
# 3001 portunu kullanan uygulamaları bul
netstat -tulpn | grep 3001
```

### Log Dosyaları
- Uygulama logları: `./logs/production.log`
- Nginx logları: `./logs/nginx/`
- Docker logları: `docker-compose logs`

## 📞 Destek

Problemler için:
1. Log dosyalarını kontrol edin
2. Health check endpoint'ini test edin
3. Container durumlarını kontrol edin
4. Gerekirse rollback yapın

## 📁 Önemli Dosyalar

- `docker-compose.production.yml` - Main compose file
- `db-config.production.js` - Database configuration
- `nginx.conf` - Reverse proxy configuration
- `deploy-production.sh` - Deployment script
- `env.production` - Environment variables template