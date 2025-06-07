import { useState, FormEvent, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Define types
interface EmployeeFormData {
  name: string
  nip: string
  role: "admin" | "employee"
  pangkat: string
  password: string
  status: "active" | "inactive"
}

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void
  initialData?: Partial<EmployeeFormData>
}

export function EmployeeForm({ onSubmit, initialData }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: initialData?.name || "",
    nip: initialData?.nip || "",
    role: initialData?.role || "employee",
    pangkat: initialData?.pangkat || "",
    password: "",
    status: initialData?.status || "active"
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="Masukkan nama lengkap"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nip">NIP</Label>
        <Input
          id="nip"
          name="nip"
          value={formData.nip}
          onChange={handleInputChange}
          required
          placeholder="Masukkan NIP"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          name="role"
          value={formData.role}
          onValueChange={(value) => handleSelectChange(value, "role")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pangkat">Pangkat</Label>
        <Input
          id="pangkat"
          name="pangkat"
          value={formData.pangkat}
          onChange={handleInputChange}
          required
          placeholder="Masukkan pangkat"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required={!initialData} // Required only for new employees
          placeholder="Masukkan password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          value={formData.status}
          onValueChange={(value) => handleSelectChange(value, "status")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit">
        {initialData ? 'Update' : 'Tambah'} Pegawai
      </Button>
    </form>
  )
}