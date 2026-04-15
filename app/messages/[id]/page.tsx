'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Send, User, Briefcase, 
  DollarSign, CheckCircle, Clock, Loader2,
  Zap, Crown, Shield, Award, MessageCircle,
  X, ThumbsUp
} from 'lucide-react'
import PaystackPop from '@paystack/inline-js'

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
  is_read: boolean
}

interface Offer {
  application_id: any
  settlement_status: string
  id: string
  offered_amount: number
  platform_fee: number
  hunter_amount: number
  status: string
  hunter_confirmed: boolean
  business_confirmed: boolean
  created_at: string
  confirmed_at: string
  paid_at: string
  payment_intent_id?: string
  work_submitted_at?: string
  work_description?: string
  work_link?: string
  released_at?: string
  transfer_reference?: string
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [showWorkModal, setShowWorkModal] = useState(false)
const [workDescription, setWorkDescription] = useState('')
const [workLink, setWorkLink] = useState('')
const [submitting, setSubmitting] = useState(false)



// In your ConversationPage, add this useEffect:

useEffect(() => {
  const markMessagesAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Mark all messages in this conversation as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
    } else {
      console.log('Messages marked as read in conversation page')
    }
  }

  if (!loading) {
    markMessagesAsRead()
  }
}, [conversationId, loading, supabase])

 useEffect(() => {
  // Load Paystack script
  if (typeof window !== 'undefined' && !(window as any).PaystackPop) {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }
}, [])

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

    // Get conversation details
    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        *,
        job:job_id (id, title, budget, description),
        business:business_id (id, full_name, avatar_url),
        hunter:hunter_id (id, full_name, avatar_url, grade)
      `)
      .eq('id', conversationId)
      .single()

    if (convData) {
      setConversation(convData)
    }

    // Get messages
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesData) {
      setMessages(messagesData)
      
      // Mark messages as read
      const unreadMessages = messagesData.filter(m => !m.is_read && m.sender_id !== user.id)
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id))
      }
    }

    // Get active offer - get ALL offers, not just pending
    const { data: offerData } = await supabase
      .from('job_offers')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (offerData) {
      setOffer(offerData)
    }

    setLoading(false)
  }

  fetchData()

  // Subscribe to new messages
  const messageSubscription = supabase
    .channel(`messages:${conversationId}`)
    // In your subscription useEffect
.on('postgres_changes', 
  { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
  (payload) => {
    setMessages(prev => {
      // Check if message already exists (by ID or by checking recent temp messages)
      const exists = prev.some(m => m.id === payload.new.id)
      if (exists) return prev
      
      // Also check if there's a temp message with same content from last 2 seconds
      const recentTemp = prev.some(m => 
        m.id.startsWith('temp_') && 
        m.message === payload.new.message &&
        new Date().getTime() - new Date(m.created_at).getTime() < 2000
      )
      
      if (recentTemp) {
        // Replace the temp message with real one
        return prev.map(m => 
          m.id.startsWith('temp_') && m.message === payload.new.message 
            ? payload.new as Message 
            : m
        )
      }
      
      return [...prev, payload.new as Message]
    })
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
)
    .subscribe()

  // Subscribe to offer changes (UPDATE events)
  const offerSubscription = supabase
    .channel(`offers:${conversationId}`)
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'job_offers', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        console.log('Offer updated:', payload)
        setOffer(payload.new as Offer)
        
        // If offer was just accepted, refresh messages
        if (payload.new.status === 'accepted' && payload.old.status !== 'accepted') {
          // Add system message
          supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: payload.new.business_confirmed ? payload.new.business_id : payload.new.hunter_id,
              message: `✅ **Offer Accepted!** Price: ₦${payload.new.offered_amount.toLocaleString()}`
            })
        }
      }
    )
    .subscribe()

  return () => {
    messageSubscription.unsubscribe()
    offerSubscription.unsubscribe()
  }
}, [conversationId, router, supabase])


  
const sendMessage = async () => {
  if (!newMessage.trim() || sending) return

  setSending(true)
  const { data: { user } } = await supabase.auth.getUser()

  // Create optimistic message with a unique temp ID
  const tempId = `temp_${Date.now()}_${Math.random()}`
  const newMsg = {
    id: tempId,
    conversation_id: conversationId,
    sender_id: user?.id,
    message: newMessage,
    created_at: new Date().toISOString(),
    is_read: false
  }

  // Add to UI immediately (optimistic)
  setMessages(prev => [...prev, newMsg as Message])
  setNewMessage('')
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Send to database - DON'T use .single()
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      message: newMessage
    })

  if (error) {
    console.error('Error sending message:', error)
    // Remove the optimistic message if failed
    setMessages(prev => prev.filter(m => m.id !== tempId))
    alert('Failed to send message')
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  setSending(false)
}

const cancelOffer = async () => {
  setProcessing(true)
  const { data: { user } } = await supabase.auth.getUser()

  // Update offer status to rejected
  await supabase
    .from('job_offers')
    .update({ status: 'rejected' })
    .eq('id', offer?.id)

  // Send system message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      message: `❌ **Offer Cancelled:** The previous offer of ₦${offer?.offered_amount.toLocaleString()} has been cancelled. A new offer can be made.`
    })

  setOffer(null)
  setProcessing(false)
  setShowOfferModal(true) // Open modal to create new offer
}

const createOffer = async () => {
  const amount = parseInt(offerAmount)
  if (isNaN(amount) || amount <= 0) return

  setProcessing(true)
  const { data: { user } } = await supabase.auth.getUser()

  // First, get the seeker_profile ID from the hunter's user_id
  const { data: seekerProfile, error: seekerError } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', conversation?.hunter_id)
    .maybeSingle()

  if (seekerError || !seekerProfile) {
    console.error('No seeker profile found for hunter:', conversation?.hunter_id)
    alert('Hunter profile not found')
    setProcessing(false)
    return
  }

  console.log('Found seeker profile:', seekerProfile)

  // Now get the application using the seeker_profile ID
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', conversation?.job_id)
    .eq('seeker_id', seekerProfile.id)  // Use seeker_profile.id, not user_id
    .maybeSingle()

  if (appError) {
    console.error('Error finding application:', appError)
    alert('Error finding application')
    setProcessing(false)
    return
  }

  if (!application) {
    console.error('No application found for job:', conversation?.job_id, 'and seeker:', seekerProfile.id)
    alert('No application found for this job and hunter. The hunter may not have applied for this job.')
    setProcessing(false)
    return
  }

  console.log('Found application:', application)

  const platformFee = Math.floor(amount * 0.1)
  const hunterAmount = amount - platformFee

  const { error: insertError } = await supabase
    .from('job_offers')
    .insert({
      conversation_id: conversationId,
      application_id: application.id,
      offered_amount: amount,
      platform_fee: platformFee,
      hunter_amount: hunterAmount,
      status: 'pending',
      business_confirmed: true
    })

  if (insertError) {
    console.error('Error creating offer:', insertError)
    alert('Failed to create offer: ' + insertError.message)
    setProcessing(false)
    return
  }

  // Send message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      message: `📝 **Offer Created:** I'm offering ₦${amount.toLocaleString()} for this job. (₦${platformFee.toLocaleString()} platform fee, hunter receives ₦${hunterAmount.toLocaleString()})`
    })

  setShowOfferModal(false)
  setOfferAmount('')
  
  // Fetch the new offer
  const { data: newOffer } = await supabase
    .from('job_offers')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (newOffer) {
    setOffer(newOffer)
  }
  
  setProcessing(false)
}

