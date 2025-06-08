"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useEmployees } from "@/hooks/use-employees"
import { LoadingSpinner } from "@/components/ui/loading"
import { useAuth } from "@/hooks/use-auth"
import AdminHeader from "@/components/admin/AdminHeader"
import EmployeeList from "@/components/admin/EmployeeList"
import EmployeeDialog from "@/components/admin/EmployeeDialog"
import { toast } from "@/components/ui/use-toast"
import { Users, UserCheck, UserX, UserCog, Clock, Calendar, AlertCircle } from "lucide-react"
import AttendanceStats from "@/components/admin/AttendanceStats"

// Interfaces
interface Attendance {
  id: string
  date: Date
  checkIn: Date | null
  checkOut: Date | null
  status: "present" | "absent" 
  location?: any
  notes?: string
  employeeId: string
  createdAt: Date
  updatedAt: Date
}

interface Employee {
  id: string
  name: string
  role: "admin" | "employee"
  nip: string
  pangkat: string
  status: "active" | "inactive"
  attendance?: Attendance[]
}

interface EmployeeFormData {
  name: string
  nip: string
  role: "admin" | "employee"
  pangkat: string
  status: "active" | "inactive"
  password?: string
}

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

export default function AdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAbsentDialog, setShowAbsentDialog] = useState(false)
  const [absentEmployees, setAbsentEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { employees, loading: employeesLoading, error: employeesError, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

  // Fetch attendance stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/attendance/stats?date=${selectedDate}`)
        if (!response.ok) {
          throw new Error('Gagal mengambil data statistik')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedDate])

  // Fetch attendance records for selected date
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const response = await fetch(`/api/attendance/admin?date=${selectedDate}`)
        if (!response.ok) {
          throw new Error('Gagal mengambil data kehadiran')
        }
        const data = await response.json()
        setAttendanceRecords(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchAttendanceRecords()
  }, [selectedDate])

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    } else if (user?.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/", redirect: true })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Loading state
  if (authLoading || employeesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (employeesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{employeesError}</div>
      </div>
    )
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const handleExport = () => {
    if (!employees || !attendanceRecords) return

    const headers = "Nama,NIP,Jabatan,Tanggal,Waktu CheckIn,Waktu CheckOut\n"
    const rows = attendanceRecords.map(record => {
      const emp = employees.find(e => e.id === record.employeeId)
      if (!emp) return null
      const dateStr = new Date(record.date).toLocaleDateString('id-ID')
      const checkInStr = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID') : ''
      const checkOutStr = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID') : ''
      return `${emp.name},${emp.nip},${emp.pangkat},${dateStr},${checkInStr},${checkOutStr}`
    }).filter(row => row !== null).join("\n")

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `daftar_absensi_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenDialog = (employee: Employee | null) => {
    setEditingEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setEditingEmployee(null)
    setIsDialogOpen(false)
  }

  const handleSubmitEmployee = async (idOrFormData: string | EmployeeFormData, formData?: Partial<EmployeeFormData>) => {
    try {
      if (typeof idOrFormData === 'string') {
        // Ini adalah update employee
        if (!formData) {
          throw new Error('Data yang akan diupdate tidak ditemukan')
        }
        await updateEmployee(idOrFormData, formData)
      } else {
        // Ini adalah add employee baru
        await addEmployee(idOrFormData)
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Error in handleSubmitEmployee:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk menampilkan dialog pegawai yang tidak hadir
  const handleShowAbsentEmployees = () => {
    // Filter pegawai yang tidak hadir berdasarkan attendanceRecords yang sudah difilter per tanggal
    const absent = employees?.filter((emp: Employee) => {
      if (emp.status !== 'active') return false

      // Cek apakah pegawai memiliki record kehadiran hari ini di attendanceRecords
      const hasAttendanceToday = attendanceRecords.some((record: Attendance) => record.employeeId === emp.id)

      // Jika tidak memiliki record kehadiran sama sekali hari ini, berarti tidak hadir
      return !hasAttendanceToday
    }) || []

    setAbsentEmployees(absent)
    setShowAbsentDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardHeader className="pb-4">
            <AdminHeader onExportCSV={handleExport} />
          </CardHeader>
        </Card>

        {/* Statistik Kehadiran */}
        <AttendanceStats
          stats={stats}
          loading={loading}
          error={error}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onAbsentClick={handleShowAbsentEmployees}
        />

        {/* Employee List */}
        <EmployeeList
          employees={employees || []}
          loading={employeesLoading}
          error={employeesError}
          onAddEmployee={handleSubmitEmployee}
          onEditEmployee={handleSubmitEmployee}
          onDeleteEmployee={deleteEmployee}
          page={page}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onOpenDialog={handleOpenDialog}
        />

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <EmployeeDialog
            employee={editingEmployee}
            onSave={handleSubmitEmployee}
            open={isDialogOpen}
            onOpenChange={handleCloseDialog}
          />
        </Dialog>

        {/* Dialog Daftar Pegawai Tidak Hadir */}
        <Dialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Daftar Pegawai Tidak Hadir</DialogTitle>
              <DialogDescription>
                Berikut adalah daftar pegawai yang belum melakukan absensi hari ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {absentEmployees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-base">{emp.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {emp.nip} - {emp.pangkat}
                    </div>
                  </div>
                </div>
              ))}
              {absentEmployees.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Semua pegawai sudah melakukan absensi hari ini
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
