/**
 * apiClient.js — centralized HTTP client.
 *
 * Provides a thin wrapper around fetch() with:
 *   - Base URL resolution
 *   - JSON body handling
 *   - Auth header injection
 *   - Standardized error handling
 *
 * ──────────────────────────────────────────────
 * When switching to a real backend, no changes
 * are needed here — just set VITE_API_URL.
 * ──────────────────────────────────────────────
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050'

/**
 * Build a full API URL from a path segment.
 *   buildUrl('/api/auth/login') → 'http://localhost:5050/api/auth/login'
 */
function buildUrl(path) {
  return `${API_BASE_URL}${path}`
}

/**
 * Read the current auth token from localStorage.
 * Returns the token string or null.
 */
function getStoredToken() {
  try {
    const raw = localStorage.getItem('absensi_auth')

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)

    return parsed?.token || null
  } catch {
    return null
  }
}

/**
 * Build Authorization header object.
 *   getAuthHeaders()           → { Authorization: 'Bearer mock_admin_...' }
 *   getAuthHeaders(customToken) → { Authorization: 'Bearer customToken' }
 *
 * Returns an empty object if no token is available.
 */
function getAuthHeaders(token) {
  const resolved = token || getStoredToken()

  if (!resolved) {
    return {}
  }

  return { Authorization: `Bearer ${resolved}` }
}

/**
 * Standard error class for API responses.
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Core fetch wrapper.
 *
 * Usage:
 *   const data = await apiFetch('/api/employees', { method: 'GET' })
 *   const data = await apiFetch('/api/auth/login', {
 *     method: 'POST',
 *     body: { username, password },
 *   })
 *
 * Options:
 *   - method      : HTTP method (default 'GET')
 *   - body        : request body (will be JSON-stringified)
 *   - headers     : additional headers to merge
 *   - auth        : if true (default), includes Authorization header
 *   - ...rest     : forwarded to fetch()
 */
async function apiFetch(path, options = {}) {
  const {
    body,
    headers = {},
    auth = true,
    ...fetchOptions
  } = options

  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(auth ? getAuthHeaders() : {}),
    ...headers,
  }

  const config = {
    ...fetchOptions,
    headers: mergedHeaders,
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(buildUrl(path), config)
  } catch (err) {
    throw new ApiError(
      'Tidak bisa terhubung ke server API. Pastikan backend berjalan dan URL API benar.',
      0,
      { cause: err.message },
    )
  }

  // Try to parse JSON regardless of status (API may return error details)
  let data = null

  try {
    data = await response.json()
  } catch {
    // Response body is not JSON — that's fine for 204 etc.
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Request gagal (${response.status})`

    throw new ApiError(message, response.status, data)
  }

  return data
}

/**
 * Health check — simple GET to verify API is running.
 */
async function getHealthStatus() {
  return apiFetch('/api/health', { auth: false })
}

export {
  API_BASE_URL,
  ApiError,
  apiFetch,
  buildUrl,
  getAuthHeaders,
  getHealthStatus,
  getStoredToken,
}
