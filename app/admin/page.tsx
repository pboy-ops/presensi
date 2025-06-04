"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LogOut, Users, Clock, MapPin, Search, Download, Plus, Edit, Trash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAttendanceStats } from '@/hooks/use-attendance'
import { useEmployees } from "@/hooks/use-employees"
import { LoadingSpinner } from "@/components/ui/loading"
import { useAuth } from "@/hooks/use-auth"
import { useAttendance } from "@/hooks/use-attendance"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Interfaces
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
  role: "admin" | "employee"
  nip: string
  pangkat: string
  status: "active" | "inactive"
}

interface EmployeeFormData {
  name: string
  nip: string
  role: "admin" | "employee"
  pangkat: string
  status: "active" | "inactive"
  password?: string // Tambah field password
}

interface FormErrors {
  name: string
  nip: string
  pangkat: string
  password: string // Tambah validasi password
}

type AttendanceStatus = 'all' | 'present' | 'absent' | 'late'

export default function AdminPage() {
  // Split state for better management
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const { employees, loading: employeesLoading, error: employeesError, addEmployee, updateEmployee, deleteEmployee } = useEmployees()
  const { stats, loading: statsLoading, error: statsError } = useAttendanceStats(selectedDate)
  const { attendance, loading: attendanceLoading } = useAttendance()

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!employees) return []
    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  // Paginate employees
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  }, [filteredEmployees, page, itemsPerPage])

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
  if (authLoading || employeesLoading || statsLoading || attendanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (employeesError || statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{employeesError || statsError}</div>
      </div>
    )
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((emp) => emp.id === employeeId)
    return employee ? employee.name : employeeId
  }

  const getEmployeeStatus = (employeeId: string, date: string) => {
    const dayRecords = attendance.filter(
      (record: AttendanceRecord) =>
        record.employeeId === employeeId &&
        new Date(record.timestamp).toDateString() === new Date(date).toDateString()
    )

    const clockIn = dayRecords.find((r: AttendanceRecord) => r.type === "clock-in")
    const clockOut = dayRecords.find((r: AttendanceRecord) => r.type === "clock-out")

    if (clockIn && clockOut) return "Lengkap"
    if (clockIn) return "Masuk"
    return "Tidak Hadir"
  }

  const getWorkingHours = (employeeId: string, date: string) => {
    const dayRecords = attendance.filter(
      (record: AttendanceRecord) =>
        record.employeeId === employeeId &&
        new Date(record.timestamp).toDateString() === new Date(date).toDateString() &&
        record.status === "success"
    )

    const clockIn = dayRecords.find((r: AttendanceRecord) => r.type === "clock-in") as AttendanceRecord | undefined
    const clockOut = dayRecords.find((r: AttendanceRecord) => r.type === "clock-out") as AttendanceRecord | undefined

    if (clockIn && clockOut) {
      const diff = new Date(clockOut.timestamp).getTime() - new Date(clockIn.timestamp).getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}j ${minutes}m`
    }

    return "-"
  }

  const selectedDateRecords = attendance
    .filter((record: AttendanceRecord) =>
      new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString()
    )
    .sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Export functionality
  interface ExportRecord {
    date: string
    employeeId: string
    name: string
    type: string
    time: string
    location: string
    status: string
  }

  const formatExportData = (records: AttendanceRecord[]): ExportRecord[] => {
    return records.map(record => ({
      date: formatDate(record.timestamp),
      employeeId: record.employeeId,
      name: getEmployeeName(record.employeeId),
      type: record.type,
      time: formatTime(record.timestamp),
      location: record.location.address,
      status: record.status
    }))
  }

  const exportToCSV = (records: AttendanceRecord[], date: string) => {
    const formattedData = formatExportData(records)
    const headers = "Tanggal,ID Pegawai,Nama,Tipe,Waktu,Lokasi,Status\n"
    const rows = formattedData
      .map(record =>
        `${record.date},${record.employeeId},${record.name},${record.type},${record.time},${record.location},${record.status}`
      )
      .join("\n")

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `absensi_${date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = () => {
    const filteredRecords = attendance.filter((record: AttendanceRecord) =>
      new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString()
    )
    exportToCSV(filteredRecords, selectedDate)
  }

  // Placeholder for export functions
  const exportDataAsExcel = () => {
    alert("Excel export is not implemented yet.")
  }

  const exportDataAsPDF = () => {
    alert("PDF export is not implemented yet.")
  }

  const handleAddEmployee = async (formData: EmployeeFormData) => {
    setIsSubmitting(true)
    try {
      if (!formData.password) {
        throw new Error('Password is required for new employees')
      }
      await addEmployee(formData)
      setIsDialogOpen(false)
      alert('Pegawai berhasil ditambahkan')
    } catch (error) {
      console.error('Error adding employee:', error)
      alert(`Gagal menambahkan pegawai: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEmployee = async (id: string, formData: Partial<EmployeeFormData>) => {
    setIsSubmitting(true)
    try {
      await updateEmployee(id, formData)
      setIsDialogOpen(false)
      setEditingEmployee(null)
      alert('Pegawai berhasil diperbarui')
    } catch (error) {
      console.error('Gagal memperbarui pegawai:', error)
      alert(`Gagal memperbarui pegawai: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    // Remove this line to prevent dialog reopening on delete
    // setIsDialogOpen(true)
    // Use a dialog for deletion confirmation (to be implemented)
    if (confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      try {
        await deleteEmployee(id)
        setIsDialogOpen(false) // Close dialog after delete
        setEditingEmployee(null) // Clear editing employee state
        alert('Pegawai berhasil dihapus')
      } catch (error) {
        console.error('Gagal menghapus pegawai:', error)
        alert(`Gagal menghapus pegawai: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const EmployeeDialog = ({
    employee,
    onSave
  }: {
    employee?: Employee | null
    onSave: (data: EmployeeFormData) => void
  }) => {
    const [formData, setFormData] = useState<EmployeeFormData>({
      name: employee?.name || "",
      role: employee?.role || "employee",
      nip: employee?.nip || "",
      pangkat: employee?.pangkat || "",
      status: employee?.status || "active",
      password: "" // Tambah initial state password
    })
    const [errors, setErrors] = useState<FormErrors>({
      name: '',
      nip: '',
      pangkat: '',
      password: '' // Tambah error state password
    })

    const validateForm = (data: EmployeeFormData): FormErrors => {
      const errors: FormErrors = {
        name: '',
        nip: '',
        pangkat: '',
        password: ''
      }

      if (!data.name.trim()) {
        errors.name = 'Nama tidak boleh kosong'
      } else if (data.name.length < 3) {
        errors.name = 'Nama minimal 3 karakter'
      }

      const nipRegex = /^\d{18}$/
      if (!data.nip) {
        errors.nip = 'NIP tidak boleh kosong'
      } else if (!nipRegex.test(data.nip)) {
        errors.nip = 'NIP harus 18 digit angka'
      }

      if (!data.pangkat) {
        errors.pangkat = 'Pangkat/Golongan tidak boleh kosong'
      }

      // Tambah validasi password
      if (!employee && !data.password) { // Hanya validasi untuk pegawai baru
        errors.password = 'Password tidak boleh kosong'
      } else if (!employee && data.password && data.password.length < 6) {
        errors.password = 'Password minimal 6 karakter'
      }

      return errors
    }

    const handleSubmit = () => {
      const formErrors = validateForm(formData)
      setErrors(formErrors)

      if (Object.values(formErrors).some(error => error !== '')) {
        return
      }

      onSave(formData)
    }

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>NIP</Label>
            <Input
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              className={errors.nip ? "border-red-500" : ""}
              maxLength={18}
              placeholder="Contoh: 198507232010012001"
            />
            {errors.nip && <p className="text-red-500 text-xs">{errors.nip}</p>}
          </div>
          <div className="space-y-2">
            <Label>Pangkat/Golongan</Label>
            <Input
              value={formData.pangkat}
              onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
              className={errors.pangkat ? "border-red-500" : ""}
              placeholder="Contoh: Penata Muda/III-a"
            />
            {errors.pangkat && <p className="text-red-500 text-xs">{errors.pangkat}</p>}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              className="w-full p-2 border rounded"
              value={formData.role}
              onChange={(e) => setFormData({
                ...formData,
                role: e.target.value as "admin" | "employee"
              })}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="w-full p-2 border rounded"
              value={formData.status}
              onChange={(e) => setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive"
              })}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
          {/* Tambah field password */}
          {!employee && ( // Hanya tampilkan untuk pegawai baru
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? "border-red-500" : ""}
                placeholder="Minimal 6 karakter"
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>
          )}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900">Dashboard Admin</CardTitle>
                <CardDescription className="text-gray-600">Sistem Manajemen Absensi Pegawai</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={exportDataAsExcel}>
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={exportDataAsPDF}>
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-gray-100">
                  <LogOut className="w-5 h-5 text-gray-700" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistik Card */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Statistik Kehadiran</CardTitle>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : statsError ? (
              <div className="text-red-600 text-center">{statsError}</div>
            ) : stats && (
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
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees">Daftar Pegawai</TabsTrigger>
            <TabsTrigger value="attendance">Riwayat Absensi</TabsTrigger>
          </TabsList>
          <TabsContent value="employees">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Daftar Pegawai</CardTitle>
                  <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Karyawan
                        </Button>
                      </DialogTrigger>
                      <EmployeeDialog
                        employee={editingEmployee}
                        onSave={editingEmployee ?
                          (data) => handleEditEmployee(editingEmployee.id, data) :
                          handleAddEmployee
                        }
                      />
                    </Dialog>
                    <Input
                      placeholder="Cari pegawai..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {employeesLoading ? (
                  <LoadingSpinner />
                ) : employeesError ? (
                  <div className="text-red-500 text-center">{employeesError}</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedEmployees.map((employee) => {
                        const status = getEmployeeStatus(employee.id, new Date().toISOString())
                        const workingHours = getWorkingHours(employee.id, new Date().toISOString())

                        return (
                          <div key={employee.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-gray-500">{employee.id}</div>
                                  <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                                    {employee.role}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                        <div className="text-right">
                          {/* Remove attendance status and working hours from employee list */}
                          {/* <Badge variant={status === "Lengkap" ? "default" : status === "Masuk" ? "secondary" : "outline"}>
                            {status}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">Jam kerja: {workingHours}</div> */}
                        </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingEmployee(employee)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEmployee(employee.id)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center mt-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="py-2">
                        Page {page} of {Math.ceil(filteredEmployees.length / itemsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(filteredEmployees.length / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance">
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
                    // Group attendance records by employee and show their attendance status
                    filteredEmployees.map((employee) => {
                      const dayRecords: AttendanceRecord[] = attendance.filter(
                        (record: AttendanceRecord) =>
                          record.employeeId === employee.id &&
                          new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString()
                      )
                      if (dayRecords.length === 0) return null

                      const clockIn = dayRecords.find((r: AttendanceRecord) => r.type === "clock-in")
                      const clockOut = dayRecords.find((r: AttendanceRecord) => r.type === "clock-out")

                      return (
                        <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <div>
                              <div className="font-medium text-sm">{employee.name}</div>
                              <div className="text-xs text-gray-500">
                                {clockIn ? "Clock In" : "Belum Clock In"}{clockOut ? ", Clock Out" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {clockIn ? formatTime(clockIn.timestamp) : "-"} {clockOut ? `- ${formatTime(clockOut.timestamp)}` : ""}
                            </div>
                            <Badge variant={dayRecords.every(r => r.status === "success") ? "default" : "destructive"} className="text-xs">
                              {dayRecords.every(r => r.status === "success") ? "Berhasil" : "Gagal"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}