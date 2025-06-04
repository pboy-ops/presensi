import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ATTENDANCE_CONFIG } from '@/lib/attendance-validator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Cek attendance hari ini
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { employee: true }
    })

    // Cek apakah masih dalam waktu check-in atau check-out
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const canCheckIn = currentTime >= ATTENDANCE_CONFIG.checkIn.start && currentTime <= ATTENDANCE_CONFIG.checkIn.end
    const canCheckOut = currentTime >= ATTENDANCE_CONFIG.checkOut.start && currentTime <= ATTENDANCE_CONFIG.checkOut.end

    // Allow check-out between 15:00-23:59 even if no prior check-in
    const allowCheckoutWithoutCheckin = currentTime >= '15:00' && currentTime <= '23:59'
    const canCheckOutAdjusted = canCheckOut && (
      (todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut) ||
      (allowCheckoutWithoutCheckin && (!todayAttendance || !todayAttendance.checkIn))
    )

    return NextResponse.json({
      attendance: todayAttendance,
      canCheckIn: canCheckIn && (!todayAttendance || !todayAttendance.checkIn),
      canCheckOut: canCheckOutAdjusted,
      config: ATTENDANCE_CONFIG,
      currentTime
    })
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil status absensi' },
      { status: 500 }
    )
  }
}
