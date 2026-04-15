'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { 
  User, Phone, MapPin, Briefcase, 
  Star, Award, Zap, Edit2, ChevronLeft, 
  Loader2, X, Plus, Link as LinkIcon, 
  FileText, Image, Trash2, Save, Globe, Download,
  CheckCircle, Camera, ExternalLink, AlertCircle,
  Crown, BadgeCheck, Verified, Shield, TrendingUp, Lock,
  Clock,
  Mail,
  Wallet,
  Building, History,
  RefreshCw
} from 'lucide-react'
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'
import { BankAccountModal } from '../components/profile/BankAccountModal'
import { WithdrawalModal } from '../components/profile/WithdrawalModal'
import Link from 'next/link'
import { bankCodes } from '@/app/lib/bankCodes'

interface WorkSample {
  image_url: string
  title: string
  link: string
  description: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [seekerProfile, setSeekerProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Basic Info
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  
  // Professional Info (Required)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUrl, setCvUrl] = useState('')
  const [cvFilename, setCvFilename] = useState('')
  const [experienceDescription, setExperienceDescription] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  
  // Social Links
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  
  // Work Samples
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([])
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [editingSampleIndex, setEditingSampleIndex] = useState<number | null>(null)
  const [sampleImageFile, setSampleImageFile] = useState<File | null>(null)
  const [sampleImagePreview, setSampleImagePreview] = useState('')
  const [sampleTitle, setSampleTitle] = useState('')
  const [sampleLink, setSampleLink] = useState('')
  const [sampleDescription, setSampleDescription] = useState('')
  const [uploadingSample, setUploadingSample] = useState(false)
  
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  

// Bank & Withdrawal States
const [bankAccounts, setBankAccounts] = useState<any[]>([])
const [showBankModal, setShowBankModal] = useState(false)
const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
const [walletBalance, setWalletBalance] = useState(0)
const [loadingBank, setLoadingBank] = useState(false)

const [escrowBalance, setEscrowBalance] = useState(0)

const hasBankAccount = bankAccounts.length > 0
const defaultBankAccount = bankAccounts.find(acc => acc.is_default) || bankAccounts[0]

const [subaccountBalance, setSubaccountBalance] = useState(0)
const [checkingBalance, setCheckingBalance] = useState(false)


const [totalEarned, setTotalEarned] = useState(0)
const [completedJobsCount, setCompletedJobsCount] = useState(0)
const [refreshing, setRefreshing] = useState(false)
const [myRatings, setMyRatings] = useState<any[]>([])
const [loadingRatings, setLoadingRatings] = useState(false)

  const supabase = createClient()

 // Get verification level and progress
const getVerificationInfo = () => {
  const levels = [
    { key: 'is_email_verified', name: 'Email Verified', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', points: 50, benefit: 'Basic trust from employers' },
    { key: 'is_identity_verified', name: 'Identity Verified', icon: BadgeCheck, color: 'text-orange-400', bg: 'bg-orange-500/20', points: 100, benefit: 'Higher trust, priority in applications' },
    { key: 'is_skill_verified', name: 'Skill Verified', icon: Verified, color: 'text-gray-400', bg: 'bg-gray-500/20', points: 150, benefit: 'Featured in top search results' },
    { key: 'is_premium', name: 'Premium Verified', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', points: 200, benefit: 'Gold badge + 500 monthly points' },
  ]

  let currentLevel = -1
  for (let i = 0; i < levels.length; i++) {
    if (profile?.[levels[i].key] === true) {
      currentLevel = i
    }
  }

  const nextLevel = levels[currentLevel + 1]
  const progress = currentLevel >= 0 ? ((currentLevel + 1) / levels.length) * 100 : 0

  return { levels, currentLevel, nextLevel, progress }
}

  // Get rank progress
const getRankInfo = () => {
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S']
  const thresholds = [0, 500, 2000, 5000, 15000, 50000]
  
  const currentPoints = profile?.points_balance || 0
  
  // Find current rank based on points
  let currentRankIndex = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (currentPoints >= thresholds[i]) {
      currentRankIndex = i
      break
    }
  }
  
  const currentRank = ranks[currentRankIndex]
  const nextRank = ranks[currentRankIndex + 1]
  const currentThreshold = thresholds[currentRankIndex]
  const nextThreshold = thresholds[currentRankIndex + 1]
  
  // Calculate progress percentage
  let progress = 0
  let pointsNeeded = 0
  
  if (nextThreshold) {
    // Points earned within current rank
    const pointsInCurrentRank = currentPoints - currentThreshold
    // Total points needed to reach next rank
    const pointsRequiredForNext = nextThreshold - currentThreshold
    progress = (pointsInCurrentRank / pointsRequiredForNext) * 100
    pointsNeeded = nextThreshold - currentPoints
  } else {
    progress = 100
    pointsNeeded = 0
  }

  return {
    currentRank,
    nextRank,
    pointsNeeded: Math.max(0, pointsNeeded),
    currentPoints,
    progress: Math.min(100, Math.max(0, progress)),
    currentThreshold,
    nextThreshold
  }
}

useEffect(() => {
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get main profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)
    setFullName(profileData?.full_name || '')
    setAvatarUrl(profileData?.avatar_url || '')
    
    if (profileData?.role === 'business') {
      router.push('/business/dashboard')
      return
    }

    // Get seeker profile
    let { data: seekerData } = await supabase
      .from('seeker_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (!seekerData) {
      const { data: newSeeker } = await supabase
        .from('seeker_profiles')
        .insert({
          user_id: user.id,
          skills: [],
          experience_years: 0,
          work_samples: []
        })
        .select()
        .single()
      
      if (newSeeker) {
        seekerData = newSeeker
      }
    }
    
    if (seekerData) {
      setSeekerProfile(seekerData)
      setPhone(seekerData.phone || '')
      setLocation(seekerData.location || '')
      setBio(seekerData.bio || '')
      setSkills(seekerData.skills || [])
      setCvUrl(seekerData.cv_url || '')
      setCvFilename(seekerData.cv_filename || '')
      setExperienceDescription(seekerData.experience_description || '')
      setPortfolioUrl(seekerData.portfolio_url || '')
      setGithubUrl(seekerData.github_url || '')
      setLinkedinUrl(seekerData.linkedin_url || '')
      setTwitterUrl(seekerData.twitter_url || '')
      setWorkSamples(seekerData.work_samples || [])
    }
    
    // Wait for ratings to be fetched before setting loading to false
    await fetchMyRatings()
    setLoading(false)
  }

  fetchProfile()
}, [router, supabase])


const fetchEscrowBalance = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // First, get all conversations where this user is the hunter
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('hunter_id', user.id)

