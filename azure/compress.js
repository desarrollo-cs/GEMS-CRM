// Genera .br y .gz junto a cada archivo de texto de dist/ para que
// azure/server.js los sirva sin comprimir en cada petición.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const DIST = path.resolve(process.argv[2] || 'dist')
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|map|ico)$/i

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  )
}

let before = 0, after = 0
for (const file of walk(DIST)) {
  if (!COMPRESSIBLE.test(file)) continue
  const data = fs.readFileSync(file)
  if (data.length < 1024) continue
  const br = zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } })
  fs.writeFileSync(file + '.br', br)
  fs.writeFileSync(file + '.gz', zlib.gzipSync(data, { level: 9 }))
  before += data.length; after += br.length
}
console.log(`Comprimido: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB (brotli)`)
