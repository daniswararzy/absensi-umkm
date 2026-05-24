const assert = require('node:assert/strict')
const { test } = require('node:test')

process.env.NODE_ENV = 'test'

const DESCRIPTOR_LENGTH = 128

const testEnv = {
  attendance: {
    checkInNormalUntilTime: '23:00',
    checkOutTime: '00:00',
    closeTime: '23:59',
    lateAfterTime: '23:59',
    lateToleranceMinutes: 59,
    openTime: '00:00',
  },
  jwt: {
    expiresIn: '7d',
    secret: 'test_secret',
  },
  nodeEnv: 'test',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

class MockQuery {
  constructor(database, table) {
    this.database = database
    this.table = table
    this.filters = []
    this.limitCount = null
    this.operation = 'select'
    this.ordering = null
    this.payload = null
  }

  select() {
    return this
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  gte(column, value) {
    this.filters.push((row) => row[column] >= value)
    return this
  }

  lte(column, value) {
    this.filters.push((row) => row[column] <= value)
    return this
  }

  in(column, values) {
    const allowedValues = new Set(values)

    this.filters.push((row) => allowedValues.has(row[column]))
    return this
  }

  order(column, options = {}) {
    this.ordering = {
      ascending: options.ascending !== false,
      column,
    }
    return this
  }

  limit(count) {
    this.limitCount = count
    return this
  }

  insert(payload) {
    this.operation = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.operation = 'update'
    this.payload = payload
    return this
  }

  upsert(payload) {
    this.operation = 'upsert'
    this.payload = payload
    return this
  }

  maybeSingle() {
    return this.execute().then(({ data, error }) => {
      if (error) {
        return { data: null, error }
      }

      return {
        data: Array.isArray(data) ? data[0] || null : data || null,
        error: null,
      }
    })
  }

  single() {
    return this.execute().then(({ data, error }) => {
      if (error) {
        return { data: null, error }
      }

      const row = Array.isArray(data) ? data[0] : data

      if (!row) {
        return { data: null, error: { code: 'PGRST116' } }
      }

      return { data: row, error: null }
    })
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  execute() {
    if (this.operation === 'insert') {
      return Promise.resolve(this.executeInsert())
    }

    if (this.operation === 'update') {
      return Promise.resolve(this.executeUpdate())
    }

    if (this.operation === 'upsert') {
      return Promise.resolve(this.executeUpsert())
    }

    return Promise.resolve(this.executeSelect())
  }

  executeSelect() {
    let rows = this.getFilteredRows()

    if (this.ordering) {
      const { ascending, column } = this.ordering

      rows = [...rows].sort((first, second) => {
        const left = first[column] || ''
        const right = second[column] || ''

        return ascending
          ? String(left).localeCompare(String(right))
          : String(right).localeCompare(String(left))
      })
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount)
    }

    return { data: clone(rows), error: null }
  }

  executeInsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
    const insertedRows = rows.map((row) => ({
      id: row.id || `${this.table}-${this.database[this.table].length + 1}`,
      ...clone(row),
    }))

    this.database[this.table].push(...insertedRows)

    return { data: clone(insertedRows), error: null }
  }

  executeUpdate() {
    const updatedRows = []

    this.database[this.table] = this.database[this.table].map((row) => {
      if (!this.matches(row)) {
        return row
      }

      const updatedRow = { ...row, ...clone(this.payload) }

      updatedRows.push(updatedRow)
      return updatedRow
    })

    return { data: clone(updatedRows), error: null }
  }

  executeUpsert() {
    const row = clone(this.payload)
    const key = row.pegawai_id ? 'pegawai_id' : 'id'
    const existingIndex = this.database[this.table].findIndex((item) => item[key] === row[key])

    if (existingIndex >= 0) {
      this.database[this.table][existingIndex] = {
        ...this.database[this.table][existingIndex],
        ...row,
      }
      return { data: [clone(this.database[this.table][existingIndex])], error: null }
    }

    const nextRow = {
      id: row.id || `${this.table}-${this.database[this.table].length + 1}`,
      ...row,
    }

    this.database[this.table].push(nextRow)

    return { data: [clone(nextRow)], error: null }
  }

  getFilteredRows() {
    return this.database[this.table].filter((row) => this.matches(row))
  }

  matches(row) {
    return this.filters.every((filter) => filter(row))
  }
}

function createMockSupabase(initialData = {}) {
  const database = {
    absensi: clone(initialData.absensi || []),
    data_wajah: clone(initialData.data_wajah || []),
    pegawai: clone(initialData.pegawai || []),
    users: clone(initialData.users || []),
  }

  return {
    database,
    supabase: {
      from(table) {
        if (!database[table]) {
          database[table] = []
        }

        return new MockQuery(database, table)
      },
    },
  }
}

async function withFreshModule(modulePath, mocks, callback) {
  const resolvedModule = require.resolve(modulePath)
  const mockEntries = Object.entries(mocks).map(([mockPath, exports]) => [
    require.resolve(mockPath),
    exports,
  ])
  const trackedPaths = [resolvedModule, ...mockEntries.map(([mockPath]) => mockPath)]
  const originals = new Map(trackedPaths.map((moduleId) => [moduleId, require.cache[moduleId]]))

  delete require.cache[resolvedModule]
  mockEntries.forEach(([mockPath, exports]) => {
    require.cache[mockPath] = {
      exports,
      filename: mockPath,
      id: mockPath,
      loaded: true,
    }
  })

  try {
    return await callback(require(modulePath))
  } finally {
    delete require.cache[resolvedModule]
    trackedPaths.forEach((moduleId) => {
      const original = originals.get(moduleId)

      if (original) {
        require.cache[moduleId] = original
      } else {
        delete require.cache[moduleId]
      }
    })
  }
}

function makeDescriptor(value = 0.1) {
  return Array.from({ length: DESCRIPTOR_LENGTH }, () => value)
}

function getJakartaDateKey() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

function assertServiceError(error, statusCode, pattern) {
  assert.equal(error.statusCode, statusCode)
  assert.match(error.message, pattern)
  return true
}

test('pegawai service filters active and inactive employees', async () => {
  const { supabase } = createMockSupabase({
    pegawai: [
      { id: 'PGW-A', nama: 'Aktif Satu', jabatan: 'Kasir', telepon: '1', status: 'Aktif' },
      { id: 'PGW-N', nama: 'Nonaktif Satu', jabatan: 'Barista', telepon: '2', status: 'Nonaktif' },
    ],
  })

  await withFreshModule('../src/services/pegawaiService', {
    '../src/config': { env: testEnv, supabase },
  }, async (pegawaiService) => {
    const activeEmployees = await pegawaiService.getAll({ status: 'Aktif' })
    const inactiveEmployees = await pegawaiService.getAll({ status: 'Nonaktif' })

    assert.deepEqual(activeEmployees.map((employee) => employee.id), ['PGW-A'])
    assert.deepEqual(inactiveEmployees.map((employee) => employee.id), ['PGW-N'])
  })
})

test('laporan service includes Belum Absen for active employees without attendance', async () => {
  const { supabase } = createMockSupabase({
    absensi: [
      {
        id: 'ABS-1',
        jam_keluar: null,
        jam_masuk: '08:00:00',
        metode: 'Face Recognition',
        pegawai_id: 'PGW-A',
        status: 'Hadir',
        tanggal: '2026-05-19',
      },
    ],
    pegawai: [
      { id: 'PGW-A', nama: 'Aktif A', jabatan: 'Kasir', status: 'Aktif' },
      { id: 'PGW-B', nama: 'Aktif B', jabatan: 'Barista', status: 'Aktif' },
      { id: 'PGW-N', nama: 'Nonaktif', jabatan: 'Kurir', status: 'Nonaktif' },
    ],
  })

  await withFreshModule('../src/services/laporanService', {
    '../src/config': { env: testEnv, supabase },
  }, async (laporanService) => {
    const reports = await laporanService.getLaporan({ tanggal: '2026-05-19' })
    const missingReport = reports.find((report) => report.pegawaiId === 'PGW-B')

    assert.equal(reports.some((report) => report.pegawaiId === 'PGW-N'), false)
    assert.equal(missingReport.status, 'Belum Absen')
    assert.equal(missingReport.jamMasuk, null)
  })
})

test('laporan service supports date range and fills missing active attendance per date', async () => {
  const { supabase } = createMockSupabase({
    absensi: [
      {
        id: 'ABS-1',
        jam_keluar: '16:00:00',
        jam_masuk: '08:00:00',
        metode: 'Face Recognition',
        pegawai_id: 'PGW-A',
        status: 'Hadir',
        tanggal: '2026-05-19',
      },
    ],
    pegawai: [
      { id: 'PGW-A', nama: 'Aktif A', jabatan: 'Kasir', status: 'Aktif' },
      { id: 'PGW-B', nama: 'Aktif B', jabatan: 'Barista', status: 'Aktif' },
    ],
  })

  await withFreshModule('../src/services/laporanService', {
    '../src/config': { env: testEnv, supabase },
  }, async (laporanService) => {
    const reports = await laporanService.getLaporan({
      tanggal_mulai: '2026-05-18',
      tanggal_selesai: '2026-05-19',
    })
    const missingReports = reports.filter((report) => report.status === 'Belum Absen')

    assert.equal(reports.length, 4)
    assert.equal(missingReports.length, 3)
    assert.ok(missingReports.some((report) => (
      report.pegawaiId === 'PGW-A' && report.tanggal === '2026-05-18'
    )))
  })
})

test('face service rejects inactive employees for registration and verification', async () => {
  const { supabase } = createMockSupabase({
    data_wajah: [
      {
        face_encoding: JSON.stringify(makeDescriptor()),
        pegawai_id: 'PGW-N',
        status: 'Terdaftar',
      },
    ],
    pegawai: [
      { id: 'PGW-N', nama: 'Nonaktif', jabatan: 'Kurir', status: 'Nonaktif' },
    ],
  })

  await withFreshModule('../src/services/faceService', {
    '../src/config': { env: testEnv, supabase },
  }, async (faceService) => {
    await assert.rejects(
      () => faceService.registerFace({
        descriptor: makeDescriptor(),
        employeeId: 'PGW-N',
      }),
      (error) => assertServiceError(error, 403, /nonaktif/i),
    )

    await assert.rejects(
      () => faceService.verifyFace({
        descriptor: makeDescriptor(),
        employeeId: 'PGW-N',
      }),
      (error) => assertServiceError(error, 403, /nonaktif/i),
    )
  })
})

test('attendance service records check-in and check-out for active employee', async () => {
  const today = getJakartaDateKey()
  const { database, supabase } = createMockSupabase({
    pegawai: [
      { id: 'PGW-A', nama: 'Aktif', jabatan: 'Kasir', status: 'Aktif' },
    ],
  })
  const faceService = {
    verifyFace: async () => ({
      employeeId: 'PGW-A',
      matched: true,
    }),
  }

  await withFreshModule('../src/services/attendanceService', {
    '../src/config': { env: testEnv, supabase },
    '../src/services/faceService': faceService,
  }, async (attendanceService) => {
    const checkInRecord = await attendanceService.checkIn({
      descriptor: makeDescriptor(),
      employeeId: 'PGW-A',
    })
    const checkOutRecord = await attendanceService.checkOut({
      descriptor: makeDescriptor(),
      employeeId: 'PGW-A',
    })

    assert.equal(checkInRecord.employeeId, 'PGW-A')
    assert.equal(checkInRecord.date, today)
    assert.equal(checkInRecord.status, 'Hadir')
    assert.equal(checkOutRecord.employeeId, 'PGW-A')
    assert.ok(checkOutRecord.checkOut)
    assert.equal(database.absensi.length, 1)
  })
})

test('attendance service rejects inactive employees after face verification', async () => {
  const { supabase } = createMockSupabase({
    pegawai: [
      { id: 'PGW-N', nama: 'Nonaktif', jabatan: 'Kurir', status: 'Nonaktif' },
    ],
  })
  const faceService = {
    verifyFace: async () => ({
      employeeId: 'PGW-N',
      matched: true,
    }),
  }

  await withFreshModule('../src/services/attendanceService', {
    '../src/config': { env: testEnv, supabase },
    '../src/services/faceService': faceService,
  }, async (attendanceService) => {
    await assert.rejects(
      () => attendanceService.checkIn({
        descriptor: makeDescriptor(),
        employeeId: 'PGW-N',
      }),
      (error) => assertServiceError(error, 403, /nonaktif/i),
    )
  })
})
