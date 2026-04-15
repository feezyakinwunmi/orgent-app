'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  Briefcase, Users, DollarSign, Eye, 
  Plus, TrendingUp, Clock, CheckCircle,
  Loader2, Zap, Award, Star
} from 'lucide-react'
import Link from 'next/link'

export default function BusinessDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    totalSpent: 0
  })
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const supabase = createClient()

useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)

    // Redirect if not business
    if (profileData?.role !== 'business') {
      router.push('/jobs')
      return
    }

    // Get business profile
    const { data: businessData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setBusinessProfile(businessData)

    // Get jobs
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*, applications:applications(count)')
      .eq('business_id', businessData?.id)
      .order('created_at', { ascending: false })

    // Calculate actual total spent from released job offers
    let actualTotalSpent = 0

    if (jobsData && jobsData.length > 0) {
      const jobIds = jobsData.map(job => job.id)
      
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, job_id')
        .in('job_id', jobIds)
      
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        
        const { data: releasedOffers } = await supabase
          .from('job_offers')
          .select('offered_amount')
          .in('conversation_id', conversationIds)
          .eq('status', 'released')
        
        if (releasedOffers) {
          actualTotalSpent = releasedOffers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0)
        }
      }
    }

    if (jobsData) {
      setRecentJobs(jobsData.slice(0, 5))
      setStats({
        totalJobs: jobsData.length,
        activeJobs: jobsData.filter(j => j.status === 'open').length,
        totalApplicants: jobsData.reduce((acc, j) => acc + (j.applications?.[0]?.count || 0), 0),
        totalSpent: actualTotalSpent
      })
    }

    setLoading(false)
  }

  fetchData()
}, [router, supabase])

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

      {/* Header */}
      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
              </div>
              <h1 className="text-xl font-bold text-white">Business Hub</h1>
            </div>
           
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {businessProfile?.business_name || 'Business'}
          </h2>
          <p className="text-gray-400">Manage your jobs, find talent, and grow your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Jobs</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeJobs}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Applicants</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalApplicants}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-yellow-400">₦{stats.totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50">
            <div className="p-6 text-center">
              <Plus className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Post a New Job</h3>
              <p className="text-gray-400 text-sm mb-4">
                Create a new gig and find talented hunters
              </p>
              <Button onClick={() => router.push('/business/jobs/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/50">
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">View Applicants</h3>
              <p className="text-gray-400 text-sm mb-4">
                Review and manage job applications
              </p>
              <Button variant="outline" onClick={() => router.push('/business/applicants')}>
                View Applicants
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Jobs</h3>
            <Link href="/business/jobs" className="text-purple-400 text-sm hover:underline">
              View All →
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No jobs posted yet</p>
              <Button variant="outline" className="mt-3" onClick={() => router.push('/business/jobs/create')}>
                Post Your First Job
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Card key={job.id} className="hover:border-purple-500/50 transition">
                  <div className="py-4 flex flex-col items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white">{job.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          job.status === 'open' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {job.status === 'open' ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        ₦{job.budget.toLocaleString()} • {job.job_type} • {job.location || 'Remote'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/business/jobs/${job.id}/applicants`)}>
                        <Users className="w-4 h-4 mr-1" />
                        View Applicants
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}