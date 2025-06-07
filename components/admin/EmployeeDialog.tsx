"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

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
  password?: string
}

interface FormErrors {
  name: string
  nip: string
  pangkat: string
  password: string
}

interface EmployeeDialogProps {
  employee: Employee | null
  onSave: (idOrFormData: string | EmployeeFormData, formData?: Partial<EmployeeFormData>) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EmployeeListProps {
  employees: Employee[]
  loading: boolean
  error: string | null
  onAddEmployee: (data: EmployeeFormData) => void
  onEditEmployee: (id: string, data: EmployeeFormData) => void
  onDeleteEmployee: (id: string) => void
  page: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function EmployeeDialog({
  employee,
  onSave,
  open,
  onOpenChange
}: EmployeeDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: employee?.name || "",
    role: employee?.role || "employee",
    nip: employee?.nip || "",
    pangkat: employee?.pangkat || "",
    status: employee?.status || "active",
    password: ""
  })
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    nip: '',
    pangkat: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (!employee && !data.password) {
      errors.password = 'Password tidak boleh kosong'
    } else if (data.password && data.password.length < 6) {
      errors.password = 'Password minimal 6 karakter'
    }

    return errors
  }

  const handleSubmit = async () => {
    const formErrors = validateForm(formData)
    setErrors(formErrors)

    if (Object.values(formErrors).some(error => error !== '')) {
      toast({
        title: "Error Validasi",
        description: "Mohon periksa kembali data yang dimasukkan",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      if (employee) {
        const updatedData: Partial<EmployeeFormData> = {
          name: formData.name,
          nip: formData.nip,
          role: formData.role,
          pangkat: formData.pangkat,
          status: formData.status
        }
        
        if (formData.password) {
          updatedData.password = formData.password
        }
        
        await onSave(employee.id, updatedData)
      } else {
        if (!formData.password) {
          toast({
            title: "Error",
            description: "Password harus diisi untuk pegawai baru",
            variant: "destructive",
          })
          return
        }
        await onSave(formData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}>
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
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({
                ...formData,
                role: value as "admin" | "employee"
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({
                ...formData,
                status: value as "active" | "inactive"
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Password {employee && "(Opsional)"}</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={errors.password ? "border-red-500" : ""}
              placeholder={employee ? "Kosongkan jika tidak ingin mengubah password" : "Minimal 6 karakter"}
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EmployeeList({
  employees,
  loading,
  error,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  page,
  itemsPerPage,
  onPageChange
}: EmployeeListProps) {
  return (
    <Card>
      {/* ... existing content ... */}

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="py-2">
          Page {page} of {Math.ceil(employees.length / itemsPerPage)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= Math.ceil(employees.length / itemsPerPage)}
        >
          Next
        </Button>
      </div>
    </Card>
  )
}
