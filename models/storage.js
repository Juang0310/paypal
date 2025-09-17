const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'paypal_data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function read(file) {
  const p = path.join(dataDir, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8') || '[]');
}

function write(file, data) {
  const p = path.join(dataDir, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { read, write };
