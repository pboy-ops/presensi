"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Plus, Trash } from "lucide-react"

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

interface EmployeeListProps {
  employees: Employee[]
  loading: boolean
  error: string | null
  onAddEmployee: (formData: EmployeeFormData) => Promise<void>
  onEditEmployee: (id: string, formData: Partial<EmployeeFormData>) => Promise<void>
  onDeleteEmployee: (id: string) => Promise<void>
  page: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onOpenDialog: (employee: Employee | null) => void
}

export default function EmployeeList({ onOpenDialog, ...props }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const filteredEmployees = props.employees
    ? props.employees.filter((employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handleAddClick = () => {
    onOpenDialog(null)
  }

  const handleEditClick = (employee: Employee) => {
    onOpenDialog(employee)
  }

  const handleDeleteClick = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) {
      props.onDeleteEmployee(id)
      setIsDialogOpen(false)
      setEditingEmployee(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daftar Pegawai</CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleAddClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Karyawan
                </Button>
              </DialogTrigger>
              {/* EmployeeDialog should be rendered here by parent */}
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
        {props.loading ? (
          <div className="text-center">Loading...</div>
        ) : props.error ? (
          <div className="text-red-500 text-center">{props.error}</div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg"
                >
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(employee)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(employee.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(filteredEmployees.length / itemsPerPage)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
