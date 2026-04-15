import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { subaccount_code } = await request.json()

    console.log('Checking balance for subaccount:', subaccount_code)

    const response = await fetch(`https://api.paystack.co/subaccount/${subaccount_code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()
    console.log('Paystack response:', JSON.stringify(data, null, 2))

    if (data.status) {
      const subaccount = data.data
      // Balance is in kobo, convert to naira
      const balance = subaccount.balance || 0
      const pending_settlement = subaccount.pending_settlement || 0
      
      return NextResponse.json({
        success: true,
        balance: balance / 100,
        pending_settlement: pending_settlement / 100,
        currency: subaccount.currency,
        settlement_schedule: subaccount.settlement_schedule
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.message
      })
    }
  } catch (error) {
    console.error('Check subaccount error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    })
  }
}