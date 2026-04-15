'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Bookmark, BookmarkCheck, Zap, 
  Briefcase, MapPin, Home, Building, Clock, Trash2,
  Loader2
} from 'lucide-react'
import type { Job } from '@/app/types/jobs'

interface SavedJobWithDetails {
  id: string
  job_id: string
  created_at: string
  job: Job
}

export default function SavedJobsPage() {
  const router = useRouter()
  const [savedJobs, setSavedJobs] = useState<SavedJobWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSavedJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Get saved jobs with job details
      const { data: savedData, error } = await supabase
        .from('saved_jobs')
        .select(`
          id,
          job_id,
          created_at,
          jobs:job_id (
            id,
            title,
            description,
            budget,
            job_type,
            location,
            grade_required,
            questions,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching saved jobs:', error)
      } else if (savedData) {
        const formatted = savedData.map((item: any) => ({
          id: item.id,
          job_id: item.job_id,
          created_at: item.created_at,
          job: item.jobs
        }))
        setSavedJobs(formatted)
      }
      setLoading(false)
    }

    fetchSavedJobs()
  }, [router, supabase])

  const handleRemoveSaved = async (savedId: string, jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', savedId)

    setSavedJobs(prev => prev.filter(job => job.id !== savedId))
  }

  const handleApply = (job: Job) => {
    localStorage.setItem('applyingJob', JSON.stringify(job))
    router.push(`/jobs/apply/${job.id}`)
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'remote': return <Home className="w-4 h-4" />
      case 'onsite': return <Building className="w-4 h-4" />
      case 'hybrid': return <Briefcase className="w-4 h-4" />
      default: return <Briefcase className="w-4 h-4" />
    }
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      E: 'text-gray-400 border-gray-500',
      D: 'text-blue-400 border-blue-500',
      C: 'text-green-400 border-green-500',
      B: 'text-yellow-400 border-yellow-500',
      A: 'text-orange-400 border-orange-500',
      S: 'text-purple-400 border-purple-500',
    }
    return colors[grade] || 'text-gray-400 border-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-purple-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-bold text-white">{profile?.points_balance || 0} pts</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Saved Jobs
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {savedJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/30">
                <Bookmark className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Saved Jobs</h2>
              <p className="text-gray-400 text-sm mb-6">
                Save jobs you're interested in and they'll appear here
              </p>
              <Button onClick={() => router.push('/jobs')}>
                Browse Gigs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((saved) => {
                const job = saved.job
                if (!job) return null
                
                return (
                  <Card key={saved.id} className="bg-gradient-to-br from-purple-900/20 to-black/50 backdrop-blur-sm border border-purple-500/30">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className={`inline-block px-2 py-0.5 rounded-full border text-xs font-bold mb-2 ${getGradeColor(job.grade_required)}`}>
                            {job.grade_required}-Rank
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {job.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleRemoveSaved(saved.id, job.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>₦{job.budget?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getJobTypeIcon(job.job_type)}
                          <span className="capitalize">{job.job_type}</span>
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/jobs/apply/${job.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApply(job)}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Apply Now
                        </Button>
                      </div>

                      <p className="text-gray-500 text-xs mt-3">
                        Saved {new Date(saved.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}