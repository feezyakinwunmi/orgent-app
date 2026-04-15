'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Loader2, CheckCircle, AlertCircle, 
  Verified, Clock, Send, ChevronDown
} from 'lucide-react'

function Timer({ minutes, onTimeUp }: { minutes: number; onTimeUp: () => void }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60)

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isWarning = timeLeft < 300

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
      isWarning ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-purple-500/20 text-purple-400'
    }`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono font-bold">{mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  )
}

export default function SkillVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [skillCategories, setSkillCategories] = useState<any[]>([])
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [fileLinks, setFileLinks] = useState<Record<string, string>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'select' | 'answer' | 'complete'>('select')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Get unique skills from skill_questions table
      const { data: questionsData } = await supabase
        .from('skill_questions')
        .select('skill_name, sub_category')
        
      if (questionsData) {
        const uniqueSkills = new Map()
        questionsData.forEach((q: any) => {
          const key = `${q.skill_name}-${q.sub_category}`
          if (!uniqueSkills.has(key)) {
            uniqueSkills.set(key, {
              id: key,
              skill_name: q.skill_name,
              sub_category: q.sub_category,
              display_name: `${q.skill_name} - ${q.sub_category}`
            })
          }
        })
        setSkillCategories(Array.from(uniqueSkills.values()))
      }
      
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleStartVerification = async (category: any) => {
    setLoading(true)
    setError('')
    setSelectedSkill(category)
    
    // Fetch questions for this skill
    const { data: allQuestions, error: questionsError } = await supabase
      .from('skill_questions')
      .select('*')
      .eq('skill_name', category.skill_name)
      .eq('sub_category', category.sub_category)
    
    if (questionsError || !allQuestions || allQuestions.length === 0) {
      setError('No questions available for this skill')
      setLoading(false)
      return
    }
    
    // Randomly select 3 questions
    const shuffled = [...allQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selectedQuestions = shuffled.slice(0, 3)
    
    // Create verification session
    const { data: session, error: sessionError } = await supabase
      .from('skill_verification_sessions')
      .insert({
        user_id: profile?.id,
        skill_name: category.skill_name,
        sub_category: category.sub_category,
        status: 'in_progress',
        time_limit_minutes: 45
      })
      .select()
      .single()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      setError('Failed to start verification session: ' + sessionError.message)
      setLoading(false)
      return
    }
    
    setSessionId(session.id)
    setQuestions(selectedQuestions)
    setStep('answer')
    setLoading(false)
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleFileLinkChange = (questionId: string, value: string) => {
    setFileLinks(prev => ({ ...prev, [questionId]: value }))
  }

  const handleTimeUp = useCallback(async () => {
    if (step !== 'answer') return
    alert('Time is up! Submitting your answers...')
    await handleSubmitVerification()
  }, [step])

const handleSubmitVerification = async () => {
  // Check if all questions are answered
  const unanswered = questions.filter(q => {
    if (q.question_type === 'design' || q.question_type === 'video' || q.question_type === 'audio' || q.question_type === 'file') {
      return !fileLinks[q.id]
    }
    return !answers[q.id]
  })
  
  if (unanswered.length > 0) {
    setError(`Please complete all ${unanswered.length} questions before submitting`)
    return
  }

  setSubmitting(true)
  setError('')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    setSubmitting(false)
    return
  }

  // Update session end time
  await supabase
    .from('skill_verification_sessions')
    .update({ 
      end_time: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', sessionId)

  // Save all answers
  for (const question of questions) {
    await supabase
      .from('skill_verification_answers')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        skill_name: selectedSkill.skill_name,
        question_id: question.id,
        answer: answers[question.id] || '',
        file_link: fileLinks[question.id] || '',
        status: 'pending'
      })
  }

  // Update profile status
  await supabase
    .from('profiles')
    .update({ 
      skill_verification_status: 'pending',
      skill_submitted_at: new Date().toISOString()
    })
    .eq('id', user.id)
  
  // Show success and redirect
  setSuccess(true)
  setSubmitting(false)
  
  // Redirect after 2 seconds
  setTimeout(() => {
    router.push('/profile')
  }, 4000)
}

  // Group skills by main category
  const groupedSkills = skillCategories.reduce((acc: any, skill) => {
    const category = skill.skill_name
    if (!acc[category]) acc[category] = []
    acc[category].push(skill)
    return acc
  }, {})

  if (loading && step === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  // Selection screen
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="px-4 py-3">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Verified className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Skill Verification</h1>
            <p className="text-gray-400 mt-2">Select a skill to verify</p>
          </div>

          <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 mb-8">
            <h3 className="font-semibold text-white mb-2">How it works</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>1. Select a skill from the dropdown</li>
              <li>2. Answer 3 random questions</li>
              <li>3. Submit within 45 minutes</li>
              <li>4. Admin reviews and approves</li>
              <li>5. Get Silver Badge + 150 points</li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Custom Dropdown */}
          <div className="relative mb-6">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl flex justify-between items-center hover:border-purple-500 transition"
            >
              <span className="text-white">
                {selectedSkill ? selectedSkill.display_name : 'Select a skill to verify...'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl max-h-80 overflow-y-auto z-20">
                {Object.entries(groupedSkills).map(([categoryName, skills]: [string, any]) => (
                  <div key={categoryName}>
                    <div className="px-4 py-2 bg-gray-900 text-purple-400 text-sm font-semibold">
                      {categoryName}
                    </div>
                    {skills.map((skill: any) => (
                      <button
                        key={skill.id}
                        onClick={() => {
                          setSelectedSkill(skill)
                          setDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-purple-600/20 hover:text-white transition"
                      >
                        {skill.display_name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={() => selectedSkill && handleStartVerification(selectedSkill)} 
            disabled={!selectedSkill}
            className="w-full"
          >
            Start Verification
          </Button>
        </main>
      </div>
    )
  }

  // Answer screen
  if (step === 'answer' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white font-medium">{selectedSkill?.display_name}</span>
                <p className="text-xs text-gray-400 mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <Timer minutes={45} onTimeUp={handleTimeUp} />
            </div>
          </div>
        </header>

        <main className="px-4 py-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{currentQuestion.question}</h3>
                <span className="text-xs text-purple-400">{currentQuestion.points} points</span>
              </div>
              
              {currentQuestion.question_type === 'code' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white font-mono text-sm"
                  placeholder="Write your code here..."
                />
              )}
              
              {currentQuestion.question_type === 'text' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                  placeholder="Type your answer here..."
                />
              )}
              
              {(currentQuestion.question_type === 'design' || currentQuestion.question_type === 'video' || currentQuestion.question_type === 'audio' || currentQuestion.question_type === 'file') && (
                <div>
                  <input
                    type="url"
                    value={fileLinks[currentQuestion.id] || ''}
                    onChange={(e) => handleFileLinkChange(currentQuestion.id, e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="Paste your work link here (Imgur, YouTube, Google Drive, etc.)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload your work to a sharing platform and paste the link here</p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmitVerification} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                  Next
                </Button>
              )}
            </div>
          </Card>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your answers have been submitted. Review takes 24-48 hours.
          </p>
          <Button onClick={() => router.push('/profile')}>Return to Profile</Button>
        </div>
      </div>
    )
  }

  return null
}