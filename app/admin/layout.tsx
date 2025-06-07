import React, { ReactNode } from "react"
import "../globals.css"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 antialiased flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Admin Panel</h1>
       </header>
      <main className="p-6 max-w-7xl mx-auto flex-grow">{children}</main>
      <footer className="bg-gray-100 text-gray-600 p-4 text-center text-sm mt-auto">
        &copy; 2025 Absensi App. All rights reserved.
      </footer>
    </div>
  )
}
