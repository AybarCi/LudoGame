# Ludo Game - Web Frontend

Bu proje Ludo oyununun web arayüzüdür. Next.js 14 ile geliştirilmiştir.

## 🚀 Başlangıç

### Gereksinimler
- Node.js 18.x veya üzeri
- npm veya yarn

### Kurulum
```bash
cd web
npm install
```

### Geliştirme Sunucusu
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📁 Proje Yapısı

- `/src/app` - Next.js App Router sayfaları
- `/src/components` - React bileşenleri
- `/public` - Statik dosyalar

## 🐳 Docker

```bash
docker build -t ludo-web .
docker run -p 3002:3000 ludo-web
```

### Docker Compose
```bash
docker-compose up -d
```

## 🚀 GitHub Actions & Portainer

Bu proje GitHub Actions ile otomatik build ve deploy desteğine sahiptir. Detaylı bilgi için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bakın.

## 🔗 Bağlantılar

- Backend: [Ludo Backend](../backend)
- Mobil: [Ludo Mobile](../frontend)
