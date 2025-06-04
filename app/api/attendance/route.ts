import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        employee: true
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

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const attendance = await prisma.attendance.create({
      data,
      include: {
        employee: true
      }
    })
    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal menambah absensi' },
      { status: 500 }
    )
  }
}