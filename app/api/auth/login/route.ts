import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
    }

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          role: "veteran", // Default role
          first_name: authData.user.user_metadata?.first_name || "",
          last_name: authData.user.user_metadata?.last_name || "",
          phone: authData.user.user_metadata?.phone || null,
          email_verified: authData.user.email_confirmed_at ? true : false,
          is_active: true,
        })
        .select()
        .single()

      if (createError) {
        console.error("Profile creation error:", createError)
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }

      profile = newProfile
    }

    // Create response with session cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
      },
    })

    // Set session cookies
    if (authData.session) {
      response.cookies.set("sb-access-token", authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: authData.session.expires_in,
        path: "/",
      })

      response.cookies.set("sb-refresh-token", authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })
    }

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
