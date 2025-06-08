import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { validateAttendance } from '@/lib/attendance-validator'

interface CheckInRequest {
  employeeId: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, location } = await request.json() as CheckInRequest
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Validasi waktu check-in
    const validation = validateAttendance('checkIn', now)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Cek apakah sudah check-in hari ini
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingAttendance && existingAttendance.checkIn) {
      return NextResponse.json(
        { error: 'Anda sudah melakukan check-in hari ini' },
        { status: 400 }
      )
    }

    let attendance
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { 
          checkIn: now,
          location: location ? JSON.stringify(location) : undefined
        },
        include: { employee: true }
      })
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: now,
          location: location ? JSON.stringify(location) : undefined
        },
        include: { employee: true }
      })
    }

    return NextResponse.json({
      message: 'Check-in berhasil',
      attendance
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Gagal melakukan check-in' },
      { status: 500 }
    )
  }
}
