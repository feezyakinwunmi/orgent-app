import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { subaccount_code } = await request.json()

    const response = await fetch(`https://api.paystack.co/subaccount/${subaccount_code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (data.status) {
      // Get balance from subaccount
      const balance = data.data.balance || 0
      
      return NextResponse.json({
        success: true,
        balance: balance,
        settlement_schedule: data.data.settlement_schedule,
        currency: data.data.currency
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