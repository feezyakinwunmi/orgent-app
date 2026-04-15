import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event, data } = body

    // Verify webhook signature (add your Paystack secret key verification here)
    // const signature = request.headers.get('x-paystack-signature')
    // verifySignature(signature, body, process.env.PAYSTACK_SECRET_KEY!)
    
    if (event === 'charge.success') {
      const supabase = await createClient()
      const metadata = data.metadata
      const userEmail = data.customer?.email
      
      if (!userEmail) {
        return NextResponse.json({ error: 'No email found' }, { status: 400 })
      }

      // Get the user
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, points_balance')
        .eq('email', userEmail)
        .single()

      if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Handle premium purchase
      if (metadata.type === 'premium') {
        const premiumUntil = new Date()
        if (metadata.plan === 'monthly') {
          premiumUntil.setMonth(premiumUntil.getMonth() + 1)
        } else {
          premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)
        }

        const newPointsBalance = (userData.points_balance || 0) + metadata.bonusPoints

        await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            premium_until: premiumUntil.toISOString(),
            verification_badge_level: 'gold',
            points_balance: newPointsBalance
          })
          .eq('id', userData.id)

        await supabase
          .from('points_transactions')
          .insert({
            user_id: userData.id,
            amount: metadata.bonusPoints,
            balance_after: newPointsBalance,
            reason: `Premium ${metadata.plan} subscription - ${metadata.bonusPoints} bonus points`
          })
      }
      
      // Handle points purchase
      else if (metadata.type === 'points') {
        const totalPoints = metadata.totalPoints
        const newPointsBalance = (userData.points_balance || 0) + totalPoints

        await supabase
          .from('profiles')
          .update({ 
            points_balance: newPointsBalance
          })
          .eq('id', userData.id)

        await supabase
          .from('points_transactions')
          .insert({
            user_id: userData.id,
            amount: totalPoints,
            balance_after: newPointsBalance,
            reason: `Purchased ${metadata.points} points + ${metadata.bonus} bonus points`
          })
      }
      
   
// Handle business subscription
else if (metadata.type === 'business_subscription') {
  const { data: business } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('user_id', userData.id)
    .single()
  
  if (business) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    
    await supabase
      .from('business_profiles')
      .update({
        subscription_tier: metadata.plan,
        subscription_expires_at: expiresAt.toISOString(),
        jobs_posted_this_month: 0
      })
      .eq('id', business.id)
    
    // Record business transaction
    await supabase
      .from('business_transactions')
      .insert({
        business_id: business.id,
        amount: metadata.amount,
        type: 'subscription',
        description: `Upgraded to ${metadata.plan} plan`,
        reference: data.reference
      })
  }
}
      
      // Handle job payment (escrow)
      else if (metadata.type === 'job_payment') {
        await supabase
          .from('job_offers')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            payment_intent_id: data.reference,
            escrow_amount: metadata.amount
          })
          .eq('id', metadata.offer_id)

        await supabase
          .from('jobs')
          .update({ status: 'in_progress' })
          .eq('id', metadata.job_id)

        await supabase
          .from('messages')
          .insert({
            conversation_id: metadata.conversation_id,
            sender_id: metadata.business_id,
            message: `💰 **Payment Complete!** ₦${metadata.amount.toLocaleString()} has been sent to escrow. The hunter can now start work.`
          })
      }
    }

    // Handle subaccount settlement
    if (event === 'transfer.success') {
      const supabase = await createClient()
      
      const { data: offer } = await supabase
        .from('job_offers')
        .select('id, conversation_id')
        .eq('payment_intent_id', data.reference?.split('_')[1])
        .single()

      if (offer) {
        await supabase
          .from('job_offers')
          .update({ 
            settlement_status: 'completed',
            settlement_reference: data.reference,
            settled_at: new Date().toISOString()
          })
          .eq('id', offer.id)

        await supabase
          .from('messages')
          .insert({
            conversation_id: offer.conversation_id,
            sender_id: 'system',
            message: `💰 **Money Received!** Funds have been deposited to your bank account.`
          })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}