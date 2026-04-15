'use client'

import { ParticleBackground } from '@/app/components/ui/ParticleBackground'
import { useEffect, useState } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 anime-bg opacity-30 z-0" />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 anime-bg opacity-30 z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}