import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  // Hapus data yang ada (opsional)
  await prisma.attendance.deleteMany({})
  await prisma.employee.deleteMany({})

  // Hash default password
  const defaultPassword = await bcrypt.hash('123456', 10)

  try {
    // Buat data pegawai awal
    const dataPegawai = await Promise.all([
      // Admin Utama
      prisma.employee.create({
        data: {
          name: 'Admin Sistem',
          role: 'admin',
          nip: '198507232010012001',
          pangkat: 'Penata Muda/III-a',
          status: 'active',
          password: defaultPassword,
        },
      }),

      // Pegawai Regular
      prisma.employee.create({
        data: {
          name: 'Budi Santoso',
          role: 'employee',
          nip: '198607242011012002',
          pangkat: 'Penata Muda/III-a',
          status: 'active',
          password: defaultPassword,
        },
      }),

      prisma.employee.create({
        data: {
          name: 'Maharani Irwansyah',
          role: 'employee',
          nip: '2002030501202001',
          pangkat: 'Staff Andalan',
          status: 'active',
          password: defaultPassword,
        },
      }),
    ])

    console.log('Data pegawai berhasil ditambahkan:', dataPegawai)

  } catch (error) {
    console.error('Gagal menambahkan data:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })