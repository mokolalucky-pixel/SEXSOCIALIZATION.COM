import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sexsocialization.auth.user'

function readStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawUser = window.localStorage.getItem(STORAGE_KEY)
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: ({ email }) => {
        const normalizedEmail = email.trim().toLowerCase()
        const nextUser = {
          email: normalizedEmail,
          displayName: normalizedEmail.split('@')[0],
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
      signup: ({ email, name }) => {
        const normalizedEmail = email.trim().toLowerCase()
        const nextUser = {
          email: normalizedEmail,
          displayName: name.trim(),
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