const confirmOffer = async () => {
  if (!offer) return
  
  setProcessing(true)
  const { data: { user } } = await supabase.auth.getUser()
  const isHunter = profile?.role === 'seeker'

  const updateField = isHunter ? 'hunter_confirmed' : 'business_confirmed'

  const { error } = await supabase
    .from('job_offers')
    .update({ [updateField]: true })
    .eq('id', offer.id)

  if (error) {
    console.error('Error confirming offer:', error)
    alert('Failed to confirm offer: ' + error.message)
  } else {
    setOffer(prev => prev ? { ...prev, [updateField]: true } : null)

    const confirmBy = isHunter ? 'Hunter' : 'Business'
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        message: `✓ **Confirmed by ${confirmBy}**`
      })

    // Use maybeSingle() here too
    const { data: updatedOffer } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', offer.id)
      .maybeSingle()  // Change from .single() to .maybeSingle()

    if (updatedOffer?.hunter_confirmed && updatedOffer?.business_confirmed) {
      await supabase
        .from('job_offers')
        .update({ status: 'accepted', confirmed_at: new Date().toISOString() })
        .eq('id', offer.id)

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          message: `✅ **Offer Accepted!** Price: ₦${updatedOffer.offered_amount.toLocaleString()}`
        })

      setOffer(prev => prev ? { ...prev, status: 'accepted' } : null)
    }
  }
  setProcessing(false)
}


