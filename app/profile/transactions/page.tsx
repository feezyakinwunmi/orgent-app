'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Zap, Loader2, TrendingUp, TrendingDown, 
  ShoppingBag, Award, Crown, Briefcase, Calendar
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  balance_after: number
  reason: string
  created_at: string
}

export default function TransactionHistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
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

      const { data: transactionsData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsData) {
        setTransactions(transactionsData)
      }
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const getTransactionIcon = (reason: string) => {
    if (reason.includes('Premium')) return <Crown className="w-4 h-4 text-yellow-400" />
    if (reason.includes('Purchased')) return <ShoppingBag className="w-4 h-4 text-green-400" />
    if (reason.includes('Applied')) return <Briefcase className="w-4 h-4 text-blue-400" />
    if (reason.includes('Completed')) return <Award className="w-4 h-4 text-purple-400" />
    if (reason.includes('Identity') || reason.includes('Skill')) return <Award className="w-4 h-4 text-purple-400" />
    return <Zap className="w-4 h-4 text-gray-400" />
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
              Transaction History
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track all your points activity
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/30">
                <Zap className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Transactions Yet</h2>
              <p className="text-gray-400 text-sm mb-6">
                Your points activity will appear here
              </p>
              <Button onClick={() => router.push('/jobs')}>
                Browse Gigs
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0
                const Icon = getTransactionIcon(tx.reason)
                
                return (
                  <Card key={tx.id} className="bg-gradient-to-br from-purple-900/20 to-black/50 backdrop-blur-sm border border-purple-500/30">
                    <div className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {Icon}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{tx.reason}</p>
                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(tx.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold flex  ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{tx.amount} pts
                          </p>
                          <p className="text-xs text-gray-500">Balance: {tx.balance_after}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}