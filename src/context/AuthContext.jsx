import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  loginRequest,
  meRequest,
  registerRequest,
  registerWithDiscordCodeRequest,
} from '../lib/authApi'

const TOKEN_STORAGE_KEY = 'zm_auth_token'
const USER_STORAGE_KEY = 'zm_auth_user'

const AuthContext = createContext(null)

const readStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(() => readStoredUser())
  const [initializing, setInitializing] = useState(true)

  const applySession = useCallback((nextToken, nextUser) => {
    const normalizedToken = String(nextToken || '')
    setToken(normalizedToken)
    setUser(nextUser || null)

    if (normalizedToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    applySession('', null)
  }, [applySession])

  const refreshCurrentUser = useCallback(async (existingToken) => {
    const payload = await meRequest(existingToken)
    applySession(existingToken, payload.user || null)
    return payload.user || null
  }, [applySession])

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      if (!token) {
        if (isMounted) setInitializing(false)
        return
      }

      try {
        await refreshCurrentUser(token)
      } catch {
        if (isMounted) {
          applySession('', null)
        }
      } finally {
        if (isMounted) setInitializing(false)
      }
    }

    void bootstrap()
    return () => {
      isMounted = false
    }
  }, [applySession, refreshCurrentUser, token])

  const login = useCallback(async ({ username, password }) => {
    const payload = await loginRequest({ username, password })
    applySession(payload.token, payload.user || null)
    return payload
  }, [applySession])

  const register = useCallback(async ({ username, password, discordId, discordTag }) => {
    const payload = await registerRequest({ username, password, discordId, discordTag })
    applySession(payload.token, payload.user || null)
    return payload
  }, [applySession])

  const registerWithDiscordCode = useCallback(async ({ code, state }) => {
    const payload = await registerWithDiscordCodeRequest({ code, state })
    applySession(payload.token, payload.user || null)
    return payload
  }, [applySession])

  const value = useMemo(() => ({
    token,
    user,
    initializing,
    isAuthenticated: Boolean(token),
    login,
    register,
    registerWithDiscordCode,
    logout,
    refreshCurrentUser: () => refreshCurrentUser(token),
  }), [initializing, login, logout, refreshCurrentUser, register, registerWithDiscordCode, token, user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
