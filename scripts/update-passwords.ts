import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updatePasswords() {
  const employees = await prisma.employee.findMany()
  
  for (const employee of employees) {
    const hashedPassword = await bcrypt.hash('123456', 10)
    await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword }
    })
  }
  
  console.log('All passwords have been updated')
}

updatePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect())