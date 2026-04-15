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
  Crown, Shield, TrendingUp, Calendar, 
  Download, ExternalLink, FileText, Image, Clock, ThumbsUp,
  Verified,
  AlertCircle,
  StarIcon,
  BadgeCheck
} from 'lucide-react'
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'

interface WorkSample {
  image_url: string
  title: string
  link: string
  description: string
}

interface Rating {
  score: number
  review: string
  created_at: string
  from_user: {
    full_name: string
    avatar_url: string
  }
}

export default function ApplicantProfilePage() {
  const params = useParams()
  const router = useRouter()
  const applicantId = params.id as string
  const [loading, setLoading] = useState(true)
  const [applicant, setApplicant] = useState<any>(null)
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchApplicantProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get the applicant's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', applicantId)
        .single()

      if (!profile) {
        router.back()
        return
      }

      // Get seeker profile
      const { data: seekerProfile } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', applicantId)
        .single()

      // Get work samples
      if (seekerProfile?.work_samples) {
        setWorkSamples(seekerProfile.work_samples)
      }

      // Get ratings received
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select(`
          *,
          from_user:from_user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('to_user_id', applicantId)
        .order('created_at', { ascending: false })

      if (ratingsData) {
        setRatings(ratingsData as Rating[])
      }

      // Get completed jobs
const { data: seekerProfileId } = await supabase
  .from('seeker_profiles')
  .select('id')
  .eq('user_id', applicantId)
  .single()

let completedJobsData = []
if (seekerProfileId) {
  const { data: completedApps } = await supabase
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        title,
        budget,
        job_type,
        location,
        grade_required
      )
    `)
    .eq('seeker_id', seekerProfileId.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (completedApps) {
    completedJobsData = completedApps
  }
}

      // Calculate trust score
      let trustScore = 0
      const rankPoints: Record<string, number> = { E: 10, D: 25, C: 50, B: 80, A: 120, S: 200 }
      trustScore += rankPoints[profile?.grade || 'E'] || 10
      if (profile?.is_identity_verified) trustScore += 30
      if (profile?.is_skill_verified) trustScore += 50
      if (profile?.is_premium) trustScore += 100
      
      const avgRating = ratingsData?.length 
        ? ratingsData.reduce((a, b) => a + b.score, 0) / ratingsData.length 
        : 0
      trustScore += Math.floor(avgRating * 10)
      trustScore += (completedJobsData.length || 0) * 5

     setApplicant({
  ...profile,
  seeker_profile: seekerProfile,
  trust_score: trustScore,
  avg_rating: avgRating,
  total_ratings: ratingsData?.length || 0,
  completed_jobs_count: completedJobsData.length
})

