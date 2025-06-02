import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("Auth check - User:", user?.id, "Error:", authError)

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.log("No user found in session")
      return NextResponse.json({ error: "No user session found" }, { status: 401 })
    }

    // Get user profile from our custom users table
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    console.log("Profile fetch - Data:", profile, "Error:", profileError)

    if (profileError) {
      console.error("Profile fetch error:", profileError)

      // If user doesn't exist in our custom table, create one
      if (profileError.code === "PGRST116") {
        console.log("Creating new user profile...")
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email || "",
            role: "veteran", // Default role
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            phone: user.user_metadata?.phone || "",
            is_active: true,
            email_verified: user.email_confirmed_at ? true : false,
          })
          .select()
          .single()

        if (createError) {
          console.error("Profile creation error:", createError)
          return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
        }

        // Create veteran profile as well
        const { error: veteranProfileError } = await supabase.from("veteran_profiles").insert({
          user_id: user.id,
          profile_completion_percentage: 25,
        })

        if (veteranProfileError) {
          console.error("Veteran profile creation error:", veteranProfileError)
        }

        return NextResponse.json({
          profile: {
            ...newProfile,
            roleProfile: null,
          },
        })
      }

      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Get role-specific profile
    let roleProfile = null

    if (profile.role === "veteran") {
      const { data } = await supabase.from("veteran_profiles").select("*").eq("user_id", user.id).single()
      roleProfile = data
    } else if (profile.role === "employer") {
      const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single()
      roleProfile = data
    } else if (profile.role === "recruiter") {
      const { data } = await supabase.from("recruiter_profiles").select("*").eq("user_id", user.id).single()
      roleProfile = data
    }

    return NextResponse.json({
      profile: {
        ...profile,
        roleProfile,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updateData = await request.json()
    const { basicInfo, roleSpecificData } = updateData

    console.log("Updating profile for user:", user.id)
    console.log("Basic info:", basicInfo)
    console.log("Role specific data:", roleSpecificData)

    // Update basic user info if provided
    if (basicInfo && Object.keys(basicInfo).length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          first_name: basicInfo.first_name,
          last_name: basicInfo.last_name,
          phone: basicInfo.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (userError) {
        console.error("User update error:", userError)
        return NextResponse.json({ error: `Failed to update basic info: ${userError.message}` }, { status: 400 })
      }
    }

    // Update role-specific profile if provided
    if (roleSpecificData && Object.keys(roleSpecificData).length > 0) {
      // Get user role
      const { data: profile, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (roleError) {
        console.error("Role fetch error:", roleError)
        return NextResponse.json({ error: `Failed to get user role: ${roleError.message}` }, { status: 400 })
      }

      let tableName = ""
      if (profile?.role === "veteran") {
        tableName = "veteran_profiles"
      } else if (profile?.role === "employer") {
        tableName = "employer_profiles"
      } else if (profile?.role === "recruiter") {
        tableName = "recruiter_profiles"
      }

      if (tableName) {
        // Check if profile exists
        const { data: existingProfile } = await supabase.from(tableName).select("id").eq("user_id", user.id).single()

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              ...roleSpecificData,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)

          if (updateError) {
            console.error("Role profile update error:", updateError)
            return NextResponse.json(
              { error: `Failed to update ${profile.role} profile: ${updateError.message}` },
              { status: 400 },
            )
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabase.from(tableName).insert({
            user_id: user.id,
            ...roleSpecificData,
          })

          if (insertError) {
            console.error("Role profile insert error:", insertError)
            return NextResponse.json(
              { error: `Failed to create ${profile.role} profile: ${insertError.message}` },
              { status: 400 },
            )
          }
        }
      }
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
