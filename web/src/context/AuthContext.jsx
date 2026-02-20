import { createContext, useState, useCallback, useEffect } from 'react'
import { getToken, setToken, removeToken } from '../utils/token'
import { loginUser, registerUser } from '../api/auth.api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setUser({ userId: payload.userId, email: payload.email, role: payload.role })
        } else {
          removeToken()
        }
      } catch {
        removeToken()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials)
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (credentials) => {
    const data = await registerUser(credentials)
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
