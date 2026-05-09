import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app to provide auth state and actions.
 *
 * All auth logic is delegated to authService. This component
 * only manages React state and exposes it via context.
 *
 * State exposed via context:
 *   - user            : { username, role, label } | null
 *   - token           : string | null
 *   - isAuthenticated : boolean
 *   - isLoading       : boolean (true while restoring session on mount)
 *
 * Actions exposed via context:
 *   - login(username, password) → Promise<{ redirectTo }>
 *   - logout()
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore and validate session on first mount
  useEffect(() => {
    async function restoreSession() {
      const session = await authService.validateSession()

      if (session) {
        setUser(session.user)
        setToken(session.token)
      }

      setIsLoading(false)
    }

    restoreSession()
  }, [])

  const login = useCallback(async (username, password) => {
    const result = await authService.login(username, password)

    const session = { user: result.user, token: result.token }

    setUser(result.user)
    setToken(result.token)
    authService.saveSession(session)

    return { redirectTo: result.redirectTo }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = Boolean(user && token)

  const value = useMemo(
    () => ({ user, token, isAuthenticated, isLoading, login, logout }),
    [user, token, isAuthenticated, isLoading, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — convenience hook to consume the auth context.
 * Must be used within an AuthProvider.
 */
function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }

  return context
}

export { AuthContext, AuthProvider, useAuth }
