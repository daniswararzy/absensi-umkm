/**
 * index.js — server entry point.
 *
 * Imports the app and starts listening.
 * This file does nothing else — all app config lives in src/app.js.
 */

const app = require('./src/app')
const { env } = require('./src/config')

app.listen(env.port, (error) => {
  if (error) {
    console.error(`Server gagal berjalan: ${error.message}`)
    process.exit(1)
  }

  console.log(`
  ╔════════════════════════════════════════════╗
  ║   Absensi UMKM API                        ║
  ║   http://localhost:${String(env.port).padEnd(26)}║
  ║   Environment: ${env.nodeEnv.padEnd(27)}║
  ╚════════════════════════════════════════════╝
  `)
})
