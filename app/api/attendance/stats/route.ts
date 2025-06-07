import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Attendance, Employee } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return new NextResponse('Date parameter is required', { status: 400 })
    }

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        status: 'active'
      }
    })

    const totalEmployees = activeEmployees.length

    // Get attendance records for the specified date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        employee: {
          status: 'active'
        }
      },
      include: {
        employee: true
      }
    })

    // Calculate statistics
    const stats = {
      total: totalEmployees,
      present: 0,      
      absent: 0,      
      checkInCount: 0,
      checkOutCount: 0
    }

    // Hitung pegawai yang memiliki record kehadiran hari ini
    const presentEmployeeIds = new Set(attendanceRecords.map((record: Attendance) => record.employeeId))
    
    // Hitung pegawai yang tidak hadir (tidak memiliki record kehadiran sama sekali)
    stats.absent = totalEmployees - presentEmployeeIds.size

    // Hitung status kehadiran untuk pegawai yang hadir
    attendanceRecords.forEach((record: Attendance & { employee: Employee }) => {
      switch (record.status) {
        case 'present':
          stats.present++
          break        
      }

      if (record.checkIn) {
        stats.checkInCount++
      }
      if (record.checkOut) {
        stats.checkOutCount++
      }
    })

    // Log untuk debugging
    console.log('Attendance Stats:', {
      totalEmployees,
      presentEmployeeIds: presentEmployeeIds.size,
      absent: stats.absent,
      attendanceRecords: attendanceRecords.length,
      present: stats.present,
      
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[ATTENDANCE_STATS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}