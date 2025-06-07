import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

// Get pegawai by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        attendance: true
      }
    })
    if (!employee) {
      return NextResponse.json(
        { error: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }
    return NextResponse.json(employee)
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data pegawai' },
      { status: 500 }
    )
  }
}

// Update pegawai
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { password, ...updateData } = data

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData
    })

    const { password: _, ...employeeWithoutPassword } = employee
    return NextResponse.json(employeeWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// Delete pegawai
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}