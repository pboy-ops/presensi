"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useAttendance } from "@/hooks/use-attendance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTimeInfo } from "@/components/attendance-time-info"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, LogOut, AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { OFFICE_LOCATIONS } from "@/lib/office-locations"

interface AttendanceRecord {
  id: string
  employeeId: string
  type: "clock-in" | "clock-out"
  timestamp: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  officeId: string
  officeName: string
  status: "success" | "failed"
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const { 
    attendance, 
    loading: attendanceLoading, 
    error: attendanceError, 
    clockIn, 
    clockOut,
    getAttendanceStatus,
    todayAttendance
  } = useAttendance()
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [locationError, setLocationError] = useState("")
  const [isInOfficeArea, setIsInOfficeArea] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Debug session
  useEffect(() => {
    console.log('Session Status:', status)
    console.log('Session Data:', session)
    console.log('User Data:', session?.user)
  }, [session, status])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      console.log('Session is ready')
      setIsSessionReady(true)
    } else {
      console.log('Session is not ready yet')
      setIsSessionReady(false)
    }
  }, [status, session])

  // Check user authentication
  useEffect(() => {
    if (status === "loading") return
    if (!session?.user) {
      router.push("/")
    }
  }, [session, status, router])

  // Get attendance status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!session?.user?.id) return
      try {
        const status = await getAttendanceStatus(session.user.id)
        setAttendanceStatus(status)
      } catch (error) {
        console.error('Error fetching attendance status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser ini")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position)
        checkIfInOfficeArea(position)
        setLocationError("")
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Akses lokasi ditolak. Mohon izinkan akses lokasi untuk melakukan absensi.")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Informasi lokasi tidak tersedia.")
            break
          case error.TIMEOUT:
            setLocationError("Permintaan lokasi timeout.")
            break
          default:
            setLocationError("Terjadi kesalahan saat mengambil lokasi.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const checkIfInOfficeArea = (position: GeolocationPosition) => {
    const isInAnyOffice = OFFICE_LOCATIONS.some(office => {
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        office.latitude,
        office.longitude
      )
      return distance <= office.radius
    })

    setIsInOfficeArea(isInAnyOffice)
  }

  const getNearestOffice = (position: GeolocationPosition) => {
    let nearest = {
      office: OFFICE_LOCATIONS[0],
      distance: Infinity,
    }

    OFFICE_LOCATIONS.forEach(office => {
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        office.latitude,
        office.longitude
      )
      if (distance < nearest.distance) {
        nearest = { office, distance }
      }
    })

    return nearest
  }

  const handleAttendance = async (type: "clock-in" | "clock-out") => {
    if (!location || !session?.user) {
      setLocationError("Lokasi belum tersedia atau user belum login")
      return
    }

    if (!isInOfficeArea) {
      setLocationError("Anda berada di luar area kantor")
      return
    }

    setIsLoading(true)

    try {
      await (type === "clock-in" ? clockIn : clockOut)(session.user.id, {})
      const status = await getAttendanceStatus(session.user.id)
      setAttendanceStatus(status)
      setLocationError("")
    } catch (error: any) {
      console.error(`Gagal melakukan ${type}:`, error)
      setLocationError(error.message || `Gagal melakukan ${type === "clock-in" ? "Check In" : "Check Out"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: "/" 
      })
      router.replace("/")
    } catch (error) {
      console.error("Logout error:", error)
      setLocationError("Gagal logout. Silakan coba lagi.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  if (status === "authenticated" && (attendanceLoading || !attendanceStatus)) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardHeader className="pb-4 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-700">Selamat Datang</h2>
            <p className="text-lg md:text-xl text-gray-600">{session?.user?.name}</p>
            {isSessionReady && session?.user?.nip ? (
              <p className="text-sm text-gray-500">{session.user.nip}</p>
            ) : (
              <p className="text-sm text-gray-500">Loading...</p>
            )}
          </div>
          <div className="absolute right-2 top-2 md:right-4 md:top-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              disabled={isLoggingOut || status === "loading"}
              className="hover:bg-gray-100"
            >
              {isLoggingOut ? (
                <LoadingSpinner className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <LogOut className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            Status Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {locationError ? (
            <Alert variant="destructive" className="rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          ) : location ? (
            <div className="space-y-2">
              <div
                className={`flex items-center gap-2 p-3 md:p-4 rounded-lg ${
                  isInOfficeArea ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {isInOfficeArea ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />}
                <span className="text-xs md:text-sm font-semibold">
                  {isInOfficeArea ? `Di dalam area ${getNearestOffice(location).office.name}` : "Di luar area kantor"}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                Lat: {location.coords.latitude.toFixed(6)}, Lng: {location.coords.longitude.toFixed(6)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Mengambil lokasi...</div>
          )}

          <Button variant="outline" size="sm" onClick={getCurrentLocation} className="w-full rounded-md text-sm">
            Refresh Lokasi
          </Button>
        </CardContent>
      </Card>

      {attendanceStatus && (
        <AttendanceTimeInfo
          canCheckIn={attendanceStatus.canCheckIn}
          canCheckOut={attendanceStatus.canCheckOut}
          config={attendanceStatus.config}
          currentTime={attendanceStatus.currentTime}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            Absensi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-500">{formatDate(new Date().toISOString())}</div>
          </div>

          {attendanceStatus?.canCheckIn && !attendanceStatus?.attendance?.checkIn && (
            <Button
              onClick={() => handleAttendance("clock-in")}
              disabled={!isInOfficeArea || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-sm"
            >
              {isLoading ? "Memproses..." : "Check In"}
            </Button>
          )}

          {attendanceStatus?.canCheckOut && !attendanceStatus?.attendance?.checkOut && (
            <Button
              onClick={() => handleAttendance("clock-out")}
              disabled={!isInOfficeArea || isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-sm"
            >
              {isLoading ? "Memproses..." : "Check Out"}
            </Button>
          )}

          {attendanceStatus?.attendance?.checkOut && (
            <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
              <div className="text-xs md:text-sm font-medium text-blue-700">Absensi hari ini sudah selesai</div>
            </div>
          )}

          {!attendanceStatus?.canCheckIn && !attendanceStatus?.canCheckOut && !attendanceStatus?.attendance?.checkOut && (
            <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
              <div className="text-xs md:text-sm font-medium text-yellow-700">
                Absensi hanya dapat dilakukan pada jam yang ditentukan
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}