"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, MapPin, Shield, Clock, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { OFFICE_LOCATIONS } from "@/lib/office-locations"
import { useAttendance } from "@/hooks/use-attendance"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { attendance, loading: attendanceLoading, fetchAttendance } = useAttendance()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user) {
      router.push("/")
      return
    }
    fetchAttendance()
  }, [session, status, router, fetchAttendance])

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyRecords = attendance.filter((record) => {
      const recordDate = new Date(record.timestamp)
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear &&
        record.employeeId === session?.user?.id &&
        record.status === "success"
      )
    })

    const uniqueDays = new Set(monthlyRecords.map((record) => new Date(record.timestamp).toDateString())).size

    const completeDays = monthlyRecords.reduce((acc, record, index, arr) => {
      const date = new Date(record.timestamp).toDateString()
      const dayRecords = arr.filter((r) => new Date(r.timestamp).toDateString() === date)
      const hasClockIn = dayRecords.some((r) => r.type === "clock-in")
      const hasClockOut = dayRecords.some((r) => r.type === "clock-out")

      if (hasClockIn && hasClockOut && !acc.includes(date)) {
        acc.push(date)
      }
      return acc
    }, [] as string[]).length

    return { uniqueDays, completeDays }
  }

  if (status === "loading" || attendanceLoading) {
    return <div>Loading...</div>
  }

  const { uniqueDays, completeDays } = getMonthlyStats()

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      <div className="max-w-md mx-auto space-y-3 md:space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-base">Profil Pegawai</CardTitle>
                <CardDescription className="text-xs">Informasi akun dan statistik</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Informasi Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {(session?.user?.name || "")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <div className="font-semibold text-base">{session?.user?.name}</div>
                <div className="text-xs text-gray-500">{session?.user?.pangkat}</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {session?.user?.role === "admin" ? "Administrator" : "Pegawai"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Statistik Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{uniqueDays}</div>
                <div className="text-xs text-green-700">Hari Hadir</div>
                <div className="text-[10px] text-green-600 mt-1">
                  {completeDays > 0 ? Math.round((completeDays / uniqueDays) * 100) : 0}% kehadiran lengkap
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{completeDays}</div>
                <div className="text-xs text-blue-700">Hari Lengkap</div>
                <div className="text-[10px] text-blue-600 mt-1">
                  {uniqueDays - completeDays} hari tidak lengkap
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Efisiensi Kehadiran</span>
                <span className="font-medium text-green-600">
                  {completeDays > 0 ? Math.round((completeDays / uniqueDays) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Kehadiran Tidak Lengkap</span>
                <span className="font-medium text-orange-600">
                  {uniqueDays - completeDays} hari
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Fitur Keamanan Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Verifikasi GPS</span>
              </div>
              <Badge variant="default" className="text-xs">
                Aktif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Geofencing</span>
              </div>
              <Badge variant="default" className="text-xs">
                Aktif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Anti Fake GPS</span>
              </div>
              <Badge variant="default" className="text-xs">
                Aktif
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Deteksi Developer Mode</span>
              </div>
              <Badge variant="default" className="text-xs">
                Aktif
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Office Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lokasi Kantor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <div className="font-medium text-xs">{OFFICE_LOCATIONS[0].name}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                Lat: {OFFICE_LOCATIONS[0].latitude}, Long: {OFFICE_LOCATIONS[0].longitude}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informasi Aplikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Versi Aplikasi</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Platform</span>
              <span>Web App</span>
            </div>
            <div className="flex justify-between">
              <span>Terakhir Update</span>
              <span>Januari 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            <Clock className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <Button variant="outline" className="w-full" onClick={() => router.push("/history")}>
            Lihat Riwayat Lengkap
          </Button>
        </div>
      </div>
    </div>
  )
}
