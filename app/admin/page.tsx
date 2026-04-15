'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { 
  Users, Briefcase, DollarSign, CheckCircle, 
  Clock, AlertCircle, TrendingUp, Shield,
  UserCheck, Building, FileText, CreditCard,
  Activity, Eye, ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalHunters: number
  totalBusinesses: number
  totalJobs: number
  activeJobs: number
  pendingVerifications: number
  totalRevenue: number
  completedJobs: number
  jobCommission: number
  subscriptionRevenue: number
  pointsRevenue: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalHunters: 0,
    totalBusinesses: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    completedJobs: 0,
    jobCommission: 0,
    subscriptionRevenue: 0,
    pointsRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: totalHunters },
        { count: totalBusinesses },
        { count: totalJobs },
        { count: activeJobs },
        { count: completedJobs },
        { count: pendingVerifications },
        { data: jobCommissions },
        { data: businessSubs },
        { data: pointsSales }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seeker'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'business'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .or('identity_verification_status.eq.pending,skill_verification_status.eq.pending'),
        supabase.from('job_offers').select('platform_fee').eq('status', 'released'),
        supabase.from('business_profiles').select('subscription_tier').not('subscription_tier', 'eq', 'free'),
        supabase.from('points_transactions').select('amount').gt('amount', 0)
      ])

      // Calculate job commissions (10% from each completed job)
      const jobCommission = jobCommissions?.reduce((sum, j) => sum + (j.platform_fee || 0), 0) || 0
      
      // Calculate subscription revenue (simplified - assuming Pro = ₦5,000, Enterprise = ₦15,000)
      let subscriptionRevenue = 0
      if (businessSubs) {
        subscriptionRevenue = businessSubs.reduce((sum, b) => {
          if (b.subscription_tier === 'pro') return sum + 5000
          if (b.subscription_tier === 'enterprise') return sum + 15000
          return sum
        }, 0)
      }
      
      // Calculate points revenue (assuming 100 points = ₦500)
      const pointsSold = pointsSales?.reduce((sum, p) => sum + p.amount, 0) || 0
      const pointsRevenue = pointsSold * 5 // 100 points = ₦500, so 1 point = ₦5

      const totalRevenue = jobCommission + subscriptionRevenue + pointsRevenue

      setStats({
        totalUsers: totalUsers || 0,
        totalHunters: totalHunters || 0,
        totalBusinesses: totalBusinesses || 0,
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        completedJobs: completedJobs || 0,
        pendingVerifications: pendingVerifications || 0,
        totalRevenue: totalRevenue,
        jobCommission: jobCommission,
        subscriptionRevenue: subscriptionRevenue,
        pointsRevenue: pointsRevenue
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          <p className="text-gray-400 text-sm mt-3">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const mainStats = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      link: '/admin/users'
    },
    { 
      label: 'Active Jobs', 
      value: stats.activeJobs, 
      icon: Briefcase, 
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-500/10',
      link: '/admin/jobs'
    },
    { 
      label: 'Platform Revenue', 
      value: `₦${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500/10',
      link: '/admin/earnings'
    },
    { 
      label: 'Pending Reviews', 
      value: stats.pendingVerifications, 
      icon: Clock, 
      color: stats.pendingVerifications > 0 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600',
      bg: stats.pendingVerifications > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10',
      link: '/admin/verifications'
    },
  ]

  const revenueBreakdown = [
    { label: 'Job Commission (10%)', value: `₦${stats.jobCommission.toLocaleString()}`, icon: Briefcase, color: 'text-green-400' },
    { label: 'Business Subscriptions', value: `₦${stats.subscriptionRevenue.toLocaleString()}`, icon: Building, color: 'text-blue-400' },
    { label: 'Points Sales', value: `₦${stats.pointsRevenue.toLocaleString()}`, icon: Zap, color: 'text-yellow-400' },
  ]

  return (
    <div className="p-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, Admin</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {mainStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label} 
              onClick={() => router.push(stat.link)}
              className={`rounded-xl ${stat.bg} border border-purple-500/20 p-5 hover:border-purple-500/40 transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue Breakdown */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Revenue Breakdown
          </h2>
          <button 
            onClick={() => router.push('/admin/earnings')}
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View Details <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueBreakdown.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${item.color} opacity-70`} />
                  <div>
                    <p className="text-gray-500 text-xs">{item.label}</p>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/verifications" className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300 text-sm group-hover:text-white transition">Verifications</span>
              {stats.pendingVerifications > 0 && (
                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                  {stats.pendingVerifications}
                </span>
              )}
            </Link>
            <Link href="/admin/users" className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm group-hover:text-white transition">Users</span>
            </Link>
            <Link href="/admin/jobs" className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
              <Briefcase className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 text-sm group-hover:text-white transition">Jobs</span>
            </Link>
            <Link href="/admin/earnings" className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300 text-sm group-hover:text-white transition">Earnings</span>
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Platform Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total Jobs</span>
              <span className="text-white font-medium">{stats.totalJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Completed Jobs</span>
              <span className="text-green-400 font-medium">{stats.completedJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Hunters</span>
              <span className="text-white font-medium">{stats.totalHunters}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Businesses</span>
              <span className="text-white font-medium">{stats.totalBusinesses}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}