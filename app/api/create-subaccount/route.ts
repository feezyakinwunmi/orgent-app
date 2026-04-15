import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { business_name, bank_code, account_number, percentage_charge, email } = await request.json()

    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: business_name,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: percentage_charge || 0,
        primary_contact_email: email,
        settlement_schedule: 'auto'
      })
    })

    const data = await response.json()

    if (data.status) {
      return NextResponse.json({
        success: true,
        subaccount_code: data.data.subaccount_code,
        subaccount_id: data.data.id
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.message
      })
    }
  } catch (error) {
    console.error('Create subaccount error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    })
  }
}