'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Send, User, Briefcase, 
  DollarSign, CheckCircle, Clock, Loader2,
  MessageCircle, Users, Zap, Crown
} from 'lucide-react'

interface Conversation {
  id: string
  job_id: string
  business_id: string
  hunter_id: string
  created_at: string
  updated_at: string
  job: {
    title: string
    budget: number
  }
  other_user: {
    id: string
    full_name: string
    avatar_url: string
    role: string
    grade: string
  }
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
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

      await fetchConversations(user.id, profileData)
    }

    fetchData()
  }, [router, supabase])

  const fetchConversations = async (userId: string, profileData: any) => {
    // Get conversations
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select(`
        *,
        job:job_id (title, budget),
        business:business_id (full_name, avatar_url),
        hunter:hunter_id (full_name, avatar_url, grade)
      `)
      .or(`business_id.eq.${userId},hunter_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (conversationsData) {
      const formatted = await Promise.all(conversationsData.map(async (conv) => {
        const otherUser = profileData?.role === 'business' ? conv.hunter : conv.business
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('message, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId)

        return {
          ...conv,
          other_user: {
            id: otherUser?.id,
            full_name: otherUser?.full_name,
            avatar_url: otherUser?.avatar_url,
            role: profileData?.role === 'business' ? 'hunter' : 'business',
            grade: otherUser?.grade
          },
          last_message: lastMsg?.message,
          last_message_at: lastMsg?.created_at,
          unread_count: count || 0
        }
      }))
      setConversations(formatted)
    }
    setLoading(false)
  }

const handleOpenConversation = async (conversationId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('No user found')
    return
  }

  console.log('Marking messages as read for conversation:', conversationId)
  console.log('User ID:', user.id)

  // Mark all messages in this conversation as read
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
  } else {
    console.log('Messages marked as read successfully:', data)
  }

  // Update local state to remove unread count
  setConversations(prev => prev.map(conv => 
    conv.id === conversationId 
      ? { ...conv, unread_count: 0 }
      : conv
  ))

  // Navigate to conversation
  router.push(`/messages/${conversationId}`)
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
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-purple-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Messages</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-2xl mx-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Messages Yet</h2>
            <p className="text-gray-400 text-sm">
              When you select an applicant, you can start messaging here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="cursor-pointer"
                onClick={() => handleOpenConversation(conv.id)}
              >
                <Card className={`hover:border-purple-500/50 transition ${ (conv.unread_count ?? 0) > 0 ? 'border-purple-500/50 bg-purple-900/10' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {conv.other_user.avatar_url ? (
                        <img 
                          src={conv.other_user.avatar_url} 
                          alt={conv.other_user.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white">{conv.other_user.full_name}</h3>
                          {(conv.unread_count ?? 0) > 0 && (                        
                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Briefcase className="w-3 h-3" />
                          <span>{conv.job?.title}</span>
                          <Zap className="w-3 h-3 text-yellow-500 ml-2" />
                          <span>₦{conv.job?.budget?.toLocaleString()}</span>
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}