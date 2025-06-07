import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  nip: string
  name: string
  role: 'admin' | 'employee'
  status: 'active' | 'inactive'
  pangkat: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (nip: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nip, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = useCallback(async () => {
    try {
      // Clear local state
      setUser(null)
      
      // Clear any stored tokens/session
      localStorage.removeItem('user')
      sessionStorage.clear()
      
      return true
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return {
    user,
    handleLogin,
    loading,
    error,
    logout
  }
}