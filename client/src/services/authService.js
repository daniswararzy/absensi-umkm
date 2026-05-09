/**
 * authService.js — authentication service layer.
 *
 * This module encapsulates ALL auth-related operations:
 *   - login / logout (network calls)
 *   - session persistence (localStorage)
 *   - auth header helpers
 *
 * ──────────────────────────────────────────────
 * MOCK vs REAL API
 *
 * Currently uses mock implementations that validate
 * against dummyData. To switch to a real backend:
 *
 *   1. Replace login()  → call apiFetch('/api/auth/login', ...)
 *   2. Replace logout() → call apiFetch('/api/auth/logout', ...)
 *   3. Replace validateSession() → call apiFetch('/api/auth/me', ...)
 *
 * The function signatures stay the same, so AuthContext
 * and the rest of the app require zero changes.
 * ──────────────────────────────────────────────
 */

import { loginAccounts } from '../data/dummyData'
// import { apiFetch } from './apiClient'  // ← uncomment for real API

// ─── Session Storage ─────────────────────────

const STORAGE_KEY = 'absensi_auth'

/**
 * Read the stored session from localStorage.
 * @returns {{ user: object, token: string } | null}
 */
function getCurrentSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)

    if (!parsed || !parsed.user || !parsed.token) {
      return null
    }

    return { user: parsed.user, token: parsed.token }
  } catch {
    return null
  }
}

/**
 * Persist session data to localStorage.
 * @param {{ user: object, token: string }} session
 */
function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

/**
 * Remove session data from localStorage.
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Login ───────────────────────────────────

/**
 * Authenticate a user with username and password.
 *
 * On success returns { user, token, redirectTo }.
 * On failure throws an Error with a user-facing message.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: object, token: string, redirectTo: string }>}
 *
 * ⚠️ MOCK — replace body with:
 *   const data = await apiFetch('/api/auth/login', {
 *     method: 'POST',
 *     body: { username, password },
 *     auth: false,
 *   })
 *   return { user: data.user, token: data.token, redirectTo: data.redirectTo }
 */
async function login(username, password) {
  // --- input validation (kept for both mock and real) ---
  if (!username || !password) {
    throw new Error('Silakan isi username dan password')
  }

  // --- MOCK START ---
  await simulateDelay()

  const account = loginAccounts.find(
    (item) => item.username === username && item.password === password,
  )

  if (!account) {
    throw new Error('Username atau password salah')
  }

  const token = `mock_${account.role}_${Date.now()}`
  const user = {
    username: account.username,
    role: account.role,
    label: account.label,
  }

  return { user, token, redirectTo: account.redirectTo }
  // --- MOCK END ---
}

// ─── Logout ──────────────────────────────────

/**
 * Log out the current user.
 *
 * Clears the local session. When connected to a real backend,
 * this should also call an API endpoint to invalidate the token.
 *
 * ⚠️ MOCK — add backend call:
 *   await apiFetch('/api/auth/logout', { method: 'POST' })
 */
async function logout() {
  clearSession()
  // --- REAL API: await apiFetch('/api/auth/logout', { method: 'POST' }) ---
}

// ─── Session Validation ──────────────────────

/**
 * Validate the current stored session against the backend.
 *
 * Returns the validated session { user, token } if valid,
 * or null if the session is expired / invalid.
 *
 * ⚠️ MOCK — currently just trusts localStorage.
 * Replace with:
 *   const data = await apiFetch('/api/auth/me')
 *   return { user: data.user, token: getCurrentSession().token }
 *
 * @returns {Promise<{ user: object, token: string } | null>}
 */
async function validateSession() {
  const session = getCurrentSession()

  if (!session) {
    return null
  }

  // --- MOCK: trust localStorage without server validation ---
  return session

  // --- REAL API ---
  // try {
  //   const data = await apiFetch('/api/auth/me')
  //   return { user: data.user, token: session.token }
  // } catch {
  //   clearSession()
  //   return null
  // }
}

// ─── Helpers ─────────────────────────────────

/**
 * Simulate network latency for mock operations (200–400ms).
 * Remove when using a real API.
 */
function simulateDelay() {
  const ms = 200 + Math.random() * 200

  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Public API ──────────────────────────────

export {
  clearSession,
  getCurrentSession,
  login,
  logout,
  saveSession,
  validateSession,
}
