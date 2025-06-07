"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

interface AdminHeaderProps {
  onExportCSV: () => void
}

export default function AdminHeader({
   onExportCSV,
}: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/", redirect: true })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard Admin</h2>
        <p className="text-gray-600">Sistem Manajemen Absensi Pegawai</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={onExportCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-gray-100">
          <LogOut className="w-5 h-5 text-gray-700" />
        </Button>
      </div>
    </div>
  )
}
