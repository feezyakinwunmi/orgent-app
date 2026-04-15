'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, Zap, MapPin, Briefcase } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: any) => void
}

export function FilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
  const [jobType, setJobType] = useState<string[]>([])
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [gradeRequired, setGradeRequired] = useState<string[]>([])
  const [location, setLocation] = useState('')

  const jobTypes = ['remote', 'onsite', 'hybrid']
  const grades = ['E', 'D', 'C', 'B', 'A', 'S']

  const handleApply = () => {
    onApply({
      jobType: jobType.length > 0 ? jobType : null,
      minBudget: minBudget ? parseInt(minBudget) : null,
      maxBudget: maxBudget ? parseInt(maxBudget) : null,
      gradeRequired: gradeRequired.length > 0 ? gradeRequired : null,
      location: location || null,
    })
    onClose()
  }

  const handleReset = () => {
    setJobType([])
    setMinBudget('')
    setMaxBudget('')
    setGradeRequired([])
    setLocation('')
    onApply({})
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-purple-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold">Filters</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  Job Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {jobTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setJobType(prev => 
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                      className={`px-4 py-2 rounded-lg capitalize transition ${
                        jobType.includes(type)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Budget Range (₦)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Grade Required */}
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Rank</label>
                <div className="flex gap-2 flex-wrap">
                  {grades.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setGradeRequired(prev =>
                        prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
                      )}
                      className={`w-10 h-10 rounded-full font-bold transition ${
                        gradeRequired.includes(grade)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City or area..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  Reset All
                </Button>
                <Button className="flex-1" onClick={handleApply}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}