/**
 * supabase.js — Supabase client singleton.
 *
 * Creates a single Supabase client using the service role key.
 * The service role key bypasses RLS (Row Level Security), so
 * this client should ONLY be used server-side — never expose
 * it to the frontend.
 *
 * Usage in services:
 *   const { supabase } = require('../config')
 *
 *   const { data, error } = await supabase
 *     .from('employees')
 *     .select('*')
 *
 * If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set,
 * the client is created as null and a warning is logged.
 * This allows the server to start without Supabase for
 * local development that doesn't need a database.
 */

const { createClient } = require('@supabase/supabase-js')
const env = require('./env')

let supabase = null

function isPlaceholderConfig() {
  return env.supabase.url.includes('your-project-id')
    || env.supabase.serviceRoleKey.includes('your-service-role-key')
}

const hasRequiredEnv = Boolean(env.supabase.url && env.supabase.serviceRoleKey)
const hasPlaceholderEnv = isPlaceholderConfig()

const supabaseConfig = {
  env: hasRequiredEnv,
  placeholder: hasPlaceholderEnv,
  configured: hasRequiredEnv && !hasPlaceholderEnv,
  active: false,
}

if (supabaseConfig.configured) {
  supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  supabaseConfig.active = true
} else {
  console.warn(
    '[WARN] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum valid. '
    + 'Supabase client tidak aktif. Set variabel di .env untuk mengaktifkan.',
  )
}

module.exports = { supabase, supabaseConfig }
