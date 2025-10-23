// Test script for frontend socket connection
const io = require('socket.io-client');

// Frontend'deki yeni socket URL'si
const SOCKET_URL = 'https://ludoturcoapi.istekbilisim.com';

console.log('🔍 Frontend socket bağlantısı test ediliyor...');
console.log('📍 Socket URL:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  path: '/socket.io/',
  secure: true,
  timeout: 10000,
  reconnection: false,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('✅ Socket bağlantısı başarılı!');
  console.log('🔌 Socket ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket bağlantı hatası:', error.message);
  console.log('📋 Hata detayları:', error);
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket hatası:', error);
  process.exit(1);
});

// 10 saniye sonra timeout
setTimeout(() => {
  console.log('⏰ Bağlantı zaman aşımı');
  socket.disconnect();
  process.exit(1);
}, 10000);