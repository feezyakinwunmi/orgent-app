'use client'

import { motion, useScroll, useTransform, Variants } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { GlowText } from '@/app/components/ui/GlowText'
import { Card } from '@/app/components/ui/Card'
import { ParticleBackground } from '@/app/components/ui/ParticleBackground'
import { 
  ArrowRight, Zap, Trophy, Shield, Users, TrendingUp, Clock, 
  Sword, Crown, Sparkles, ChevronDown, Star, Award, 
  Mail, MapPin, Calendar,
  CheckCircle, Play, Volume2, VolumeX
} from 'lucide-react'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  
  const featuresRef = useRef(null)
  const rankingRef = useRef(null)
  const aboutRef = useRef(null)

  const scrollToSection = (ref: any) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fixed floating animation variants
  const floatingVariants: Variants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0 0 0 0 rgba(139, 92, 246, 0.4)",
        "0 0 0 20px rgba(139, 92, 246, 0)",
        "0 0 0 0 rgba(139, 92, 246, 0)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const glowVariants: Variants = {
    animate: {
      textShadow: [
        "0 0 20px rgba(139, 92, 246, 0.5)",
        "0 0 40px rgba(139, 92, 246, 0.8)",
        "0 0 20px rgba(139, 92, 246, 0.5)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover opacity-30"
          poster="/solo-leveling-poster.jpg"
        >
          <source src="/solo-leveling-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>
      
      <ParticleBackground />
      
      {/* Animated gradient overlay */}
      <div className="fixed inset-0 anime-bg opacity-20 z-0" />
      
      {/* Navigation */}
      <nav className="relative z-50 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <motion.div 
            variants={floatingVariants}
            animate="animate"
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
          </motion.div>
          <span className="text-2xl font-bold">
            <GlowText>Orgent</GlowText>
          </span>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Ranking', 'About'].map((item) => (
            <motion.button
              key={item}
              whileHover={{ scale: 1.05 }}
              className="text-gray-300 hover:text-purple-400 transition font-medium"
              onClick={() => {
                if (item === 'Features') scrollToSection(featuresRef)
                if (item === 'Ranking') scrollToSection(rankingRef)
                if (item === 'About') scrollToSection(aboutRef)
              }}
            >
              {item}
            </motion.button>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="hover:scale-105 transition">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="hover:scale-105 transition">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <motion.div
            style={{ opacity, scale }}
            className="text-center"
          >
            {/* Anime-style badge */}
            <motion.div
              variants={pulseVariants}
              animate="animate"
              className="inline-block mb-6"
            >
              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 text-purple-400 text-sm font-semibold inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                ⚡ NEW: S-Rank Quests Available
              </span>
            </motion.div>

            {/* Main Title with Anime Effect */}
            <motion.h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-white">Your Daily</span>
              <br />
              <motion.span
                variants={glowVariants}
                animate="animate"
              >
                <GlowText animate={false} className="text-7xl md:text-8xl lg:text-9xl">
                  2k Grind
                </GlowText>
              </motion.span>
              <span className="text-white"> Starts Here</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-xl max-w-2xl mx-auto mb-10"
            >
              From E-Rank to S-Rank. Find urgent side gigs, get paid instantly, 
              and level up your hustle. <span className="text-purple-400">The dungeon is waiting.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Grind
                    <Sword className="w-4 h-4 group-hover:rotate-12 transition" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg"
                onClick={() => scrollToSection(featuresRef)}
              >
                Watch Trailer
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Hero Image Space - Anime Style */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative mt-20"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <img 
                  src="/soloL.jpeg" 
                  alt="Solo Leveling Inspired Hero"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '500px' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent z-20">
                  <p className="text-white text-lg font-semibold">"Arise, Hunter."</p>
                  <p className="text-gray-400 text-sm">Your journey begins now</p>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"
              />
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-20"
            >
              {[
                { value: "10,000+", label: "Active Hunters", icon: Users, color: "purple" },
                { value: "₦2k-100k", label: "Daily Gigs", icon: Zap, color: "yellow" },
                { value: "4.9★", label: "Rating", icon: Trophy, color: "orange" },
                { value: "Instant", label: "Payout", icon: Clock, color: "green" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-purple-500/20"
                >
                  <div className={`flex justify-center mb-2 text-${stat.color}-500`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center mt-16 cursor-pointer"
              onClick={() => scrollToSection(featuresRef)}
            >
              <ChevronDown className="w-6 h-6 text-purple-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div ref={featuresRef} id="how-it-works" className="bg-gradient-to-b from-transparent via-purple-900/10 to-transparent py-24">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How the <GlowText>System</GlowText> Works
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Just like Solo Leveling — start from the bottom and grind your way to S-Rank.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Accept Your Quest",
                  description: "Swipe through urgent gigs. From delivery to design — find work that matches your skills.",
                  color: "from-yellow-500 to-orange-500",
                  image: "/quest.jpeg"
                },
                {
                  icon: Shield,
                  title: "Complete the Dungeon",
                  description: "Money is held safely in escrow until work is delivered. No scams. No drama.",
                  color: "from-blue-500 to-cyan-500",
                  image: "/done.jpeg"
                },
                {
                  icon: Crown,
                  title: "Level Up Your Rank",
                  description: "Complete jobs, earn points, and climb from E-Rank to S-Rank. Better ranks = better gigs.",
                  color: "from-purple-500 to-pink-500",
                  image: "/levelup.jpeg"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -10 }}
                >
                  <Card hover className="h-full overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                      <div className={`absolute top-4 left-4 w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center z-20 shadow-lg`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <div ref={rankingRef} className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                The <GlowText>Ranking</GlowText> System
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Every hunter starts at E-Rank. Prove yourself and rise through the ranks.
              </p>
            </motion.div>

         

            <div className="flex flex-wrap justify-center gap-4">
              {[
                { rank: "E", name: "E-Rank", color: "gray", desc: "Just started", points: "0-100", icon: "⭐" },
                { rank: "D", name: "D-Rank", color: "blue", desc: "Getting there", points: "101-500", icon: "⭐⭐" },
                { rank: "C", name: "C-Rank", color: "green", desc: "Reliable", points: "501-1000", icon: "⭐⭐⭐" },
                { rank: "B", name: "B-Rank", color: "yellow", desc: "High performer", points: "1001-2000", icon: "⭐⭐⭐⭐" },
                { rank: "A", name: "A-Rank", color: "orange", desc: "Elite", points: "2001-5000", icon: "⭐⭐⭐⭐⭐" },
                { rank: "S", name: "S-Rank", color: "purple", desc: "Legendary", points: "5000+", icon: "👑" }
              ].map((rank, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 min-w-[140px] text-center hover:shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-2">{rank.icon}</div>
                  <div className={`text-4xl font-bold text-${rank.color}-500 mb-2`}>
                    {rank.rank}
                  </div>
                  <div className="font-semibold text-white">{rank.name}</div>
                  <div className="text-gray-500 text-sm">{rank.desc}</div>
                  <div className="text-xs text-purple-400 mt-2">{rank.points} pts</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div ref={aboutRef} className="py-24 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                About <GlowText>Orgent</GlowText>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Born from the spirit of Solo Leveling — where every hunter has the chance to become legendary.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-3xl font-bold text-white mb-4">
                  Our <span className="text-purple-400">Mission</span>
                </h3>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  At Orgent, we believe everyone deserves a chance to level up their career. 
                  Just like Sung Jin-Woo rising from the weakest E-Rank to the Shadow Monarch, 
                  we help freelancers transform their skills into success.
                </p>
                <div className="space-y-3">
                  {[
                    "⚡ 10,000+ successful quests completed",
                    "💰 ₦50M+ paid to hunters",
                    "🌟 4.9★ rating from 5,000+ users",
                    "🚀 24/7 support for all hunters"
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

             <motion.div
  initial={{ opacity: 0, x: 50 }}
  whileInView={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6 }}
  className="relative flex justify-center items-center "
>
  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 w-48 h-48">
    <img 
      src="/orgentlogo.jpeg" 
      alt="About Orgent"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
  </div>
  <motion.div
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -top-5 -right-5 w-20 h-20 bg-purple-500/30 rounded-full blur-xl -z-10"
  />
</motion.div>
            </div>

            {/* Team/Values Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                {
                  icon: Shield,
                  title: "Trust & Security",
                  description: "Escrow protection and verified hunters ensure safe transactions."
                },
                {
                  icon: TrendingUp,
                  title: "Growth Mindset",
                  description: "Level up your skills and earnings with our ranking system."
                },
                {
                  icon: Users,
                  title: "Community First",
                  description: "Join a community of hunters supporting each other."
                }
              ].map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -5 }}
                  className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-center"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{value.title}</h4>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="py-24 border-t border-purple-500/20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-6"
              >
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Start Your <GlowText>Grind</GlowText>?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of hunters finding their daily 2k on Orgent. 
                <span className="block text-purple-400 mt-2">Arise, and claim your destiny.</span>
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg group">
                  <span className="flex items-center gap-2">
                    Begin Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-purple-500/20 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
             <img src="/orgentlogo.jpeg" alt="Orgent Logo" width={34} height={34} className="bg-transparent rounded-full" />
                  <span className="text-xl font-bold text-white">Orgent</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Level up your freelance career with Orgent.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Quick Links</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/jobs" className="hover:text-purple-400 transition">Browse Gigs</Link></li>
                  <li><Link href="/ranking" className="hover:text-purple-400 transition">Ranking System</Link></li>
                  <li><Link href="/support" className="hover:text-purple-400 transition">Support</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/terms" className="hover:text-purple-400 transition">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-purple-400 transition">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-purple-400 transition">Cookie Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Contact</h4>
                <div className="flex gap-3">
                  <motion.a
                    whileHover={{ scale: 1.1, y: -2 }}
                    href="mailto:support@orgent.com"
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-purple-500/20 transition"
                  >
                    <Mail className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                  </motion.a>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm mt-12 pt-8 border-t border-purple-500/20">
              © 2026 Orgent. All rights reserved. Inspired by Solo Leveling. Sponsord by Phantomire Technlogies
            </div>
          </div>
        </footer>
      </main>

      {/* Video Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 flex gap-2"
      >
        <button
          onClick={() => {
            if (videoRef.current) {
              if (isMuted) {
                videoRef.current.muted = false
                setIsMuted(false)
              } else {
                videoRef.current.muted = true
                setIsMuted(true)
              }
            }
          }}
          className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-purple-500/50 transition border border-purple-500/30"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </motion.div>
    </div>
  )
}