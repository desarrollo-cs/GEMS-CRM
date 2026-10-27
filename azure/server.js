// Servidor estático del frontend en Azure App Service.
// Sin dependencias: sirve las versiones .br/.gz que genera azure/compress.js
// en el build, cachea /assets para siempre (llevan hash) y responde
// index.html para las rutas de la SPA.
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const PORT = process.env.PORT || 8080

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
}

function resolveFile(urlPath) {
  let rel
  try { rel = decodeURIComponent(urlPath.split('?')[0]) } catch { return null }
  const file = path.normalize(path.join(ROOT, rel))
  if (!file.startsWith(ROOT)) return null
  try {
    if (fs.statSync(file).isFile()) return file
  } catch {}
  return null
}

function send(req, res, file, isFallback) {
  const ext = path.extname(file).toLowerCase()
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Vary': 'Accept-Encoding',
    'X-Content-Type-Options': 'nosniff',
    // Archivos con hash: inmutables. index.html y el resto: revalidar siempre.
    'Cache-Control': !isFallback && file.includes(`${path.sep}assets${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
  }

  const accept = String(req.headers['accept-encoding'] || '')
  let body = file
  if (/\bbr\b/.test(accept) && fs.existsSync(file + '.br')) {
    body = file + '.br'; headers['Content-Encoding'] = 'br'
  } else if (/\bgzip\b/.test(accept) && fs.existsSync(file + '.gz')) {
    body = file + '.gz'; headers['Content-Encoding'] = 'gzip'
  }

  headers['Content-Length'] = fs.statSync(body).size
  res.writeHead(200, headers)
  if (req.method === 'HEAD') return res.end()
  fs.createReadStream(body).pipe(res)
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); return res.end()
  }
  const file = resolveFile(req.url || '/')
  if (file && !file.endsWith('.br') && !file.endsWith('.gz')) return send(req, res, file, false)
  // Un archivo con extensión que no existe es un 404 real (no devolver HTML como JS)
  if (path.extname((req.url || '').split('?')[0])) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found')
  }
  send(req, res, path.join(ROOT, 'index.html'), true)
}).listen(PORT, () => console.log(`Frontend listo en el puerto ${PORT}`))
