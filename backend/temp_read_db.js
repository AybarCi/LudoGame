const fs = require('fs');
const path = require('path');

try {
  const content = fs.readFileSync(path.join(__dirname, 'db-config.js'), 'utf8');
  console.log('--- Start of db-config.js content ---');
  console.log(content);
  console.log('--- End of db-config.js content ---');
} catch (error) {
  console.error('Error reading db.js:', error);
}
