const sms = require('./services/sms-service.js');

console.log('=== SMS SERVİS TESTİ ===');
console.log('Test Mode:', sms.testMode);
console.log('API ID:', sms.apiId);
console.log('API Key:', sms.apiKey);
console.log('Sender:', sms.sender);
console.log('API Credentials Check:');
console.log('  - API ID var:', !!sms.apiId);
console.log('  - API Key var:', !!sms.apiKey);
console.log('  - Sender var:', !!sms.sender);
console.log('  - Hepsi var:', !!(sms.apiId && sms.apiKey && sms.sender));
console.log('Environment Check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - SMS_TEST_MODE:', process.env.SMS_TEST_MODE);
console.log('  - SMS_TEST_MODE === "true":', process.env.SMS_TEST_MODE === 'true');