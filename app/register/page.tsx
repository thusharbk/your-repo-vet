"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, User, Mail, Phone, MapPin, Lock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<"veteran" | "employer" | "recruiter">("veteran")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    agreeTerms: false,
  })

  const supabase = createClient()

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError("First name is required")
      return false
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!formData.agreeTerms) {
      setError("Please agree to the terms and conditions")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)

    try {
      console.log("Registering user with:", {
        email: formData.email,
        role,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || null,
            role: role,
          },
        },
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError("Registration failed. Please try again.")
        setLoading(false)
        return
      }

      console.log("Registration successful, user:", authData.user.id)

      // Create user profile in our custom table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .upsert(
          {
            id: authData.user.id,
            email: formData.email.trim(),
            role: role,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim() || null,
            email_verified: false,
            is_active: true,
          },
          { onConflict: "id", ignoreDuplicates: false },
        )
        .select()
        .single()

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continue anyway, profile can be created later
      }

      // Create role-specific profile
      if (role === "veteran") {
        const { error: veteranProfileError } = await supabase.from("veteran_profiles").upsert(
          {
            user_id: authData.user.id,
            current_location: formData.location.trim() || null,
            profile_completion_percentage: 30, // Higher since we have more info
            bio: `${formData.firstName} ${formData.lastName} - Military Veteran`,
            skills: [],
            certifications: [],
            awards: [],
            languages: ["English"],
            job_preferences: [],
          },
          { onConflict: "user_id" },
        )

        if (veteranProfileError) {
          console.error("Veteran profile creation error:", veteranProfileError)
        }
      } else if (role === "employer") {
        const { error: employerProfileError } = await supabase.from("employer_profiles").upsert(
          {
            user_id: authData.user.id,
            company_name: `${formData.firstName} ${formData.lastName} Company`,
            headquarters_location: formData.location.trim() || null,
            is_veteran_friendly: true,
            benefits: [],
          },
          { onConflict: "user_id" },
        )

        if (employerProfileError) {
          console.error("Employer profile creation error:", employerProfileError)
        }
      } else if (role === "recruiter") {
        const { error: recruiterProfileError } = await supabase.from("recruiter_profiles").upsert(
          {
            user_id: authData.user.id,
            agency_name: `${formData.firstName} ${formData.lastName} Recruiting`,
            specialization: ["Veteran Placement"],
            placement_count: 0,
            total_earnings: 0,
            monthly_target: 10,
            experience_years: 0,
            success_rate: 0,
            commission_rate: 15.0,
          },
          { onConflict: "user_id" },
        )

        if (recruiterProfileError) {
          console.error("Recruiter profile creation error:", recruiterProfileError)
        }
      }

      console.log("Redirecting to dashboard for role:", role)

      // Redirect to appropriate dashboard
      switch (role) {
        case "veteran":
          router.push("/veteran/dashboard")
          break
        case "employer":
          router.push("/employer/dashboard")
          break
        case "recruiter":
          router.push("/recruiter/dashboard")
          break
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const roles = [
    {
      id: "veteran",
      title: "Military Veteran",
      description: "Find your next career opportunity",
      icon: "🎖️",
      color: "from-orange-500 to-red-600",
    },
    {
      id: "employer",
      title: "Employer",
      description: "Hire talented veterans",
      icon: "🏢",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "recruiter",
      title: "Recruiter",
      description: "Connect veterans with opportunities",
      icon: "👥",
      color: "from-green-500 to-emerald-600",
    },
  ]

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
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join VetBridge</h2>
          <p className="text-lg text-gray-600">Create your account and start your journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Role Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Role</h3>
              <div className="space-y-4">
                {roles.map((roleOption) => (
                  <Card
                    key={roleOption.id}
                    className={`cursor-pointer transition-all border-2 ${
                      role === roleOption.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => setRole(roleOption.id as any)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{roleOption.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{roleOption.title}</h4>
                          <p className="text-sm text-gray-600">{roleOption.description}</p>
                        </div>
                        {role === roleOption.id && <CheckCircle className="h-5 w-5 text-orange-600" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Role Benefits */}
            <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {role === "veteran" && "Veteran Benefits"}
                  {role === "employer" && "Employer Benefits"}
                  {role === "recruiter" && "Recruiter Benefits"}
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {role === "veteran" && (
                    <>
                      <li>• Access to 1000+ veteran-friendly job opportunities</li>
                      <li>• Connect with experienced military mentors</li>
                      <li>• Free career transition resources and training</li>
                      <li>• Skill assessment and career matching</li>
                    </>
                  )}
                  {role === "employer" && (
                    <>
                      <li>• Access to 25,000+ verified Indian Army veterans</li>
                      <li>• Advanced filtering by regiment, rank, and skills</li>
                      <li>• Direct communication and interview tools</li>
                      <li>• Dedicated account management support</li>
                    </>
                  )}
                  {role === "recruiter" && (
                    <>
                      <li>• Commission-based placement opportunities</li>
                      <li>• Access to exclusive veteran talent pool</li>
                      <li>• Advanced sourcing and matching tools</li>
                      <li>• Partnership with 800+ hiring companies</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Registration Form */}
          <div className="max-w-md mx-auto w-full">
            <Card className="border-orange-200 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>Fill in your details to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="phone"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="location"
                            placeholder="City, State"
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="pl-10 pr-10"
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
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeTerms", checked as boolean)}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-orange-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-orange-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating Account...
                      </div>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
