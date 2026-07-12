import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/apiClient.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    apiRequest('/api/auth/session')
      .then(({ user: sessionUser }) => {
        if (isMounted) {
          setUser(sessionUser)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login: async ({ email, password }) => {
        const { user: nextUser } = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setUser(nextUser)
        return nextUser
      },
      logout: async () => {
        await apiRequest('/api/auth/logout', { method: 'POST' })
        setUser(null)
      },
      signup: async ({ email, name, password }) => {
        const { user: nextUser } = await apiRequest('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, name, password }),
        })
        setUser(nextUser)
        return nextUser
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
