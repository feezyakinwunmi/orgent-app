'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Plus, Trash2, Loader2, 
  Briefcase, MapPin, Zap, Award, Crown,
  AlertCircle, Lock, TrendingUp
} from 'lucide-react'

export default function CreateJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    tier: 'free',
    jobsUsed: 0,
    jobsLimit: 3,
    canSelectRank: false,
    remainingJobs: 3
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    job_type: 'remote',
    location: '',
    grade_required: 'E',
    questions: ['', '', '']
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get both profile and business in parallel
      const [profileResult, businessResult] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase.from('business_profiles').select('*').eq('user_id', user.id).single()
      ])

      if (profileResult.error || profileResult.data?.role !== 'business') {
        router.push('/jobs')
        return
      }

      let business = businessResult.data

      if (!business) {
        const { data: newBusiness } = await supabase
          .from('business_profiles')
          .insert({
            user_id: user.id,
            business_name: 'My Business',
            description: '',
            subscription_tier: 'free',
            jobs_posted_this_month: 0,
            last_reset_date: new Date().toISOString()
          })
          .select()
          .single()
        
        if (newBusiness) {
          business = newBusiness
        }
      }
      
      // Check subscription expiry
      if (business?.subscription_expires_at && new Date(business.subscription_expires_at) < new Date()) {
        await supabase
          .from('business_profiles')
          .update({ 
            subscription_tier: 'free',
            subscription_expires_at: null
          })
          .eq('id', business.id)
        
        business.subscription_tier = 'free'
        business.subscription_expires_at = null
      }
      
      setBusinessProfile(business)

      // Calculate limits
      const tier = business?.subscription_tier || 'free'
      const jobsLimit = tier === 'free' ? 3 : tier === 'pro' ? 15 : 999
      const canSelectRank = tier !== 'free'
      const jobsUsed = business?.jobs_posted_this_month || 0
      const remainingJobs = jobsLimit - jobsUsed

      setSubscriptionInfo({
        tier,
        jobsUsed,
        jobsLimit,
        canSelectRank,
        remainingJobs
      })
      
      setInitialLoading(false)
    }

    fetchBusiness()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (subscriptionInfo.remainingJobs <= 0) {
      alert(`You have reached your monthly limit of ${subscriptionInfo.jobsLimit} jobs. Upgrade to post more.`)
      return
    }

    if (!businessProfile) return

    setLoading(true)

    const filteredQuestions = formData.questions.filter(q => q.trim() !== '')
    const finalGradeRequired = subscriptionInfo.canSelectRank ? formData.grade_required : 'E'

    const { error } = await supabase
      .from('jobs')
      .insert({
        business_id: businessProfile.id,
        title: formData.title,
        description: formData.description,
        budget: parseInt(formData.budget),
        job_type: formData.job_type,
        location: formData.location || null,
        grade_required: finalGradeRequired,
        questions: filteredQuestions,
        status: 'open'
      })

    if (error) {
      console.error('Error creating job:', error)
      alert('Failed to create job')
    } else {
      await supabase
        .from('business_profiles')
        .update({ 
          jobs_posted_this_month: subscriptionInfo.jobsUsed + 1
        })
        .eq('id', businessProfile.id)
      
      router.push('/business/dashboard')
    }
    setLoading(false)
  }

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = value
    setFormData({ ...formData, questions: newQuestions })
  }

  const addQuestion = () => {
    setFormData({ ...formData, questions: [...formData.questions, ''] })
  }

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index)
      setFormData({ ...formData, questions: newQuestions })
    }
  }

  const getTierBadge = () => {
    switch (subscriptionInfo.tier) {
      case 'free':
        return { color: 'bg-gray-500/20 text-gray-400', label: 'Free', icon: Lock }
      case 'pro':
        return { color: 'bg-blue-500/20 text-blue-400', label: 'Pro', icon: TrendingUp }
      case 'enterprise':
        return { color: 'bg-purple-500/20 text-purple-400', label: 'Enterprise', icon: Crown }
      default:
        return { color: 'bg-gray-500/20 text-gray-400', label: 'Free', icon: Lock }
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const tierBadge = getTierBadge()
  const TierIcon = tierBadge.icon

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-purple-400">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Post a New Gig</h1>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${tierBadge.color}`}>
            <TierIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{tierBadge.label}</span>
          </div>
        </div>

        {/* Subscription Info Card */}
        <Card className="p-4 mb-6 bg-purple-900/20 border-purple-500/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-gray-300">Monthly Job Limit</p>
              <p className="text-lg font-bold text-white">
                {subscriptionInfo.jobsUsed} / {subscriptionInfo.jobsLimit} jobs used
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Remaining</p>
              <p className={`text-lg font-bold ${subscriptionInfo.remainingJobs > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {subscriptionInfo.remainingJobs} jobs left
              </p>
            </div>
          </div>
          
          {subscriptionInfo.remainingJobs <= 0 && (
            <div className="mt-3 p-2 bg-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">
                You've reached your monthly limit. <button onClick={() => router.push('/upgrade/business')} className="underline">Upgrade to post more</button>
              </p>
            </div>
          )}

          {!subscriptionInfo.canSelectRank && (
            <div className="mt-3 p-2 bg-yellow-500/20 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                Free tier: Jobs are limited to E-Rank. <button onClick={() => router.push('/upgrade/business')} className="underline">Upgrade to set higher ranks</button>
              </p>
            </div>
          )}
        </Card>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="p-5">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              placeholder="e.g., Logo Designer Needed"
              required
            />
          </Card>

          <Card className="p-5">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none"
              placeholder="Describe the job, requirements, and expectations..."
              required
            />
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Budget (₦) *
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                placeholder="5000"
                required
              />
            </Card>

            <Card className="p-5">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Job Type *
              </label>
              <select
                value={formData.job_type}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="remote">Remote</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Location (for onsite/hybrid)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                placeholder="Lagos, Nigeria"
              />
            </Card>

            <Card className="p-5">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Minimum Rank Required
              </label>
              <select
                value={formData.grade_required}
                onChange={(e) => setFormData({ ...formData, grade_required: e.target.value })}
                className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white ${
                  !subscriptionInfo.canSelectRank ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!subscriptionInfo.canSelectRank}
              >
                <option value="E">E-Rank (10 points to apply)</option>
                {subscriptionInfo.canSelectRank && (
                  <>
                    <option value="D">D-Rank (30 points to apply)</option>
                    <option value="C">C-Rank (60 points to apply)</option>
                    <option value="B">B-Rank (120 points to apply)</option>
                    <option value="A">A-Rank (200 points to apply)</option>
                    <option value="S">S-Rank (300 points to apply)</option>
                  </>
                )}
              </select>
              {!subscriptionInfo.canSelectRank && (
                <p className="text-xs text-yellow-400 mt-1">Upgrade to Pro or Enterprise to set higher ranks</p>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Application Questions
            </label>
            <p className="text-xs text-gray-500 mb-3">Add questions applicants must answer</p>
            {formData.questions.map((q, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                  placeholder={`Question ${index + 1}`}
                />
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="text-purple-400 text-sm hover:underline flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || subscriptionInfo.remainingJobs <= 0} 
              className="flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Post Job
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}