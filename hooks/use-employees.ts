import { useState, useEffect, useCallback } from 'react'
import { Prisma } from '@prisma/client'

// Define Employee interface locally
interface Employee {
  id: string
  name: string
  role: "admin" | "employee"
  nip: string
  pangkat: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

// Type for creating new employee
type EmployeeCreate = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>

interface UseEmployeesReturn {
  employees: Employee[]
  loading: boolean
  error: string | null
  addEmployee: (data: EmployeeCreate) => Promise<void>
  updateEmployee: (id: string, data: Partial<EmployeeCreate>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  refreshEmployees: () => Promise<void>
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Gagal mengambil data pegawai')
      const data = await response.json()
      setEmployees(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [])

  const addEmployee = async (data: EmployeeCreate) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Gagal menambah pegawai')
      await fetchEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      throw err
    }
  }

  const updateEmployee = async (id: string, data: Partial<EmployeeCreate>) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Gagal memperbarui pegawai')
      await fetchEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      throw err
    }
  }

  const deleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Gagal menghapus pegawai')
      await fetchEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      throw err
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees: fetchEmployees
  }
}