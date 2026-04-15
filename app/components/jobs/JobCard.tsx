'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Star, Zap, Briefcase, Home, Building } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import type { Job } from '@/app/types/jobs'

interface JobCardProps {
  job: Job
  onPass: () => void
  onApply: () => void
  isDragging?: boolean
}

export function JobCard({ job, onPass, onApply, isDragging = false }: JobCardProps) {
  const getJobTypeIcon = () => {
    switch (job.job_type) {
      case 'remote':
        return <Home className="w-3 h-3" />
      case 'onsite':
        return <Building className="w-3 h-3" />
      case 'hybrid':
        return <Briefcase className="w-3 h-3" />
    }
  }

  const getGradeColor = () => {
    const colors: Record<string, string> = {
      E: 'text-gray-400',
      D: 'text-blue-400',
      C: 'text-green-400',
      B: 'text-yellow-400',
      A: 'text-orange-400',
      S: 'text-purple-400',
    }
    return colors[job.grade_required] || 'text-gray-400'
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      whileHover={{ y: -2 }}
      className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-base font-bold text-white flex-1 line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-xs font-bold ${getGradeColor()}`}>
              {job.grade_required}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 rounded-full text-purple-400 capitalize">
              {job.job_type === 'remote' ? '🏠' : job.job_type === 'onsite' ? '📍' : '🔄'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>₦{job.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            {getJobTypeIcon()}
            <span className="capitalize">{job.job_type}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-gray-300 text-sm line-clamp-3 mb-3">
          {job.description}
        </p>
        
        {job.questions.length > 0 && (
          <div className="mb-3 p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-purple-400 mb-0.5">Question:</p>
            <p className="text-xs text-gray-400 line-clamp-2">{job.questions[0]}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-purple-500/20 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-sm py-2"
          onClick={onPass}
          disabled={isDragging}
        >
          Pass
        </Button>
        <Button
          size="sm"
          className="flex-1 text-sm py-2"
          onClick={onApply}
          disabled={isDragging}
        >
          Apply
        </Button>
      </div>
    </motion.div>
  )
}