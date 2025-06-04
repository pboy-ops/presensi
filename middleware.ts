import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Izinkan akses ke halaman login dan API routes
  if (
    request.nextUrl.pathname === "/" || 
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })

  // Redirect ke login jika tidak ada token
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect employee routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && token.role !== "employee") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Handle logout path
  if (request.nextUrl.pathname === '/api/auth/signout') {
    // Clear session cookie
    const response = NextResponse.next()
    response.cookies.delete('next-auth.session-token')
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
}