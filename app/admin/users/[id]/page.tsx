'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  ChevronLeft, User, Mail, Calendar, Shield, 
  Building, Star, Crown, BadgeCheck, Verified,
  Loader2, Phone, MapPin, Briefcase, Award,Users,
  Clock, CreditCard
} from 'lucide-react'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'jobs'>('overview')
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    setLoading(true)
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      setLoading(false)
      return
    }

    // Common data
    let userData: any = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || 'Not set',
      role: profile.role,
      is_admin: profile.is_admin || false,
      created_at: profile.created_at,
      avatar_url: profile.avatar_url || '',
    }

    // HUNTER (SEEKER) DATA
    if (profile.role === 'seeker') {
      // Get seeker profile
      const { data: seeker } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get conversations where this user is hunter
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('hunter_id', userId)

      let completedJobsList: any[] = []
      let activeJobsList: any[] = []
      let totalEarned = 0
      let allOffers: any[] = []

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        
        const { data: offers } = await supabase
          .from('job_offers')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
        
        if (offers) {
          allOffers = offers
          completedJobsList = offers.filter(o => o.status === 'released')
          activeJobsList = offers.filter(o => o.status === 'paid' || o.status === 'completed')
          totalEarned = completedJobsList.reduce((sum, o) => sum + (o.hunter_amount || 0), 0)
        }
      }

      userData = {
        ...userData,
        grade: profile.grade || 'E',
        points_balance: profile.points_balance || 0,
        is_premium: profile.is_premium || false,
        is_identity_verified: profile.is_identity_verified || false,
        is_skill_verified: profile.is_skill_verified || false,
        phone: seeker?.phone || 'Not set',
        location: seeker?.location || 'Not set',
        bio: seeker?.bio || 'Not set',
        skills: seeker?.skills || [],
        total_earned: totalEarned,
        completed_jobs: completedJobsList.length,
        active_jobs: activeJobsList.length,
        avg_rating: profile.avg_rating || 0
      }

      // Get points transactions
      const { data: pointsData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setTransactions(pointsData || [])
      setJobs(allOffers)
    }

