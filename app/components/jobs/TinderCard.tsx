'use client'

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { MapPin, Zap, Briefcase, Home, Building, Clock, AlertCircle } from 'lucide-react'
import type { Job } from '@/app/types/jobs'

interface TinderCardProps {
  job: Job
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onAccept: () => void
  isActive: boolean
  cardIndex: number
  userPoints?: number
  userRank?: string
}

export function TinderCard({ 
  job, 
  onSwipeLeft, 
  onSwipeRight, 
  onAccept, 
  isActive, 
  cardIndex,
  userPoints = 0,
  userRank = 'E'
}: TinderCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10])
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

  const handleDragEnd = (event: MouseEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight()
    } else if (info.offset.x < -100) {
      onSwipeLeft()
    }
  }

  const getJobTypeIcon = () => {
    switch (job.job_type) {
      case 'remote':
        return <Home className="w-4 h-4" />
      case 'onsite':
        return <Building className="w-4 h-4" />
      case 'hybrid':
        return <Briefcase className="w-4 h-4" />
    }
  }

  const getGradeColor = () => {
    const colors: Record<string, string> = {
      E: 'from-gray-500 to-gray-600',
      D: 'from-blue-500 to-blue-600',
      C: 'from-green-500 to-green-600',
      B: 'from-yellow-500 to-yellow-600',
      A: 'from-orange-500 to-orange-600',
      S: 'from-purple-500 to-purple-600',
    }
    return colors[job.grade_required] || 'from-gray-500 to-gray-600'
  }

  // Check if user is eligible to apply
  const rankOrder: Record<string, number> = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 }
  const userRankIndex = rankOrder[userRank] || 0
  const jobRankIndex = rankOrder[job.grade_required] || 0
  
  const pointsCost: Record<string, number> = {
    'E': 5, 'D': 15, 'C': 30, 'B': 50, 'A': 75, 'S': 100
  }
  const requiredPoints = pointsCost[job.grade_required] || 5
  
  const isRankEligible = userRankIndex >= (jobRankIndex - 1)
  const hasEnoughPoints = userPoints >= requiredPoints
  const canApply = isRankEligible && hasEnoughPoints

  // Get disable reason
  const getDisableReason = () => {
    if (!isRankEligible) {
      return `Requires ${job.grade_required}-Rank. You are ${userRank}-Rank. Complete more gigs to level up!`
    }
    if (!hasEnoughPoints) {
      return `Need ${requiredPoints} points to apply. You have ${userPoints} points.`
    }
    return null
  }

  // Stack effect for cards behind
  const getCardStyle = () => {
    if (!isActive) {
      const offset = cardIndex * 8
      const scaleValue = 1 - (cardIndex * 0.05)
      return {
        transform: `scale(${scaleValue}) translateY(${-offset}px)`,
        opacity: 1 - (cardIndex * 0.2),
        zIndex: 10 - cardIndex,
        pointerEvents: 'none' as const,
      }
    }
    return {
      zIndex: 100,
      pointerEvents: 'auto' as const,
    }
  }

  const disableReason = getDisableReason()

  return (
    <motion.div
      style={{
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        scale: isActive ? scale : 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        cursor: isActive ? 'grab' : 'default',
        ...getCardStyle(),
      }}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header with gradient */}
      <div className={`h-32 bg-gradient-to-r ${getGradeColor()} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <div className="text-white/90 text-xs font-semibold mb-1">
                {job.job_type.toUpperCase()} • {job.location || 'Remote'}
              </div>
              <h3 className="text-white text-xl font-bold line-clamp-2">
                {job.title}
              </h3>
            </div>
            <div className="text-right ml-4">
              <div className="text-white text-2xl font-bold">
                ₦{job.budget.toLocaleString()}
              </div>
              <div className="text-white/80 text-xs">budget</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-3 py-1 bg-purple-100 rounded-full text-purple-700 font-medium flex items-center gap-1">
            {job.grade_required}-Rank Required
          </span>
          <span className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-700 capitalize flex items-center gap-1">
            {getJobTypeIcon()}
            {job.job_type}
          </span>
          {job.location && (
            <span className="text-xs px-3 py-1 bg-blue-100 rounded-full text-blue-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
          {job.description}
        </p>

        {/* Questions Preview */}
        {job.questions && job.questions.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Questions you'll answer:
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">{job.questions[0]}</p>
          </div>
        )}

        {/* Points & Rank Info */}
        {isActive && !canApply && (
          <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{disableReason}</span>
            </div>
          </div>
        )}

        {/* Accept Button */}
        {isActive && (
          <button
            onClick={canApply ? onAccept : undefined}
            disabled={!canApply}
            className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg mt-2 ${
              canApply 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5" />
            {canApply ? 'Accept This Gig' : `Need ${requiredPoints} points (You have ${userPoints})`}
          </button>
        )}
      </div>
    </motion.div>
  )
}