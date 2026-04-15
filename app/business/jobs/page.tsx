'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Plus, Eye, Users, 
  MoreVertical, Loader2, Zap, MapPin,
  Clock, CheckCircle, XCircle, Trash2,
  Briefcase
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  job_type: string
  location: string | null
  grade_required: string
  status: string
  created_at: string
  applications_count?: number
}

export default function BusinessJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get business profile
      const { data: business } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      setBusinessProfile(business)

      if (business) {
        // Get jobs with application counts
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            *,
            applications:applications(count)
          `)
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })

        if (jobsData) {
          const formatted = jobsData.map((job: any) => ({
            ...job,
            applications_count: job.applications?.[0]?.count || 0
          }))
          setJobs(formatted as Job[])
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)

    if (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job status')
    } else {
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ))
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    } else {
      setJobs(jobs.filter(job => job.id !== jobId))
    }
  }

  const activeJobs = jobs.filter(job => job.status === 'open')
  const closedJobs = jobs.filter(job => job.status === 'closed' || job.status === 'filled')

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
            <button onClick={() => router.back()} className="flex items-center gap-2 text-purple-400">
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <Button size="sm" onClick={() => router.push('/business/jobs/create')}>
              <Plus className="w-4 h-4 mr-1" />
              Post Job
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">My Jobs</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'closed'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Closed ({closedJobs.length})
          </button>
        </div>

        {activeTab === 'active' && activeJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Active Jobs</h2>
            <p className="text-gray-400 text-sm mb-6">Post your first job to find talented hunters</p>
            <Button onClick={() => router.push('/business/jobs/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
          </div>
        )}

        {activeTab === 'closed' && closedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Closed Jobs</h2>
            <p className="text-gray-400 text-sm">Completed jobs will appear here</p>
          </div>
        )}

        <div className="space-y-4">
          {(activeTab === 'active' ? activeJobs : closedJobs).map((job) => (
            <Card key={job.id} className="hover:border-purple-500/50 transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        ₦{job.budget.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {job.job_type}
                      </span>
                      {job.location && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                      )}
                      <span className="text-xs text-purple-400">
                        {job.grade_required}-Rank
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/business/jobs/${job.id}/applicants`)}
                      className="p-2 hover:bg-purple-500/20 rounded-lg transition"
                      title="View Applicants"
                    >
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-xs ml-1">{job.applications_count || 0}</span>
                    </button>
                    {activeTab === 'active' && (
                      <button
                        onClick={() => handleUpdateStatus(job.id, 'closed')}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition"
                        title="Close Job"
                      >
                        <XCircle className="w-4 h-4 text-yellow-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {job.description}
                </p>

                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-xs">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/business/jobs/${job.id}/applicants`)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View Applicants ({job.applications_count || 0})
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}