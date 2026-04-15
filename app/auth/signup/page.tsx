'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { GlowText } from '@/app/components/ui/GlowText'
import { Card } from '@/app/components/ui/Card'
import { Mail, Lock, User, ArrowRight, CheckCircle, Briefcase, Building, Users, MapPin, Globe, Phone } from 'lucide-react'
import { PasswordInput } from '@/app/components/ui/PasswordInput'

export default function SignupPage() {
  const router = useRouter()
  
  // Common fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'seeker' | 'business'>('seeker')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Business-specific fields
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')

  const supabase = createClient()
  
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const refCode = urlParams.get('ref')
  if (refCode) {
    localStorage.setItem('referralCode', refCode)
  }
}, [])


  

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Prepare metadata based on role
    const metadata: any = {
      full_name: fullName,
      role: role,
    }

    // Add business metadata if role is business
    if (role === 'business') {
      metadata.business_name = businessName
      metadata.business_type = businessType
      metadata.business_phone = businessPhone
      metadata.business_address = businessAddress
      metadata.business_description = businessDescription
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {

        // After successful signup - add this INSIDE the else block where success is true
if (data.user) {
  const referralCode = localStorage.getItem('referralCode')
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single()
    
    if (referrer) {
      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.user_id,
          referred_id: data.user.id,
          status: 'pending'
        })
    }
    localStorage.removeItem('referralCode')
  }
}
      setSuccess(true)
      setLoading(false)
      
      // Clear form
      setFullName('')
      setEmail('')
      setPassword('')
      setBusinessName('')
      setBusinessType('')
      setBusinessPhone('')
      setBusinessAddress('')
      setBusinessDescription('')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Check Your Email, <GlowText>{role === 'business' ? 'Entrepreneur' : 'Hunter'}</GlowText>
            </h2>
            <p className="text-gray-400 mb-4">
              We sent a verification link to:
            </p>
            <p className="text-purple-400 font-medium mb-6">{email}</p>
            <p className="text-gray-500 text-sm mb-6">
              Click the link in the email to verify your account and start your journey.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 text-sm text-gray-500 hover:text-purple-400"
            >
              ← Back to signup
            </button>
          </Card>
        </motion.div>
      </div>
    )
  }




  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Image Banner */}
        <div className="relative mb-8 rounded-2xl overflow-hidden h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-black/80 z-10" />
          <img 
            src="/solol.jpeg"
            alt="Work together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {role === 'business' ? 'Find Top Talent' : 'Start Your Journey'}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {role === 'business' 
                  ? 'Post gigs and find skilled workers instantly' 
                  : 'Find urgent gigs and earn your daily 2k'}
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          {/* Role Selection - Small and at the top */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-900/50 rounded-lg border border-purple-500/20">
            <button
              type="button"
              onClick={() => setRole('seeker')}
              className={`flex-1 py-2 px-3 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                role === 'seeker'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole('business')}
              className={`flex-1 py-2 px-3 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                role === 'business'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Building className="w-4 h-4" />
              Business
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-4">
            {/* Common Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="hello@example.com"
                    required
                  />
                </div>
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
                  placeholder="•••••••• (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Business-specific fields */}
            {role === 'business' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-purple-500/20"
              >
                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Business Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Type
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="tech">Tech / IT</option>
                        <option value="retail">Retail / E-commerce</option>
                        <option value="service">Service Provider</option>
                        <option value="restaurant">Restaurant / Food</option>
                        <option value="creative">Creative Agency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                        placeholder="+234 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Business Description
                  </label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="Tell us what your business does..."
                  />
                </div>
              </motion.div>
            )}

            <Button type="submit" size="lg" className="w-full flex justify-between" disabled={loading}>
              {loading ? 'Creating Account...' : `Sign up as ${role === 'business' ? 'Business' : 'Job Seeker'}`}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
              Login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}