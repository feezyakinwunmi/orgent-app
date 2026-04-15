export type UserRole = 'seeker' | 'business'
export type Grade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type JobType = 'remote' | 'onsite' | 'hybrid'
export type JobStatus = 'open' | 'closed' | 'filled' | 'expired'
export type ApplicationStatus = 'applied' | 'selected' | 'rejected' | 'completed' | 'cancelled'
export type EscrowStatus = 'pending' | 'held' | 'released' | 'disputed' | 'refunded'

export interface Profile {
  id: string
  email: string
  role: UserRole
  points_balance: number
  grade: Grade
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  business_id: string
  title: string
  description: string
  budget: number
  job_type: JobType
  location: string | null
  grade_required: Grade
  questions: string[]
  status: JobStatus
  created_at: string
  expires_at: string | null
}