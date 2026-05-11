/**
 * authService.js — authentication business logic.
 *
 * Handles user lookup and password verification via Supabase.
 * Does NOT generate tokens — that's the controller's job.
 */

const bcrypt = require('bcrypt')
const { supabase } = require('../config')

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
    const err = new Error('Username dan password wajib diisi')
    err.statusCode = 400
    throw err
  }

  if (!supabase) {
    const err = new Error('Database belum dikonfigurasi')
    err.statusCode = 503
    throw err
  }

  // Lookup user
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password, role, label')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') {
    const err = new Error('Database auth belum bisa dihubungi')
    err.statusCode = 503
    throw err
  }

  if (!user) {
    const err = new Error('Username atau password salah')
    err.statusCode = 401
    throw err
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    const err = new Error('Username atau password salah')
    err.statusCode = 401
    throw err
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
