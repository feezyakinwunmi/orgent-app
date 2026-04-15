'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { GlowText } from '@/app/components/ui/GlowText'
import { Card } from '@/app/components/ui/Card'
import { 
  Zap, ArrowLeft, CheckCircle, AlertCircle, 
  Home, Building, Briefcase, MapPin, Clock, Award 
} from 'lucide-react'
import type { Job } from '@/app/types/jobs'

export default function JobApplicationPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pointsDeducted, setPointsDeducted] = useState(0)
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchJobAndCheckApplication = async () => {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get job from localStorage first (from the jobs page)
      const storedJob = localStorage.getItem('applyingJob')
      let currentJob: Job | null = null
      
      if (storedJob) {
        currentJob = JSON.parse(storedJob)
        setJob(currentJob)
        localStorage.removeItem('applyingJob')
      } else {
        // Fallback: fetch from database
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (error) {
          console.error('Error fetching job:', error)
          router.push('/jobs')
          return
        }
        currentJob = data as Job
        setJob(currentJob)
      }

      // Check if user has already applied for this job
      if (user && currentJob) {
        // First, get the seeker profile
        const { data: seekerProfile } = await supabase
          .from('seeker_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (seekerProfile) {
          // Check for existing application
          const { data: existingApplication, error: appError } = await supabase
            .from('applications')
            .select('id, status')
            .eq('seeker_id', seekerProfile.id)
            .eq('job_id', currentJob.id)
            .maybeSingle()

          if (existingApplication) {
            setHasApplied(true)
            setError(`You have already applied for this job. Application status: ${existingApplication.status}`)
          }
        }
      }
      
      setLoading(false)
      setCheckingApplication(false)
    }

    fetchJobAndCheckApplication()
  }, [jobId, router, supabase])

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({ ...prev, [index]: value }))
  }

  const handleSubmit = async () => {
    // Check if already applied
    if (hasApplied) {
      setError('You have already applied for this job. You cannot apply twice.')
      return
    }

    // Check if all questions are answered
    if (!job) return
    
    const unanswered = job.questions.filter((_, index) => !answers[index]?.trim())
    if (unanswered.length > 0) {
      setError(`Please answer all ${unanswered.length} question(s) before submitting`)
      return
    }

    setSubmitting(true)
    setError('')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Double-check again before submitting to prevent race conditions
    const { data: seekerProfile } = await supabase
      .from('seeker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (seekerProfile) {
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('seeker_id', seekerProfile.id)
        .eq('job_id', job.id)
        .maybeSingle()

      if (existingApplication) {
        setError('You have already applied for this job. You cannot apply twice.')
        setSubmitting(false)
        return
      }
    }

    // Format answers as JSONB
    const formattedAnswers: Record<string, string> = {}
    Object.keys(answers).forEach(key => {
      formattedAnswers[key] = answers[parseInt(key)]
    })

    // Call the apply_for_job RPC function
    const { data, error: submitError } = await supabase.rpc('apply_for_job', {
      p_job_id: job.id,
      p_seeker_id: user.id,
      p_answers: formattedAnswers
    })

    if (submitError) {
      console.error('Submit error:', submitError)
      setError(submitError.message)
    } else if (data && !data.success) {
      setError(data.error)
    } else if (data && data.success) {
      setPointsDeducted(data.points_deducted)
      setSuccess(true)
      setTimeout(() => {
        router.push('/jobs/active')
      }, 3000)
    }
    setSubmitting(false)
  }

  if (loading || checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-purple-400">Loading job details...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
          <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-400 mb-2">
            Your application for <span className="text-purple-400">{job.title}</span> has been sent.
          </p>
          
          <p className="text-yellow-400 text-sm mb-2">
            ⚠️ {pointsDeducted} points were deducted. No refunds if rejected!
          </p>
          <p className="text-red-400 text-xs mb-6">
            This is the dungeon. Choose your battles wisely.
          </p>
          <Button onClick={() => router.push('/jobs/active')}>
            View My Applications
          </Button>
        </motion.div>
      </div>
    )
  }

  const getJobTypeIcon = () => {
    switch (job.job_type) {
      case 'remote': return <Home className="w-4 h-4" />
      case 'onsite': return <Building className="w-4 h-4" />
      case 'hybrid': return <Briefcase className="w-4 h-4" />
      default: return <Briefcase className="w-4 h-4" />
    }
  }

  const getGradeColor = () => {
    const colors: Record<string, string> = {
      E: 'text-gray-400 border-gray-500',
      D: 'text-blue-400 border-blue-500',
      C: 'text-green-400 border-green-500',
      B: 'text-yellow-400 border-yellow-500',
      A: 'text-orange-400 border-orange-500',
      S: 'text-purple-400 border-purple-500',
    }
    return colors[job.grade_required] || 'text-gray-400 border-gray-500'
  }

  // Points cost for display
 const pointsCost: Record<string, number> = {
  'E': 10,
  'D': 30,
  'C': 60,
  'B': 120,
  'A': 200,
  'S': 300
}
  const requiredPoints = pointsCost[job.grade_required] 

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      {/* Header */}
      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Jobs</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Already Applied Banner */}
          {hasApplied && (
            <div className="mb-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Already Applied</span>
              </div>
              <p className="text-red-300 text-sm">
                You have already submitted an application for this position. 
                You cannot apply again. Check your <button 
                  onClick={() => router.push('/jobs/active')}
                  className="text-purple-400 hover:underline"
                >
                  Active Jobs
                </button> page for status updates.
              </p>
            </div>
          )}

          {/* Points Info Banner */}
          {!hasApplied && (
            <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p className="text-sm text-yellow-400 text-center">
                This {job.grade_required}-Rank job costs <span className="font-bold">{requiredPoints} points</span> to apply
              </p>
            </div>
          )}

          {/* Job Card */}
          <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-black/50 backdrop-blur-sm border-2 border-purple-500/30">
            {/* Grade Badge */}
            <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border ${getGradeColor()} text-xs font-bold`}>
              {job.grade_required}-Rank Required • {requiredPoints} pts
            </div>

            <div className="pt-8">
              <h1 className="text-2xl font-bold text-white mb-3 pr-20">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 text-yellow-400 mb-4">
                <Zap className="w-5 h-5" />
                <span className="text-3xl font-bold">₦{job.budget.toLocaleString()}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs px-3 py-1.5 bg-purple-500/20 rounded-full text-purple-300 capitalize flex items-center gap-1.5 border border-purple-500/30">
                  {getJobTypeIcon()}
                  {job.job_type}
                </span>
                {job.location && (
                  <span className="text-xs px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-300 flex items-center gap-1.5 border border-blue-500/30">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}
              </div>

              <div className="mb-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
                <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Job Description
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Questions Section - Only show if not applied */}
          {!hasApplied && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Application Questions
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Please answer all questions carefully. The business owner will review your responses.
                </p>

                <div className="space-y-5">
                  {job.questions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-5"
                    >
                      <label className="block text-sm font-medium text-purple-400 mb-2">
                        Question {index + 1} of {job.questions.length}
                      </label>
                      <p className="text-white text-base mb-3 font-medium">
                        {question}
                      </p>
                      <textarea
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none"
                        placeholder="Type your answer here..."
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="sticky bottom-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || hasApplied}
                  className="w-full py-4 text-lg shadow-xl shadow-purple-500/30"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : hasApplied ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Already Applied
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Submit Application ({requiredPoints} points will be deducted)
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Show View Applications button if already applied */}
          {hasApplied && (
            <div className="sticky bottom-4">
              <Button
                onClick={() => router.push('/jobs/active')}
                className="w-full py-4 text-lg"
              >
                View My Applications
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}