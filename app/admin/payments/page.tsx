'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  DollarSign, Zap, Crown, Briefcase,
  Loader2, X, User, Calendar, Eye,
  Filter, Search, ChevronDown, ChevronLeft, ChevronRight,
  Building
} from 'lucide-react'

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, transactions])

const fetchData = async () => {
  setLoading(true)
  
  // Get points transactions
  const { data: pointsData } = await supabase
    .from('points_transactions')
    .select(`
      *,
      profile:user_id (full_name, email)
    `)
    .order('created_at', { ascending: false })

  // Get job payments
  const { data: jobsData } = await supabase
    .from('job_offers')
    .select(`
      *,
      conversation:conversation_id (
        job:job_id (title),
        hunter:hunter_id (full_name, email)
      )
    `)
    .eq('status', 'released')
    .order('released_at', { ascending: false })

  // Get business subscriptions
  const { data: businessData } = await supabase
    .from('business_profiles')
    .select(`
      *,
      profile:user_id (full_name, email)
    `)
    .not('subscription_tier', 'eq', 'free')
    .not('subscription_tier', 'is', null)
    .order('updated_at', { ascending: false })

  const all = [
    // Points transactions
    ...(pointsData || []).map(t => ({
      id: t.id,
      name: t.profile?.full_name || 'Unknown',
      email: t.profile?.email,
      type: 'points',
      amount: t.amount,
      description: t.reason,
      date: t.created_at,
      raw: t
    })),
    // Job payments
    ...(jobsData || []).map(j => ({
      id: j.id,
      name: j.conversation?.hunter?.full_name || 'Unknown',
      email: j.conversation?.hunter?.email,
      type: 'job',
      amount: j.hunter_amount,
      description: `Job: ${j.conversation?.job?.title}`,
      date: j.released_at,
      raw: j
    })),
    // Business subscriptions
    ...(businessData || []).map(b => ({
      id: b.id,
      name: b.profile?.full_name || 'Unknown',
      email: b.profile?.email,
      type: 'subscription',
      amount: 0,
      description: `Business Subscription: ${b.subscription_tier.toUpperCase()} plan`,
      date: b.subscription_expires_at || b.updated_at,
      raw: b
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  setTransactions(all)
  setFilteredTransactions(all)
  setLoading(false)
}

  const applyFilters = () => {
    let filtered = [...transactions]

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.email?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo))
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters({
      type: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    })
    setShowFilter(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const handleRowClick = (tx: any) => {
    setSelectedTx(tx)
    setShowModal(true)
  }

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

 // Calculate stats
const totalRevenue = filteredTransactions.filter(t => t.type === 'job').reduce((sum, t) => sum + (t.raw?.platform_fee || 0), 0)
const totalPointsSold = filteredTransactions.filter(t => t.type === 'points' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
const totalPremiumSubs = filteredTransactions.filter(t => t.type === 'points' && t.description?.includes('Premium')).length
const totalJobs = filteredTransactions.filter(t => t.type === 'job').length
const totalBusinessSubs = filteredTransactions.filter(t => t.type === 'subscription').length

const stats = [
  { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
  { label: 'Points Sold', value: totalPointsSold.toLocaleString(), icon: Zap, color: 'text-yellow-400' },
  { label: 'Premium Users', value: totalPremiumSubs, icon: Crown, color: 'text-purple-400' },
  { label: 'Jobs Done', value: totalJobs, icon: Briefcase, color: 'text-blue-400' },
  { label: 'Business Subs', value: totalBusinessSubs, icon: Building, color: 'text-orange-400' },
]
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Stats - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${stat.color} opacity-70`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-3 py-2 rounded-xl border transition flex items-center gap-1 text-sm ${
            showFilter ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
             <select
  value={filters.type}
  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
>
  <option value="all">All</option>
  <option value="points">Points</option>
  <option value="job">Jobs</option>
  <option value="subscription">Subscriptions</option>
</select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">
        {filteredTransactions.length} transactions
      </p>

      {/* Transactions Table - Horizontal scroll on mobile */}
      
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Date</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedTransactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  className="hover:bg-gray-800/50 cursor-pointer transition"
                  onClick={() => handleRowClick(tx)}
                >
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{tx.name}</p>
                    <p className="text-gray-500 text-xs">{tx.email}</p>
                  </td>
                <td className="px-4 py-3">
  <span className={`text-xs px-2 py-0.5 rounded-full ${
    tx.type === 'points' ? 'bg-purple-500/20 text-purple-400' : 
    tx.type === 'job' ? 'bg-green-500/20 text-green-400' : 
    'bg-orange-500/20 text-orange-400'
  }`}>
    {tx.type === 'points' ? 'Points' : tx.type === 'job' ? 'Job' : 'Subscription'}
  </span>
</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.type === 'points' ? 'pts' : '₦'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-sm">{formatDate(tx.date)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Eye className="w-4 h-4 text-purple-400 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No transactions found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Transaction Details</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">User</span>
                <span className="text-white text-sm font-medium">{selectedTx.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="text-white text-sm">{selectedTx.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Type</span>
                <span className="text-white text-sm capitalize">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className={`text-sm font-medium ${selectedTx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount} {selectedTx.type === 'points' ? 'points' : '₦'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Date</span>
                <span className="text-white text-sm">{new Date(selectedTx.date).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <span className="text-gray-400 text-sm">Description</span>
                <p className="text-white text-sm mt-1">{selectedTx.description}</p>
              </div>
              {selectedTx.type === 'job' && selectedTx.raw?.platform_fee && (
                <div className="flex justify-between pt-2 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">Platform Fee</span>
                  <span className="text-purple-400 text-sm">₦{selectedTx.raw.platform_fee.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800">
              <Button className="w-full" onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}