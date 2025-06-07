import React, { ReactNode } from "react"
import Link from "next/link"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Sistem Absensi</h1>
          <nav className="space-x-4">
            <Link href="/dashboard" className="hover:underline">
              Absensi
            </Link>
            <Link href="/history" className="hover:underline">
              Riwayat
            </Link>
            <Link href="/profile" className="hover:underline">
              Profil
            </Link>
          </nav>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}