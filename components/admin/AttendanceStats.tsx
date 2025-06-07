"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading"

interface AttendanceStatsProps {
  stats: {
    total: number
    present: number
    absent: number
  } | null
  loading: boolean
  error: string | null
  selectedDate: string
  onDateChange: (date: string) => void
}

export default function AttendanceStats({
  stats,
  loading,
  error,
  selectedDate,
  onDateChange,
}: AttendanceStatsProps) {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Statistik Kehadiran</CardTitle>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-44 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-extrabold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Pegawai</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Hadir</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">Tidak Hadir</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
