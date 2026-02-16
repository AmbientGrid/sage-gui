const http = require('http')

const API_TARGET = '127.0.0.1'
const API_PORT = 8080

// Paths to proxy from Parcel dev server to mock_api.py
const proxyPaths = [
  '/api/',
  '/beehive/',
  '/manifests',
  '/sensors',
  '/demo',
  '/ontology',
  '/factory',
  '/token',
  '/portal-logout',
  '/sensorhardwares',
  '/repositories',
  '/apps',
]

module.exports = function(app) {
  // Remove COEP header
  app.use((req, res, next) => {
    res.removeHeader('Cross-Origin-Embedder-Policy')
    next()
  })

  // Proxy API paths to mock_api on port 8080
  app.use((req, res, next) => {
    const shouldProxy = proxyPaths.some(p => req.url.startsWith(p))
    if (!shouldProxy) return next()

    const options = {
      hostname: API_TARGET,
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${API_TARGET}:${API_PORT}` },
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error(`[proxy] Error forwarding ${req.method} ${req.url}: ${err.message}`)
      res.writeHead(502)
      res.end(`Proxy error: ${err.message}`)
    })

    req.pipe(proxyReq)
  })
}
