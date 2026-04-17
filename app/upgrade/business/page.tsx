// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { createClient } from '@/app/lib/supabase/client'
// import { Card } from '@/app/components/ui/Card'
// import { Button } from '@/app/components/ui/Button'
// import { Crown, TrendingUp, Zap, CheckCircle, Loader2 } from 'lucide-react'
// import PaystackPop from '@paystack/inline-js'

// export default function BusinessUpgradePage() {
//   const router = useRouter()
//   const [processing, setProcessing] = useState(false)
//   const [profile, setProfile] = useState<any>(null)
//   const [business, setBusiness] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const supabase = createClient()

//   useEffect(() => {
//     const fetchData = async () => {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (user) {
//         const { data: profileData } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', user.id)
//           .single()
//         setProfile(profileData)
        
//         const { data: businessData } = await supabase
//           .from('business_profiles')
//           .select('*')
//           .eq('user_id', user.id)
//           .single()
//         setBusiness(businessData)
//       }
//       setLoading(false)
//     }
//     fetchData()
//   }, [])

//   const plans = [
//     {
//       name: 'Free',
//       price: 0,
//       priceDisplay: '₦0',
//       period: 'forever',
//       icon: Zap,
//       features: ['3 jobs per month', 'E-Rank only', 'Basic support'],
//       color: 'from-gray-500 to-gray-600',
//       popular: false,
//       tier: 'free'
//     },
//     {
//       name: 'Pro',
//       price: 5000,
//       priceDisplay: '₦5,000',
//       period: 'per month',
//       icon: TrendingUp,
//       features: ['15 jobs per month', 'All ranks (E to S)', 'Priority support', 'Featured listings'],
//       color: 'from-blue-500 to-blue-600',
//       popular: true,
//       tier: 'pro'
//     },
//     {
//       name: 'Enterprise',
//       price: 15000,
//       priceDisplay: '₦15,000',
//       period: 'per month',
//       icon: Crown,
//       features: ['Unlimited jobs', 'All ranks (E to S)', '24/7 priority support', 'Featured listings', 'Custom branding', 'Dedicated account manager'],
//       color: 'from-purple-500 to-pink-500',
//       popular: false,
//       tier: 'enterprise'
//     }
//   ]

//   const handleUpgrade = async (plan: any) => {
//     if (plan.name === 'Free' || !profile) return
    
//     setProcessing(true)
    
//     try {
//       const paystack = new PaystackPop()
      
//       paystack.newTransaction({
//         key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
//         email: profile.email,
//         amount: plan.price * 100,
//         currency: 'NGN',
//         metadata: {
//           type: 'business_subscription',
//           plan: plan.tier,
//           amount: plan.price
//         },
//         onSuccess: async (transaction: any) => {
//           console.log('Payment successful:', transaction)
          
//           if (business) {
//             const expiresAt = new Date()
//             expiresAt.setMonth(expiresAt.getMonth() + 1)
            
//             await supabase
//               .from('business_profiles')
//               .update({
//                 subscription_tier: plan.tier,
//                 subscription_expires_at: expiresAt.toISOString(),
//                 jobs_posted_this_month: 0
//               })
//               .eq('id', business.id)
//           }
          
//           alert(`Successfully upgraded to ${plan.name}!`)
//           router.push('/business/dashboard')
//         },
//         onCancel: () => {
//           console.log('Payment cancelled')
//           alert('Payment cancelled')
//         },
//         onError: (error: any) => {
//           console.error('Payment error:', error)
//           alert('Payment failed. Please try again.')
//         }
//       })
//     } catch (error) {
//       console.error('Error:', error)
//       alert('Payment system error. Please refresh and try again.')
//     } finally {
//       setProcessing(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black">
//         <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-black">
//       <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

//       <main className="relative z-10 px-4 py-12 max-w-6xl mx-auto">
//         <div className="text-center mb-12">
//           <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
//           <p className="text-gray-400 text-lg">Upgrade to post more jobs and reach top hunters</p>
//           {business && (
//             <p className="text-sm text-purple-400 mt-2">
//               Current plan: <span className="font-bold capitalize">{business.subscription_tier || 'Free'}</span>
//             </p>
//           )}
//         </div>

