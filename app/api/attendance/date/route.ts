import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Parameter tanggal diperlukan' },
        { status: 400 }
      )
    }

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Ambil semua pegawai aktif
    const activeEmployees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    // Format response
    const attendance = activeEmployees.map(employee => ({
      id: employee.id,
      name: employee.name,
      nip: employee.nip,
      pangkat: employee.pangkat,
      status: employee.status,
      role: employee.role,
      attendance: employee.attendance[0] || null
    }))

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi' },
      { status: 500 }
    )
  }
}