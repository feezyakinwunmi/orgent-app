import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accountNumber, bankCode } = await request.json()

    // For test mode, accept any 10-digit number
    const isTestMode = process.env.PAYSTACK_SECRET_KEY?.includes('test') || process.env.NODE_ENV === 'development'
    
    if (isTestMode) {
      // Return success for any 10-digit account number in test mode
      if (accountNumber && accountNumber.length === 10 && /^\d+$/.test(accountNumber)) {
        return NextResponse.json({
          success: true,
          account_name: 'Test Account Name',
        })
      }
    }

    // Real verification for production
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.status) {
      return NextResponse.json({
        success: true,
        account_name: data.data.account_name,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid account number',
      })
    }
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
    })
  }
}