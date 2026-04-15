'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Loader2, CheckCircle, 
  Crown, Zap, Star, TrendingUp, Shield,
  Calendar, Gift, Rocket, Sparkles,
  DollarSign, Package, Infinity, Award
} from 'lucide-react'
import PaystackPop from '@paystack/inline-js'


export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [selectedTab, setSelectedTab] = useState<'premium' | 'points'>('premium')
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPoints, setSelectedPoints] = useState<number>(500)
  
  const supabase = createClient()

  // Exchange rates (approximate - you can update these)
  const USD_TO_NGN = 1500
  const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`
  const formatUSD = (amount: number) => `$${amount}`

 const premiumPlans = {
  monthly: {
    naira: 2000,
    usd: 1.33,
    bonusPoints: 500,
    savings: 0,
    popular: false
  },
  yearly: {
    naira: 20000,
    usd: 13.33,
    bonusPoints: 6000,
    savings: 17,  // 2 months free
    popular: true
  }
}

const pointPackages = [
  { points: 200, naira: 500, usd: 0.33, bonus: 0, popular: false },
  { points: 500, naira: 1200, usd: 0.80, bonus: 10, popular: false },
  { points: 850, naira: 2000, usd: 1.33, bonus: 25, popular: true },
  { points: 2000, naira: 4500, usd: 3.00, bonus: 100, popular: false },
  { points: 5000, naira: 10000, usd: 6.67, bonus: 300, popular: false }
]

  useEffect(() => {
    const fetchProfile = async () => {
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
      setLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const processPayment = async (amount: number, metadata: any, callback: () => Promise<void>) => {
    const paystack = new PaystackPop()
    
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      amount: amount * 100, // Paystack uses kobo
      email: profile?.email,
      metadata: {
        ...metadata,
        custom_fields: [
          { display_name: "User ID", variable_name: "user_id", value: profile?.id },
          { display_name: "Plan", variable_name: "plan", value: metadata.plan },
          { display_name: "Points", variable_name: "points", value: metadata.points }
        ]
      },
      onSuccess: async (transaction: any) => {
        console.log('Payment success:', transaction)
        await callback()
      },
      onCancel: () => {
        setProcessing(false)
        alert('Payment cancelled')
      },
      onError: (error: any) => {
        console.error('Payment error:', error)
        setProcessing(false)
        alert('Payment failed. Please try again.')
      }
    })
  }

  const handlePremiumUpgrade = async () => {
    setProcessing(true)
    
    const plan = premiumPlans[selectedPlan]
    
    await processPayment(
      plan.naira,
      { plan: selectedPlan, type: 'premium', bonusPoints: plan.bonusPoints },
      async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const premiumUntil = new Date()
        if (selectedPlan === 'monthly') {
          premiumUntil.setMonth(premiumUntil.getMonth() + 1)
        } else {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)
        }
        
        await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            premium_until: premiumUntil.toISOString(),
            verification_badge_level: 'gold',
            points_balance: (profile?.points_balance || 0) + plan.bonusPoints
          })
          .eq('id', user.id)

        await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            amount: plan.bonusPoints,
            balance_after: (profile?.points_balance || 0) + plan.bonusPoints,
            reason: `Premium ${selectedPlan} subscription - ${plan.bonusPoints} bonus points`
          })

        setProcessing(false)
        router.push('/profile')
      }
    )
  }

  const handlePointsPurchase = async () => {
    const packageData = pointPackages.find(p => p.points === selectedPoints)
    if (!packageData) return
    
    setProcessing(true)
    
    const totalPoints = packageData.points + packageData.bonus
    
    await processPayment(
      packageData.naira,
      { type: 'points', points: packageData.points, bonus: packageData.bonus, totalPoints: totalPoints },
      async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const newBalance = (profile?.points_balance || 0) + totalPoints
        
        await supabase
          .from('profiles')
          .update({ points_balance: newBalance })
          .eq('id', user.id)

        await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            amount: totalPoints,
            balance_after: newBalance,
            reason: `Purchased ${packageData.points} points + ${packageData.bonus} bonus points`
          })

        setProcessing(false)
        router.push('/profile')
      }
    )
  }


  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Level Up Your Experience</h1>
          <p className="text-gray-400">Get premium benefits or purchase points to apply for more gigs</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl mb-8 max-w-md mx-auto">
          <button
            onClick={() => setSelectedTab('premium')}
            className={`flex-1 px-3 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              selectedTab === 'premium'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            Premium Subscription
          </button>
          <button
            onClick={() => setSelectedTab('points')}
            className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              selectedTab === 'points'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            Buy Points
          </button>
        </div>

        {/* Current Points Display */}
        <div className="text-center mb-8 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
          <p className="text-gray-400 text-sm">Your Current Balance</p>
          <p className="text-3xl font-bold text-purple-400">{profile?.points_balance || 0} points</p>
          <p className="text-xs text-gray-500 mt-1">≈ {Math.round((profile?.points_balance || 0) / 10)} premium applications</p>
        </div>

        {/* Premium Section */}
        {selectedTab === 'premium' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`cursor-pointer transition-all transform hover:scale-105 ${
                  selectedPlan === 'monthly' ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <Card className="h-full bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Monthly</h3>
                        <p className="text-gray-400 text-sm">Flexible plan</p>
                      </div>
                      <Crown className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-white">{formatNaira(premiumPlans.monthly.naira)}</p>
                      <p className="text-sm text-gray-400">{formatUSD(premiumPlans.monthly.usd)} / month</p>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Gold verification badge</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>+{premiumPlans.monthly.bonusPoints} bonus points</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Premium-only gigs</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePremiumUpgrade}
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Get Monthly
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Yearly Plan */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`cursor-pointer transition-all transform hover:scale-105 ${
                  selectedPlan === 'yearly' ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <Card className="h-full bg-gradient-to-br from-purple-900/30 to-black border-purple-500/30 relative overflow-hidden">
                  {premiumPlans.yearly.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        BEST VALUE
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Yearly</h3>
                        <p className="text-gray-400 text-sm">Save {premiumPlans.yearly.savings}%</p>
                      </div>
                      <Crown className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-white">{formatNaira(premiumPlans.yearly.naira)}</p>
                      <p className="text-sm text-gray-400">{formatUSD(premiumPlans.yearly.usd)} / year</p>
                      <p className="text-xs text-green-400 mt-1">Just {formatNaira(premiumPlans.yearly.naira / 12)}/month</p>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Gold verification badge</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>+{premiumPlans.yearly.bonusPoints} bonus points</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Premium-only gigs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Featured profile</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Priority support</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePremiumUpgrade}
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      Get Yearly (Save 20%)
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Premium Benefits Details */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                All Premium Benefits
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Gold verification badge (highest trust level)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Featured profile in search results</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Priority support within 1 hour</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Rocket className="w-4 h-4 text-purple-400" />
                    <span>Unlock premium-only gigs (higher pay)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Gift className="w-4 h-4 text-purple-400" />
                    <span>Bonus points monthly</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Points Purchase Section */}
        {selectedTab === 'points' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {pointPackages.map((pkg) => (
                <div
                  key={pkg.points}
                  onClick={() => setSelectedPoints(pkg.points)}
                  className={`cursor-pointer transition-all transform hover:scale-105 ${
                    selectedPoints === pkg.points ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <Card className={`text-center h-full ${pkg.popular ? 'bg-gradient-to-br from-purple-900/30 to-black border-purple-500/30' : 'bg-gray-800/50'}`}>
                    {pkg.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          POPULAR
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{pkg.points} points</h3>
                      <p className="text-3xl font-bold text-purple-400 my-2">{formatNaira(pkg.naira)}</p>
                      <p className="text-xs text-gray-400">{formatUSD(pkg.usd)}</p>
                      {pkg.bonus > 0 && (
                        <p className="text-xs text-green-400 mt-2">+{pkg.bonus} bonus points</p>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        ≈ {Math.floor(pkg.points / 10)} premium applications
                      </p>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Points Benefits */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                What can you do with points?
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">5-100</p>
                  <p className="text-xs text-gray-400">Apply for E to S-Rank jobs</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">+150</p>
                  <p className="text-xs text-gray-400">Skill verification reward</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">+500</p>
                  <p className="text-xs text-gray-400">Monthly premium bonus</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Payment Button */}
        <div className="mt-8">
          <Button 
            onClick={selectedTab === 'premium' ? handlePremiumUpgrade : handlePointsPurchase}
            disabled={processing}
            className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : selectedTab === 'premium' ? (
              <Crown className="w-5 h-5 mr-2" />
            ) : (
              <Zap className="w-5 h-5 mr-2" />
            )}
            {processing 
              ? 'Processing...' 
              : selectedTab === 'premium' 
                ? `Upgrade to Premium (${selectedPlan === 'monthly' ? formatNaira(premiumPlans.monthly.naira) + '/month' : formatNaira(premiumPlans.yearly.naira) + '/year'})`
                : `Buy ${selectedPoints} Points + Bonus`
            }
          </Button>
          <p className="text-center text-gray-500 text-xs mt-4">
            Secure payment powered by Paystack • Instant delivery • No hidden fees
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 p-6 bg-gray-800/30 rounded-xl">
          <h3 className="font-semibold text-white mb-4 text-center">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-purple-400 font-medium mb-1">How do points work?</p>
              <p className="text-gray-400">Points are used to apply for jobs. Each application costs 5-100 points depending on the job rank.</p>
            </div>
            <div>
              <p className="text-purple-400 font-medium mb-1">Can I cancel premium anytime?</p>
              <p className="text-gray-400">Yes, you can cancel your subscription at any time. No questions asked.</p>
            </div>
            <div>
              <p className="text-purple-400 font-medium mb-1">Do points expire?</p>
              <p className="text-gray-400">Points never expire as long as your account is active.</p>
            </div>
            <div>
              <p className="text-purple-400 font-medium mb-1">What payment methods?</p>
              <p className="text-gray-400">We accept card payments, bank transfers, and USSD via Paystack.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}