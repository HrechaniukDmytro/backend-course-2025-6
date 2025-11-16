const { program } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');

program
  .requiredOption('-h, --host <type>', 'адреса сервера')
  .requiredOption('-p, --port <type>', 'порт сервера')
  .requiredOption('-c, --cache <type>', 'шлях до директорії кешу');

program.parse(process.argv);

const options = program.opts();

const HOST = options.host;
const PORT = parseInt(options.port, 10);
const CACHE_DIR = path.resolve(options.cache);

if (!fs.existsSync(CACHE_DIR))
{
  console.log(`Cache directory not found. Creating: ${CACHE_DIR}`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} 
else 
{
  console.log(`Using existing cache directory: ${CACHE_DIR}`);
}

const app = express();


app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Access registration form at http://${HOST}:${PORT}/RegisterForm.html`);
  console.log(`Access search form at http://${HOST}:${PORT}/SearchForm.html`);
});