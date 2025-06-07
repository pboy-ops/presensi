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

    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        employee: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi' },
      { status: 500 }
    )
  }
}