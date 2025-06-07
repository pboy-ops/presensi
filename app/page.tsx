"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [nip, setNip] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Session check with loading state
  useEffect(() => {
    if (status === "loading") return // Wait for session to load
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.push("/admin")
      } else if (session.user.role === "employee") {
        router.push("/dashboard")
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        nip,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("NIP atau password salah")
        return
      }

      // Redirect handled by useEffect
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">Sistem Absensi</h2>
        <p className="text-center text-gray-600 mb-8">Masuk untuk melakukan absensi pegawai</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="nip" className="block text-sm font-medium text-gray-700 mb-1">NIP</Label>
            <Input
              id="nip"
              name="nip"
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
              placeholder="Masukkan NIP"
              disabled={isLoading}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md border-gray-300"
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
              disabled={isLoading}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md border-gray-300"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 rounded-lg transition"
            disabled={isLoading || status === "loading"}
          >
            {isLoading ? "Loading..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}
