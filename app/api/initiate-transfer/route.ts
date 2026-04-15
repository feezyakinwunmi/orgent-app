import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, recipient_code, reference, reason } = await request.json()

    const isTestMode = process.env.NODE_ENV === 'development' || 
                       process.env.PAYSTACK_SECRET_KEY?.includes('test')
    
    if (isTestMode) {
      console.log('Test mode: Fake transfer successful', { amount, reference })
      return NextResponse.json({
        success: true,
        reference: reference || `test_${Date.now()}`,
        transfer_code: `TRF_test_${Date.now()}`
      })
    }

    // Real Paystack call for production
    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100,
        recipient: recipient_code,
        reason: reason,
        reference: reference
      })
    })

    const data = await response.json()

    if (data.status) {
      return NextResponse.json({
        success: true,
        reference: data.data.reference,
        transfer_code: data.data.transfer_code
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.message
      })
    }
  } catch (error) {
    console.error('Initiate transfer error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    })
  }
}