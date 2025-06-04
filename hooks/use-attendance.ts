import { useState, useEffect } from 'react'

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

export function useAttendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendance = async (date?: string) => {
    try {
      setLoading(true)
      const queryDate = date || new Date().toISOString().split('T')[0]
      
      // Tambahkan pengecekan role dari session
      const session = await fetch('/api/auth/session')
      const sessionData = await session.json()
      
      // URL berbeda untuk admin dan employee
      const url = sessionData?.user?.role === 'admin' 
        ? `/api/attendance/admin?date=${queryDate}`
        : `/api/attendance?date=${queryDate}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data absensi')
      }

      const data = await response.json()
      // Jika role admin, transform data ke format yang diharapkan halaman admin
      let transformedData = data
      if (sessionData?.user?.role === 'admin') {
        transformedData = data.map((item: any) => ({
          id: item.id,
          employeeId: item.employee.id,
          type: item.type || 'clock-in', // default type jika tidak ada
          timestamp: item.date.toString(),
          location: item.location || { latitude: 0, longitude: 0, address: '' },
          status: item.status || 'success'
        }))
      }
      setAttendance(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      console.error('Attendance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

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

  return {
    attendance,
    loading,
    error,
    clockIn,
    clockOut,
    fetchAttendance,
    getAttendanceStatus
  }
}