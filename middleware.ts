import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient()

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/veteran/dashboard", "/employer/dashboard", "/recruiter/dashboard"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If logged in and trying to access login/register, redirect to appropriate dashboard
  if (session && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    // Get user profile to determine role
    const { data: profile } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (profile?.role === "veteran") {
      return NextResponse.redirect(new URL("/veteran/dashboard", request.url))
    } else if (profile?.role === "employer") {
      return NextResponse.redirect(new URL("/employer/dashboard", request.url))
    } else if (profile?.role === "recruiter") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
