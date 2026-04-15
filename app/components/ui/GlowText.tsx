'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlowTextProps {
  children: ReactNode
  className?: string
  animate?: boolean
}

export function GlowText({ children, className = '', animate = true }: GlowTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent ${className}`}
      animate={animate ? {
        textShadow: [
          '0 0 5px #8b5cf6',
          '0 0 15px #a855f7',
          '0 0 5px #8b5cf6'
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.span>
  )
}