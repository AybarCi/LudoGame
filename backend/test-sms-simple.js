const sms = require('./services/sms-service.js');

console.log('=== SMS SERVİS KONTROLÜ ===');
console.log('Test Mode:', sms.testMode);
console.log('API ID:', !!sms.apiId);
console.log('API Key:', !!sms.apiKey);
console.log('Sender:', !!sms.sender);

const shouldUseTestMode = sms.testMode || process.env.NODE_ENV === 'development' || !sms.apiId || !sms.apiKey || !sms.sender;
console.log('Test modu kullanılacak mı:', shouldUseTestMode);

if (shouldUseTestMode) {
    console.log('❌ Test modunda çalışıyor!');
    console.log('Sebep:');
    if (sms.testMode) console.log('  - SMS_TEST_MODE=true');
    if (process.env.NODE_ENV === 'development') console.log('  - NODE_ENV=development');
    if (!sms.apiId) console.log('  - API_ID eksik');
    if (!sms.apiKey) console.log('  - API_KEY eksik');
    if (!sms.sender) console.log('  - SENDER eksik');
} else {
    console.log('✅ Production modunda çalışıyor!');
}