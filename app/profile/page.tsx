"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  Save,
  Shield,
  Award,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileCompletion, setProfileCompletion] = useState(25)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [achievements, setAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState("")
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")

  const router = useRouter()
  const supabase = createClient()

  const [profileData, setProfileData] = useState({
    // Basic Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    linkedinProfile: "",
    summary: "",

    // Military Background (for veterans)
    serviceNumber: "",
    branch: "",
    regiment: "",
    rank: "",
    serviceStartDate: "",
    serviceEndDate: "",
    clearanceLevel: "",
    deployments: "",

    // Career Preferences
    targetRole: "",
    preferredIndustries: [] as string[],
    workType: "",
    remotePreference: "",
    salaryRange: "",
    travelWillingness: "",

    // Career Goals
    careerGoals: "",
    timeline: "",
    educationGoals: [] as string[],
    challenges: "",
    supportNeeded: [] as string[],
  })

  // Check authentication and load profile on component mount
  useEffect(() => {
    initializeProfile()
  }, [])

  const initializeProfile = async () => {
    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      console.log("Session check:", { session: !!session, error: sessionError })

      if (sessionError) {
        console.error("Session error:", sessionError)
        setError("Authentication error. Please log in again.")
        router.push("/login")
        return
      }

      if (!session) {
        console.log("No session found")
        setError("Please log in to access your profile.")
        router.push("/login")
        return
      }

      setUser(session.user)

      // Load profile data
      await loadProfileData(session.user.id)
    } catch (error) {
      console.error("Profile initialization error:", error)
      setError("Failed to load profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadProfileData = async (userId: string) => {
    try {
      setError(null)

      // Get user profile from our custom users table
      const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", userId).single()

      console.log("Profile fetch:", { profile, error: profileError })

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // User doesn't exist in our custom table, create one
          console.log("Creating new user profile...")
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: user?.email || "",
              role: "veteran", // Default role
              first_name: user?.user_metadata?.first_name || "",
              last_name: user?.user_metadata?.last_name || "",
              phone: user?.user_metadata?.phone || "",
              is_active: true,
              email_verified: user?.email_confirmed_at ? true : false,
            })
            .select()
            .single()

          if (createError) {
            console.error("Profile creation error:", createError)
            throw new Error("Failed to create user profile")
          }

          // Create veteran profile as well
          await supabase.from("veteran_profiles").insert({
            user_id: userId,
            profile_completion_percentage: 25,
          })

          setUserRole("veteran")
          setProfileData((prev) => ({
            ...prev,
            email: newProfile.email,
            firstName: newProfile.first_name || "",
            lastName: newProfile.last_name || "",
            phone: newProfile.phone || "",
          }))
          return
        }
        throw new Error(profileError.message)
      }

      setUserRole(profile.role)

      // Get role-specific profile
      let roleProfile = null
      if (profile.role === "veteran") {
        const { data } = await supabase.from("veteran_profiles").select("*").eq("user_id", userId).single()
        roleProfile = data
      } else if (profile.role === "employer") {
        const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", userId).single()
        roleProfile = data
      } else if (profile.role === "recruiter") {
        const { data } = await supabase.from("recruiter_profiles").select("*").eq("user_id", userId).single()
        roleProfile = data
      }

      // Update profile data
      setProfileData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: roleProfile?.current_location || "",
        linkedinProfile: roleProfile?.linkedin_url || "",
        summary: roleProfile?.bio || "",

        // Military background (for veterans)
        serviceNumber: roleProfile?.service_number || "",
        branch: roleProfile?.military_branch || "",
        regiment: "",
        rank: roleProfile?.rank || "",
        serviceStartDate: roleProfile?.service_start_date || "",
        serviceEndDate: roleProfile?.service_end_date || "",
        clearanceLevel: roleProfile?.security_clearance || "",
        deployments: roleProfile?.deployment_history?.join("\n") || "",

        // Career preferences
        targetRole: roleProfile?.job_preferences?.[0] || "",
        preferredIndustries: [],
        workType: "",
        remotePreference: "",
        salaryRange: roleProfile?.salary_expectation_min
          ? `₹${roleProfile.salary_expectation_min}-${roleProfile.salary_expectation_max || 0} LPA`
          : "",
        travelWillingness: "",

        // Career goals
        careerGoals: "",
        timeline: "",
        educationGoals: [],
        challenges: "",
        supportNeeded: [],
      })

      // Update skills and achievements
      setSkills(roleProfile?.skills || [])
      setAchievements(roleProfile?.awards || [])
      setProfileCompletion(roleProfile?.profile_completion_percentage || 25)
    } catch (error) {
      console.error("Failed to load profile data:", error)
      setError(error instanceof Error ? error.message : "Failed to load profile")
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
      updateProfileCompletion()
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const addAchievement = () => {
    if (newAchievement.trim() && !achievements.includes(newAchievement.trim())) {
      setAchievements([...achievements, newAchievement.trim()])
      setNewAchievement("")
      updateProfileCompletion()
    }
  }

  const removeAchievement = (achievementToRemove: string) => {
    setAchievements(achievements.filter((achievement) => achievement !== achievementToRemove))
  }

  const updateProfileCompletion = () => {
    // Calculate profile completion based on filled fields
    let completion = 0
    const totalFields = 20
    let filledFields = 0

    // Check basic info
    if (profileData.firstName) filledFields++
    if (profileData.lastName) filledFields++
    if (profileData.email) filledFields++
    if (profileData.phone) filledFields++
    if (profileData.location) filledFields++
    if (profileData.summary) filledFields++

    // Check military background
    if (profileData.serviceNumber) filledFields++
    if (profileData.regiment) filledFields++
    if (profileData.rank) filledFields++
    if (profileData.serviceStartDate) filledFields++
    if (profileData.serviceEndDate) filledFields++
    if (profileData.deployments) filledFields++

    // Check career preferences
    if (profileData.targetRole) filledFields++
    if (profileData.preferredIndustries.length > 0) filledFields++
    if (profileData.workType) filledFields++
    if (profileData.salaryRange) filledFields++

    // Check skills and achievements
    if (skills.length > 0) filledFields++
    if (achievements.length > 0) filledFields++

    // Check career goals
    if (profileData.careerGoals) filledFields++
    if (profileData.timeline) filledFields++

    completion = Math.round((filledFields / totalFields) * 100)
    setProfileCompletion(completion)
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    updateProfileCompletion()
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Update basic user info
      const { error: userError } = await supabase
        .from("users")
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (userError) {
        throw new Error(`Failed to update basic info: ${userError.message}`)
      }

      // Update role-specific profile
      let tableName = ""
      if (userRole === "veteran") {
        tableName = "veteran_profiles"
      } else if (userRole === "employer") {
        tableName = "employer_profiles"
      } else if (userRole === "recruiter") {
        tableName = "recruiter_profiles"
      }

      if (tableName) {
        const roleSpecificData = {
          current_location: profileData.location,
          linkedin_url: profileData.linkedinProfile,
          bio: profileData.summary,
          service_number: profileData.serviceNumber,
          military_branch: profileData.branch,
          rank: profileData.rank,
          service_start_date: profileData.serviceStartDate || null,
          service_end_date: profileData.serviceEndDate || null,
          security_clearance: profileData.clearanceLevel,
          deployment_history: profileData.deployments
            ? profileData.deployments.split("\n").filter((d) => d.trim())
            : [],
          skills: skills,
          awards: achievements,
          profile_completion_percentage: profileCompletion,
          updated_at: new Date().toISOString(),
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase.from(tableName).select("id").eq("user_id", user.id).single()

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase.from(tableName).update(roleSpecificData).eq("user_id", user.id)

          if (updateError) {
            throw new Error(`Failed to update ${userRole} profile: ${updateError.message}`)
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabase.from(tableName).insert({
            user_id: user.id,
            ...roleSpecificData,
          })

          if (insertError) {
            throw new Error(`Failed to create ${userRole} profile: ${insertError.message}`)
          }
        }
      }

      setSuccess("Profile saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Save error:", error)
      setError(error instanceof Error ? error.message : "Failed to save profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const getDashboardLink = () => {
    switch (userRole) {
      case "veteran":
        return "/veteran/dashboard"
      case "employer":
        return "/employer/dashboard"
      case "recruiter":
        return "/recruiter/dashboard"
      default:
        return "/veteran/dashboard"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-lg text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href={getDashboardLink()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Profile Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Profile Completion: <span className="font-semibold">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="w-24" />
              <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Alert */}
        <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-1">Complete Your Profile</h3>
                  <p className="text-orange-700 mb-2">
                    Your profile is {profileCompletion}% complete. Complete it to get better job matches.
                  </p>
                  <Progress value={profileCompletion} className="w-64 h-3" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">{profileCompletion}%</div>
                <div className="text-sm text-orange-700">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="military">Military Background</TabsTrigger>
            <TabsTrigger value="skills">Skills & Preferences</TabsTrigger>
            <TabsTrigger value="career">Career Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-600" />
                  Basic Information
                </CardTitle>
                <CardDescription>Update your personal and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profileData.firstName[0] || "U"}
                    {profileData.lastName[0] || "U"}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        className="pl-10 bg-gray-50"
                        disabled // Email should not be editable after registration
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="location"
                        placeholder="City, State"
                        value={profileData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/..."
                      value={profileData.linkedinProfile}
                      onChange={(e) => handleInputChange("linkedinProfile", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Professional Summary *</Label>
                  <Textarea
                    id="summary"
                    placeholder="Brief overview of your background and career objectives..."
                    className="min-h-[120px]"
                    value={profileData.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Military Background Tab */}
          <TabsContent value="military">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-green-600" />
                  Military Background
                </CardTitle>
                <CardDescription>Provide details about your military service and experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="serviceNumber">Service Number *</Label>
                    <Input
                      id="serviceNumber"
                      value={profileData.serviceNumber}
                      onChange={(e) => handleInputChange("serviceNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch of Service *</Label>
                    <Select value={profileData.branch} onValueChange={(value) => handleInputChange("branch", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="army">Indian Army</SelectItem>
                        <SelectItem value="navy">Indian Navy</SelectItem>
                        <SelectItem value="air_force">Indian Air Force</SelectItem>
                        <SelectItem value="coast_guard">Indian Coast Guard</SelectItem>
                        <SelectItem value="marines">Paramilitary Forces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rank">Final Rank *</Label>
                    <Input
                      id="rank"
                      value={profileData.rank}
                      onChange={(e) => handleInputChange("rank", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceStart">Service Start Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="serviceStart"
                        type="date"
                        value={profileData.serviceStartDate}
                        onChange={(e) => handleInputChange("serviceStartDate", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceEnd">Service End Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="serviceEnd"
                        type="date"
                        value={profileData.serviceEndDate}
                        onChange={(e) => handleInputChange("serviceEndDate", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clearance">Security Clearance</Label>
                    <Select
                      value={profileData.clearanceLevel}
                      onValueChange={(value) => handleInputChange("clearanceLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select clearance level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Confidential">Confidential</SelectItem>
                        <SelectItem value="Secret">Secret</SelectItem>
                        <SelectItem value="Top Secret">Top Secret</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deployments">Deployments & Key Assignments</Label>
                  <Textarea
                    id="deployments"
                    placeholder="List your deployments, duty stations, and key assignments..."
                    className="min-h-[120px]"
                    value={profileData.deployments}
                    onChange={(e) => handleInputChange("deployments", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Military Achievements & Awards</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {achievements.map((achievement) => (
                      <Badge key={achievement} variant="secondary" className="px-3 py-1">
                        {achievement}
                        <button
                          onClick={() => removeAchievement(achievement)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add achievement or award..."
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addAchievement()}
                    />
                    <Button onClick={addAchievement} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle>Skills & Competencies</CardTitle>
                <CardDescription>Map your military skills to civilian equivalents and add new skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Core Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="ml-2 text-gray-500 hover:text-gray-700">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <Button onClick={addSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Career Preferences</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Job Title</Label>
                      <Input
                        id="targetRole"
                        value={profileData.targetRole}
                        onChange={(e) => handleInputChange("targetRole", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workType">Work Type</Label>
                      <Select
                        value={profileData.workType}
                        onValueChange={(value) => handleInputChange("workType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Goals Tab */}
          <TabsContent value="career">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle>Career Goals & Transition Plan</CardTitle>
                <CardDescription>Define your career objectives and transition timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="careerGoals">Career Goals *</Label>
                  <Textarea
                    id="careerGoals"
                    placeholder="Describe your short-term and long-term career objectives..."
                    className="min-h-[120px]"
                    value={profileData.careerGoals}
                    onChange={(e) => handleInputChange("careerGoals", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Transition Timeline</Label>
                  <Select value={profileData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="Within 3 months">Within 3 months</SelectItem>
                      <SelectItem value="Within 6 months">Within 6 months</SelectItem>
                      <SelectItem value="Within 1 year">Within 1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-center pt-8">
          <Button onClick={handleSave} size="lg" className="bg-orange-600 hover:bg-orange-700" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Complete Profile
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
