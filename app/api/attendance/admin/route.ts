import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    // Check auth session
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get date from query params
    const url = new URL(request.url)
    const dateParam = url.searchParams.get("date")
    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }
    const date = new Date(dateParam)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    // Get attendance records for the specified date
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: date,
          lt: nextDate
        }
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json(records)

  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
