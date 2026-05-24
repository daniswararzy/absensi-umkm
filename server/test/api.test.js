const assert = require('node:assert/strict')
const { Readable, Writable } = require('node:stream')
const { test } = require('node:test')

process.env.NODE_ENV = 'test'

const app = require('../src/app')

function request(path, options = {}) {
  const body = options.body ? JSON.stringify(options.body) : null
  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    ...(options.ip ? { 'x-forwarded-for': options.ip } : {}),
    ...(options.headers || {}),
  }

  return new Promise((resolve, reject) => {
    let bodyWasRead = false
    const req = new Readable({
      read() {
        if (bodyWasRead) {
          return
        }

        bodyWasRead = true
        this.push(body || null)

        if (body) {
          this.push(null)
        }
      },
    })
    const chunks = []
    const res = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk))
        callback()
      },
    })

    req.method = options.method || 'GET'
    req.url = path
    req.originalUrl = path
    req.headers = headers
    req.connection = { remoteAddress: '127.0.0.1' }
    req.socket = req.connection

    res.statusCode = 200
    res.headers = {}
    res.setHeader = (name, value) => {
      res.headers[name.toLowerCase()] = value
    }
    res.getHeader = (name) => res.headers[name.toLowerCase()]
    res.removeHeader = (name) => {
      delete res.headers[name.toLowerCase()]
    }
    res.writeHead = (statusCode, nextHeaders = {}) => {
      res.statusCode = statusCode
      Object.entries(nextHeaders).forEach(([name, value]) => {
        res.setHeader(name, value)
      })
    }

    res.end = (chunk) => {
      if (chunk) {
        chunks.push(Buffer.from(chunk))
      }

      const rawBody = Buffer.concat(chunks).toString('utf8')
      let data = null

      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = rawBody
      }

      resolve({
        data,
        headers: res.headers,
        status: res.statusCode,
      })
    }

    app.handle(req, res, reject)
  })
}

test('GET / returns API metadata', async () => {
  const response = await request('/')

  assert.equal(response.status, 200)
  assert.equal(response.data.success, true)
  assert.equal(response.data.message, 'API Absensi UMKM berjalan')
})

test('unknown route returns JSON 404', async () => {
  const response = await request('/api/unknown-route')

  assert.equal(response.status, 404)
  assert.equal(response.data.success, false)
  assert.match(response.data.message, /Route tidak ditemukan/)
})

test('protected laporan route requires token', async () => {
  const response = await request('/api/laporan')

  assert.equal(response.status, 401)
  assert.equal(response.data.success, false)
  assert.match(response.data.message, /Token tidak ditemukan/)
})

test('login validates missing credentials before database lookup', async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {},
    ip: '127.0.0.10',
  })

  assert.equal(response.status, 400)
  assert.equal(response.data.success, false)
  assert.match(response.data.message, /Username dan password wajib diisi/)
})

test('login route is rate limited', async () => {
  let response

  for (let index = 0; index < 21; index += 1) {
    response = await request('/api/auth/login', {
      method: 'POST',
      body: {},
      ip: '127.0.0.20',
    })
  }

  assert.equal(response.status, 429)
  assert.equal(response.data.success, false)
  assert.match(response.data.message, /Terlalu banyak percobaan login/)
})
