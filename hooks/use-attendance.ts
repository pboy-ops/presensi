import { useState, useEffect, useMemo, useCallback } from 'react'

interface AttendanceStats {
  total: number
  present: number
  absent: number
  date: string
}

export function useAttendanceStats(date?: string) {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const queryDate = date || new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/attendance/stats?date=${queryDate}`)
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data statistik')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [date])

  return { stats, loading, error }
}

interface AttendanceRecord {
  id: string
  employeeId: string
  type: 'clock-in' | 'clock-out'
  timestamp: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  status: 'success' | 'failed'
}

interface AttendanceHookReturn {
  attendance: AttendanceRecord[]
  loading: boolean
  error: string | null
  clockIn: (employeeId: string, location: any) => Promise<void>
  clockOut: (employeeId: string, location: any) => Promise<void>
  fetchAttendance: (date?: string) => Promise<void>
  getAttendanceStatus: (employeeId: string) => Promise<any>
  todayAttendance: {
    clockIn?: string
    clockOut?: string
  } | null
}

export function useAttendance(): AttendanceHookReturn {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false) // Set initial loading ke false
  const [error, setError] = useState<string | null>(null)

  const fetchAttendance = useCallback(async (date?: string) => {
    try {
      setLoading(true)
      const url = date ? `/api/attendance?date=${date}` : '/api/attendance'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance')
      }
      
      const data = await response.json()
      setAttendance(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }, []) // useCallback tanpa dependencies

  // Panggil fetchAttendance saat komponen mount
  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const clockIn = async (employeeId: string, location: any) => {
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal melakukan check-in')
      }

      // Refresh data setelah check-in
      await fetchAttendance()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const clockOut = async (employeeId: string, location: any) => {
    try {
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal melakukan check-out')
      }

      // Refresh data setelah check-out
      await fetchAttendance()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const getAttendanceStatus = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/attendance/status?employeeId=${employeeId}`)
      
      if (!response.ok) {
        throw new Error('Gagal mengambil status absensi')
      }

      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const todayAttendance = useMemo(() => {
    if (!attendance.length) return null
    
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendance.filter(record => {
      // Add null check and use optional chaining
      if (!record?.timestamp) return false
      return record.timestamp.split('T')[0] === today
    })

    return {
      clockIn: todayRecords.find(r => r.type === 'clock-in')?.timestamp,
      clockOut: todayRecords.find(r => r.type === 'clock-out')?.timestamp
    }
  }, [attendance])

  return {
    attendance,
    loading,
    error,
    clockIn,
    clockOut,
    fetchAttendance,
    getAttendanceStatus,
    todayAttendance
  }
}