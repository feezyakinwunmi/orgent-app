'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  ChevronLeft, User, Mail, Calendar, Clock, 
  CheckCircle, XCircle, Loader2, FileText,
  Link as LinkIcon, Eye
} from 'lucide-react'
import Link from 'next/link'


interface Answer {
  question: string
  answer: string
  expected_answer: string
  points: number
  question_type: string
}

export default function VerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [userId])

const fetchData = async () => {
  setLoading(true)
  
  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  setProfile(profileData)

  // Get the most recent session for this user
  const { data: latestSession } = await supabase
    .from('skill_verification_sessions')
    .select('id, start_time, status')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log('Latest session:', latestSession)

  if (!latestSession) {
    console.log('No session found')
    setLoading(false)
    return
  }

  // Get answers from the most recent session
  const { data: answersData } = await supabase
    .from('skill_verification_answers')
    .select('*')
    .eq('session_id', latestSession.id)
    .order('submitted_at', { ascending: true })

  console.log('Answers found:', answersData?.length)

  if (answersData && answersData.length > 0) {
    // Get question details
    const questionIds = answersData.map(a => a.question_id)
    const { data: questions } = await supabase
      .from('skill_questions')
      .select('*')
      .in('id', questionIds)

    const questionMap = new Map()
    questions?.forEach(q => questionMap.set(q.id, q))

    const formattedAnswers = answersData.map((a: any) => {
      const q = questionMap.get(a.question_id)
      return {
        question: q?.question || 'Question not found',
        answer: a.answer || a.file_link || 'No answer provided',
        expected_answer: q?.expected_answer || 'N/A',
        points: q?.points || 0,
        question_type: q?.question_type || 'text'
      }
    })
    setAnswers(formattedAnswers)
  } else {
    // If no answers in session, try getting answers directly by user_id
    const { data: allAnswers } = await supabase
      .from('skill_verification_answers')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
    
    if (allAnswers && allAnswers.length > 0) {
      const questionIds = allAnswers.map(a => a.question_id)
      const { data: questions } = await supabase
        .from('skill_questions')
        .select('*')
        .in('id', questionIds)
      
      const questionMap = new Map()
      questions?.forEach(q => questionMap.set(q.id, q))
      
      const formattedAnswers = allAnswers.map((a: any) => {
        const q = questionMap.get(a.question_id)
        return {
          question: q?.question || 'Question not found',
          answer: a.answer || a.file_link || 'No answer provided',
          expected_answer: q?.expected_answer || 'N/A',
          points: q?.points || 0,
          question_type: q?.question_type || 'text'
        }
      })
      setAnswers(formattedAnswers)
    }
  }

  setLoading(false)
}

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, text: 'Approved' }
    }
    if (status === 'rejected') {
      return { color: 'bg-red-500/20 text-red-400', icon: XCircle, text: 'Rejected' }
    }
    return { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, text: 'Pending' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const status = getStatusBadge(profile?.skill_verification_status)

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-purple-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Skill Verification Details</h1>
          <p className="text-gray-400 text-sm">Review user's answers and approve or reject</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="p-5 mb-6">
        <div className="flex items-start gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{profile?.full_name || 'Unknown'}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                <status.icon className="w-3 h-3" />
                {status.text}
              </span>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
              <Mail className="w-3 h-3" />
              {profile?.email}
            </p>
            <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Submitted: {new Date(profile?.skill_submitted_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Rank</p>
            <p className="text-xl font-bold text-purple-400">{profile?.grade || 'E'}-Rank</p>
          </div>
        </div>
      </Card>

      {/* Answers Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Submitted Answers ({answers.length} questions)
        </h3>
        
        <div className="space-y-4">
         {answers.length === 0 ? (
  <div className="text-center py-8 bg-gray-800/50 rounded-xl">
    <p className="text-gray-400">No answers found for this verification</p>
  </div>
) : (
  <div className="space-y-4">
    {answers.map((answer, index) => (
      <Card key={index} className="p-5">
        {/* Question */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h4 className="text-white font-medium">Question {index + 1}</h4>
            <span className="text-xs text-purple-400">{answer.points} points</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">{answer.question}</p>
        </div>
        
        {/* User's Answer */}
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">User's Answer:</p>
          {answer.question_type === 'design' || answer.question_type === 'video' || answer.answer?.startsWith('http') ? (
            <a 
              href={answer.answer} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:underline flex items-center gap-1 break-all"
            >
              <LinkIcon className="w-3 h-3" />
              {answer.answer}
            </a>
          ) : (
            <p className="text-white text-sm whitespace-pre-wrap">{answer.answer}</p>
          )}
        </div>
        
        {/* Expected Answer */}
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-xs text-green-400 mb-1">Expected Answer:</p>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{answer.expected_answer}</p>
        </div>
      </Card>
    ))}
  </div>
)}
        </div>
      </div>

      {/* Action Buttons */}
      {profile?.skill_verification_status === 'pending' && (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
            onClick={async () => {
              await supabase
                .from('profiles')
                .update({ skill_verification_status: 'rejected' })
                .eq('id', userId)
              router.back()
            }}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={async () => {
              // Get current points
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('points_balance')
                .eq('id', userId)
                .single()
              
              const newBalance = (userProfile?.points_balance || 0) + 150
              
              await supabase
                .from('profiles')
                .update({ 
                  is_skill_verified: true,
                  skill_verification_status: 'approved',
                  verification_badge_level: 'silver',
                  points_balance: newBalance
                })
                .eq('id', userId)
              
              await supabase
                .from('points_transactions')
                .insert({
                  user_id: userId,
                  amount: 150,
                  balance_after: newBalance,
                  reason: 'Skill verification approved'
                })
              
              router.back()
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve & Award 150 Points
          </Button>
        </div>
      )}

      {profile?.skill_verification_status !== 'pending' && (
        <div className="text-center p-4 bg-gray-800/50 rounded-xl">
          <p className="text-gray-400">
            This verification has been {profile?.skill_verification_status}
          </p>
        </div>
      )}
    </div>
  )
}