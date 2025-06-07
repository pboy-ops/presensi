"use client"

import { useState, useEffect } from "react"

interface GroupedAttendance {
  date: string;
  clockIn?: any;
  clockOut?: any;
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAttendance } from "@/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const isValidTimestamp = (timestamp: string | Date | undefined): boolean => {
  if (!timestamp) return false
  const date = new Date(timestamp)
  return !isNaN(date.getTime())
}

export default function HistoryPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { attendance, loading, error, fetchAttendance } = useAttendance()

  useEffect(() => {
    fetchAttendance()
  }, [])

  // Group attendance records by date
  const groupedAttendance = attendance.reduce((groups: GroupedAttendance[], record) => {
    if (!record?.timestamp) return groups

    try {
      const date = new Date(record.timestamp).toISOString().split('T')[0]
      
      const existingGroup = groups.find(group => group.date === date)
      if (existingGroup) {
        if (record.type === "clock-in") {
          existingGroup.clockIn = record
        } else {
          existingGroup.clockOut = record
        }
      } else {
        groups.push({
          date,
          [record.type === "clock-in" ? "clockIn" : "clockOut"]: record
        })
      }
    } catch (error) {
      console.error('Error processing record:', record, error)
    }
    
    return groups
  }, [])

  // Sort groups by date (newest first)
  const sortedGroups = [...groupedAttendance].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Formatting helper
  const formatDateTime = (timestamp: string, type: 'date' | 'time') => {
    try {
      const date = new Date(timestamp)
      if (type === 'date') {
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error(`Error formatting ${type}:`, error)
      return type === 'date' ? 'Tanggal tidak valid' : 'Waktu tidak valid'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white p-3 md:p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-blue-100"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-lg md:text-xl font-bold">Riwayat Absensi</h1>
          </div>
        </div>
      </header>

      <main className="p-3 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Riwayat Absensi</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              {loading ? (
                <div className="text-center py-6 md:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : !attendance || attendance.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <Clock className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3" />
                  <div className="text-sm md:text-base text-gray-500">Belum ada data absensi</div>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {sortedGroups.map((group) => (
                    <div 
                      key={group.date}
                      className="p-3 md:p-4 bg-gray-50 rounded-lg space-y-2 md:space-y-3"
                    >
                      <div className="font-medium text-base md:text-lg border-b pb-2">
                        {formatDateTime(group.date, 'date')}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {/* Clock In */}
                        <div className="space-y-1">
                          <div className="text-xs md:text-sm font-medium text-gray-600">Jam Masuk</div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                            <span className="text-sm md:text-base">
                              {group.clockIn ? formatDateTime(group.clockIn.timestamp, 'time') : '-'}
                            </span>
                          </div>
                          {group.clockIn?.location && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs">{group.clockIn.location.address || "Lokasi tidak tersedia"}</span>
                            </div>
                          )}
                        </div>

                        {/* Clock Out */}
                        <div className="space-y-1">
                          <div className="text-xs md:text-sm font-medium text-gray-600">Jam Keluar</div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                            <span className="text-sm md:text-base">
                              {group.clockOut ? formatDateTime(group.clockOut.timestamp, 'time') : '-'}
                            </span>
                          </div>
                          {group.clockOut?.location && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs">{group.clockOut.location.address || "Lokasi tidak tersedia"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