  if (!conversations || conversations.length === 0) {
    setEscrowBalance(0)
    return
  }

  const conversationIds = conversations.map(c => c.id)

  // Get all job offers for these conversations that are paid or completed
  const { data: offers } = await supabase
    .from('job_offers')
    .select('escrow_amount, status')
    .in('conversation_id', conversationIds)
    .in('status', ['paid', 'completed'])

  if (offers) {
    const total = offers.reduce((sum, offer) => sum + (offer.escrow_amount || 0), 0)
    setEscrowBalance(total)
  }
}


// Call this when profile loads
useEffect(() => {
  fetchEscrowBalance()
}, [])

  
// Fetch bank accounts
useEffect(() => {
  const fetchBankAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)

    if (data) {
      setBankAccounts(data)
    }
  }
  fetchBankAccounts()
}, [supabase])



// Add this function to fetch earnings data
const fetchEarningsData = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  setRefreshing(true)

  // Get all conversations where this user is the hunter
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('hunter_id', user.id)

  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map(c => c.id)

    // Get completed jobs (released offers)
    const { data: completedOffers } = await supabase
      .from('job_offers')
      .select('hunter_amount')
      .in('conversation_id', conversationIds)
      .eq('status', 'released')

    if (completedOffers) {
      const total = completedOffers.reduce((sum, offer) => sum + (offer.hunter_amount || 0), 0)
      setTotalEarned(total)
      setCompletedJobsCount(completedOffers.length)
    }
  }

  // Also refresh escrow balance
  await fetchEscrowBalance()
  setRefreshing(false)
}

// Update the useEffect to fetch earnings data
useEffect(() => {
  fetchEscrowBalance()
  fetchEarningsData()
}, [])


const checkSubaccountBalance = async () => {
  if (!defaultBankAccount?.subaccount_code) {
    alert('No subaccount found. Please add a bank account first.')
    return
  }
  
  console.log('Checking balance for subaccount:', defaultBankAccount.subaccount_code)
  setCheckingBalance(true)
  
  try {
    const response = await fetch('/api/check-subaccount-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subaccount_code: defaultBankAccount.subaccount_code
      })
    })
    
    const data = await response.json()
    console.log('Balance check response:', data)
    
    if (data.success) {
      setSubaccountBalance(data.balance)
      // Update database
      await supabase
        .from('bank_accounts')
        .update({ 
          subaccount_balance: data.balance,
          last_balance_check: new Date().toISOString()
        })
        .eq('id', defaultBankAccount.id)
      
      alert(`Balance: ₦${data.balance.toLocaleString()}`)
    } else {
      console.error('Balance check failed:', data.error)
      alert('Failed to check balance: ' + data.error)
    }
  } catch (error) {
    console.error('Balance check error:', error)
    alert('Failed to check balance')
  }
  setCheckingBalance(false)
}

