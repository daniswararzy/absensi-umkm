/**
 * authService.js — authentication business logic.
 *
 * Handles user lookup and password verification via Supabase.
 * Does NOT generate tokens — that's the controller's job.
 */

const bcrypt = require('bcrypt')
const { supabase } = require('../config')

function createAuthError(message, statusCode, cause) {
  const err = new Error(message)
  err.statusCode = statusCode

  if (cause) {
    err.cause = cause
  }

  return err
}

function logAuthDatabaseError(error) {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  console.error('[AUTH_DB_ERROR]', {
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    message: error?.message,
  })
}

/**
 * Find a user by username and verify password.
 *
 * @param {string} username
 * @param {string} password — plaintext, will be compared against bcrypt hash
 * @returns {Promise<{ id, username, role, label }>}
 * @throws {Error} with user-facing message
 */
async function verifyCredentials(username, password) {
  if (!username || !password) {
    throw createAuthError('Username dan password wajib diisi', 400)
  }

  if (!supabase) {
    throw createAuthError('Database belum dikonfigurasi', 503)
  }

  // Lookup user
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password, role, label')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') {
    logAuthDatabaseError(error)
    throw createAuthError(
      'Login admin belum dapat diproses karena koneksi database auth bermasalah. Periksa konfigurasi Supabase dan tabel users.',
      503,
      error,
    )
  }

  if (!user) {
    throw createAuthError('Username atau password salah', 401)
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw createAuthError('Username atau password salah', 401)
  }

  if (user.role !== 'admin') {
    throw createAuthError('Login hanya tersedia untuk admin', 403)
  }

  // Return user without password hash
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    label: user.label,
  }
}

/**
 * Find a user by ID (for token validation).
 *
 * @param {string} userId — UUID
 * @returns {Promise<{ id, username, role, label } | null>}
 */
async function getUserById(userId) {
  if (!supabase) return null

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, role, label')
    .eq('id', userId)
    .single()

  if (error || !user) return null

  return user
}

module.exports = { getUserById, verifyCredentials }
