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
} from "@/components/ui/dialog"
import { useEmployees } from "@/hooks/use-employees"
import { LoadingSpinner } from "@/components/ui/loading"
import { useAuth } from "@/hooks/use-auth"
import AdminHeader from "@/components/admin/AdminHeader"
import EmployeeList from "@/components/admin/EmployeeList"
import EmployeeDialog from "@/components/admin/EmployeeDialog"
import { toast } from "@/components/ui/use-toast"
import { Users, UserCheck, UserX, UserCog, Clock, Calendar, AlertCircle } from "lucide-react"

// Interfaces
interface Attendance {
  date: string
  checkIn?: string
  checkOut?: string
  status: "present" | "late" | "absent"
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
  present: number
  late: number
  absent: number
  checkInCount: number
  checkOutCount: number
  [key: string]: number
}

export default function AdminPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { employees, loading: employeesLoading, error: employeesError, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

  // Statistik pegawai
  const stats = useMemo(() => {
    if (!employees) return null

    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = employees.reduce((acc: AttendanceStats, emp: Employee) => {
      const attendance = emp.attendance?.find((a: Attendance) => a.date === today)
      if (attendance) {
        const status = attendance.status as keyof AttendanceStats
        acc[status] = (acc[status] || 0) + 1
        if (attendance.checkIn) acc.checkInCount++
        if (attendance.checkOut) acc.checkOutCount++
      } else {
        acc.absent = (acc.absent || 0) + 1
      }
      return acc
    }, {
      present: 0,
      late: 0,
      absent: 0,
      checkInCount: 0,
      checkOutCount: 0
    })

    return {
      total: employees.length,
      active: employees.filter(emp => emp.status === "active").length,
      inactive: employees.filter(emp => emp.status === "inactive").length,
      admin: employees.filter(emp => emp.role === "admin").length,
      employee: employees.filter(emp => emp.role === "employee").length,
      pangkatGroups: employees.reduce((acc, emp) => {
        acc[emp.pangkat] = (acc[emp.pangkat] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      attendance: todayAttendance
    }
  }, [employees])

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
    if (!employees) return

    const headers = "NIP,Nama,Pangkat,Role,Status\n"
    const rows = employees.map(emp => 
      `${emp.nip},${emp.name},${emp.pangkat},${emp.role},${emp.status}`
    ).join("\n")

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `daftar_pegawai.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenDialog = (employee: Employee | null = null) => {
    setEditingEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setEditingEmployee(null)
    setIsDialogOpen(false)
  }

  const handleSubmitEmployee = async (idOrFormData: string | EmployeeFormData, formData?: Partial<EmployeeFormData>) => {
    try {
      if (typeof idOrFormData === 'string' && formData) {
        // Edit mode
        await updateEmployee(idOrFormData, formData)
        toast({
          title: "Berhasil",
          description: "Data pegawai berhasil diperbarui",
        })
      } else if (typeof idOrFormData === 'object') {
        // Add mode
        if (!idOrFormData.password) {
          toast({
            title: "Error",
            description: "Password harus diisi untuk pegawai baru",
            variant: "destructive",
          })
          return
        }
        await addEmployee(idOrFormData)
        toast({
          title: "Berhasil",
          description: "Pegawai baru berhasil ditambahkan",
        })
      }
      handleCloseDialog()
    } catch (error) {
      console.error("Error submitting employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      })
    }
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

        {/* Statistik Dashboard */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active} aktif, {stats.inactive} tidak aktif
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pegawai Aktif</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.active / stats.total) * 100).toFixed(1)}% dari total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin</CardTitle>
                  <UserCog className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.admin}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.admin / stats.total) * 100).toFixed(1)}% dari total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pegawai</CardTitle>
                  <UserX className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.employee}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.employee / stats.total) * 100).toFixed(1)}% dari total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistik Kehadiran Hari Ini */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Kehadiran Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Check In</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.attendance.checkInCount} pegawai
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((stats.attendance.checkInCount / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Check Out</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.attendance.checkOutCount} pegawai
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((stats.attendance.checkOutCount / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="font-medium">Terlambat</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.attendance.late} pegawai
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((stats.attendance.late / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">Tidak Hadir</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.attendance.absent} pegawai
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((stats.attendance.absent / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daftar Pegawai yang Belum Absen Hari Ini */}
            <Card>
              <CardHeader>
                <CardTitle>Pegawai yang Belum Absen Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees?.filter((emp: Employee) => {
                    const todayAttendance = emp.attendance?.find((a: Attendance) => a.date === new Date().toISOString().split('T')[0])
                    return !todayAttendance || !todayAttendance.checkIn
                  }).map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {emp.nip} - {emp.pangkat}
                        </div>
                      </div>
                      <div className="text-sm text-red-500">
                        Belum Check In
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Distribusi Pangkat */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Pangkat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.pangkatGroups).map(([pangkat, count]) => (
                  <div key={pangkat} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div>
                      <div className="font-medium">{pangkat}</div>
                      <div className="text-sm text-muted-foreground">
                        {count} pegawai
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((count / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  )
}
