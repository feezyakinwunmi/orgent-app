'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  onWithdraw: (amount: number) => Promise<void>
  maxAmount: number
}

export function WithdrawalModal({ isOpen, onClose, onWithdraw, maxAmount }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseInt(amount)
    
    if (isNaN(amountNum) || amountNum < 1000) {
      setError('Minimum withdrawal amount is ₦1,000')
      return
    }
    
    if (amountNum > maxAmount) {
      setError(`Maximum withdrawal amount is ₦${maxAmount.toLocaleString()}`)
      return
    }
    
    setLoading(true)
    setError('')
    await onWithdraw(amountNum)
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
          <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <p className="text-sm text-gray-300">
            Available balance: <span className="text-purple-400 font-bold">₦{maxAmount.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₦1,000</p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount (₦)
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                placeholder="Enter amount"
                min="1000"
                max={maxAmount}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Request Withdrawal
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Withdrawals are processed within 24-48 hours
        </p>
      </motion.div>
    </div>
  )
}