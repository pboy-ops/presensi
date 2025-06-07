import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  // Hapus cookie auth-token
  response.cookies.delete('auth-token')
  
  return response
}