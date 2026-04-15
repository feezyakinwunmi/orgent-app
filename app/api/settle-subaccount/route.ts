import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { subaccount_code, amount, reference } = await request.json()

    // Request settlement from subaccount
    const response = await fetch('https://api.paystack.co/subaccount/settle', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subaccount: subaccount_code,
        amount: amount * 100,
        reference: reference
      })
    })

    const data = await response.json()

    if (data.status) {
      return NextResponse.json({
        success: true,
        settlement: data.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.message
      })
    }
  } catch (error) {
    console.error('Settle subaccount error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    })
  }
}