setCompletedJobs(completedJobsData)

      setLoading(false)
    }

    fetchApplicantProfile()
  }, [applicantId, router, supabase])

  const getRankColor = (grade: string) => {
    const colors: Record<string, string> = {
      E: 'text-gray-400',
      D: 'text-blue-400',
      C: 'text-green-400',
      B: 'text-yellow-400',
      A: 'text-orange-400',
      S: 'text-purple-400',
    }
    return colors[grade] || 'text-gray-400'
  }

  const getRankingBadge = () => {
    if (!applicant) return null
    if (applicant.grade === 'S' || applicant.trust_score >= 300) {
      return { icon: Crown, label: 'LEGENDARY HUNTER', color: 'text-purple-400 bg-purple-500/20 border-purple-500' }
    }
    if (applicant.trust_score >= 200 || applicant.is_premium) {
      return { icon: TrendingUp, label: 'HIGHLY RECOMMENDED', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500' }
    }
    if (applicant.trust_score >= 100) {
      return { icon: Shield, label: 'RECOMMENDED', color: 'text-blue-400 bg-blue-500/20 border-blue-500' }
    }
    if (applicant.avg_rating < 2 && applicant.total_ratings > 0) {
      return { icon: AlertCircle, label: 'UNTRUSTED', color: 'text-red-400 bg-red-500/20 border-red-500' }
    }
    return { icon: User, label: 'ORDINARY', color: 'text-gray-400 bg-gray-500/20 border-gray-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Applicant Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const rankingBadge = getRankingBadge()
  const RankingIcon = rankingBadge?.icon

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      {/* Header */}
      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-purple-400">
            <ChevronLeft className="w-5 h-5" />
            Back to Applicants
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              {applicant.avatar_url ? (
                <img 
                  src={applicant.avatar_url} 
                  alt={applicant.full_name}
                  className="w-full h-full rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white">{applicant.full_name}</h1>
          
          {/* Ranking Badge */}
          {rankingBadge && (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${rankingBadge.color} mt-2`}>
              <StarIcon className="w-4 h-4" />
              <span className="text-xs font-bold">{rankingBadge.label}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Card className="text-center p-4">
            <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className={`text-xl font-bold ${getRankColor(applicant.grade)}`}>{applicant.grade}-Rank</div>
            <div className="text-xs text-gray-400">Hunter Rank</div>
          </Card>
          <Card className="text-center p-4">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{applicant.avg_rating?.toFixed(1) || '0'}</div>
            <div className="text-xs text-gray-400">Rating ({applicant.total_ratings})</div>
          </Card>
          <Card className="text-center p-4">
            <Briefcase className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{applicant.completed_jobs_count}</div>
            <div className="text-xs text-gray-400">Jobs Completed</div>
          </Card>
          <Card className="text-center p-4">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{applicant.trust_score}</div>
            <div className="text-xs text-gray-400">Trust Score</div>
          </Card>
          <Card className="text-center p-4">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">
              {applicant.is_premium ? '✓' : applicant.is_skill_verified ? '✓' : applicant.is_identity_verified ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-400">Verified</div>
          </Card>
        </div>

        {/* Verification Badges */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Verification Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg border ${applicant.is_email_verified ? 'bg-green-500/20 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <CheckCircle className={`w-5 h-5 mb-1 ${applicant.is_email_verified ? 'text-green-400' : 'text-gray-500'}`} />
              <p className="text-sm font-medium text-white">Email</p>
              <p className="text-xs text-gray-400">{applicant.is_email_verified ? 'Verified' : 'Not verified'}</p>
            </div>
            <div className={`p-3 rounded-lg border ${applicant.is_identity_verified ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <BadgeCheck className={`w-5 h-5 mb-1 ${applicant.is_identity_verified ? 'text-orange-400' : 'text-gray-500'}`} />
              <p className="text-sm font-medium text-white">Identity</p>
              <p className="text-xs text-gray-400">{applicant.is_identity_verified ? 'Verified' : 'Not verified'}</p>
            </div>
            <div className={`p-3 rounded-lg border ${applicant.is_skill_verified ? 'bg-gray-500/20 border-gray-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <Verified className={`w-5 h-5 mb-1 ${applicant.is_skill_verified ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className="text-sm font-medium text-white">Skills</p>
              <p className="text-xs text-gray-400">{applicant.is_skill_verified ? 'Verified' : 'Not verified'}</p>
            </div>
            <div className={`p-3 rounded-lg border ${applicant.is_premium ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <Crown className={`w-5 h-5 mb-1 ${applicant.is_premium ? 'text-yellow-400' : 'text-gray-500'}`} />
              <p className="text-sm font-medium text-white">Premium</p>
              <p className="text-xs text-gray-400">{applicant.is_premium ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            Contact Information
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">{applicant.email}</span>
            </div>
            {applicant.seeker_profile?.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Phone className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">{applicant.seeker_profile.phone}</span>
              </div>
            )}
            {applicant.seeker_profile?.location && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">{applicant.seeker_profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {applicant.seeker_profile?.bio && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              About
            </h2>
            <Card className="p-5">
              <p className="text-gray-300 leading-relaxed">{applicant.seeker_profile.bio}</p>
            </Card>
          </div>
        )}

        {/* Skills */}
        {applicant.seeker_profile?.skills?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Skills & Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {applicant.seeker_profile.skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-purple-500/20 rounded-full text-purple-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {applicant.seeker_profile?.experience_description && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              Work Experience
            </h2>
            <Card className="p-5">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {applicant.seeker_profile.experience_description}
              </p>
            </Card>
          </div>
        )}

        {/* Work Samples */}
        {workSamples.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-400" />
              Work Samples / Portfolio
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {workSamples.map((sample, index) => (
                <Card key={index} className="overflow-hidden">
                  {sample.image_url && (
                    <img 
                      src={sample.image_url} 
                      alt={sample.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1">{sample.title}</h3>
                    {sample.description && (
                      <p className="text-gray-400 text-sm mb-2">{sample.description}</p>
                    )}
                    {sample.link && (
                      <a 
                        href={sample.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 text-sm hover:underline flex items-center gap-1"
                      >
                        View Project <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CV Download */}
        {applicant.seeker_profile?.cv_url && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              CV / Resume
            </h2>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(applicant.seeker_profile.cv_url, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download CV
            </Button>
          </div>
        )}

        {/* Social Links */}
        {(applicant.seeker_profile?.github_url || 
          applicant.seeker_profile?.linkedin_url || 
          applicant.seeker_profile?.portfolio_url) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-purple-400" />
              Social & Professional Links
            </h2>
            <div className="flex flex-wrap gap-3">
              {applicant.seeker_profile?.github_url && (
                <a 
                  href={applicant.seeker_profile.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <FaGithub className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
              {applicant.seeker_profile?.linkedin_url && (
                <a 
                  href={applicant.seeker_profile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <FaLinkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {applicant.seeker_profile?.portfolio_url && (
                <a 
                  href={applicant.seeker_profile.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Completed Jobs History */}
        {completedJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Completed Jobs ({completedJobs.length})
            </h2>
            <div className="space-y-3">
              {completedJobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{job.jobs?.title}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-gray-400">
                        <span>₦{job.jobs?.budget?.toLocaleString()}</span>
                        <span className="capitalize">{job.jobs?.job_type}</span>
                        {job.jobs?.location && <span>{job.jobs.location}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {job.status}
                      </div>
                      {job.completed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(job.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ratings & Reviews */}
        {ratings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Reviews & Ratings ({ratings.length})
            </h2>
            <div className="space-y-3">
              {ratings.map((rating, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {rating.from_user?.avatar_url ? (
                      <img 
                        src={rating.from_user.avatar_url} 
                        alt={rating.from_user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{rating.from_user?.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= rating.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-gray-400 text-sm ml-11">{rating.review}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-4">
          <Button 
            className="flex-1"
            onClick={() => router.push(`/messages/${applicant.id}`)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Hunter
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </main>
    </div>
  )
}