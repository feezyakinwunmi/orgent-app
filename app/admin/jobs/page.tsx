'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  Search, Briefcase, MapPin, Zap, Clock, 
  Trash2, Eye, AlertCircle, Loader2,
  Building, CheckCircle, XCircle,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  job_type: string
  location: string
  status: string
  grade_required: string
  created_at: string
  business_profiles: {
    business_name: string
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select(`
        *,
        business_profiles (
          business_name
        )
      `)
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    if (data) {
      setJobs(data as Job[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [searchTerm, statusFilter])

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId)
    await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)
    fetchJobs()
    setActionLoading(null)
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    setActionLoading(jobId)
    await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
    fetchJobs()
    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Open' }
      case 'closed':
        return { color: 'bg-gray-500/20 text-gray-400', icon: XCircle, label: 'Closed' }
      case 'filled':
        return { color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle, label: 'Filled' }
      default:
        return { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: status }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className='p-6 px-4'>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Jobs Management</h1>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const status = getStatusBadge(job.status)
          const StatusIcon = status.icon
          
          return (
            <Card key={job.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {job.business_profiles?.business_name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      ₦{job.budget.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Briefcase className="w-3 h-3" />
                      {job.job_type}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-purple-400" />
                      {job.grade_required}-Rank
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm line-clamp-2">{job.description}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/jobs/${job.id}`}>
                    <button className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                  {job.status === 'open' ? (
                    <button
                      onClick={() => updateJobStatus(job.id, 'closed')}
                      disabled={actionLoading === job.id}
                      className="px-3 py-1.5 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition"
                    >
                      {actionLoading === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Close'}
                    </button>
                  ) : (
                    <button
                      onClick={() => updateJobStatus(job.id, 'open')}
                      disabled={actionLoading === job.id}
                      className="px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition"
                    >
                      {actionLoading === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reopen'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteJob(job.id)}
                    disabled={actionLoading === job.id}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}

        {jobs.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No jobs found</p>
          </Card>
        )}
      </div>
    </div>
  )
}