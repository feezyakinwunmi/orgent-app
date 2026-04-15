import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { offer_id, payment_intent_id, hunter_id, amount } = await request.json()

    if (!offer_id || !payment_intent_id || !hunter_id || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      })
    }

    const supabase = await createClient()

    // Get hunter's bank account
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', hunter_id)
      .eq('is_default', true)
      .single()

    if (bankError || !bankAccount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Hunter has no bank account set up. Please ask them to add a bank account.' 
      })
    }

    // Check if transfer recipient already exists
    let recipientCode = bankAccount.recipient_code

    if (!recipientCode) {
      // Create transfer recipient on Paystack
      const createRecipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: bankAccount.account_name,
          account_number: bankAccount.account_number,
          bank_code: bankAccount.bank_code,
          currency: 'NGN'
        })
      })

      const recipientData = await createRecipientRes.json()

      if (!recipientData.status) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create transfer recipient: ' + recipientData.message 
        })
      }

      recipientCode = recipientData.data.recipient_code

      // Save recipient code to database
      await supabase
        .from('bank_accounts')
        .update({ recipient_code: recipientCode })
        .eq('id', bankAccount.id)
    }

    // Initiate transfer from Paystack balance to hunter's account
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100, // Convert to kobo
        recipient: recipientCode,
        reason: `Job payment for offer #${offer_id}`,
        reference: `transfer_${offer_id}_${Date.now()}`
      })
    })

    const transferData = await transferRes.json()

    if (!transferData.status) {
      return NextResponse.json({ 
        success: false, 
        error: transferData.message || 'Transfer failed' 
      })
    }

    // Update offer status
    await supabase
      .from('job_offers')
      .update({ 
        status: 'released',
        released_at: new Date().toISOString(),
        transfer_reference: transferData.data.reference
      })
      .eq('id', offer_id)

    // Update job status to completed
    const { data: offer } = await supabase
      .from('job_offers')
      .select('conversation_id')
      .eq('id', offer_id)
      .single()

    if (offer) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('job_id')
        .eq('id', offer.conversation_id)
        .single()

      if (conversation) {
        await supabase
          .from('jobs')
          .update({ status: 'completed' })
          .eq('id', conversation.job_id)
      }
    }

    // Record points for hunter (100 points for completing a job)
    const { data: hunter } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('id', hunter_id)
      .single()

    const newPoints = (hunter?.points_balance || 0) + 100

    await supabase
      .from('profiles')
      .update({ points_balance: newPoints })
      .eq('id', hunter_id)

    await supabase
      .from('points_transactions')
      .insert({
        user_id: hunter_id,
        amount: 100,
        balance_after: newPoints,
        reason: `Completed job - Offer #${offer_id}`
      })

    return NextResponse.json({ 
      success: true, 
      transfer: transferData.data,
      message: 'Payment released successfully!' 
    })

  } catch (error) {
    console.error('Release payment error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}