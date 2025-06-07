"use client"

import React, { ReactNode } from "react"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isRoot = pathname === "/"

  return (
    <html lang="id">
      <head>
        <title>Absensi App</title>
        <meta name="description" content="Aplikasi absensi karyawan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Add any global meta tags or links here */}
      </head>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            {isRoot && (
              <>
                {/* Global header */}
                <header className="bg-gray-900 text-white p-4 shadow-md">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Absensi App</h1>
                    {/* Add global nav or user menu here if needed */}
                  </div>
                </header>
              </>
            )}

            {/* Main content */}
            <main className={isRoot ? "flex-grow max-w-7xl mx-auto w-full p-6" : ""}>
              {children}
            </main>

            {isRoot && (
              <>
                {/* Global footer */}
                <footer className="bg-gray-100 text-gray-600 p-4 text-center text-sm">
                  &copy; 2025 Absensi App. All rights reserved.
                </footer>
              </>
            )}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
