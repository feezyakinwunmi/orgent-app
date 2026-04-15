'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { 
  Home, Briefcase, User, 
  Zap, Star, Crown, Shield, MessageCircle,
  BadgeCheck, Bookmark, LayoutDashboard, Users,
  DollarSign, Settings
} from 'lucide-react'

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const supabase = createClient()

  const checkUnreadMessages = async (userId: string) => {
    try {
      // Get all conversation IDs where user is involved
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`business_id.eq.${userId},hunter_id.eq.${userId}`)

      if (!conversations || conversations.length === 0) {
        setHasUnread(false)
        return
      }

      const conversationIds = conversations.map(c => c.id)

      // Check if there are any unread messages in these conversations
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId)

      if (error) {
        console.error('Error checking messages:', error)
        setHasUnread(false)
      } else {
        setHasUnread(count !== null && count > 0)
      }
      
    } catch (error) {
      console.error('Error:', error)
      setHasUnread(false)
    }
  }

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
        
        // Initial check
        await checkUnreadMessages(user.id)
        
        // Subscribe to real-time changes on messages table
        const subscription = supabase
          .channel('messages_unread')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
            },
            () => {
              // Re-check when any message changes
              checkUnreadMessages(user.id)
            }
          )
          .subscribe()
        
        // Also check when page becomes visible (user returns from messages)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            checkUnreadMessages(user.id)
          }
        }
        
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        return () => {
          subscription.unsubscribe()
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }
    }
    getProfile()
  }, [supabase])

  // Also check when pathname changes (navigation between pages)
  useEffect(() => {
    const refreshUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await checkUnreadMessages(user.id)
      }
    }
    refreshUnread()
  }, [pathname])

  const handleChatClick = () => {
    setHasUnread(false) // Clear dot immediately for better UX
    router.push('/messages')
  }

  // Don't show nav on auth pages
  if (pathname?.startsWith('/auth')) return null
  if (pathname?.startsWith('/admin')) return null
  if (pathname === '/') return null

  // ADMIN NAVIGATION
  if (profile?.is_admin) {
    const adminLinks = [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/verifications', label: 'Verify', icon: Shield },
      { href: '/admin/payments', label: 'Payments', icon: DollarSign },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]

    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex justify-around items-center">
              {adminLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                      isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
        <div className="pb-16" />
      </>
    )
  }

  // BUSINESS NAVIGATION
  if (profile?.role === 'business') {
    const businessLinks = [
      { href: '/business/dashboard', label: 'Home', icon: Home },
      { href: '/business/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/messages', label: 'Chat', icon: MessageCircle },
      { href: '/business/profile', label: 'Profile', icon: User },
    ]

    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex justify-around items-center">
              {businessLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                
                if (link.href === '/messages') {
                  return (
                    <button
                      key={link.href}
                      onClick={handleChatClick}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition relative ${
                        isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px]">{link.label}</span>
                    </button>
                  )
                }
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                      isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
        <div className="pb-16" />
      </>
    )
  }

  // HUNTER/SEEKER NAVIGATION
  const seekerLinks = [
    { href: '/jobs', label: 'Gigs', icon: Briefcase },
    { href: '/jobs/active', label: 'My Jobs', icon: Star },
    { href: '/jobs/saved', label: 'Saved', icon: Bookmark },
    { href: '/messages', label: 'Chat', icon: MessageCircle },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            {seekerLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              if (link.href === '/messages') {
                return (
                  <button
                    key={link.href}
                    onClick={handleChatClick}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition relative ${
                      isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px]">{link.label}</span>
                  </button>
                )
              }
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                    isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
      <div className="pb-16" />
    </>
  )
}