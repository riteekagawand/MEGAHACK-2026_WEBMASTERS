import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = await request.json()

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      )
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET!

    const hmac = crypto.createHmac("sha256", key_secret)
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId)
    const generated_signature = hmac.digest("hex")

    if (generated_signature === razorpaySignature) {
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpayPaymentId,
      })
    } else {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    )
  }
}
