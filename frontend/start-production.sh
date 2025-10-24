#!/bin/bash

# Production environment değişkenlerini ayarla
export EXPO_PUBLIC_API_URL="https://ludoturcoapi.istekbilisim.com"
export EXPO_PUBLIC_SOCKET_URL="https://ludoturcoapi.istekbilisim.com"
export EXPO_PUBLIC_ADMOB_BANNER_ID="ca-app-pub-1743455537598911/1234567890"
export EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID="ca-app-pub-1743455537598911/4233374921"
export EXPO_PUBLIC_ADMOB_REWARDED_ID="ca-app-pub-1743455537598911/9106427653"
export NODE_ENV="production"
export DEBUG="false"

# Development environment dosyalarını geçici olarak yeniden adlandır
cd /Users/cihanaybar/Projects/Ludo/frontend

if [ -f ".env.development" ]; then
    mv .env.development .env.development.backup
fi

if [ -f ".env.local" ]; then
    mv .env.local .env.local.backup
fi

# Production ortamında başlat
echo "🚀 Production ortamında başlatılıyor..."
echo "📡 API URL: $EXPO_PUBLIC_API_URL"
echo "🔗 Socket URL: $EXPO_PUBLIC_SOCKET_URL"

npx expo start --clear

# Başlatma tamamlandıktan sonra dosyaları geri yükle
echo "🔄 Environment dosyaları geri yükleniyor..."
if [ -f ".env.development.backup" ]; then
    mv .env.development.backup .env.development
fi

if [ -f ".env.local.backup" ]; then
    mv .env.local.backup .env.local
fi