'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  Search, User, Mail, Calendar, Shield, 
  Building, Star, Ban, CheckCircle, XCircle,
  Loader2, Crown, BadgeCheck, Verified, ChevronLeft,
  ChevronRight, Eye, Clock
} from 'lucide-react'
import Link from 'next/link'

interface VerificationRequest {
  id: string
  user_id: string
  type: string
  status: string
  documents: any
  submitted_at: string
  profile: {
    full_name: string
    email: string
    avatar_url: string
  }
}

export default function VerificationsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, requests])

  const fetchRequests = async () => {
    setLoading(true)
    
    // Get pending verifications from profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'seeker')
      .or('identity_verification_status.eq.pending,skill_verification_status.eq.pending')

    if (profiles) {
      const requestsList = []
      for (const profile of profiles) {
        if (profile.identity_verification_status === 'pending') {
          requestsList.push({
            id: profile.id + '_identity',
            user_id: profile.id,
            type: 'identity',
            status: 'pending',
            documents: { id_document: profile.identity_document_url },
            submitted_at: profile.identity_submitted_at || profile.created_at,
            profile: {
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url
            }
          })
        }
        if (profile.skill_verification_status === 'pending') {
          requestsList.push({
            id: profile.id + '_skill',
            user_id: profile.id,
            type: 'skill',
            status: 'pending',
            documents: { files: [] },
            submitted_at: profile.skill_submitted_at || profile.created_at,
            profile: {
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url
            }
          })
        }
      }
      setRequests(requestsList)
      setFilteredRequests(requestsList)
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...requests]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(req => 
        req.profile?.full_name?.toLowerCase().includes(searchLower) ||
        req.profile?.email?.toLowerCase().includes(searchLower)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter)
    }

    setFilteredRequests(filtered)
  }

  const getTypeIcon = (type: string) => {
    if (type === 'identity') return <BadgeCheck className="w-4 h-4 text-orange-400" />
    return <Verified className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Verification Requests</h1>
        <p className="text-gray-400 text-sm mt-1">Review and approve identity/skill verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-yellow-400">{requests.length}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-purple-400">
            {requests.filter(r => r.type === 'identity').length}
          </p>
          <p className="text-xs text-gray-500">Identity</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-bold text-blue-400">
            {requests.filter(r => r.type === 'skill').length}
          </p>
          <p className="text-xs text-gray-500">Skills</p>
        </div>
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="identity">Identity</option>
          <option value="skill">Skills</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">
        Showing {filteredRequests.length} of {requests.length} requests
      </p>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-400">No pending verification requests</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Submitted</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/admin/verifications/${req.user_id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {req.profile?.avatar_url ? (
                          <img src={req.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{req.profile?.full_name || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">{req.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(req.type)}
                        <span className="text-sm text-gray-300 capitalize">{req.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-400">
                          {new Date(req.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/verifications/${req.user_id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 text-purple-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}