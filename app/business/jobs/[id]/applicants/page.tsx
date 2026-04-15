'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, User, Star, Mail, Phone, 
  MapPin, Briefcase, CheckCircle, XCircle,
  Loader2, Zap, Award, Eye, MessageCircle,
  Crown, Shield, TrendingUp, AlertCircle,
  Users, AlertTriangle, Clock, Check, ThumbsUp
} from 'lucide-react'

interface Applicant {
  id: string
  job_id: string
  seeker_id: string
  status: string
  answers: Record<string, string>
  applied_at: string
  trust_score: number
  ranking: 'legendary' | 'highly_recommended' | 'recommended' | 'ordinary' | 'untrusted'
  seeker: {
    id: string
    user_id: string
    full_name: string
    email: string
    phone: string
    location: string
    bio: string
    skills: string[]
    cv_url: string
    experience_description: string
    portfolio_url: string
    github_url: string
    linkedin_url: string
  }
  profile: {
    grade: string
    points_balance: number
    is_identity_verified: boolean
    is_skill_verified: boolean
    is_premium: boolean
    avatar_url: string
    avg_rating: number
    total_ratings: number
    completed_jobs: number
  }
  rating?: {
    score: number
    review: string
    created_at: string
  }
}

export default function ApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'selected' | 'completed'>('pending')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [ratingHunter, setRatingHunter] = useState<Applicant | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get job details
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      setJob(jobData)

      // Get applicants with their profiles
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          *,
          seeker:seeker_id (
            id,
            user_id,
            phone,
            location,
            bio,
            skills,
            cv_url,
            experience_description,
            portfolio_url,
            github_url,
            linkedin_url
          )
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false })

      if (applications) {
        // Get ratings for this job
        const { data: ratings } = await supabase
          .from('ratings')
          .select('*')
          .eq('job_id', jobId)

        const ratingsMap = new Map()
        ratings?.forEach(rating => {
          ratingsMap.set(rating.to_user_id, rating)
        })

        // Get user profiles for each applicant
        const applicantsWithScores = await Promise.all(
          applications.map(async (app) => {
            // Get profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('grade, points_balance, is_identity_verified, is_skill_verified, is_premium, avatar_url, full_name, email')
              .eq('id', app.seeker.user_id)
              .single()

            // Get average rating
            const { data: allRatings } = await supabase
              .from('ratings')
              .select('score')
              .eq('to_user_id', app.seeker.user_id)

            const avgRating = allRatings?.length 
              ? allRatings.reduce((a, b) => a + b.score, 0) / allRatings.length 
              : 0

            // Get completed jobs count
            const { data: completedJobs } = await supabase
              .from('applications')
              .select('id')
              .eq('seeker_id', app.seeker.id)
              .eq('status', 'completed')

            // Calculate trust score
            let trustScore = 0
            
            const rankPoints: Record<string, number> = { E: 10, D: 25, C: 50, B: 80, A: 120, S: 200 }
            trustScore += rankPoints[profile?.grade || 'E'] || 10
            
            if (profile?.is_identity_verified) trustScore += 30
            if (profile?.is_skill_verified) trustScore += 50
            if (profile?.is_premium) trustScore += 100
            
            trustScore += Math.floor(avgRating * 10)
            trustScore += (completedJobs?.length || 0) * 5

            let ranking: 'legendary' | 'highly_recommended' | 'recommended' | 'ordinary' | 'untrusted'
            if (profile?.grade === 'S' || trustScore >= 300) {
              ranking = 'legendary'
            } else if (trustScore >= 200 || profile?.is_premium) {
              ranking = 'highly_recommended'
            } else if (trustScore >= 100) {
              ranking = 'recommended'
            } else if (avgRating < 2 && avgRating > 0) {
              ranking = 'untrusted'
            } else {
              ranking = 'ordinary'
            }

            // Get rating for this specific job
            const jobRating = ratingsMap.get(app.seeker.user_id)

            return {
              ...app,
              trust_score: trustScore,
              ranking,
              seeker: {
                ...app.seeker,
                full_name: profile?.full_name,
                email: profile?.email
              },
              profile: {
                ...profile,
                avg_rating: avgRating,
                total_ratings: allRatings?.length || 0,
                completed_jobs: completedJobs?.length || 0
              },
              rating: jobRating ? {
                score: jobRating.score,
                review: jobRating.review,
                created_at: jobRating.created_at
              } : undefined
            }
          })
        )

        setApplicants(applicantsWithScores as Applicant[])
      }
      setLoading(false)
    }

    fetchData()
  }, [jobId, router, supabase])

  const getRankingBadge = (ranking: string) => {
    switch (ranking) {
      case 'legendary':
        return { icon: Crown, color: 'text-purple-400 bg-purple-500/20 border-purple-500', label: 'LEGENDARY' }
      case 'highly_recommended':
        return { icon: TrendingUp, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500', label: 'HIGHLY RECOMMENDED' }
      case 'recommended':
        return { icon: Shield, color: 'text-blue-400 bg-blue-500/20 border-blue-500', label: 'RECOMMENDED' }
      case 'untrusted':
        return { icon: AlertCircle, color: 'text-red-400 bg-red-500/20 border-red-500', label: 'UNTRUSTED' }
      default:
        return { icon: User, color: 'text-gray-400 bg-gray-500/20 border-gray-500', label: 'ORDINARY' }
    }
  }

  const getRankColor = (grade: string) => {
    const colors: Record<string, string> = {
      E: 'text-gray-400', D: 'text-blue-400', C: 'text-green-400',
      B: 'text-yellow-400', A: 'text-orange-400', S: 'text-purple-400'
    }
    return colors[grade] || 'text-gray-400'
  }

  const handleAccept = async (applicantId: string) => {
    setUpdating(true)
    
    const { error } = await supabase
      .from('applications')
      .update({ status: 'selected' })
      .eq('id', applicantId)

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to accept applicant')
    } else {
      setApplicants(applicants.map(app => 
        app.id === applicantId ? { ...app, status: 'selected' } : app
      ))
      if (selectedApplicant?.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, status: 'selected' })
      }
      alert('Applicant accepted successfully!')
    }
    
    setUpdating(false)
  }

  const handleReject = async (applicantId: string) => {
    setUpdating(true)
    
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', applicantId)

    if (error) {
      console.error('Error updating status:', error)
      alert('Failed to reject applicant')
    } else {
      setApplicants(applicants.map(app => 
        app.id === applicantId ? { ...app, status: 'rejected' } : app
      ))
      if (selectedApplicant?.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, status: 'rejected' })
      }
      alert('Applicant rejected')
    }
    
    setUpdating(false)
    setShowRejectConfirm(false)
    setRejectingId(null)
  }

  const handleMessageHunter = async (applicant: Applicant) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: seekerProfile } = await supabase
      .from('seeker_profiles')
      .select('user_id')
      .eq('id', applicant.seeker_id)
      .single()
    
    if (!seekerProfile) {
      alert('Could not find hunter profile')
      return
    }
    
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', applicant.job_id)
      .eq('business_id', user.id)
      .eq('hunter_id', seekerProfile.user_id)
      .maybeSingle()
    
    let conversationId = existingConv?.id
    
    if (!existingConv) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          job_id: applicant.job_id,
          business_id: user.id,
          hunter_id: seekerProfile.user_id
        })
        .select()
        .single()
      
      if (!convError && newConv) {
        conversationId = newConv.id
      }
    }
    
    if (conversationId) {
      router.push(`/messages/${conversationId}`)
    } else {
      alert('Failed to start conversation')
    }
  }

  const handleCancel = async (applicantId: string) => {
    setUpdating(true)
    
    const { error } = await supabase
      .from('applications')
      .update({ status: 'cancelled' })
      .eq('id', applicantId)

    if (error) {
      console.error('Error canceling applicant:', error)
      alert('Failed to cancel applicant')
    } else {
      setApplicants(applicants.map(app => 
        app.id === applicantId ? { ...app, status: 'cancelled' } : app
      ))
      if (selectedApplicant?.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, status: 'cancelled' })
      }
      alert('Applicant has been cancelled')
    }
    
    setUpdating(false)
    setShowCancelConfirm(false)
    setCancelingId(null)
  }

  const handleSubmitRating = async () => {
    if (!ratingHunter) return
    if (ratingValue === 0) {
      alert('Please select a rating')
      return
    }

    setSubmittingRating(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('ratings')
      .insert({
        job_id: jobId,
        from_user_id: user?.id,
        to_user_id: ratingHunter.seeker.user_id,
        score: ratingValue,
        review: reviewText,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating')
    } else {
      alert('Rating submitted successfully!')
      setShowRatingModal(false)
      setRatingValue(0)
      setReviewText('')
      // Refresh the page to show the new rating
      window.location.reload()
    }
    setSubmittingRating(false)
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

  const pendingApplicants = applicants.filter(a => a.status === 'applied')
  const selectedApplicants = applicants.filter(a => a.status === 'selected')
  const completedApplicants = applicants.filter(a => a.status === 'completed')

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-purple-400">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{job?.title}</h1>
          <p className="text-gray-400 text-sm mt-1">
            ₦{job?.budget?.toLocaleString()} • {job?.job_type}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending ({pendingApplicants.length})
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'selected'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            Selected ({selectedApplicants.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Completed ({completedApplicants.length})
          </button>
        </div>

        {/* Pending Applicants */}
        {activeTab === 'pending' && (
          <>
            {pendingApplicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Pending Applicants</h2>
                <p className="text-gray-400 text-sm">All applicants have been reviewed</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApplicants.map((applicant) => {
                  const badge = getRankingBadge(applicant.ranking)
                  const BadgeIcon = badge.icon
                  return (
                    <div 
                      key={applicant.id} 
                      className="cursor-pointer" 
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setShowDetailsModal(true)
                      }}
                    >
                      <Card className="hover:border-purple-500/50 transition">
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            {applicant.profile?.avatar_url ? (
                              <img 
                                src={applicant.profile.avatar_url} 
                                alt={applicant.seeker?.full_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-bold text-white">{applicant.seeker?.full_name || 'Anonymous'}</h3>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${getRankColor(applicant.profile?.grade || 'E')}`}>
                                  {applicant.profile?.grade || 'E'}-Rank
                                </span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                                  <BadgeIcon className="w-3 h-3" />
                                  {badge.label}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= Math.round(applicant.profile?.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              ({applicant.profile?.total_ratings || 0})
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {applicant.seeker?.skills?.slice(0, 3).map((skill: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 rounded-full text-purple-300">
                                {skill}
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                            <div className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                              Pending
                            </div>
                            <p className="text-gray-500 text-xs">
                              Score: {applicant.trust_score}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Selected Applicants */}
        {activeTab === 'selected' && (
          <>
            {selectedApplicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Selected Applicants</h2>
                <p className="text-gray-400 text-sm">Accept applicants to see them here</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedApplicants.map((applicant) => {
                  const badge = getRankingBadge(applicant.ranking)
                  const BadgeIcon = badge.icon
                  return (
                    <Card key={applicant.id} className="border-green-500/30">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {applicant.profile?.avatar_url ? (
                            <img 
                              src={applicant.profile.avatar_url} 
                              alt={applicant.seeker?.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{applicant.seeker?.full_name || 'Anonymous'}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${getRankColor(applicant.profile?.grade || 'E')}`}>
                                {applicant.profile?.grade || 'E'}-Rank
                              </span>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= Math.round(applicant.profile?.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            ({applicant.profile?.total_ratings || 0})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {applicant.seeker?.skills?.slice(0, 2).map((skill: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 rounded-full text-purple-300">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                          <Button 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMessageHunter(applicant)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setShowDetailsModal(true)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-400 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => {
                              setCancelingId(applicant.id)
                              setShowCancelConfirm(true)
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Completed Applicants */}
        {activeTab === 'completed' && (
          <>
            {completedApplicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Completed Jobs</h2>
                <p className="text-gray-400 text-sm">Completed jobs will appear here</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedApplicants.map((applicant) => {
                  const badge = getRankingBadge(applicant.ranking)
                  const BadgeIcon = badge.icon
                  const hasRated = !!applicant.rating
                  
                  return (
                    <Card key={applicant.id} className="border-green-500/30">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {applicant.profile?.avatar_url ? (
                            <img 
                              src={applicant.profile.avatar_url} 
                              alt={applicant.seeker?.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{applicant.seeker?.full_name || 'Anonymous'}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${getRankColor(applicant.profile?.grade || 'E')}`}>
                                {applicant.profile?.grade || 'E'}-Rank
                              </span>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= Math.round(applicant.profile?.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            ({applicant.profile?.total_ratings || 0})
                          </span>
                        </div>

                        {/* Rating for this job */}
                        {hasRated ? (
                          <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                            <p className="text-xs text-purple-400 mb-1">Your Rating:</p>
                            <div className="flex items-center gap-2">
                              {renderStars(applicant.rating!.score)}
                              {applicant.rating?.review && (
                                <span className="text-xs text-gray-400">"{applicant.rating.review}"</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Rated on {new Date(applicant.rating!.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => {
                              setRatingHunter(applicant)
                              setShowRatingModal(true)
                            }}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Rate This Hunter
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Applicant Details Modal */}
      {showDetailsModal && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-purple-500/30">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Applicant Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {selectedApplicant.profile?.avatar_url ? (
                <img src={selectedApplicant.profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{selectedApplicant.seeker?.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-bold ${getRankColor(selectedApplicant.profile?.grade || 'E')}`}>
                    {selectedApplicant.profile?.grade || 'E'}-Rank
                  </span>
                  {selectedApplicant.profile?.is_premium && (
                    <span className="text-xs text-yellow-400">Premium</span>
                  )}
                  {selectedApplicant.profile?.is_skill_verified && (
                    <span className="text-xs text-green-400">✓ Skill Verified</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{selectedApplicant.seeker?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {selectedApplicant.seeker?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  {selectedApplicant.seeker.phone}
                </div>
              )}
              {selectedApplicant.seeker?.location && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  {selectedApplicant.seeker.location}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">{selectedApplicant.trust_score}</p>
                <p className="text-xs text-gray-400">Trust Score</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">{selectedApplicant.profile?.avg_rating?.toFixed(1) || '0'}</p>
                <p className="text-xs text-gray-400">Rating</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{selectedApplicant.profile?.completed_jobs || 0}</p>
                <p className="text-xs text-gray-400">Jobs Done</p>
              </div>
            </div>

            {selectedApplicant.seeker?.cv_url && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-purple-400 mb-2">CV/Resume</h4>
                <a href={selectedApplicant.seeker.cv_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  View CV
                </a>
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Application Answers</h4>
              <div className="space-y-3">
                {Object.entries(selectedApplicant.answers).map(([key, value], i) => (
                  <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-purple-400 text-xs mb-1">Question {parseInt(key) + 1}</p>
                    <p className="text-gray-300 text-sm">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-800">
              {selectedApplicant.status === 'applied' && (
                <>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAccept(selectedApplicant.id)}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Accept Applicant
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-400 border-red-500/50 hover:bg-red-500/10"
                    onClick={() => {
                      setRejectingId(selectedApplicant.id)
                      setShowRejectConfirm(true)
                    }}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {selectedApplicant.status === 'selected' && (
                <Button 
                  className="w-full"
                  onClick={() => handleMessageHunter(selectedApplicant)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Hunter
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingHunter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-2">Rate Your Experience</h3>
            <p className="text-gray-400 text-sm mb-4">
              How was your experience working with {ratingHunter.seeker?.full_name}?
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRatingModal(false)
                  setRatingValue(0)
                  setReviewText('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={handleSubmitRating}
                disabled={submittingRating || ratingValue === 0}
              >
                {submittingRating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                Submit Rating
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-xl font-bold text-white">Confirm Rejection</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to reject this applicant? 
              <span className="text-red-400 block mt-2 font-semibold">⚠️ This action cannot be undone!</span>
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowRejectConfirm(false)
                  setRejectingId(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => rejectingId && handleReject(rejectingId)}
                disabled={updating}
              >
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Yes, Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-xl font-bold text-white">Confirm Cancellation</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel this selected applicant?
              <span className="text-red-400 block mt-2 font-semibold">⚠️ This action cannot be undone! The applicant will be removed from selected list.</span>
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCancelConfirm(false)
                  setCancelingId(null)
                }}
              >
                Keep Applicant
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => cancelingId && handleCancel(cancelingId)}
                disabled={updating}
              >
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}