const proceedToPayment = async () => {
  if (!offer) return
  
  setProcessing(true)
  const { data: { user } } = await supabase.auth.getUser()

  // Get hunter's subaccount
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('subaccount_code')
    .eq('user_id', conversation?.hunter_id)
    .eq('is_default', true)
    .maybeSingle()

  if (!bankAccount?.subaccount_code) {
    alert('Hunter has not set up their payout account yet')
    setProcessing(false)
    return
  }

  const reference = `JOB_${conversation?.job_id}_${Date.now()}`
  const amountInKobo = offer.offered_amount * 100

  const paystack = new PaystackPop()
  
  paystack.newTransaction({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: profile?.email,
    amount: amountInKobo,
    currency: 'NGN',
    ref: reference,
    metadata: {
      job_id: conversation?.job_id,
      offer_id: offer.id
    },
    onSuccess: async (transaction: any) => {
      console.log('Payment successful:', transaction)
      
      await supabase
        .from('job_offers')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          payment_intent_id: transaction.reference
        })
        .eq('id', offer.id)

      await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', conversation?.job_id)

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          message: `💰 **Payment Complete!** ₦${offer.offered_amount.toLocaleString()} has been sent to escrow. The hunter can now start work.`
        })

      alert('Payment successful! Funds are held in escrow.')
      router.refresh()
      setProcessing(false)
    },
    onCancel: () => {
      console.log('Payment cancelled')
      setProcessing(false)
    },
    onError: (error: any) => {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setProcessing(false)
    }
  })
}

const submitWork = async () => {
  if (!workDescription.trim()) {
    alert('Please describe the work completed')
    return
  }

  setSubmitting(true)

  // Update job_offer status to 'completed'
  await supabase
    .from('job_offers')
    .update({ 
      status: 'completed',
      work_submitted_at: new Date().toISOString(),
      work_description: workDescription,
      work_link: workLink
    })
    .eq('id', offer?.id)

  // Send notification to business
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: profile?.id,
      message: `📦 **Work Submitted!** The hunter has completed the work. Please review and release payment.`
    })

  setShowWorkModal(false)
  setSubmitting(false)
  alert('Work submitted! The business will review and release payment.')
}




const releasePayment = async () => {
  if (!offer) return
  
  setProcessing(true)
  const { data: { user } } = await supabase.auth.getUser()

  console.log('=== RELEASE PAYMENT START ===')
  console.log('Offer object:', offer)
  console.log('Offer application_id:', offer.application_id)
  console.log('Conversation:', conversation)

  // First, try to get the application_id from the offer if it exists
  let applicationId = offer.application_id

  // If no application_id on offer, try to find it from the database
  if (!applicationId) {
    console.log('No application_id on offer, fetching from database...')
    
    // Fetch the full offer from database to ensure we have application_id
    const { data: freshOffer, error: fetchError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', offer.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching fresh offer:', fetchError)
    } else if (freshOffer) {
      console.log('Fresh offer from DB:', freshOffer)
      applicationId = freshOffer.application_id
      setOffer(freshOffer) // Update local state
    }
  }

  // If still no application_id, try to find application by job_id and hunter_id
  if (!applicationId) {
    console.log('Still no application_id, searching by job and hunter...')
    
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', conversation?.job_id)
      .eq('seeker_id', conversation?.hunter_id)
      .maybeSingle()

    if (appError) {
      console.error('Error finding application:', appError)
    } else if (application) {
      console.log('Found application by job/hunter:', application)
      applicationId = application.id
    }
  }

  // Update offer status - mark as released
  const { error: offerError } = await supabase
    .from('job_offers')
    .update({ 
      status: 'released',
      released_at: new Date().toISOString()
    })
    .eq('id', offer.id)

  if (offerError) {
    console.error('Error updating offer:', offerError)
    alert('Failed to release payment. Please try again.')
    setProcessing(false)
    return
  }

  console.log('Offer updated to released')

  // Update application status to 'completed' if we have applicationId
  if (applicationId) {
    console.log('Updating application with ID:', applicationId)
    
    const { error: appError, data: updateResult } = await supabase
      .from('applications')
      .update({ 
        status: 'completed',
        selected_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()

    if (appError) {
      console.error('Error updating application:', appError)
    } else {
      console.log('Application updated successfully:', updateResult)
    }
  } else {
    console.error('NO APPLICATION_ID FOUND! Cannot update application status.')
  }

  // Update job status
  await supabase
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', conversation?.job_id)

  // Send notification
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      message: `💰 **Job Completed!** Funds have been released to the hunter's bank account.`
    })

  // Update local state
  setOffer(prev => prev ? { ...prev, status: 'released', released_at: new Date().toISOString() } : null)

  alert('Payment released successfully! Job marked as completed.')
  setProcessing(false)
  router.refresh()
}


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const otherUser = conversation?.business_id === profile?.id ? conversation?.hunter : conversation?.business
  const isBusiness = profile?.role === 'business'
  const isHunter = profile?.role === 'seeker'