const handleAddBankAccount = async (data: any) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const bankCode = bankCodes[data.bankName]

  // First, create Paystack subaccount for this hunter
  const subaccountRes = await fetch('/api/create-subaccount', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: data.accountName,
      bank_code: bankCode,
      account_number: data.accountNumber,
      percentage_charge: 0,
      email: user.email  // Pass email in body instead of headers

    })
  })

  const subaccountData = await subaccountRes.json()

  if (!subaccountData.success) {
    alert('Failed to create subaccount: ' + subaccountData.error)
    return
  }

  // Save bank account with subaccount code
  const { error } = await supabase
    .from('bank_accounts')
    .insert({
      user_id: user.id,
      bank_name: data.bankName,
      bank_code: bankCode,
      account_name: data.accountName,
      account_number: data.accountNumber,
      subaccount_code: subaccountData.subaccount_code,
      subaccount_id: subaccountData.subaccount_id,
      is_default: bankAccounts.length === 0
    })

  if (error) {
    console.error('Error adding bank account:', error)
    alert('Failed to add bank account')
  } else {
    const { data: newData } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
    
    if (newData) setBankAccounts(newData)
    alert('Bank account added successfully!')
  }
}

const handleWithdraw = async (amount: number) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (!defaultBankAccount) {
    alert('Please add a bank account first')
    return
  }

  const { error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: user.id,
      bank_account_id: defaultBankAccount.id,
      amount: amount,
      status: 'pending'
    })

  if (error) {
    console.error('Error requesting withdrawal:', error)
    alert('Failed to request withdrawal')
  } else {
    alert(`Withdrawal request of ₦${amount.toLocaleString()} submitted!`)
  }
}

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)
    
    // Check required fields
    if (!cvUrl && !cvFile) {
      alert('Please upload your CV/Resume')
      setSaving(false)
      return
    }
    
    if (!experienceDescription) {
      alert('Please add your work experience')
      setSaving(false)
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user found')
      setSaving(false)
      return
    }
    
    let finalCvUrl = cvUrl
    let finalCvFilename = cvFilename
    
    if (cvFile) {
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${user.id}_cv_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, cvFile)
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName)
        finalCvUrl = publicUrl
        finalCvFilename = cvFile.name
      }
    }
    
    await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq('id', user.id)
    
    const updateData = {
      phone: phone || null,
      location: location || null,
      bio: bio || null,
      skills: skills || [],
      cv_url: finalCvUrl || null,
      cv_filename: finalCvFilename || null,
      experience_description: experienceDescription || null,
      portfolio_url: portfolioUrl || null,
      github_url: githubUrl || null,
      linkedin_url: linkedinUrl || null,
      twitter_url: twitterUrl || null,
      work_samples: workSamples || []
    }
    
    const { error: seekerError } = await supabase
      .from('seeker_profiles')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (seekerError) {
      console.error('Seeker profile update error:', seekerError)
      alert('Error saving profile: ' + seekerError.message)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
      const { data: refreshedSeeker } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (refreshedSeeker) {
        setCvUrl(refreshedSeeker.cv_url || '')
        setCvFilename(refreshedSeeker.cv_filename || '')
      }
    }
    
    setEditing(false)
    setSaving(false)
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingAvatar(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const fileName = `${user.id}_avatar_${Date.now()}`
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      setAvatarUrl(publicUrl)
      
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
    }
    setUploadingAvatar(false)
  }

  const handleAddWorkSample = async () => {
    if (!sampleTitle) return
    
    setUploadingSample(true)
    let imageUrl = sampleImagePreview
    
    if (sampleImageFile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fileName = `${user.id}_sample_${Date.now()}`
        
        const { error } = await supabase.storage
          .from('work_samples')
          .upload(fileName, sampleImageFile)
        
        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('work_samples')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }
    }
    
    const newSample: WorkSample = {
      image_url: imageUrl,
      title: sampleTitle,
      link: sampleLink,
      description: sampleDescription
    }
    
    let updatedSamples
    if (editingSampleIndex !== null) {
      updatedSamples = [...workSamples]
      updatedSamples[editingSampleIndex] = newSample
      setWorkSamples(updatedSamples)
    } else {
      updatedSamples = [...workSamples, newSample]
      setWorkSamples(updatedSamples)
    }
    
    setShowSampleModal(false)
    setSampleImageFile(null)
    setSampleImagePreview('')
    setSampleTitle('')
    setSampleLink('')
    setSampleDescription('')
    setEditingSampleIndex(null)
    setUploadingSample(false)
  }

  const handleDeleteWorkSample = (index: number) => {
    const updatedSamples = workSamples.filter((_, i) => i !== index)
    setWorkSamples(updatedSamples)
  }

  const handleDownloadCV = () => {
    if (cvUrl) {
      window.open(cvUrl, '_blank')
    }
  }

  const handleSampleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSampleImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSampleImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


