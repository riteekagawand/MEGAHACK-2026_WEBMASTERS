import { NextRequest, NextResponse } from 'next/server';

// WhatsApp API endpoint using UltraMsg
// Free tier: 100 messages/month
// Credentials are configured in this file

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Clean the phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // UltraMsg configuration - using user's credentials
    const ultraMsgToken = 'kybjp7r734ds6ckh';
    const ultraMsgInstance = 'instance165498';

    // Use UltraMsg API - token MUST be in URL as GET parameter
    try {
      // Build URL with token and other params as query string (GET parameters)
      const params = new URLSearchParams({
        token: ultraMsgToken,
        to: `+${cleanPhone}`,
        body: message,
      });
      
      const ultraMsgUrl = `https://api.ultramsg.com/${ultraMsgInstance}/messages/chat?${params.toString()}`;
      
      console.log('Sending to UltraMsg URL:', ultraMsgUrl);
      
      // Send POST request with empty body (all data is in URL)
      const response = await fetch(ultraMsgUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = await response.json();
      console.log('UltraMsg response:', result);
      
      if (response.ok && result.sent) {
        return NextResponse.json({
          success: true,
          method: 'UltraMsg',
          messageId: result.id,
        });
      } else {
        console.error('UltraMsg API error:', result);
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send message',
          details: result
        }, { status: 500 });
      }
    } catch (error) {
      console.error('UltraMsg error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }



  } catch (error) {
    console.error('Error in send-whatsapp API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
