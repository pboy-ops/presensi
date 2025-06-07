import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [totalEmployees, attendanceCount] = await Promise.all([
      prisma.employee.count({
        where: { role: 'employee' }
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    ])

    const stats = {
      total: totalEmployees,
      present: attendanceCount,
      absent: totalEmployees - attendanceCount,
      date: date
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}