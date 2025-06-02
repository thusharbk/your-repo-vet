"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.email || !formData.password) {
        setError("Please enter both email and password")
        setLoading(false)
        return
      }

      console.log("Attempting login with:", formData.email)

      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError("Login failed. Please try again.")
        setLoading(false)
        return
      }

      console.log("Login successful, user:", authData.user.id)

      // Get or create user profile
      let { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      console.log("Profile fetch result:", { profile, error: profileError })

      // If profile doesn't exist, create it from auth metadata
      if (profileError && profileError.code === "PGRST116") {
        console.log("Creating new profile from auth metadata...")

        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            role: authData.user.user_metadata?.role || "veteran",
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
          setError("Failed to create user profile. Please try again.")
          setLoading(false)
          return
        }

        profile = newProfile

        // Create role-specific profile
        const userRole = authData.user.user_metadata?.role || "veteran"

        if (userRole === "veteran") {
          await supabase.from("veteran_profiles").insert({
            user_id: authData.user.id,
            profile_completion_percentage: 25,
            bio: `${profile.first_name} ${profile.last_name} - Military Veteran`,
            skills: [],
            certifications: [],
            awards: [],
            languages: ["English"],
          })
        } else if (userRole === "employer") {
          await supabase.from("employer_profiles").insert({
            user_id: authData.user.id,
            company_name: `${profile.first_name} ${profile.last_name} Company`,
            is_veteran_friendly: true,
            benefits: [],
          })
        } else if (userRole === "recruiter") {
          await supabase.from("recruiter_profiles").insert({
            user_id: authData.user.id,
            agency_name: `${profile.first_name} ${profile.last_name} Recruiting`,
            specialization: ["Veteran Placement"],
            placement_count: 0,
            total_earnings: 0,
            monthly_target: 10,
          })
        }
      }

      if (!profile) {
        setError("Failed to load user profile. Please try again.")
        setLoading(false)
        return
      }

      console.log("Redirecting to dashboard for role:", profile.role)

      // Redirect based on user role
      switch (profile.role) {
        case "veteran":
          router.push("/veteran/dashboard")
          break
        case "employer":
          router.push("/employer/dashboard")
          break
        case "recruiter":
          router.push("/recruiter/dashboard")
          break
        default:
          router.push("/veteran/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-800">
                VetBridge India
              </Link>
              <div className="ml-3 flex items-center">
                <Shield className="h-5 w-5 text-orange-600 mr-1" />
                <span className="text-sm text-gray-600 font-medium">Connecting Indian Army Veterans</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Sign in to access your VetBridge account</p>
          </div>

          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-gray-300 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="border-gray-300 focus:border-orange-500 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700">
                    Forgot password?
                  </Link>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading} size="lg">
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing In...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {"Don't have an account? "}
                    <Link href="/register" className="text-orange-600 hover:text-orange-700 font-medium">
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Support */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <Link href="/support" className="text-orange-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