const fetchMyRatings = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('No user found for ratings')
    return
  }

  console.log('Fetching ratings for user:', user.id)
  setLoadingRatings(true)
  
  // Fetch all ratings where this user is the receiver (to_user_id)
  const { data: ratings, error } = await supabase
    .from('ratings')
    .select(`
      *,
      from_user:from_user_id (
        id,
        full_name,
        avatar_url
      ),
      job:job_id (
        id,
        title
      )
    `)
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ratings:', error)
  } else if (ratings) {
    console.log('Ratings found:', ratings.length)
    setMyRatings(ratings)
  } else {
    console.log('No ratings found')
    setMyRatings([])
  }
  
  setLoadingRatings(false)
}

  const verification = getVerificationInfo()
  const rankInfo = getRankInfo()
  const isCvMissing = !cvUrl && !cvFile && !editing
  const isExperienceMissing = !experienceDescription && !editing

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 ">
              {/* Edit Button moved to top */}
              {!editing && (
                <Button size="sm" className='flex ' onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-bold text-white">{profile?.points_balance || 0} pts</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                <Star className="w-3 h-3 text-purple-400" />
                <span className="text-xs font-bold text-white">{profile?.grade || 'E'}-Rank</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24 max-w-3xl mx-auto">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Profile saved successfully!
          </div>
        )}

        {/* Required Fields Warning */}
        {(isCvMissing || isExperienceMissing) && !editing && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {isCvMissing && 'CV/Resume is required. '}
            {isExperienceMissing && 'Work experience is required. '}
            <button onClick={() => setEditing(true)} className="underline">Complete now</button>
          </div>
        )}

                {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto mb-3 relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-500">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition">
                  {uploadingAvatar ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-center">
 <h1 className="text-2xl font-bold text-white">
            {fullName || 'Complete Your Profile'}
          </h1>
          
          {/* Verification Badge - Display based on highest level */}
          <div className=" flex justify-center ">
            {profile?.is_premium ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400"></span>
              </div>
            ) : profile?.is_skill_verified ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-ful">
                <Verified className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400"></span>
              </div>
            ) : profile?.is_identity_verified ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transpare">
                <BadgeCheck className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-orange-400"></span>
              </div>
            ) : profile?.is_email_verified ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Email Verified</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/20 border border-gray-500">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400">Unverified</span>
              </div>
            )}
          </div>

          </div>
          
         {/* Active Subscription & Points Section */}
