"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AttendanceStats {
  total: number
  present: number
  late: number
  absent: number
  sick: number
  leave: number
  checkInCount: number
  checkOutCount: number
}

interface AttendanceStatsProps {
  stats: {
    total: number
    present: number
    late: number
    absent: number
    sick: number
    leave: number
    checkInCount: number
    checkOutCount: number
  } | null
  loading: boolean
  error: string | null
  selectedDate: string
  onDateChange: (date: string) => void
  onAbsentClick: () => void
}

export default function AttendanceStats({
  stats,
  loading,
  error,
  selectedDate,
  onDateChange,
  onAbsentClick
}: AttendanceStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Memuat data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistik Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Tidak ada data statistik</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statistik Kehadiran</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="date">Tanggal:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Check In</div>
                <div className="text-sm text-muted-foreground">
                  {stats.checkInCount} pegawai
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {((stats.checkInCount / stats.total) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Check Out</div>
                <div className="text-sm text-muted-foreground">
                  {stats.checkOutCount} pegawai
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {((stats.checkOutCount / stats.total) * 100).toFixed(1)}%
            </div>
          </div>

          <div 
            className="flex items-center justify-between p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onAbsentClick}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium">Tidak Hadir</div>
                <div className="text-sm text-muted-foreground">
                  {stats.absent} pegawai
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {((stats.absent / stats.total) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Total Pegawai</div>
                <div className="text-sm text-muted-foreground">
                  {stats.total} pegawai
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
