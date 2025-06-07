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
    console.log('Received update data:', data)
    
    const { password, ...updateData } = data

    // Validasi data yang diterima
    if (Object.keys(updateData).length === 0 && !password) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diperbarui' },
        { status: 400 }
      )
    }

    // Validasi field yang diperlukan
    const requiredFields = ['name', 'nip', 'role', 'pangkat', 'status']
    const missingFields = requiredFields.filter(field => !updateData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Field yang diperlukan: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validasi format NIP
    if (updateData.nip && !/^\d{18}$/.test(updateData.nip)) {
      return NextResponse.json(
        { error: 'Format NIP tidak valid. Harus 18 digit angka.' },
        { status: 400 }
      )
    }

    // Cek apakah pegawai exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: params.id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Pegawai tidak ditemukan' },
        { status: 404 }
      )
    }

    // If password is provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    try {
      console.log('Attempting to update with data:', updateData)
      const employee = await prisma.employee.update({
        where: { id: params.id },
        data: updateData
      })

      const { password: _, ...employeeWithoutPassword } = employee
      return NextResponse.json(employeeWithoutPassword)
    } catch (prismaError) {
      console.error('Prisma error details:', prismaError)
      return NextResponse.json(
        { error: 'Gagal memperbarui data pegawai. Pastikan data yang dimasukkan valid.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui data pegawai' },
      { status: 500 }
    )
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