<div className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Crown className="w-5 h-5 text-yellow-400" />
      <h3 className="font-semibold text-white">Premium Status</h3>
    </div>
    {profile?.is_premium ? (
      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Active</span>
    ) : (
      <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full">Inactive</span>
    )}
  </div>

  {profile?.is_premium ? (
    <>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-400">Plan</span>
        <span className="text-white font-medium">
          {profile?.premium_until ? (
            new Date(profile.premium_until) > new Date() ? 'Premium Active' : 'Expired'
          ) : 'Premium Active'}
        </span>
      </div>
      {profile?.premium_until && new Date(profile.premium_until) > new Date() && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Renewal Date</span>
          <span className="text-white text-sm">
            {new Date(profile.premium_until).toLocaleDateString()}
          </span>
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Next billing</p>
            <p className="text-sm text-white font-medium">
              {profile?.premium_until ? (
                new Date(profile.premium_until) > new Date() 
                  ? `${Math.ceil((new Date(profile.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                  : 'Subscription expired'
              ) : 'Active'}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-yellow-400 border-yellow-500"
            onClick={() => router.push('/upgrade/premium')}
          >
            Manage
          </Button>
        </div>
      </div>
    </>
  ) : (
    <div className="text-center py-2">
      <p className="text-gray-400 text-sm mb-3">No active premium subscription</p>
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-yellow-500 to-orange-500"
        onClick={() => router.push('/upgrade/premium')}
      >
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Premium
      </Button>
    </div>
  )}
</div>

{/* Points Section */}
<div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-yellow-500" />
      <h3 className="font-semibold text-white">Points Balance</h3>
    </div>
    <span className="text-2xl font-bold text-yellow-400">{profile?.points_balance || 0}</span>
  </div>
  
  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">E-Rank</p>
      <p className="text-white font-medium">5 pts</p>
    </div>
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">D-Rank</p>
      <p className="text-white font-medium">15 pts</p>
    </div>
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">C-Rank</p>
      <p className="text-white font-medium">30 pts</p>
    </div>
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">B-Rank</p>
      <p className="text-white font-medium">50 pts</p>
    </div>
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">A-Rank</p>
      <p className="text-white font-medium">75 pts</p>
    </div>
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <p className="text-gray-500">S-Rank</p>
      <p className="text-white font-medium">100 pts</p>
    </div>
  </div>

  <Button 
    variant="outline" 
    className="w-full"
    onClick={() => router.push('/upgrade/premium')}
  >
    <Zap className="w-4 h-4 mr-2" />
    Buy More Points
  </Button>
</div>

        </div>


{/* Earnings / Wallet Section */}
<div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Wallet className="w-5 h-5 text-green-400" />
      <h3 className="font-semibold text-white">Earnings Overview</h3>
    </div>
    <button 
      onClick={fetchEarningsData} 
      disabled={refreshing}
      className="p-1 hover:bg-gray-800 rounded-lg transition"
    >
      {refreshing ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
    </button>
  </div>

  <div className="grid grid-cols-2 gap-3 mb-4">
    <div className="p-3 bg-gray-800/50 rounded-xl text-center">
      <p className="text-gray-500 text-xs">Total Earned</p>
      <p className="text-xl font-bold text-green-400">₦{totalEarned.toLocaleString()}</p>
    </div>
    <div className="p-3 bg-gray-800/50 rounded-xl text-center">
      <p className="text-gray-500 text-xs">Completed Jobs</p>
      <p className="text-xl font-bold text-purple-400">{completedJobsCount}</p>
    </div>
  </div>

  {/* Escrow Balance */}
  <div className="mt-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-white font-medium">In Escrow</span>
      </div>
      <span className="text-lg font-bold text-yellow-400">₦{escrowBalance.toLocaleString()}</span>
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Funds held until business releases payment
    </p>
  </div>

  {/* Bank Account Section */}
  <div className="mt-4 pt-3 border-t border-gray-800">
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={() => setShowBankModal(true)}
      >
        <Building className="w-4 h-4 mr-2" />
        {hasBankAccount ? 'Manage Bank' : 'Add Bank Account'}
      </Button>
    </div>

    {!hasBankAccount && (
      <p className="text-xs text-yellow-400 text-center mt-3">
        Add a bank account to receive payments
      </p>
    )}
  </div>
</div>

<Link href="/profile/transactions">
  <Button variant="outline" className="w-full mt-2">
    <History className="w-4 h-4 mr-2" />
    View Transaction History
  </Button>
</Link>



        {/* Verification Progress Section */}
        <div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            Verification Progress
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Verification Level</span>
              <span>{Math.round(verification.progress)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${verification.progress}%` }}
              />
            </div>
          </div>

          {/* Verification Steps - Sequential with Status */}
          <div className="space-y-3 mb-4">
            {/* Step 1: Email Verification */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              profile?.is_email_verified 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-gray-800/50 border border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile?.is_email_verified ? 'bg-green-500/30' : 'bg-gray-700'
                }`}>
                  {profile?.is_email_verified ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Mail className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Email Verification</p>
                  <p className="text-xs text-gray-400">Verify your email address</p>
                </div>
              </div>
              {profile?.is_email_verified ? (
                <span className="text-xs text-green-400">✓ Completed</span>
              ) : (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => router.push('/profile')}>
                  Verify
                </Button>
              )}
            </div>

            {/* Step 2: Identity Verification - Locked until Email Verified */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              !profile?.is_email_verified 
                ? 'bg-gray-800/30 border border-gray-700 opacity-50'
                : profile?.is_identity_verified 
                  ? 'bg-transparent border-orange-500/50'
                  : profile?.identity_verification_status === 'pending'
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-gray-800/50 border border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile?.is_identity_verified 
                    ? 'bg-orange-500/30'
                    : profile?.identity_verification_status === 'pending'
                      ? 'bg-yellow-500/30'
                      : 'bg-gray-700'
                }`}>
                  {profile?.is_identity_verified ? (
                    <BadgeCheck className="w-4 h-4 text-orange-400" />
                  ) : profile?.identity_verification_status === 'pending' ? (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <BadgeCheck className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Identity Verification</p>
                  <p className="text-xs text-gray-400">
                    {!profile?.is_email_verified 
                      ? 'Complete email verification first'
                      : profile?.is_identity_verified 
                        ? 'Identity verified!'
                        : profile?.identity_verification_status === 'pending'
                          ? 'Pending admin review (24-48 hours)'
                          : 'Upload ID for verification'}
                  </p>
                </div>
              </div>
              {profile?.is_identity_verified ? (
                <span className="text-xs text-green-400">✓ Completed</span>
              ) : profile?.identity_verification_status === 'pending' ? (
                <span className="text-xs text-yellow-400">Pending Review</span>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => router.push('/verify/identity')}
                  disabled={!profile?.is_email_verified}
                >
                  Verify
                </Button>
              )}
            </div>

            {/* Step 3: Skill Verification - Locked until Identity Verified */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              !profile?.is_identity_verified 
                ? 'bg-gray-800/30 border border-gray-700 opacity-50'
                : profile?.is_skill_verified 
                  ? 'bg-gray-500/20 border border-gray-500/50'
                  : profile?.skill_verification_status === 'pending'
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-gray-800/50 border border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile?.is_skill_verified 
                    ? 'bg-gray-500/30'
                    : profile?.skill_verification_status === 'pending'
                      ? 'bg-yellow-500/30'
                      : 'bg-gray-700'
                }`}>
                  {profile?.is_skill_verified ? (
                    <Verified className="w-4 h-4 text-gray-400" />
                  ) : profile?.skill_verification_status === 'pending' ? (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Verified className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Skill Verification</p>
                  <p className="text-xs text-gray-400">
                    {!profile?.is_identity_verified 
                      ? 'Complete identity verification first'
                      : profile?.is_skill_verified 
                        ? 'Skills verified!'
                        : profile?.skill_verification_status === 'pending'
                          ? 'Pending admin review (24-48 hours)'
                          : 'Take skill test for verification'}
                  </p>
                </div>
              </div>
              {profile?.is_skill_verified ? (
                <span className="text-xs text-green-400">✓ Completed</span>
              ) : profile?.skill_verification_status === 'pending' ? (
                <span className="text-xs text-yellow-400">Pending Review</span>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => router.push('/verify/skill')}
                  disabled={!profile?.is_identity_verified}
                >
                  Verify
                </Button>
              )}
            </div>

            {/* Step 4: Premium Verification - Locked until Skill Verified */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              !profile?.is_skill_verified 
                ? 'bg-gray-800/30 border border-gray-700 opacity-50'
                : profile?.is_premium 
                  ? 'bg-yellow-500/20 border border-yellow-500/50'
                  : 'bg-gray-800/50 border border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile?.is_premium 
                    ? 'bg-yellow-500/30'
                    : 'bg-gray-700'
                }`}>
                  {profile?.is_premium ? (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Crown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Premium Verification</p>
                  <p className="text-xs text-gray-400">
                    {!profile?.is_skill_verified 
                      ? 'Complete skill verification first'
                      : profile?.is_premium 
                        ? 'Premium active!'
                        : 'Subscribe for premium benefits'}
                  </p>
                </div>
              </div>
              {profile?.is_premium ? (
                <span className="text-xs text-green-400">Active</span>
              ) : (
                <Button 
                  size="sm" 
                  className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500"
                  onClick={() => router.push('/upgrade/premium')}
                  disabled={!profile?.is_skill_verified}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Next Step Info - Only show if not all completed */}
          {(!profile?.is_premium) && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-400 font-medium mb-1">
                Next Step: {
                  !profile?.is_email_verified ? 'Verify your email' :
                  !profile?.is_identity_verified ? 'Complete identity verification' :
                  !profile?.is_skill_verified ? 'Complete skill verification' :
                  'Upgrade to Premium'
                }
              </p>
              <p className="text-xs text-gray-400">
                {
                  !profile?.is_email_verified ? 'Check your email for verification link' :
                  !profile?.is_identity_verified ? 'Upload your ID and selfie for verification' :
                  !profile?.is_skill_verified ? 'Take the skill test to prove your expertise' :
                  'Get the gold badge and exclusive benefits'
                }
              </p>
            </div>
          )}

          {/* All Completed Message */}
          {profile?.is_premium && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 text-center">
              <p className="text-sm text-green-400 font-medium">🎉 Fully Verified!</p>
              <p className="text-xs text-gray-400">You have reached the highest verification level</p>
            </div>
          )}
        </div>

        {/* Rank Progress Section */}
<div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-5">
  <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
    <TrendingUp className="w-5 h-5 text-purple-400" />
    Rank Progress
  </h3>
  
  {/* Current Rank Display */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-gray-400">Current Rank</span>
    <span className="text-xl font-bold text-purple-400">{rankInfo.currentRank}-Rank</span>
  </div>
  
  {/* Progress Bar */}
  <div className="mb-3">
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>{rankInfo.currentRank}-Rank</span>
      <span>{rankInfo.nextRank ? `${rankInfo.nextRank}-Rank` : 'MAX'}</span>
      <span>{Math.round(rankInfo.progress)}%</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
        style={{ width: `${rankInfo.progress}%` }}
      />
    </div>
  </div>

  {/* Points Info */}
  <div className="flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-400">Current Points</p>
      <p className="text-xl font-bold text-white">{rankInfo.currentPoints}</p>
    </div>
    {rankInfo.nextRank && (
      <div className="text-right">
        <p className="text-xs text-gray-400">Needed for {rankInfo.nextRank}-Rank</p>
        <p className="text-sm text-yellow-400">{rankInfo.pointsNeeded} more points</p>
      </div>
    )}
  </div>

  {/* Rank Benefits */}
  <div className="mt-3 pt-3 border-t border-gray-800">
    <p className="text-xs text-gray-500">Higher rank = better gig opportunities + more visibility</p>
  </div>
</div>



{/* Modals */}
<BankAccountModal
  isOpen={showBankModal}
  onClose={() => setShowBankModal(false)}
  onSave={handleAddBankAccount}
/>
{/* 
<WithdrawalModal
  isOpen={showWithdrawalModal}
  onClose={() => setShowWithdrawalModal(false)}
  onWithdraw={handleWithdraw}
  maxAmount={walletBalance}
/> */}

        {/* Profile Sections */}
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Basic Information
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    />
                  ) : (
                    <p className="text-white text-sm">{fullName || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                      placeholder="+234 XXX XXX XXX"
                    />
                  ) : (
                    <p className="text-white text-sm">{phone || '—'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Location</label>
                {editing ? (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-white text-sm">{location || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-white text-sm whitespace-pre-wrap">{bio || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Skills</label>
                {editing ? (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                        placeholder="Add a skill"
                      />
                      <button onClick={handleAddSkill} className="px-3 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 text-white text-sm">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs flex items-center gap-1">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">—</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information - Required */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                Professional Information <span className="text-xs text-red-400">*Required</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">CV/Resume *</label>
                {editing ? (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      className="w-full text-white text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                    {cvUrl && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-300 flex-1">{cvFilename || 'CV uploaded'}</span>
                        <button onClick={handleDownloadCV} className="text-purple-400 hover:text-purple-300">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {cvUrl ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-300 flex-1">{cvFilename || 'CV uploaded'}</span>
                        <button onClick={handleDownloadCV} className="text-purple-400 hover:text-purple-300">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-red-400 text-sm">No CV uploaded (Required)</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Work Experience *</label>
                {editing ? (
                  <textarea
                    value={experienceDescription}
                    onChange={(e) => setExperienceDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm resize-none"
                    placeholder="Describe your work experience, past jobs, internships..."
                    required
                  />
                ) : (
                  <p className="text-white text-sm whitespace-pre-wrap">{experienceDescription || <span className="text-red-400">No experience added (Required)</span>}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Portfolio URL</label>
                {editing ? (
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="https://yourportfolio.com"
                  />
                ) : (
                  portfolioUrl ? (
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline flex items-center gap-1">
                      {portfolioUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <p className="text-gray-500 text-sm">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-purple-400" />
                Social Links
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">GitHub</label>
                {editing ? (
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="https://github.com/username"
                  />
                ) : (
                  githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline flex items-center gap-1">
                      <FaGithub className="w-3 h-3" /> {githubUrl}
                    </a>
                  ) : <p className="text-gray-500 text-sm">—</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">LinkedIn</label>
                {editing ? (
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="https://linkedin.com/in/username"
                  />
                ) : (
                  linkedinUrl ? (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline flex items-center gap-1">
                      <FaLinkedin className="w-3 h-3" /> {linkedinUrl}
                    </a>
                  ) : <p className="text-gray-500 text-sm">—</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">Twitter/X</label>
                {editing ? (
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
                    placeholder="https://twitter.com/username"
                  />
                ) : (
                  twitterUrl ? (
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline flex items-center gap-1">
                      <FaTwitter className="w-3 h-3" /> {twitterUrl}
                    </a>
                  ) : <p className="text-gray-500 text-sm">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Samples */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-400" />
                Work Samples
              </h3>
              {editing && (
                <button
                  onClick={() => {
                    setEditingSampleIndex(null)
                    setSampleTitle('')
                    setSampleLink('')
                    setSampleDescription('')
                    setSampleImageFile(null)
                    setSampleImagePreview('')
                    setShowSampleModal(true)
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              )}
            </div>
            <div className="p-4">
              {workSamples.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {workSamples.map((sample, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex gap-3">
                        {sample.image_url && (
                          <img src={sample.image_url} alt={sample.title} className="w-16 h-16 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{sample.title}</h4>
                          {sample.description && <p className="text-gray-400 text-xs mt-1">{sample.description}</p>}
                          {sample.link && (
                            <a href={sample.link} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs hover:underline flex items-center gap-1 mt-1">
                              View Project <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {editing && (
                          <button onClick={() => handleDeleteWorkSample(index)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No work samples added</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (Bottom) */}
        {editing && (
          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </main>

      {/* Work Sample Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingSampleIndex !== null ? 'Edit Work Sample' : 'Add Work Sample'}
              </h3>
              <button onClick={() => setShowSampleModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSampleImageChange}
                  className="w-full text-white text-sm"
                />
                {sampleImagePreview && (
                  <img src={sampleImagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                  placeholder="E.g., E-commerce Website"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Link (clickable)</label>
                <input
                  type="url"
                  value={sampleLink}
                  onChange={(e) => setSampleLink(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={sampleDescription}
                  onChange={(e) => setSampleDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none"
                  placeholder="Describe your role and the project..."
                />
              </div>
              
              <Button onClick={handleAddWorkSample} disabled={uploadingSample} className="w-full">
                {uploadingSample ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingSampleIndex !== null ? 'Update' : 'Add'} Work Sample
              </Button>
            </div>
          </div>
        </div>
      )}


{/* My Ratings Section - All ratings I've received */}
<div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
  <div className="flex items-center gap-2 mb-4">
    <Star className="w-5 h-5 text-yellow-400" />
    <h3 className="font-semibold text-white">Ratings & Reviews</h3>
    <span className="text-xs text-gray-400">({myRatings.length} reviews)</span>
  </div>

  {loadingRatings ? (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
    </div>
  ) : myRatings.length === 0 ? (
    <div className="text-center py-8">
      <Star className="w-12 h-12 text-gray-600 mx-auto mb-2" />
      <p className="text-gray-400 text-sm">No ratings yet</p>
      <p className="text-gray-500 text-xs mt-1">Complete jobs to receive ratings from businesses</p>
    </div>
  ) : (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {myRatings.map((rating) => (
        <div key={rating.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {rating.from_user?.avatar_url ? (
                <img 
                  src={rating.from_user.avatar_url} 
                  alt={rating.from_user.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <p className="text-white text-sm font-medium">{rating.from_user?.full_name || 'Anonymous'}</p>
                <p className="text-gray-500 text-xs">{rating.job?.title || 'Job'}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${star <= rating.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                />
              ))}
            </div>
          </div>
          
          {rating.review && (
            <p className="text-gray-300 text-sm mt-2 italic">"{rating.review}"</p>
          )}
          
          <p className="text-gray-500 text-xs mt-2">
            {new Date(rating.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )}
  
  {/* Average Rating Summary */}
  {myRatings.length > 0 && (
    <div className="mt-4 pt-3 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= (myRatings.reduce((a, b) => a + b.score, 0) / myRatings.length) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
              />
            ))}
          </div>
          <span className="text-white font-bold">
            {(myRatings.reduce((a, b) => a + b.score, 0) / myRatings.length).toFixed(1)}
          </span>
        </div>
        <span className="text-gray-400 text-sm">Overall Rating</span>
      </div>
    </div>
  )}
</div>
    </div>
  )
}