// Update this condition - allow new offer if rejected or if pending and business wants to update
const canMakeOffer = isBusiness && (!offer || offer.status === 'rejected' || offer.status === 'pending')
  const canConfirm = offer?.status === 'pending' && 
    ((isHunter && !offer.hunter_confirmed) || (isBusiness && !offer.business_confirmed))
  const canPay = isBusiness && offer?.status === 'accepted'


 
  return (
    <div className="min-h-screen bg-black ">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      {/* Header */}
      <header className="relative z-30 bg-black/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-purple-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-white">{otherUser?.full_name}</h1>
                  <p className="text-xs text-gray-400">{conversation?.job?.title}</p>
                </div>
              </div>
            </div>
            {isBusiness && (
              <Button size="sm" variant="outline" onClick={() => setShowOfferModal(true)} disabled={!canMakeOffer}>
                <DollarSign className="w-4 h-4 mr-1" />
                Make Offer
              </Button>
            )}
          </div>
        </div>
      </header>

{/* Offer Status Card */}
{offer && (
  <div className="sticky top-16 z-20 px-4 pt-2 pb-2 bg-black/80 backdrop-blur-md">
    <Card className={`p-4 ${
      offer.status === 'accepted' ? 'bg-green-500/10 border-green-500' :
      offer.status === 'paid' ? 'bg-blue-500/10 border-blue-500' :
      offer.status === 'completed' ? 'bg-yellow-500/10 border-yellow-500' :
      offer.status === 'released' ? 'bg-green-500/10 border-green-500' :
      'bg-yellow-500/10 border-yellow-500'
    }`}>
      <div className="flex flex-col items-start gap-2 justify-between">
        <div >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-white">₦{offer.offered_amount.toLocaleString()}</span>
            <div className="text-xs text-gray-400 mt-1">
  {offer.status === 'accepted' && (
    <span>Hunter receives: ₦{offer.hunter_amount?.toLocaleString()} (after 10% fee)</span>
  )}
</div>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            {offer.status === 'pending' && 'Awaiting confirmation from both parties'}
            {offer.status === 'accepted' && '✓ Offer accepted! Ready for payment'}
            {offer.status === 'paid' && '💰 Payment in escrow. Work can start!'}
            {offer.status === 'completed' && '📦 Work submitted - Pending review'}
            {offer.status === 'released' && '✅ Payment released! Job completed.'}
          </p>
        </div>

        {/* Action Buttons based on status */}
        <div >
          {/* Pending - Show confirmation status */}
          {offer.status === 'pending' && (
            <div className="flex items-center gap-1">
              {offer.business_confirmed && <CheckCircle className="w-4 h-4 text-green-400" />}
              {offer.hunter_confirmed && <CheckCircle className="w-4 h-4 text-green-400" />}
              <span className="text-xs text-gray-400">
                {offer.business_confirmed ? 'Business ✓' : 'Business ⏳'} | 
                {offer.hunter_confirmed ? 'Hunter ✓' : 'Hunter ⏳'}
              </span>
            </div>
          )}
          
          
          {/* Accepted - Ready for payment */}
          {offer.status === 'accepted' && canPay && (
            <Button size="sm" onClick={proceedToPayment} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-1" />}
              Proceed to Payment
            </Button>
          )}
          
          {offer.status === 'accepted' && !canPay && (
            <span className="text-xs text-green-400">Awaiting business payment</span>
          )}
          
          {/* Paid - Hunter submits work */}
          {offer.status === 'paid' && isHunter && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowWorkModal(true)}>
              <ThumbsUp className="w-4 h-4 mr-2" />
              Submit Work
            </Button>
          )}
          
          {offer.status === 'paid' && !isHunter && (
            <span className="text-xs text-blue-400">Hunter working on job</span>
          )}
          
          {/* Completed - Business releases payment */}
        {offer.status === 'completed' && isBusiness && (
  <Button 
    size="sm" 
    className="bg-green-600 hover:bg-green-700 w-full" 
    onClick={() => {
      console.log('🔴 Release Payment button clicked!')
      releasePayment()
    }} 
    disabled={processing}
  >
    <DollarSign className="w-4 h-4 mr-2" />
    Release Payment
  </Button>
)}
          
          {offer.status === 'completed' && !isBusiness && (
            <span className="text-xs text-yellow-400">Work submitted - Awaiting review</span>
          )}
          
          {/* Released - Job complete */}
          {offer.status === 'released' && (
            <span className="text-xs text-green-400">✓ Payment released! Job completed.</span>
          )}
        </div>
      </div>

      {/* Confirm Button - Only show when pending and user hasn't confirmed */}
      {offer.status === 'pending' && (
        <>
          {isHunter && !offer.hunter_confirmed && (
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={confirmOffer}
              disabled={processing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Offer (₦{offer.offered_amount.toLocaleString()})
            </Button>
          )}
          
          {isBusiness && !offer.business_confirmed && (
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={confirmOffer}
              disabled={processing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Offer (₦{offer.offered_amount.toLocaleString()})
            </Button>
            
          )}
          
          {offer.hunter_confirmed && offer.business_confirmed && (
            <div className="w-full mt-3 p-2 bg-green-500/20 rounded-lg text-center">
              <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
              <span className="text-sm text-green-400">Both parties confirmed! Ready for payment.</span>
            </div>
          )}
        </>
      )}

      {/* Cancel Offer Button - Only for business who hasn't confirmed yet */}
      {offer.status === 'pending' && isBusiness && !offer.business_confirmed && (
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full mt-2 text-red-400 border-red-500"
          onClick={cancelOffer}
          disabled={processing}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel Offer & Create New
        </Button>
      )}

         {/* Settlement Status - Show after release */}
      {offer.status === 'released' && (
        <div className="mt-3 p-2 bg-blue-500/10 rounded-lg">
          <p className="text-xs text-blue-400">
            {offer.settlement_status === 'pending' && '⏳ Pending settlement (1-3 business days)'}
            {offer.settlement_status === 'processing' && '🔄 Processing settlement...'}
            {offer.settlement_status === 'completed' && '✅ Settled to bank account!'}
          </p>
        </div>
      )}
    </Card>
  </div>
)}

      {/* Messages */}
      <main className="relative z-10 px-4 py-4 pb-24 max-w-2xl mx-auto">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isSender = msg.sender_id === profile?.id
            const isSystemMessage = msg.message.startsWith('📝') || msg.message.startsWith('✅') || 
                                   msg.message.startsWith('✓') || msg.message.startsWith('💰')
            
            if (isSystemMessage) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                    {msg.message}
                  </span>
                </div>
              )
            }
            
            return (
              <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-2xl ${
                  isSender 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

    {/* Message Input */}
<div className="fixed bottom-0 left-0 right-0 z-20 mb-20 bg-gray-900 border-t border-purple-500/30 p-4">
  <div className="max-w-2xl mx-auto flex gap-2">
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      placeholder="Type a message..."
      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 text-white"
    />
    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-6">
      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
    </Button>
  </div>
</div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Make an Offer</h3>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Original budget: ₦{conversation?.job?.budget?.toLocaleString()}
            </p>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Enter offer amount"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white mb-4"
            />
            <Button onClick={createOffer} disabled={processing} className="w-full">
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Send Offer
            </Button>
          </div>
        </div>
      )}


      {/* Work Submission Modal */}
{showWorkModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-md w-full p-6 border border-purple-500/30">
      <h3 className="text-xl font-bold text-white mb-4">Submit Completed Work</h3>
      <textarea
        value={workDescription}
        onChange={(e) => setWorkDescription(e.target.value)}
        placeholder="Describe what you completed..."
        rows={4}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white mb-4"
      />
      <input
        type="url"
        value={workLink}
        onChange={(e) => setWorkLink(e.target.value)}
        placeholder="Link to work (Google Drive, Dropbox, etc.)"
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white mb-4"
      />
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setShowWorkModal(false)}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={submitWork} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Submit for Review
        </Button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}