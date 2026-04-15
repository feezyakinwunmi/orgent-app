import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import {NavBar} from './components/NavBar'
import Script from 'next/script'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Orgent - Urgent Gigs for Hunters',
  description: 'Find urgent side gigs. Earn your daily 2k. Level up from E-Rank to S-Rank.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
          <NavBar />

      </body>
    </html>
  )
}