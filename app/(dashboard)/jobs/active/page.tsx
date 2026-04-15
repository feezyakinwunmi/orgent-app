'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  Briefcase, History, Zap, Loader2, 
  ChevronLeft, CheckCircle, Clock, XCircle, MapPin,
  Star, ThumbsUp, MessageCircle, DollarSign, Check, FileText, Link as LinkIcon
} from 'lucide-react'

interface Application {
  id: string
  job_id: string
  status: 'applied' | 'selected' | 'rejected' | 'completed' | 'canceled'
  answers: Record<string, string>
  applied_at: string
  selected_at?: string
  jobs?: {
    id: string
    title: string
    budget: number
    job_type: string
    location: string | null
    description?: string
    business_id?: string
    status?: string
  }
  job_offers?: {
    id: string
    status: string
    offered_amount: number
    hunter_amount: number
    platform_fee: number
    work_submitted_at: string
    work_description: string
    work_link: string
    released_at: string
  }
  rating?: {
    score: number
    review: string
  }
}

export default function ActiveJobsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const supabase = createClient()
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const { data: seekerProfile } = await supabase
          .from('seeker_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!seekerProfile) {
          setLoading(false)
          return
        }

        await fetchApplications(seekerProfile.id, user.id)

        const subscription = supabase
          .channel('applications_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'applications',
              filter: `seeker_id=eq.${seekerProfile.id}`
            },
            () => {
              fetchApplications(seekerProfile.id, user.id)
            }
          )
          .subscribe()

        return () => {
          subscription.unsubscribe()
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchApplications = async (seekerId: string, userId: string) => {
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('seeker_id', seekerId)
        .order('applied_at', { ascending: false })

      if (appsError) {
        console.error('Error fetching applications:', appsError)
        return
      }

      if (!apps || apps.length === 0) {
        setApplications([])
        return
      }

      const jobIds = apps.map(app => app.job_id)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError)
      }

      const jobsMap = new Map()
      jobsData?.forEach(job => {
        jobsMap.set(job.id, job)
      })

      // Fetch job offers for these applications
      const applicationIds = apps.map(app => app.id)
      const { data: jobOffers } = await supabase
        .from('job_offers')
        .select('*')
        .in('application_id', applicationIds)

      const offersMap = new Map()
      jobOffers?.forEach(offer => {
        offersMap.set(offer.application_id, offer)
      })

      const { data: ratings } = await supabase
        .from('ratings')
        .select('*')
        .eq('from_user_id', userId)

      const applicationsWithDetails = apps.map(app => {
        const job = jobsMap.get(app.job_id)
        const jobOffer = offersMap.get(app.id)
        const rating = ratings?.find(r => r.job_id === app.job_id)

        return {
          ...app,
          jobs: job || {
            title: 'Loading...',
            budget: 0,
            job_type: 'Unknown',
            location: null
          },
          job_offers: jobOffer,
          rating: rating
        }
      })

      setApplications(applicationsWithDetails)
    }

    fetchData()
  }, [router, supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, text: 'Pending Review' }
      case 'selected':
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, text: 'Selected' }
      case 'rejected':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, text: 'Not Selected' }
      case 'completed':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, text: 'Completed' }
      case 'canceled':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle, text: 'Canceled' }
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock, text: status }
    }
  }

  const activeApplications = applications.filter(app => {
    return app.status === 'applied' || app.status === 'selected'
  })
  
  const completedApplications = applications.filter(app => {
    return app.status === 'completed' || app.status === 'rejected' || app.status === 'canceled'
  })

  const handleSubmitRating = async (rating: number, review: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedJob) {
      alert('You must be logged in to submit a rating')
      return
    }

    if (rating === 0) {
      alert('Please select a rating before submitting')
      return
    }

    try {
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('user_id')
        .eq('id', selectedJob.jobs?.business_id)
        .single()

      if (businessError || !businessProfile) {
        console.error('Business profile not found:', businessError)
        alert('Unable to submit rating: Business profile not found')
        return
      }

      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('job_id', selectedJob.job_id)
        .eq('from_user_id', user.id)
        .maybeSingle()

      let error
      if (existingRating) {
        const { error: updateError } = await supabase
          .from('ratings')
          .update({
            score: rating,
            review: review,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('ratings')
          .insert({
            job_id: selectedJob.job_id,
            from_user_id: user.id,
            to_user_id: businessProfile.user_id,
            score: rating,
            review: review,
            created_at: new Date().toISOString()
          })
        error = insertError
      }

      if (error) {
        console.error('Error submitting rating:', error)
        alert(`Failed to submit rating: ${error.message}`)
      } else {
        alert('Rating submitted successfully! Thank you for your feedback!')
        setShowRatingModal(false)
        setRatingValue(0)
        setReviewText('')
        window.location.reload()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const renderStars = (rating: number, interactive = false, onClick?: (value: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onClick?.(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            disabled={!interactive}
            type="button"
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-600'
              } ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const currentApplications = activeTab === 'active' ? activeApplications : completedApplications

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
              My Jobs
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track your gig applications and completed work
            </p>
          </div>

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
              Active ({activeApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Completed ({completedApplications.length})
            </button>
          </div>

          {currentApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/30">
                {activeTab === 'active' ? (
                  <Briefcase className="w-10 h-10 text-purple-400" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-purple-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {activeTab === 'active' ? 'No Active Applications' : 'No Completed Jobs'}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {activeTab === 'active' 
                  ? 'Start applying to gigs to see them here'
                  : 'Complete jobs to see your work history'}
              </p>
              {activeTab === 'active' && (
                <Button onClick={() => router.push('/jobs')}>
                  Browse Gigs
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentApplications.map((app) => {
                const status = getStatusBadge(app.status)
                const StatusIcon = status.icon
                
                return (
                  <Card key={app.id} className="bg-gradient-to-br from-purple-900/20 to-black/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 transition-all">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                              {app.jobs?.job_type || 'Remote'}
                            </span>
                            {app.jobs?.location && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {app.jobs.location}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {app.jobs?.title || 'Untitled Job'}
                          </h3>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        {app.job_offers ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span>₦{app.job_offers.offered_amount.toLocaleString()}</span>
                            <span className="text-xs text-gray-500">(₦{app.job_offers.hunter_amount.toLocaleString()} after fee)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>₦{app.jobs?.budget?.toLocaleString() || '0'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span className="capitalize">{app.jobs?.job_type || 'Unknown'}</span>
                        </div>
                      </div>

                      {/* Show work details if released */}
                      {app.job_offers?.work_link && (
                        <div className="mt-3 mb-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                          <p className="text-xs text-gray-400 mb-1">Work Submitted:</p>
                          <a 
                            href={app.job_offers.work_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm break-all"
                          >
                            {app.job_offers.work_link}
                          </a>
                          {app.job_offers.work_description && (
                            <p className="text-gray-300 text-xs mt-2">{app.job_offers.work_description}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-2">
                            Released on: {new Date(app.job_offers.released_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-gray-500 text-xs">
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                        
                        {activeTab === 'completed' && app.status === 'completed' && (
                          <div className="flex items-center gap-3">
                            {app.rating ? (
                              <div className="flex items-center gap-2">
                                {renderStars(app.rating.score)}
                                <span className="text-xs text-gray-500">{app.rating.review}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedJob(app)
                                  setShowRatingModal(true)
                                }}
                                className="text-purple-400 text-xs hover:text-purple-300 flex items-center gap-1 transition"
                              >
                                <Star className="w-3 h-3" />
                                Leave Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {showRatingModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-purple-500/30 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Rate Your Experience</h3>
            <p className="text-gray-400 text-sm mb-4">
              How was your experience with {selectedJob.jobs?.title}?
            </p>
            
            <div className="flex justify-center mb-4">
              {renderStars(ratingValue, true, setRatingValue)}
            </div>
            
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
              rows={3}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false)
                  setRatingValue(0)
                  setReviewText('')
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitRating(ratingValue, reviewText)}
                disabled={ratingValue === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}