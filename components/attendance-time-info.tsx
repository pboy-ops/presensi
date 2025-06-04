import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AttendanceTimeInfoProps {
  canCheckIn: boolean
  canCheckOut: boolean
  config: {
    checkIn: { start: string; end: string }
    checkOut: { start: string; end: string }
  }
  currentTime: string
}

export function AttendanceTimeInfo({ canCheckIn, canCheckOut, config, currentTime }: AttendanceTimeInfoProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Jadwal Absensi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-lg font-semibold">{currentTime}</div>
          <div className="text-sm text-gray-500">Waktu Sekarang</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              {canCheckIn ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Check In</span>
            </div>
            <Badge variant={canCheckIn ? "default" : "secondary"}>
              {config.checkIn.start} - {config.checkIn.end}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-red-50">
            <div className="flex items-center gap-2">
              {canCheckOut ? (
                <CheckCircle className="w-4 h-4 text-red-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Check Out</span>
            </div>
            <Badge variant={canCheckOut ? "destructive" : "secondary"}>
              {config.checkOut.start} - {config.checkOut.end}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Absensi hanya dapat dilakukan pada jam yang telah ditentukan
        </div>
      </CardContent>
    </Card>
  )
}
