# Node.js Backend Production Build ve Deployment Rehberi

## Neden Production Build Gerekli?

Haklısınız! Backend projesini komple kopyalamak yerine optimize edilmiş bir production build oluşturmak daha doğru bir yaklaşımdır. İşte nedenleri:

### 1. **Dosya Boyutu Optimizasyonu**
- Development bağımlılıkları (nodemon, eslint, vb.) production'da gereksiz
- Source map dosyaları ve debug bilgileri kaldırılmalı
- Gereksiz dosyalar (test, docs, vb.) çıkarılmalı

### 2. **Güvenlik**
- `.env.example`, `.git`, `node_modules` gibi hassas dosyalar dahil edilmemeli
- Source code minification (opsiyonel)
- Dependency vulnerability taraması

### 3. **Performance**
- Sadece production dependencies
- Optimized Node.js runtime
- Compressed assets

## Production Build Süreci

### Adım 1: Build Script'i Oluşturma

```bash
# package.json'a eklenecek script'ler
"scripts": {
  "build": "npm run clean && npm run copy-files && npm run install-prod",
  "clean": "rimraf dist",
  "copy-files": "npm run copy-source && npm run copy-config",
  "copy-source": "cpx \"**/*.js\" dist --exclude=\"node_modules/**\" --exclude=\"dist/**\" --exclude=\"*.test.js\"",
  "copy-config": "cpx \"package.json\" dist && cpx \".env.production\" dist",
  "install-prod": "cd dist && npm install --production --no-optional",
  "package": "npm run build && npm run create-archive",
  "create-archive": "tar -czf ludo-backend-production.tar.gz -C dist ."
}
```

### Adım 2: Build Konfigürasyonu

#### .buildignore dosyası oluşturun:
```
# Development files
*.test.js
*.spec.js
test/
tests/
__tests__/

# Documentation
*.md
docs/

# Development tools
.eslintrc*
.prettierrc*
nodemon.json

# Version control
.git/
.gitignore

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Environment files
.env
.env.local
.env.development

# Dependencies
node_modules/

# Build output
dist/
build/

# Temporary files
tmp/
temp/
```

### Adım 3: Otomatik Build Script'i

```bash
#!/bin/bash
# build-production.sh

echo "🚀 Ludo Backend Production Build Başlatılıyor..."

# Temizlik
echo "🧹 Önceki build temizleniyor..."
rm -rf dist/
rm -f ludo-backend-production.tar.gz

# Build dizini oluştur
mkdir -p dist

# Kaynak dosyaları kopyala (sadece gerekli olanlar)
echo "📁 Kaynak dosyalar kopyalanıyor..."
cp -r services/ dist/
cp -r utils/ dist/
cp server.js dist/
cp db.js dist/
cp constants.js dist/
cp gameConstants.js dist/

# Production config dosyalarını kopyala
echo "⚙️  Konfigürasyon dosyaları hazırlanıyor..."
cp deployment/db-config.production.js dist/db-config.js
cp deployment/package.production.json dist/package.json
cp deployment/web.config dist/

# .env.production dosyasını .env olarak kopyala
if [ -f ".env.production" ]; then
    cp .env.production dist/.env
else
    echo "⚠️  .env.production dosyası bulunamadı!"
fi

# Production dependencies yükle
echo "📦 Production dependencies yükleniyor..."
cd dist
npm install --production --no-optional --silent
cd ..

# Güvenlik taraması (opsiyonel)
echo "🔒 Güvenlik taraması..."
cd dist
npm audit --audit-level=high
cd ..

# Arşiv oluştur
echo "📦 Production paketi oluşturuluyor..."
tar -czf ludo-backend-production.tar.gz -C dist .

# Boyut bilgisi
echo "📊 Build istatistikleri:"
echo "   Kaynak dizin boyutu: $(du -sh . --exclude=node_modules --exclude=dist | cut -f1)"
echo "   Production paketi: $(du -sh ludo-backend-production.tar.gz | cut -f1)"
echo "   Dosya sayısı: $(find dist -type f | wc -l)"

echo "✅ Production build tamamlandı!"
echo "📁 Çıktı: ludo-backend-production.tar.gz"
echo "🚀 Deployment için hazır!"
```

### Adım 4: Docker ile Production Build (Alternatif)

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS builder

# Build dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs db.js ./
COPY --chown=nodejs:nodejs constants.js ./
COPY --chown=nodejs:nodejs gameConstants.js ./
COPY --chown=nodejs:nodejs services/ ./services/
COPY --chown=nodejs:nodejs utils/ ./utils/
COPY --chown=nodejs:nodejs deployment/db-config.production.js ./db-config.js
COPY --chown=nodejs:nodejs deployment/package.production.json ./package.json

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "server.js"]
```

### Adım 5: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/build-and-deploy.yml
name: Build and Deploy Backend

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      working-directory: ./backend
      run: npm ci
    
    - name: Run tests
      working-directory: ./backend
      run: npm test
    
    - name: Security audit
      working-directory: ./backend
      run: npm audit --audit-level=high
    
    - name: Build production package
      working-directory: ./backend
      run: |
        chmod +x build-production.sh
        ./build-production.sh
    
    - name: Upload build artifact
      uses: actions/upload-artifact@v3
      with:
        name: ludo-backend-production
        path: backend/ludo-backend-production.tar.gz
    
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download build artifact
      uses: actions/download-artifact@v3
      with:
        name: ludo-backend-production
    
    - name: Deploy to server
      run: |
        # Server'a deployment script'i
        echo "Deployment logic here"
```

## Deployment Optimizasyonları

### 1. **Dosya Boyutu Karşılaştırması**
```bash
# Tam proje (development)
Development: ~50MB (node_modules dahil)

# Production build
Production: ~15MB (sadece gerekli dosyalar)

# Docker image
Docker: ~80MB (Alpine Linux base)
```

### 2. **Performance İyileştirmeleri**
- PM2 ile process management
- Node.js cluster mode
- Memory optimization
- Startup time optimization

### 3. **Güvenlik İyileştirmeleri**
```javascript
// Production server.js optimizasyonları
if (process.env.NODE_ENV === 'production') {
    // Security headers
    app.use(helmet());
    
    // Rate limiting
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }));
    
    // Disable detailed error messages
    app.use((err, req, res, next) => {
        res.status(500).json({ error: 'Internal Server Error' });
    });
}
```

## Kullanım

```bash
# Production build oluştur
./build-production.sh

# Server'a deploy et
scp ludo-backend-production.tar.gz user@server:/path/to/deployment/
ssh user@server "cd /path/to/deployment && tar -xzf ludo-backend-production.tar.gz"

# Server'da başlat
ssh user@server "cd /path/to/deployment && npm start"
```

Bu yaklaşım ile:
- ✅ Sadece gerekli dosyalar deploy edilir
- ✅ Güvenlik riskleri minimize edilir
- ✅ Deployment boyutu optimize edilir
- ✅ CI/CD pipeline entegrasyonu sağlanır
- ✅ Production-ready konfigürasyon kullanılır