//         <div className="grid md:grid-cols-3 gap-6">
//           {plans.map((plan) => {
//             const Icon = plan.icon
//             const isCurrentPlan = business?.subscription_tier === plan.tier
//             return (
//               <Card key={plan.name} className={`relative overflow-hidden ${plan.popular ? 'border-2 border-purple-500' : ''}`}>
//                 {plan.popular && (
//                   <div className="absolute top-0 right-0">
//                     <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
//                       POPULAR
//                     </div>
//                   </div>
//                 )}
//                 <div className="p-6 text-center">
//                   <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
//                     <Icon className="w-8 h-8 text-white" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
//                   <div className="mt-4">
//                     <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
//                     <span className="text-gray-400">/{plan.period}</span>
//                   </div>
//                   <ul className="mt-6 space-y-2 text-left">
//                     {plan.features.map((feature, i) => (
//                       <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
//                         <CheckCircle className="w-4 h-4 text-green-400" />
//                         {feature}
//                       </li>
//                     ))}
//                   </ul>
//                   <Button 
//                     onClick={() => handleUpgrade(plan)}
//                     disabled={isCurrentPlan || processing}
//                     className={`w-full mt-6 bg-gradient-to-r ${plan.color} hover:opacity-90`}
//                   >
//                     {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
//                     {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
//                   </Button>
//                 </div>
//               </Card>
//             )
//           })}
//         </div>
//       </main>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { Crown, TrendingUp, Zap, CheckCircle, Loader2 } from 'lucide-react'
// Remove the direct import of PaystackPop
// import PaystackPop from '@paystack/inline-js'

export default function BusinessUpgradePage() {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        
        const { data: businessData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setBusiness(businessData)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const plans = [
    {
      name: 'Free',
      price: 0,
      priceDisplay: '₦0',
      period: 'forever',
      icon: Zap,
      features: ['3 jobs per month', 'E-Rank only', 'Basic support'],
      color: 'from-gray-500 to-gray-600',
      popular: false,
      tier: 'free'
    },
    {
      name: 'Pro',
      price: 5000,
      priceDisplay: '₦5,000',
      period: 'per month',
      icon: TrendingUp,
      features: ['15 jobs per month', 'All ranks (E to S)', 'Priority support', 'Featured listings'],
      color: 'from-blue-500 to-blue-600',
      popular: true,
      tier: 'pro'
    },
    {
      name: 'Enterprise',
      price: 15000,
      priceDisplay: '₦15,000',
      period: 'per month',
      icon: Crown,
      features: ['Unlimited jobs', 'All ranks (E to S)', '24/7 priority support', 'Featured listings', 'Custom branding', 'Dedicated account manager'],
      color: 'from-purple-500 to-pink-500',
      popular: false,
      tier: 'enterprise'
    }
  ]

  const handleUpgrade = async (plan: any) => {
    if (plan.name === 'Free' || !profile) return
    
    setProcessing(true)
    
    try {
      // Dynamically import PaystackPop only when needed (in the browser)
      const PaystackPop = (await import('@paystack/inline-js')).default
      const paystack = new PaystackPop()
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: profile.email,
        amount: plan.price * 100,
        currency: 'NGN',
        metadata: {
          type: 'business_subscription',
          plan: plan.tier,
          amount: plan.price
        },
        onSuccess: async (transaction: any) => {
          console.log('Payment successful:', transaction)
          
          if (business) {
            const expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + 1)
            
            await supabase
              .from('business_profiles')
              .update({
                subscription_tier: plan.tier,
                subscription_expires_at: expiresAt.toISOString(),
                jobs_posted_this_month: 0
              })
              .eq('id', business.id)
          }
          
          alert(`Successfully upgraded to ${plan.name}!`)
          router.push('/business/dashboard')
        },
        onCancel: () => {
          console.log('Payment cancelled')
          alert('Payment cancelled')
        },
        onError: (error: any) => {
          console.error('Payment error:', error)
          alert('Payment failed. Please try again.')
        }
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Payment system error. Please refresh and try again.')
    } finally {
      setProcessing(false)
    }
  }

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

      <main className="relative z-10 px-4 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg">Upgrade to post more jobs and reach top hunters</p>
          {business && (
            <p className="text-sm text-purple-400 mt-2">
              Current plan: <span className="font-bold capitalize">{business.subscription_tier || 'Free'}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = business?.subscription_tier === plan.tier
            return (
              <Card key={plan.name} className={`relative overflow-hidden ${plan.popular ? 'border-2 border-purple-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}
                <div className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan || processing}
                    className={`w-full mt-6 bg-gradient-to-r ${plan.color} hover:opacity-90`}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}