import { NextRequest, NextResponse } from "next/server"

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

    console.log("Initializing Razorpay with keyId:", keyId)
    
    // Dynamic import to avoid SSR issues
    const Razorpay = (await import("razorpay")).default
    
    let razorpay: any;
    try {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
      console.log("Razorpay initialized successfully")
    } catch (initError) {
      console.error("Failed to initialize Razorpay:", initError)
      throw new Error("Razorpay initialization failed")
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        payment_method: "upi,card,netbanking,wallet"
      }
    }

    console.log("Creating Razorpay order with options:", options)
    
    if (!razorpay.orders) {
      throw new Error("Razorpay orders API not available")
    }

    const order = await razorpay.orders.create(options)
    console.log("Order created successfully:", order.id)

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
