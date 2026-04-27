require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 5050

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'API Absensi UMKM berjalan',
    stage: 'Tahap 1 - Setup Struktur Project',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'absensi-umkm-api',
    timestamp: new Date().toISOString(),
  })
})

if (require.main === module) {
  app.listen(PORT, (error) => {
    if (error) {
      console.error(`Server gagal berjalan: ${error.message}`)
      process.exit(1)
    }

    console.log(`Server Absensi UMKM berjalan di http://localhost:${PORT}`)
  })
}

module.exports = app
