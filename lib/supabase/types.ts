export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      veteran_profiles: {
        Row: {
          id: string
          user_id: string
          service_number: string | null
          military_branch: string | null
          rank: string | null
          years_of_service: number | null
          deployment_history: string[] | null
          security_clearance: string | null
          discharge_type: string | null
          service_start_date: string | null
          service_end_date: string | null
          current_location: string | null
          willing_to_relocate: boolean | null
          preferred_locations: string[] | null
          resume_url: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          bio: string | null
          skills: string[] | null
          certifications: string[] | null
          awards: string[] | null
          languages: string[] | null
          salary_expectation_min: number | null
          salary_expectation_max: number | null
          job_preferences: string[] | null
          availability_date: string | null
          profile_completion_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_number?: string | null
          military_branch?: string | null
          rank?: string | null
          years_of_service?: number | null
          deployment_history?: string[] | null
          security_clearance?: string | null
          discharge_type?: string | null
          service_start_date?: string | null
          service_end_date?: string | null
          current_location?: string | null
          willing_to_relocate?: boolean | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          bio?: string | null
          skills?: string[] | null
          certifications?: string[] | null
          awards?: string[] | null
          languages?: string[] | null
          salary_expectation_min?: number | null
          salary_expectation_max?: number | null
          job_preferences?: string[] | null
          availability_date?: string | null
          profile_completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_number?: string | null
          military_branch?: string | null
          rank?: string | null
          years_of_service?: number | null
          deployment_history?: string[] | null
          security_clearance?: string | null
          discharge_type?: string | null
          service_start_date?: string | null
          service_end_date?: string | null
          current_location?: string | null
          willing_to_relocate?: boolean | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          bio?: string | null
          skills?: string[] | null
          certifications?: string[] | null
          awards?: string[] | null
          languages?: string[] | null
          salary_expectation_min?: number | null
          salary_expectation_max?: number | null
          job_preferences?: string[] | null
          availability_date?: string | null
          profile_completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          requirements: string[] | null
          responsibilities: string[] | null
          benefits: string[] | null
          job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance"
          experience_level: "entry" | "mid" | "senior" | "executive"
          salary_min: number | null
          salary_max: number | null
          location: string | null
          is_remote: boolean
          skills_required: string[] | null
          education_requirements: string | null
          security_clearance_required: string | null
          veteran_preference: boolean
          application_deadline: string | null
          is_active: boolean
          views_count: number
          applications_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          description: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          benefits?: string[] | null
          job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance"
          experience_level: "entry" | "mid" | "senior" | "executive"
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          is_remote?: boolean
          skills_required?: string[] | null
          education_requirements?: string | null
          security_clearance_required?: string | null
          veteran_preference?: boolean
          application_deadline?: string | null
          is_active?: boolean
          views_count?: number
          applications_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          benefits?: string[] | null
          job_type?: "full_time" | "part_time" | "contract" | "internship" | "freelance"
          experience_level?: "entry" | "mid" | "senior" | "executive"
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          is_remote?: boolean
          skills_required?: string[] | null
          education_requirements?: string | null
          security_clearance_required?: string | null
          veteran_preference?: boolean
          application_deadline?: string | null
          is_active?: boolean
          views_count?: number
          applications_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          veteran_id: string
          recruiter_id: string | null
          status: "pending" | "reviewed" | "shortlisted" | "interviewed" | "offered" | "hired" | "rejected"
          cover_letter: string | null
          resume_url: string | null
          additional_documents: string[] | null
          interview_date: string | null
          interview_notes: string | null
          feedback: string | null
          salary_offered: number | null
          match_score: number | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          veteran_id: string
          recruiter_id?: string | null
          status?: "pending" | "reviewed" | "shortlisted" | "interviewed" | "offered" | "hired" | "rejected"
          cover_letter?: string | null
          resume_url?: string | null
          additional_documents?: string[] | null
          interview_date?: string | null
          interview_notes?: string | null
          feedback?: string | null
          salary_offered?: number | null
          match_score?: number | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          veteran_id?: string
          recruiter_id?: string | null
          status?: "pending" | "reviewed" | "shortlisted" | "interviewed" | "offered" | "hired" | "rejected"
          cover_letter?: string | null
          resume_url?: string | null
          additional_documents?: string[] | null
          interview_date?: string | null
          interview_notes?: string | null
          feedback?: string | null
          salary_offered?: number | null
          match_score?: number | null
          applied_at?: string
          updated_at?: string
        }
      }
    }
  }
}
