'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { 
  DollarSign, Briefcase, Building, Zap, 
  TrendingUp, Loader2, Crown
} from 'lucide-react'

interface Earning {
  id: string
  type: string
  amount: number
  description: string
  date: string
  user_name?: string
  user_email?: string
}

export default function AdminEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    jobCommission: 0,
    subscriptionRevenue: 0,
    pointsRevenue: 0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    setLoading(true)
    
    const allEarnings: Earning[] = []
    let jobTotal = 0
    let subTotal = 0

    // 1. Job commissions from completed jobs (platform_fee from job_offers)
    const { data: jobCommissions } = await supabase
      .from('job_offers')
      .select(`
        platform_fee, 
        released_at,
        conversation_id,
        conversation:conversation_id (
          job_id,
          hunter_id
        )
      `)
      .eq('status', 'released')
      .order('released_at', { ascending: false })

    if (jobCommissions && jobCommissions.length > 0) {
      // Get all job details and hunter details separately
      for (const commission of jobCommissions) {
        const conversation = commission.conversation as any
        const conversationData = conversation?.[0] || conversation
        
        if (conversationData) {
          // Get job title
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', conversationData.job_id)
            .single()
          
          // Get hunter details
          const { data: hunter } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', conversationData.hunter_id)
            .single()
          
          if (commission.platform_fee > 0) {
            allEarnings.push({
              id: `job_${commission.released_at}_${Math.random()}`,
              type: 'job',
              amount: commission.platform_fee,
              description: `Commission: ${job?.title || 'Job'}`,
              date: commission.released_at,
              user_name: hunter?.full_name,
              user_email: hunter?.email
            })
            jobTotal += commission.platform_fee
          }
        }
      }
    }

    // 2. Business subscriptions (from business_transactions table)
    const { data: businessTx } = await supabase
      .from('business_transactions')
      .select(`
        *,
        business:business_id (
          business_name,
          user_id
        )
      `)
      .eq('type', 'subscription')
      .order('created_at', { ascending: false })

    if (businessTx && businessTx.length > 0) {
      for (const tx of businessTx) {
        const business = tx.business as any
        const businessData = business?.[0] || business
        
        // Get user profile for email
        let userName = businessData?.business_name
        let userEmail = ''
        
        if (businessData?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', businessData.user_id)
            .single()
          
          if (profile) {
            userEmail = profile.email || ''
            if (!userName) userName = profile.full_name
          }
        }
        
        allEarnings.push({
          id: `business_${tx.created_at}_${Math.random()}`,
          type: 'business_sub',
          amount: tx.amount,
          description: tx.description || 'Business subscription',
          date: tx.created_at,
          user_name: userName || 'Business',
          user_email: userEmail
        })
        subTotal += tx.amount
      }
    }

    // Sort by date (newest first)
    allEarnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setEarnings(allEarnings)
    
    setStats({
      total: jobTotal + subTotal,
      jobCommission: jobTotal,
      subscriptionRevenue: subTotal,
      pointsRevenue: 0
    })
    setLoading(false)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'job':
        return { color: 'bg-green-500/20 text-green-400', icon: Briefcase, label: 'Job Commission' }
      case 'business_sub':
        return { color: 'bg-blue-500/20 text-blue-400', icon: Building, label: 'Business Subscription' }
      default:
        return { color: 'bg-gray-500/20 text-gray-400', icon: DollarSign, label: 'Other' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Platform Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Track revenue from jobs and subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">₦{stats.total.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400 opacity-70" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Job Commission (10%)</p>
              <p className="text-xl font-bold text-green-400">₦{stats.jobCommission.toLocaleString()}</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-400 opacity-70" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Business Subscriptions</p>
              <p className="text-xl font-bold text-blue-400">₦{stats.subscriptionRevenue.toLocaleString()}</p>
            </div>
            <Building className="w-8 h-8 text-blue-400 opacity-70" />
          </div>
        </Card>
      </div>

      {/* Note for Admin */}
      <div className="mb-6 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
        <p className="text-yellow-400 text-sm">
          📊 For complete revenue details including hunter premiums and points purchases, 
          please check your <a href="https://dashboard.paystack.com" target="_blank" rel="noopener noreferrer" className="underline">Paystack Dashboard</a>
        </p>
      </div>

      {/* Earnings Table */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Transaction History
        </h2>
        
        {earnings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No earnings recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left pb-3 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left pb-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left pb-3 text-sm font-medium text-gray-400">Description</th>
                  <th className="text-right pb-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-right pb-3 text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {earnings.map((earning, index) => {
                  const badge = getTypeBadge(earning.type)
                  const Icon = badge.icon
                  return (
                    <tr key={index} className="hover:bg-gray-800/30 transition">
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="text-white text-sm">{earning.user_name || '-'}</p>
                          <p className="text-gray-500 text-xs">{earning.user_email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-300 text-sm">{earning.description}</td>
                      <td className="py-3 text-right">
                        <span className="text-green-400 text-sm font-medium">+₦{earning.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right text-gray-500 text-sm">
                        {new Date(earning.date).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}