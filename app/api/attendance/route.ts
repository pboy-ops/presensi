import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId') || session.user.id

    let whereClause = {
      employeeId: employeeId
    }
    
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      whereClause = {
        ...whereClause,
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        employee: true
      }
    })

    console.log('Retrieved attendance records:', attendance.length) // Debugging

    // Transform data to match frontend expected format
    interface TransformedRecord {
      id: string
      employeeId: string
      type: 'clock-in' | 'clock-out'
      timestamp: string
      location: any
      status: string
    }

    const transformed: TransformedRecord[] = []

    attendance.forEach(record => {
      if (record.checkIn) {
        transformed.push({
          id: record.id + '-in',
          employeeId: record.employeeId,
          type: 'clock-in',
          timestamp: record.checkIn.toISOString(),
          location: null,
          status: 'success'
        })
      }
      if (record.checkOut) {
        transformed.push({
          id: record.id + '-out',
          employeeId: record.employeeId,
          type: 'clock-out',
          timestamp: record.checkOut.toISOString(),
          location: null,
          status: 'success'
        })
      }
    })

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error in attendance API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
