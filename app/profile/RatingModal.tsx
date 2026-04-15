'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, review: string) => Promise<void>
  jobTitle: string
  businessName: string
  existingRating?: number
  existingReview?: string
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  jobTitle, 
  businessName,
  existingRating = 0,
  existingReview = ''
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState(existingReview)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    
    setLoading(true)
    await onSubmit(rating, review)
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-purple-500/30"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Rate Your Experience</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-2">
          {jobTitle}
        </p>
        <p className="text-purple-400 text-xs mb-4">
          {businessName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Rating
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && (
              <p className="text-xs text-red-400 mt-1">Please select a rating</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Your Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none"
              placeholder="Share your experience working with this business..."
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || rating === 0} 
            className="w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
            {existingRating ? 'Update Rating' : 'Submit Rating'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}