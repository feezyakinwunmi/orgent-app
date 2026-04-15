'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/app/lib/supabase/client'
import { FilterModal } from '@/app/components/jobs/FilterModal'
import { Button } from '@/app/components/ui/Button'
import { Briefcase, History, Zap, Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Award, MapPin, Home, Building, Clock, BookmarkCheck, Bookmark, Image } from 'lucide-react'
import type { Job } from '@/app/types/jobs'
import Link from 'next/link'

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<any>({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const cardOffset = 140
  const farOffset = 280

  // Fetch saved jobs on load
useEffect(() => {
  const fetchSavedJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
    
    if (data) {
      setSavedJobs(new Set(data.map(s => s.job_id)))
    }
  }
  fetchSavedJobs()
}, [])

// Function to save/unsave job
const toggleSaveJob = async (jobId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/auth/login')
    return
  }
  
  if (savedJobs.has(jobId)) {
    // Unsave
    await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)
    
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      newSet.delete(jobId)
      return newSet
    })
  } else {
    // Save
    await supabase
      .from('saved_jobs')
      .insert({ user_id: user.id, job_id: jobId })
    
    setSavedJobs(prev => new Set([...prev, jobId]))
  }
}

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
      
      if (profileData?.role === 'business') {
        router.push('/business/dashboard')
        return
      }

      // Rank order for comparison
      const rankOrder: Record<string, number> = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 }
      const userRankIndex = rankOrder[profileData?.grade || 'E']

      // Fetch jobs that user is eligible for
      const eligibleRanks = Object.keys(rankOrder).filter(rank => {
        const jobRankIndex = rankOrder[rank]
        return jobRankIndex <= userRankIndex + 1
      })

      const { data: jobsData } = await supabase
        .from('jobs')
        .select(`*,
             business_profiles!inner (
      id,
      business_name,
      logo_url
    )
    `)
        .eq('status', 'open')
        // .in('grade_required', eligibleRanks)
        .order('created_at', { ascending: false })

      if (jobsData) {
        setJobs(jobsData as Job[])
        setFilteredJobs(jobsData as Job[])
      }
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  useEffect(() => {
    let filtered = [...jobs]

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (activeFilters.jobType?.length > 0) {
      filtered = filtered.filter(job => activeFilters.jobType.includes(job.job_type))
    }
    if (activeFilters.minBudget) {
      filtered = filtered.filter(job => job.budget >= activeFilters.minBudget)
    }
    if (activeFilters.maxBudget) {
      filtered = filtered.filter(job => job.budget <= activeFilters.maxBudget)
    }
    if (activeFilters.gradeRequired?.length > 0) {
      filtered = filtered.filter(job => activeFilters.gradeRequired.includes(job.grade_required))
    }
    if (activeFilters.location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(activeFilters.location.toLowerCase())
      )
    }

    setFilteredJobs(filtered)
    setCurrentIndex(0)
  }, [searchTerm, activeFilters, jobs])

  const handleNext = () => {
    if (currentIndex < filteredJobs.length - 1) setCurrentIndex(currentIndex + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleAccept = (job: Job) => {
    localStorage.setItem('applyingJob', JSON.stringify(job))
    router.push(`/jobs/apply/${job.id}`)
  }

  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters)
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragStart(clientX)
    setDragOffset(0)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragOffset(clientX - dragStart)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    if (dragOffset > 60) handlePrev()
    else if (dragOffset < -60) handleNext()
    
    setIsDragging(false)
    setDragOffset(0)
  }

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex

    if (diff === 0) {
      return {
        transform: `translateX(0px) scale(1)`,
        opacity: 1,
        zIndex: 10,
        pointerEvents: 'auto' as const,
      }
    } 
    else if (diff === 1) {
      return {
        transform: `translateX(${cardOffset}px) scale(0.88)`,
        opacity: 0.65,
        zIndex: 5,
        pointerEvents: 'none' as const,
      }
    } 
    else if (diff === -1) {
      return {
        transform: `translateX(-${cardOffset}px) scale(0.88)`,
        opacity: 0.65,
        zIndex: 5,
        pointerEvents: 'none' as const,
      }
    } 
    else if (diff > 1) {
      return {
        transform: `translateX(${farOffset}px) scale(0.75)`,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
      }
    } 
    else {
      return {
        transform: `translateX(-${farOffset}px) scale(0.75)`,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'remote': return <Home className="w-4 h-4" />
      case 'onsite': return <Building className="w-4 h-4" />
      case 'hybrid': return <Briefcase className="w-4 h-4" />
      default: return <Briefcase className="w-4 h-4" />
    }
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      E: 'text-gray-400 border-gray-500',
      D: 'text-blue-400 border-blue-500',
      C: 'text-green-400 border-green-500',
      B: 'text-yellow-400 border-yellow-500',
      A: 'text-orange-400 border-orange-500',
      S: 'text-purple-400 border-purple-500',
    }
    return colors[grade] || 'text-gray-400 border-gray-500'
  }

  // Points cost mapping
