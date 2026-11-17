// Servidor de Mis Gastos para Docker/homelab.
// Sirve la app (archivos estáticos) y guarda los datos en DATA_DIR/datos.json,
// para que no dependan solo del navegador. Sin dependencias externas.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'datos.json');
// Solo estas claves se guardan en el servidor. La clave de API y lo propio de cada
// dispositivo (correoUrl, correoAt) se quedan en el navegador.
const KEYS = ['expenses', 'contacts', 'split', 'sueldos', 'banco', 'periods'];
const STATIC = new Set(['index.html', 'manifest.json', 'sw.js', 'icon-180.png', 'icon-192.png', 'icon-512.png']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };

fs.mkdirSync(DATA_DIR, { recursive: true });

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) {
    if (e.code !== 'ENOENT') console.error('No pude leer', DATA_FILE, e.message);
    return { rev: 0, data: {} };
  }
}
let db = readData();

function writeData() {
  // Escritura atómica: primero a un temporal y luego se renombra. Se deja una copia .bak.
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  try { fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak'); } catch (e) {}
  fs.renameSync(tmp, DATA_FILE);
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (p === '/api/datos') {
    if (req.method === 'GET') return send(res, 200, db);
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 20e6) req.destroy(); });
      req.on('end', () => {
        let patch;
        try { patch = JSON.parse(body); } catch (e) { return send(res, 400, { error: 'JSON inválido' }); }
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return send(res, 400, { error: 'Se esperaba un objeto' });
        for (const k of Object.keys(patch)) if (KEYS.includes(k)) db.data[k] = patch[k];
        db.rev = (db.rev || 0) + 1;
        try { writeData(); } catch (e) { console.error(e); return send(res, 500, { error: 'No pude guardar' }); }
        send(res, 200, { rev: db.rev });
      });
      return;
    }
    return send(res, 405, { error: 'Método no permitido' });
  }

  if (p === '/salud') return send(res, 200, 'ok', 'text/plain');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método no permitido', 'text/plain');

  const name = p === '/' ? 'index.html' : p.slice(1);
  if (!STATIC.has(name)) return send(res, 404, 'No encontrado', 'text/plain');
  fs.readFile(path.join(ROOT, name), (err, buf) => {
    if (err) return send(res, 404, 'No encontrado', 'text/plain');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
});

server.listen(PORT, () => console.log(`Mis Gastos en http://localhost:${PORT} (datos en ${DATA_FILE})`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
