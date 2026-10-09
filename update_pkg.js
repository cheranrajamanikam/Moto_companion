const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['map-server'] = 'npx tsx server/map-server.ts';
pkg.scripts['dev:full'] = 'concurrently " \npm run dev\\ \\npm run map-server\\';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('OK');