const pointsCost: Record<string, number> = {
  'E': 10,
  'D': 30,
  'C': 60,
  'B': 120,
  'A': 200,
  'S': 300
}

  // Rank order for comparison
  const rankOrder: Record<string, number> = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 }
  const userRankIndex = rankOrder[profile?.grade || 'E']




  

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Orgent
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-purple-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-bold text-white">{profile?.points_balance || 0} pts</span>
              </div>
              <div className="flex items-center gap-1 bg-purple-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
                <Award className="w-3 h-3 text-purple-400" />
                <span className="text-xs font-bold text-white">{profile?.grade || 'E'}-Rank</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="Search gigs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-400"
              />
            </div>
            <button onClick={() => setShowFilters(true)} className="px-4 py-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl hover:bg-purple-800/30 transition">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            </button>
            <button onClick={() => router.push('/jobs/active')} className="px-4 py-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl hover:bg-purple-800/30 transition">
              <History className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>
      </header>

      <main 
        className="relative z-10 py-6 min-h-[calc(100vh)]"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="max-w-md mx-auto ">
          {/* Header Stats */}
          <div className="text-center mb-6 mx-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Find Your Next Gig
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredJobs.length} opportunity{filteredJobs.length !== 1 ? 's' : ''} available
            </p>
            {Object.keys(activeFilters).length > 0 && (
              <button 
                onClick={() => setActiveFilters({})}
                className="mt-2 text-xs text-purple-400 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Points Banner */}
          {profile && (
            <div className="mb-4 mx-4 p-3 rounded-lg flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30">
              <div>
                <p className="text-sm text-yellow-400">
                  You have <span className="font-bold">{profile.points_balance}</span> points
                </p>
                {profile.points_balance < 50 && (
                  <p className="text-xs text-gray-400">
                    Low points! Complete more gigs or upgrade to Premium for bonus points.
                  </p>
                )}
              </div>
              <Link href="/upgrade/premium">
                <Button size="sm" variant="outline" className="text-yellow-400 border-yellow-500">
                  Get Points
                </Button>
              </Link>
            </div>
          )}

          {/* Card Stack Container */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/30">
                <Briefcase className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Gigs Found</h2>
              <p className="text-gray-400 text-sm">
                {searchTerm || Object.keys(activeFilters).length > 0 
                  ? "Try adjusting your search or filters" 
                  : "Check back later for new opportunities"}
              </p>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative h-[560px] flex items-center justify-center overflow-hidden"
            >
              {filteredJobs.map((job, index) => {
                const diff = index - currentIndex
                if (Math.abs(diff) > 2) return null

                const style = getCardStyle(index)
                const isCenter = diff === 0
                
                // Check if user can apply
             const jobRankIndex = rankOrder[job.grade_required]
const requiredPoints = pointsCost[job.grade_required] || 10
const isRankEligible = userRankIndex >= (jobRankIndex - 1)
const hasEnoughPoints = (profile?.points_balance || 0) >= requiredPoints
const canApply = isRankEligible && hasEnoughPoints
                
              const getDisableReason = () => {
  if (!isRankEligible) {
    const requiredRank = getRequiredRank(job.grade_required)
    return `Requires ${requiredRank}-Rank or higher. You are ${profile?.grade || 'E'}-Rank`
  }
  if (!hasEnoughPoints) {
    return `Need ${requiredPoints} points to apply for this ${job.grade_required}-Rank job`
  }
  return null
}


const getRequiredRank = (jobRank: string): string => {
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S']
  const jobIndex = ranks.indexOf(jobRank)
  const requiredIndex = Math.max(0, jobIndex - 1)
  return ranks[requiredIndex]
}
                return (
                  <motion.div
                    key={job.id}
                    initial={false}
                    animate={style}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    className="absolute w-[80%] max-w-[420px] mx-auto bg-gradient-to-br from-purple-900/30 to-black/50 backdrop-blur-xl border-2 rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                      borderColor: isCenter ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.25)',
                      boxShadow: isCenter 
                        ? '0 0 40px rgba(139, 92, 246, 0.35)' 
                        : '0 10px 30px rgba(0, 0, 0, 0.4)',
                      left: '10%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Grade Badge */}
                    <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border ${getGradeColor(job.grade_required)} text-xs font-bold`}>
  {job.grade_required}-Rank • {requiredPoints} pts
</div>
                    {/* Save Button - Top Right */}
<button
  onClick={() => toggleSaveJob(job.id)}
  className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-purple-600/60 transition"
>
  {savedJobs.has(job.id) ? (
    <BookmarkCheck className="w-4 h-4 text-purple-400" />
  ) : (
    <Bookmark className="w-4 h-4 text-gray-400" />
  )}
</button>


                    <div className=" mt-10 p-6 pt-8">

                        <div className="flex items-center gap-3 mb-4">
  {job.business_profiles?.logo_url ? (
    <img 
      src={job.business_profiles.logo_url} 
      alt={job.business_profiles.business_name}
      className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
      <Briefcase className="w-5 h-5 text-white" />
    </div>
  )}
  <div>
    <p className="text-white text-sm font-medium">
      {job.business_profiles?.business_name || 'Anonymous Business'}
    </p>
    <p className="text-gray-500 text-xs">Posted {new Date(job.created_at).toLocaleDateString()}</p>
  </div>
</div>

                      <h3 className="text-2xl font-bold text-white mb-3 pr-12 leading-tight">
                        {job.title}
                      </h3>

                      <div className="flex items-center gap-2 text-yellow-400 mb-4">
                        <Zap className="w-5 h-5" />
                        <span className="text-3xl font-bold">₦{job.budget.toLocaleString()}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-5">
                        <span className="text-xs px-3 py-1.5 bg-purple-500/20 rounded-full text-purple-300 capitalize flex items-center gap-1.5 border border-purple-500/30">
                          {getJobTypeIcon(job.job_type)}
                          {job.job_type}
                        </span>
                        {job.location && (
                          <span className="text-xs px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-300 flex items-center gap-1.5 border border-blue-500/30">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-300 text-[15px] mt-8 mb-5 leading-relaxed line-clamp-4">
                        {job.description}
                      </p>

                      {/* {job.questions && job.questions.length > 0 && (
                        <div className="mb-6 p-4 bg-purple-900/20 rounded-2xl border border-purple-500/30">
                          <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Questions
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-2">{job.questions[0]}</p>
                        </div>
                      )} */}

                      {/* Points & Rank Warning */}
                      {isCenter && !canApply && (
                        <div className="mb-3 p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                          <p className="text-xs text-red-400 text-center">
                            {getDisableReason()}
                          </p>
                        </div>
                      )}

                      {/* Accept Button */}
                      {isCenter && (
                        <button
                          onClick={() => canApply && handleAccept(job)}
                          disabled={!canApply}
                          className={`w-full py-4 rounded-2xl text-white font-semibold text-md px-2 transition-all active:scale-[0.985] shadow-xl flex items-center justify-center gap-2 ${
                            canApply 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/40 cursor-pointer'
                              : 'bg-gray-600 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <Zap className="w-5 h-5 " />
                          {canApply ? 'View This Quest' : `Need ${requiredPoints} points (You have ${profile?.points_balance || 0})`}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Navigation */}
          {filteredJobs.length > 0 && (
            <>
              <div className="flex justify-center gap-8 mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-sm ${
                    currentIndex === 0
                      ? 'bg-zinc-900/50 border-zinc-700 text-zinc-600'
                      : 'bg-purple-900/30 border-purple-500/70 text-purple-400 hover:bg-purple-800/40'
                  }`}
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === filteredJobs.length - 1}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-sm ${
                    currentIndex === filteredJobs.length - 1
                      ? 'bg-zinc-900/50 border-zinc-700 text-zinc-600'
                      : 'bg-purple-900/30 border-purple-500/70 text-purple-400 hover:bg-purple-800/40'
                  }`}
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </div>

              <div className="text-center mt-5">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-900/20 backdrop-blur-sm rounded-full border border-purple-500/30 text-sm">
                  <span className="text-purple-400 font-medium">
                    {currentIndex + 1} of {filteredJobs.length}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilterApply}
      />
    </div>
  )
}