export type JobType = 'remote' | 'onsite' | 'hybrid'
export type JobStatus = 'open' | 'closed' | 'filled' | 'expired'
export type Grade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

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
  business_profiles?: {
    id: string
    business_name: string
    logo_url: string | null
  }
}