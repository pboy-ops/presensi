// lib/attendance-api.ts

export async function getAttendanceRecords() {
  const res = await fetch("/api/attendance/admin") // Update endpoint path

  if (!res.ok) {
    throw new Error("Gagal mengambil data absensi")
  }

  const rawRecords = await res.json()

  const transformed = rawRecords.flatMap((record: any) => {
    const entries = []

    if (record.checkIn) {
      entries.push({
        id: `${record.id}-in`,
        employeeId: record.employeeId,
        type: "clock-in",
        timestamp: record.checkIn,
        location: {
          latitude: record.checkInLat ?? 0,
          longitude: record.checkInLng ?? 0,
          address: record.checkInAddr ?? "Lokasi tidak diketahui",
        },
        status: "success",
      })
    }

    if (record.checkOut) {
      entries.push({
        id: `${record.id}-out`,
        employeeId: record.employeeId,
        type: "clock-out",
        timestamp: record.checkOut,
        location: {
          latitude: record.checkOutLat ?? 0,
          longitude: record.checkOutLng ?? 0,
          address: record.checkOutAddr ?? "Lokasi tidak diketahui",
        },
        status: "success",
      })
    }

    return entries
  })

  return transformed
}
