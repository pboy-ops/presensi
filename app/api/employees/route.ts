import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    const employee = await prisma.employee.create({
      data: {
        ...data,
        password: hashedPassword
      }
    })

    // Remove password from response
    const { password, ...employeeWithoutPassword } = employee
    return NextResponse.json(employeeWithoutPassword)
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}