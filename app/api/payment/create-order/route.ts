import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR", receipt } = await request.json()

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      )
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials missing:", { keyId: !!keyId, keySecret: !!keySecret })
      return NextResponse.json(
        { error: "Razorpay configuration missing" },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const options = {
      amount: amount * 100,
      currency,
      receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        payment_method: "upi,card,netbanking,wallet"
      }
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    })
  } catch (error) {
    console.error("Razorpay order creation failed:", error)
    
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }
    
    return NextResponse.json(
      { error: "Failed to create order", details: errorMessage },
      { status: 500 }
    )
  }
}
