// app/api/send-test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🧺 Test Email from 4MJ's Laundry</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p>If you received this email, your email setup is successful! ✅</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to,
      subject: 'Test Email from 4MJ's Laundry',
      html,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    });
  } catch (error: any) {
    console.error('Error in send-test-email API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
