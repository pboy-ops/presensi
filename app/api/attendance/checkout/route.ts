import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { validateAttendance } from '@/lib/attendance-validator'

interface CheckOutRequest {
  employeeId: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, location } = await request.json() as CheckOutRequest
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Validasi waktu check-out
    const validation = validateAttendance('checkOut', now)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Cek apakah sudah ada attendance hari ini
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    // Allow checkout without prior check-in between 15:00-23:59
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const allowCheckoutWithoutCheckin = currentTime >= '15:00' && currentTime <= '23:59'

    if (!existingAttendance && !allowCheckoutWithoutCheckin) {
      return NextResponse.json(
        { error: 'Anda belum melakukan check-in hari ini' },
        { status: 400 }
      )
    }

    if (existingAttendance && existingAttendance.checkOut) {
      return NextResponse.json(
        { error: 'Anda sudah melakukan check-out hari ini' },
        { status: 400 }
      )
    }

    // Update attendance dengan check-out time
    let attendance
    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { 
          checkOut: now,
          location: location ? JSON.stringify(location) : undefined
        },
        include: { employee: true }
      })
    } else {
      // Create attendance record with only checkOut time (no checkIn)
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkOut: now,
          location: location ? JSON.stringify(location) : undefined
        },
        include: { employee: true }
      })
    }

    return NextResponse.json({
      message: 'Check-out berhasil',
      attendance
    })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      { error: 'Gagal melakukan check-out' },
      { status: 500 }
    )
  }
}
