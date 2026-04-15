'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { 
  Search, User, Mail, Calendar, Shield, 
  Building, Star, Ban, CheckCircle, XCircle,
  Loader2, Crown, BadgeCheck, Verified, ChevronLeft,
  ChevronRight, Eye
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  grade: string
  is_premium: boolean
  is_identity_verified: boolean
  is_skill_verified: boolean
  is_admin: boolean
  created_at: string
  avatar_url: string
  points_balance: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const supabase = createClient()

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalHunters: 0,
    totalPremium: 0,
    pendingIdentity: 0,
    pendingSkills: 0
  })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [searchTerm, roleFilter, currentPage])

const fetchStats = async () => {
  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Businesses
  const { count: totalBusinesses } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'business')

  // Hunters
  const { count: totalHunters } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seeker')

  // Premium users
  const { count: totalPremium } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true)

  // Pending identity verifications - ONLY SEEKERS
  const { count: pendingIdentity } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seeker')
    .eq('identity_verification_status', 'pending')

  // Pending skill verifications - ONLY SEEKERS
  const { count: pendingSkills } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seeker')
    .eq('skill_verification_status', 'pending')

  setStats({
    totalUsers: totalUsers || 0,
    totalBusinesses: totalBusinesses || 0,
    totalHunters: totalHunters || 0,
    totalPremium: totalPremium || 0,
    pendingIdentity: pendingIdentity || 0,
    pendingSkills: pendingSkills || 0
  })
}

  const fetchUsers = async () => {
    setLoading(true)
    
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    const { data, count } = await query
    if (data) {
      setUsers(data as User[])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    }
    setLoading(false)
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    setActionLoading(userId)
    const newRole = currentRole === 'seeker' ? 'business' : 'seeker'
    
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    
    fetchUsers()
    fetchStats()
    setActionLoading(null)
  }

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    setActionLoading(userId)
    
    await supabase
      .from('profiles')
      .update({ is_admin: !isAdmin })
      .eq('id', userId)
    
    fetchUsers()
    fetchStats()
    setActionLoading(null)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'business') {
      return { color: 'bg-blue-500/20 text-blue-400', icon: Building, label: 'Business' }
    }
    if (role === 'admin') {
      return { color: 'bg-red-500/20 text-red-400', icon: Shield, label: 'Admin' }
    }
    return { color: 'bg-purple-500/20 text-purple-400', icon: User, label: 'Hunter' }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/users' },
    { label: 'Businesses', value: stats.totalBusinesses, icon: Building, color: 'text-blue-400', bg: 'bg-blue-500/10', link: '/admin/users?role=business' },
    { label: 'Hunters', value: stats.totalHunters, icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', link: '/admin/users?role=seeker' },
    { label: 'Premium', value: stats.totalPremium, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', link: '/admin/users?premium=true' },
    { label: 'Pending ID', value: stats.pendingIdentity, icon: BadgeCheck, color: 'text-orange-400', bg: 'bg-orange-500/10', link: '/admin/verifications?type=identity' },
    { label: 'Pending Skills', value: stats.pendingSkills, icon: Verified, color: 'text-gray-400', bg: 'bg-gray-500/10', link: '/admin/verifications?type=skill' },
  ]

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users Management</h1>
        <p className="text-gray-400 text-sm mt-1">Manage all users on the platform</p>
      </div>

      {/* Stats - 3x2 grid, clickable */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              onClick={() => router.push(stat.link)}
              className={`${stat.bg} rounded-xl p-3 text-center border border-gray-700 cursor-pointer hover:border-purple-500 transition-all hover:scale-105`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm"
        >
          <option value="all">All Roles</option>
          <option value="seeker">Hunters</option>
          <option value="business">Businesses</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">
        Showing {users.length} users
      </p>

      {/* Users Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full ">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Joined</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => {
                const RoleIcon = getRoleBadge(user.role).icon
                return (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getRoleBadge(user.role).color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {getRoleBadge(user.role).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.is_premium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        )}
                        {user.is_identity_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400">
                            <BadgeCheck className="w-3 h-3" />
                            ID
                          </span>
                        )}
                        {user.is_skill_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">
                            <Verified className="w-3 h-3" />
                            Skills
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <button className="p-1.5 hover:bg-gray-700 rounded-lg transition" title="View Details">
                            <Eye className="w-4 h-4 text-purple-400" />
                          </button>
                        </Link>
                        <button
                          onClick={() => toggleUserRole(user.id, user.role)}
                          disabled={actionLoading === user.id}
                          className="p-1.5 hover:bg-purple-500/20 rounded-lg transition"
                          title={`Make ${user.role === 'seeker' ? 'Business' : 'Hunter'}`}
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 text-purple-400" />}
                        </button>
                        <button
                          onClick={() => toggleAdmin(user.id, user.is_admin)}
                          disabled={actionLoading === user.id}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                          title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 text-red-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {users.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No users found</p>
        </div>
      )}
    </div>
  )
}