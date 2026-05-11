/**
 * authService.js — authentication service layer.
 *
 * This module encapsulates ALL auth-related operations:
 *   - login / logout (network calls)
 *   - session persistence (localStorage)
 *   - auth header helpers
 *
 * ──────────────────────────────────────────────
 * REAL API — connected to POST /api/auth/login
 * and GET /api/auth/me on the Express backend.
 *
 * The function signatures are unchanged from mock,
 * so AuthContext, LoginPage, and the rest of the app
 * require zero changes.
 * ──────────────────────────────────────────────
 */

import { apiFetch } from './apiClient'

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
 * Sends a POST request to /api/auth/login.
 * On success returns { user, token, redirectTo }.
 * On failure throws an Error with a user-facing message.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: object, token: string, redirectTo: string }>}
 */
async function login(username, password) {
  if (!username || !password) {
    throw new Error('Silakan isi username dan password')
  }

  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  })

  return {
    user: response.data.user,
    token: response.data.token,
    redirectTo: response.data.redirectTo,
  }
}

// ─── Logout ──────────────────────────────────

/**
 * Log out the current user.
 *
 * Clears the local session. Backend does not have a
 * logout endpoint yet (JWT is stateless), so we only
 * clear client-side state.
 */
async function logout() {
  clearSession()
}

// ─── Session Validation ──────────────────────

/**
 * Validate the current stored session against the backend.
 *
 * Sends GET /api/auth/me with the stored token.
 * If the token is valid, refreshes the user data from the server.
 * If invalid or expired, clears the session and returns null.
 *
 * @returns {Promise<{ user: object, token: string } | null>}
 */
async function validateSession() {
  const session = getCurrentSession()

  if (!session) {
    return null
  }

  try {
    const response = await apiFetch('/api/auth/me')

    // Refresh user data from server, keep existing token
    return { user: response.data.user, token: session.token }
  } catch {
    // Token expired or invalid — clear and return null
    clearSession()

    return null
  }
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
