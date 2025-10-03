# Windows Server IIS Deployment Rehberi - Ludo Game Backend

## Ön Gereksinimler

### 1. Windows Server Hazırlığı
- Windows Server 2016 veya üzeri
- IIS (Internet Information Services) yüklü
- Node.js 18.x veya üzeri yüklü
- SQL Server 2017 veya üzeri

### 2. Gerekli IIS Modülleri
```powershell
# PowerShell ile IIS özelliklerini etkinleştir
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
```

### 3. IISNode Kurulumu
1. [IISNode](https://github.com/Azure/iisnode/releases) indirin ve kurun
2. [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite) indirin ve kurun

## Deployment Adımları

### Adım 1: Proje Dosyalarını Sunucuya Kopyalama
```bash
# Backend klasörünü sunucuya kopyalayın
# Örnek konum: C:\inetpub\wwwroot\ludo-backend\
```

### Adım 2: Node.js Bağımlılıklarını Yükleme
```bash
cd C:\inetpub\wwwroot\ludo-backend
npm install --production
```

### Adım 3: Ortam Değişkenlerini Ayarlama
`.env` dosyası oluşturun:
```env
# Database Configuration
DB_SERVER=localhost
DB_DATABASE=LudoGameDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://your-frontend-domain.com
```

### Adım 4: IIS Site Oluşturma
1. IIS Manager'ı açın
2. "Sites" üzerine sağ tıklayın → "Add Website"
3. Site bilgilerini girin:
   - **Site name**: Ludo-Backend
   - **Physical path**: C:\inetpub\wwwroot\ludo-backend
   - **Port**: 3000 (veya istediğiniz port)
   - **Host name**: (opsiyonel)

### Adım 5: Web.config Dosyasını Yerleştirme
`web.config` dosyasını proje kök dizinine kopyalayın (zaten oluşturuldu).

### Adım 6: SQL Server Veritabanı Kurulumu

#### Manuel Kurulum
1. SQL Server Management Studio'yu açın
2. `deployment/create_database.sql` dosyasını çalıştırın
3. Veritabanı bağlantı bilgilerini `.env` dosyasında güncelleyin

#### Production Build ile Kurulum
**Önemli**: Production zip/tar.gz paketinde SQL script dosyası **bulunmaz**. Veritabanını kurmak için:

1. **SQL Script'i ayrıca kopyalayın**:
   ```cmd
   # Deployment klasöründen create_database.sql dosyasını servera kopyalayın
   # Örnek: C:\temp\create_database.sql
   ```

2. **SQL Server Management Studio'da çalıştırın**:
   ```sql
   -- create_database.sql dosyasını açın ve çalıştırın
   -- Bu script şu tabloları oluşturacak:
   -- - users (kullanıcı bilgileri)
   -- - UserPawns (kullanıcı piyonları)
   -- - refresh_tokens (JWT token'ları)
   -- - game_sessions (oyun oturumları)
   -- - game_participants (oyun katılımcıları)
   ```

3. **Veritabanı bağlantısını test edin**:
   ```sql
   USE LudoGameDB;
   SELECT COUNT(*) FROM users; -- Test kullanıcısı görünmeli
   ```

### Adım 7: Güvenlik Ayarları

#### IIS Application Pool Ayarları
1. IIS Manager → Application Pools
2. Ludo-Backend pool'unu seçin
3. "Advanced Settings":
   - **Process Model → Identity**: ApplicationPoolIdentity
   - **Recycling → Idle Time-out**: 0 (disable)
   - **.NET CLR Version**: No Managed Code

#### Dosya İzinleri
```powershell
# Application Pool identity'ye gerekli izinleri verin
icacls "C:\inetpub\wwwroot\ludo-backend" /grant "IIS AppPool\Ludo-Backend":(OI)(CI)F
```

### Adım 8: Firewall Ayarları
```powershell
# Port 3000'i açın (veya kullandığınız port)
New-NetFirewallRule -DisplayName "Ludo Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Adım 9: SSL Sertifikası (Üretim için önerilen)
1. SSL sertifikası edinin (Let's Encrypt, commercial CA, vb.)
2. IIS Manager'da sertifikayı site'a bağlayın
3. HTTPS redirect kuralı ekleyin

## Test ve Doğrulama

### 1. Backend Test
```bash
# Browser'da test edin
http://your-server:3000/

# API endpoint test
http://your-server:3000/api/health
```

### 2. Socket.IO Test
```javascript
// Browser console'da test
const socket = io('http://your-server:3000');
socket.on('connect', () => console.log('Connected!'));
```

### 3. Veritabanı Bağlantı Test
```sql
-- SQL Server'da test
SELECT COUNT(*) FROM users;
```

## Sorun Giderme

### 1. Log Dosyaları
- IIS Logs: `C:\inetpub\logs\LogFiles\`
- IISNode Logs: `C:\inetpub\wwwroot\ludo-backend\iisnode\`
- Application Logs: Windows Event Viewer

### 2. Yaygın Sorunlar

#### Node.js bulunamıyor
```xml
<!-- web.config'e ekleyin -->
<iisnode nodeProcessCommandLine="C:\Program Files\nodejs\node.exe" />
```

#### Socket.IO bağlantı sorunu
- CORS ayarlarını kontrol edin
- Firewall kurallarını kontrol edin
- WebSocket desteğini etkinleştirin

#### Veritabanı bağlantı sorunu
- SQL Server servisinin çalıştığını kontrol edin
- Bağlantı string'ini kontrol edin
- SQL Server Authentication'ı etkinleştirin

### 3. Performance Optimizasyonu
```xml
<!-- web.config optimizasyonları -->
<iisnode
  nodeProcessCountPerApplication="4"
  maxConcurrentRequestsPerProcess="1024"
  asyncCompletionThreadCount="0"
/>
```

## Monitoring ve Maintenance

### 1. Health Check Endpoint
Backend'de health check endpoint'i ekleyin:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### 2. Log Rotation
- IIS log rotation ayarlarını yapılandırın
- Application log'ları için log rotation implementasyonu

### 3. Backup Strategy
- Veritabanı backup planı
- Application files backup
- Configuration backup

## Güvenlik Checklist

- [ ] SQL injection koruması aktif
- [ ] CORS doğru yapılandırılmış
- [ ] JWT secret'ları güvenli
- [ ] HTTPS kullanımı (production)
- [ ] Firewall kuralları minimal
- [ ] Database user minimal yetkiler
- [ ] Error handling güvenli
- [ ] Rate limiting implementasyonu

## Production Build ile Hızlı Deployment

### Önerilen Yöntem: Hazır Production Paketi

Tüm projeyi manuel olarak kopyalamak yerine, optimize edilmiş production build kullanın:

#### Adım 1: Production Build Oluşturma
```bash
# Backend dizininde
cd /path/to/ludo/backend
./deployment/build-production.sh
```

Bu script şu dosyaları oluşturacak:
- `ludo-backend-production.tar.gz` (13MB) - Linux/Unix için
- `ludo-backend-production.zip` (17MB) - Windows için

#### Adım 2: Paket İçeriği
Production paketi şunları içerir:
- **Ana dosyalar**: server.js, db.js, constants.js, gameConstants.js
- **Servisler**: services/ ve utils/ klasörleri
- **Konfigürasyon**: web.config, db-config.js, .env
- **Dependencies**: Sadece production node_modules (288 paket)

#### Adım 3: Windows Server'a Deployment

1. **Paketi ve SQL script'i servera yükleyin**:
   ```cmd
   # ludo-backend-production.zip dosyasını servera kopyalayın
   # Örnek konum: C:\temp\ludo-backend-production.zip
   
   # SQL script'i de ayrıca kopyalayın (production pakette yok!)
   # deployment/create_database.sql -> C:\temp\create_database.sql
   ```

2. **Paketi IIS dizinine açın**:
   ```cmd
   # IIS site dizininde (örn: C:\inetpub\wwwroot\ludo-backend\)
   # Zip dosyasını extract edin
   ```

3. **Veritabanını oluşturun**:
   ```sql
   -- SQL Server Management Studio'da create_database.sql'i çalıştırın
   -- LudoGameDB veritabanı ve tüm tablolar oluşturulacak
   ```

4. **IIS Site ayarları**:
   - **Site name**: Ludo-Backend
   - **Physical path**: C:\inetpub\wwwroot\ludo-backend
   - **Port**: 3000
   - **Application Pool**: .NET CLR Version = "No Managed Code"

5. **Ortam değişkenlerini güncelleyin**:
   ```env
   # .env dosyasını production değerleri ile düzenleyin
   DB_SERVER=your-sql-server
   DB_DATABASE=LudoGameDB
   DB_USER=your-db-user
   DB_PASSWORD=your-strong-password
   JWT_SECRET=your-production-jwt-secret
   ```

6. **Uygulamayı başlatın**:
   - IIS Manager'da site'ı restart edin
   - Browser'da test edin: `http://your-server:3000`

### Avantajlar
- ✅ **Hızlı deployment** (13MB vs 199MB)
- ✅ **Sadece gerekli dosyalar** (development dependencies yok)
- ✅ **Güvenlik** (test dosyaları, .git klasörü yok)
- ✅ **Optimize edilmiş** (gereksiz dosyalar temizlenmiş)

### Production Build Özellikleri
- **Boyut**: 13MB (orijinal: 199MB)
- **Dosya sayısı**: 10,830 (sadece production)
- **Node modules**: 288 paket (development dependencies hariç)
- **Güvenlik taraması**: Yüksek riskli vulnerability kontrolü
- **IIS hazır**: web.config ve production config dahil

---

## Sonraki Adımlar

1. Frontend deployment (React/Next.js)
2. Load balancer yapılandırması (gerekirse)
3. CDN entegrasyonu
4. Monitoring tools (Application Insights, vb.)
5. CI/CD pipeline kurulumu

---

**Not**: Bu rehber temel bir deployment için hazırlanmıştır. Production ortamında ek güvenlik ve performance optimizasyonları gerekebilir.