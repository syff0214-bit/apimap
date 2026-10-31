import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/distance.js': ['distance.js', 'text/javascript'] };
createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(new URL(`../public/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Server error'); }
}).listen(3000, '127.0.0.1', () => console.log('http://localhost:3000'));
