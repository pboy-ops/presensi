export const ATTENDANCE_CONFIG = {
  checkIn: {
    start: '06:30',
    end: '09:00'
  },
  checkOut: {
    start: '15:00',
    end: '23:59'
  }
}

export function isWithinCheckInTime(date: Date): boolean {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  
  return time >= ATTENDANCE_CONFIG.checkIn.start && time <= ATTENDANCE_CONFIG.checkIn.end
}

export function isWithinCheckOutTime(date: Date): boolean {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  
  return time >= ATTENDANCE_CONFIG.checkOut.start && time <= ATTENDANCE_CONFIG.checkOut.end
}

export function validateAttendance(type: 'checkIn' | 'checkOut', date: Date): { 
  valid: boolean;
  message?: string;
} {
  if (type === 'checkIn') {
    if (!isWithinCheckInTime(date)) {
      return {
        valid: false,
        message: `Jam masuk hanya diperbolehkan antara ${ATTENDANCE_CONFIG.checkIn.start} - ${ATTENDANCE_CONFIG.checkIn.end}`
      }
    }
  } else {
    if (!isWithinCheckOutTime(date)) {
      return {
        valid: false,
        message: `Jam pulang hanya diperbolehkan antara ${ATTENDANCE_CONFIG.checkOut.start} - ${ATTENDANCE_CONFIG.checkOut.end}`
      }
    }
  }

  return { valid: true }
}