// BUSINESS DATA
else if (profile.role === 'business') {
  // Get business profile
  const { data: business } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get jobs posted by this business
  const { data: businessJobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })

  // Get conversations for these jobs
  let totalSpent = 0
  let paidJobsCount = 0
  
  if (businessJobs && businessJobs.length > 0) {
    const jobIds = businessJobs.map(job => job.id)
    
    // First get conversations for these jobs
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .in('job_id', jobIds)
    
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id)
      
      // Then get job offers for these conversations
      const { data: jobOffers } = await supabase
        .from('job_offers')
        .select('*')
        .in('conversation_id', conversationIds)
        .in('status', ['paid', 'released', 'completed'])
      
      if (jobOffers) {
        totalSpent = jobOffers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0)
        paidJobsCount = jobOffers.length
      }
    }
  }

  userData = {
    ...userData,
    business_name: business?.business_name || 'Not set',
    business_type: business?.business_type || 'Not set',
    business_description: business?.description || 'Not set',
    phone: business?.phone || 'Not set',
    location: business?.address || 'Not set',
    total_spent: totalSpent,
    total_jobs: businessJobs?.length || 0,
    paid_jobs: paidJobsCount
  }
  setJobs(businessJobs || [])
}


    setUser(userData)
    setLoading(false)
  }

  const getRoleBadge = () => {
    if (!user) return null
    if (user.is_admin) {
      return { color: 'bg-red-500/20 text-red-400', icon: Shield, label: 'Admin' }
    }
    if (user.role === 'business') {
      return { color: 'bg-blue-500/20 text-blue-400', icon: Building, label: 'Business' }
    }
    return { color: 'bg-purple-500/20 text-purple-400', icon: User, label: 'Hunter' }
  }

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { color: 'bg-green-500/20 text-green-400', label: 'Open' }
      case 'paid':
        return { color: 'bg-blue-500/20 text-blue-400', label: 'In Progress' }
      case 'completed':
        return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Work Submitted' }
      case 'released':
        return { color: 'bg-green-500/20 text-green-400', label: 'Completed' }
      default:
        return { color: 'bg-gray-500/20 text-gray-400', label: status }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">User not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const roleBadge = getRoleBadge()
  const RoleIcon = roleBadge?.icon
  const isHunter = user.role === 'seeker'
  const isBusiness = user.role === 'business'

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-purple-400" />
        </button>
        <h1 className="text-2xl font-bold text-white">User Details</h1>
      </div>

      {/* Profile Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-2xl font-bold text-white">
                {isBusiness ? user.business_name : user.full_name}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${roleBadge?.color}`}>
                <Users className="w-3 h-3" />
                {roleBadge?.label}
              </span>
              {isHunter && user.is_premium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1 mb-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4">
            {isHunter ? (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{user.grade}</p>
                  <p className="text-xs text-gray-500">Rank</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{user.points_balance}</p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">₦{user.total_earned?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Earned</p>
                </div>
              </>
            ) : isBusiness ? (
      <>
    <div className="text-center">
      <p className="text-2xl font-bold text-blue-400">{user.total_jobs || 0}</p>
      <p className="text-xs text-gray-500">Jobs Posted</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-red-400">₦{user.total_spent?.toLocaleString() || 0}</p>
      <p className="text-xs text-gray-500">Total Spent</p>
    </div>
  </>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        {isHunter && (
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transactions
          </button>
        )}
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'jobs'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {isHunter ? 'Jobs Completed' : 'Jobs Posted'} ({isHunter ? user.completed_jobs || 0 : user.total_jobs || 0})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Contact Info */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-400" />
              Contact Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-300"><span className="text-gray-500">Phone:</span> {user.phone}</p>
              <p className="text-sm text-gray-300"><span className="text-gray-500">Location:</span> {user.location}</p>
              {user.bio && <p className="text-sm text-gray-300"><span className="text-gray-500">Bio:</span> {user.bio}</p>}
              {isBusiness && user.business_description && (
                <p className="text-sm text-gray-300"><span className="text-gray-500">Description:</span> {user.business_description}</p>
              )}
            </div>
          </Card>

          {/* Hunter Specific - Verification & Skills */}
          {isHunter && (
            <>
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Verification Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${user.is_identity_verified ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
                    <BadgeCheck className={`w-5 h-5 mb-1 ${user.is_identity_verified ? 'text-green-400' : 'text-gray-500'}`} />
                    <p className="text-sm font-medium text-white">Identity</p>
                    <p className="text-xs text-gray-400">{user.is_identity_verified ? 'Verified' : 'Not verified'}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${user.is_skill_verified ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
                    <Verified className={`w-5 h-5 mb-1 ${user.is_skill_verified ? 'text-green-400' : 'text-gray-500'}`} />
                    <p className="text-sm font-medium text-white">Skills</p>
                    <p className="text-xs text-gray-400">{user.is_skill_verified ? 'Verified' : 'Not verified'}</p>
                  </div>
                </div>
              </Card>

              {user.skills && user.skills.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Business Specific */}
          {isBusiness && (
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                Business Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-300"><span className="text-gray-500">Business Name:</span> {user.business_name}</p>
                <p className="text-sm text-gray-300"><span className="text-gray-500">Business Type:</span> {user.business_type}</p>
                <p className="text-sm text-gray-300"><span className="text-gray-500">Total Jobs Posted:</span> {user.total_jobs}</p>
                <p className="text-sm text-gray-300"><span className="text-gray-500">Total Spent:</span> ₦{user.total_spent?.toLocaleString() || 0}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Tab - Only for Hunters */}
      {isHunter && activeTab === 'transactions' && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Point Transactions
          </h3>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white text-sm">{tx.reason || 'Transaction'}</p>
                    <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                    </p>
                    <p className="text-xs text-gray-500">Balance: {tx.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            {isHunter ? 'Jobs' : 'Jobs Posted'}
          </h3>
          {jobs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {isHunter ? 'No jobs yet' : 'No jobs posted yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const status = getJobStatusBadge(job.status)
                return (
                  <div key={job.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {isHunter ? job.conversation?.job?.title : job.title}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(job.created_at || job.released_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        {isHunter ? (
                          <p className="text-green-400 text-sm font-medium mt-1">
                            ₦{job.hunter_amount?.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-purple-400 text-sm font-medium mt-1">
                            ₦{job.budget?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}