'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { GlowText } from '@/app/components/ui/GlowText'
import { Card } from '@/app/components/ui/Card'
import { Mail, Lock, Shield } from 'lucide-react'
import { PasswordInput } from '@/app/components/ui/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email first. Check your inbox for the confirmation link.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else if (data.user) {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Error fetching user profile')
        setLoading(false)
        return
      }

      console.log('User profile:', profile)

      // Redirect based on is_admin FIRST
      if (profile?.is_admin === true) {
        console.log('Admin user - redirecting to /admin')
        window.location.href = '/admin'
      } 
      else if (profile?.role === 'business') {
        console.log('Business user - redirecting to /business/dashboard')
        window.location.href = '/business/dashboard'
      } 
      else {
        console.log('Hunter user - redirecting to /jobs')
        window.location.href = '/jobs'
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Image Banner */}
        <div className="relative mb-8 rounded-2xl overflow-hidden h-32">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-black/60 z-10" />
          <img 
            src="/solol.jpeg"
            alt="Welcome to Orgent"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
              </div>
              <h2 className="text-white font-bold text-lg">Welcome Back</h2>
              <p className="text-gray-300 text-xs">Sign in to continue your journey</p>
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              <GlowText>Orgent</GlowText>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Ready to continue your grind?
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="text-right mt-2">
                <Link href="/auth/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Logging in...
                </div>
              ) : (
                <>Sign In</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium transition">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}