/**
 * healthController — health check endpoint handlers.
 */

const { supabase, supabaseConfig } = require('../config')

async function checkSupabaseDatabase() {
  const { error } = await supabase
    .from('pegawai')
    .select('id', { head: true })
    .limit(1)

  if (error) {
    throw new Error(`database check failed: ${error.message}`)
  }
}

async function getHealth(req, res) {
  let supabaseStatus = 'not_configured'
  const supabaseChecks = {
    env: supabaseConfig.env,
    configured: supabaseConfig.configured,
    client: supabaseConfig.active,
    database: false,
  }

  if (supabase) {
    try {
      await checkSupabaseDatabase()
      supabaseChecks.database = true
      supabaseStatus = 'active'
    } catch (err) {
      supabaseStatus = `error: ${err.message}`
    }
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'absensi-umkm-api',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      supabase: supabaseStatus,
      supabaseChecks,
    },
  })
}

module.exports = { getHealth }
