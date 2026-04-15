'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Gift, Users, Copy, CheckCircle, 
  Share2, Zap, Loader2, TrendingUp, Award
} from 'lucide-react'

interface Referral {
  id: string
  referred_id: string
  status: string
  reward_given: boolean
  created_at: string
  referred_profile: {
    full_name: string
    email: string
    created_at: string
  }
}

export default function ReferralPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pointsEarned: 0
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
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

      // Get or create referral code
      let { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .single()

      if (!codeData) {
        // Generate unique code
        const generatedCode = user.id.slice(0, 8).toUpperCase()
        const { data: newCode } = await supabase
          .from('referral_codes')
          .insert({ user_id: user.id, code: generatedCode })
          .select()
          .single()
        codeData = newCode
      }
      setReferralCode(codeData?.code || '')

      // Get referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_profile:referred_id (
            full_name,
            email,
            created_at
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsData) {
        setReferrals(referralsData as Referral[])
        setStats({
          total: referralsData.length,
          completed: referralsData.filter(r => r.status === 'completed').length,
          pointsEarned: referralsData.filter(r => r.reward_given).length * 100
        })
      }
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const text = `Join Orgent using my referral code ${referralCode} and get 50 bonus points! 🚀\n\nhttps://orgent.com/signup?ref=${referralCode}`
    if (navigator.share) {
      navigator.share({
        title: 'Join Orgent',
        text: text,
        url: `https://orgent.com/signup?ref=${referralCode}`
      })
    } else {
      handleCopyCode()
    }
  }

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://orgent.com'}/signup?ref=${referralCode}`

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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Refer & Earn
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Invite friends and earn points when they join
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center p-4">
              <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total Referrals</div>
            </Card>
            <Card className="text-center p-4">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.completed}</div>
              <div className="text-xs text-gray-400">Joined</div>
            </Card>
            <Card className="text-center p-4">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.pointsEarned}</div>
              <div className="text-xs text-gray-400">Points Earned</div>
            </Card>
          </div>

          {/* Referral Code Section */}
          <Card className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50">
            <div className="p-5 text-center">
              <h3 className="text-lg font-bold text-white mb-2">Your Referral Code</h3>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-black/50 px-6 py-3 rounded-xl border border-purple-500/30">
                  <p className="text-2xl font-mono font-bold text-purple-400 tracking-wider">
                    {referralCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
              <Button onClick={handleShare} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Invite Link
              </Button>
            </div>
          </Card>

          {/* How it Works */}
          <Card className="mb-6">
            <div className="p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                  <div>
                    <p className="text-white text-sm font-medium">Share your code</p>
                    <p className="text-gray-400 text-xs">Share your unique referral code with friends</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                  <div>
                    <p className="text-white text-sm font-medium">Friend signs up</p>
                    <p className="text-gray-400 text-xs">They use your code during signup</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                  <div>
                    <p className="text-white text-sm font-medium">Get rewarded</p>
                    <p className="text-gray-400 text-xs">Earn 100 points when they complete their first gig</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Referral History */}
          {referrals.length > 0 && (
            <Card>
              <div className="p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Referral History
                </h3>
                <div className="space-y-3">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {ref.referred_profile?.full_name || 'Anonymous User'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Joined {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {ref.status === 'completed' && ref.reward_given ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">+100 pts</span>
                          </div>
                        ) : ref.status === 'completed' ? (
                          <span className="text-xs text-yellow-400">Pending reward</span>
                        ) : (
                          <span className="text-xs text-gray-500">Not yet active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}