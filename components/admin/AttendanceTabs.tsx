"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"

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
  status: "success" | "failed"
}

interface Employee {
  id: string
  name: string
}

interface AttendanceTabsProps {
  attendance: AttendanceRecord[]
  filteredEmployees: Employee[]
  selectedDate: string
  attendanceLoading: boolean
  formatTime: (timestamp: string) => string
}

export default function AttendanceTabs({
  attendance,
  filteredEmployees,
  selectedDate,
  attendanceLoading,
  formatTime,
}: AttendanceTabsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Riwayat Absensi {selectedDate === new Date().toISOString().split("T")[0] ? "Hari Ini" : "Tanggal Terpilih"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendanceLoading ? (
            <LoadingSpinner />
          ) : (
            filteredEmployees.map((employee) => {
              const dayRecords = attendance.filter(
                (record) =>
                  record.employeeId === employee.id &&
                  new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString()
              )
              // Group clock-in and clock-out records separately
              const clockIns = dayRecords.filter(r => r.type === "clock-in")
              const clockOuts = dayRecords.filter(r => r.type === "clock-out")

              return (
                <div key={employee.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="font-medium text-sm">{employee.name}</div>
                  <div className="space-y-1">
                    {clockIns.length === 0 && (
                      <div className="text-xs text-red-500">Tidak Check In</div>
                    )}
                    {clockIns.map((ci) => (
                      <div key={ci.id} className="text-xs text-gray-500">
                        Clock In: {formatTime(ci.timestamp)}
                      </div>
                    ))}
                    {clockOuts.length === 0 && (
                      <div className="text-xs text-red-500">Tidak Check Out</div>
                    )}
                    {clockOuts.map((co) => (
                      <div key={co.id} className="text-xs text-gray-500">
                        Clock Out: {formatTime(co.timestamp)}
                      </div>
                    ))}
                  </div>
                  <Badge variant={dayRecords.every(r => r.status === "success") ? "default" : "destructive"} className="text-xs">
                    {dayRecords.every(r => r.status === "success") ? "Berhasil" : "Gagal"}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
