// app/api/send-order-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, customerName, orderId, orderType, expectedPickupDate } = body;

    console.log('📧 Attempting to send order email...', { to, orderId });

    // Validation
    if (!to) {
      console.error('❌ No recipient email provided');
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    if (!customerName || !orderId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Customer name and order ID are required' },
        { status: 400 }
      );
    }

    // Check email configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email configuration missing in environment variables');
      return NextResponse.json(
        { error: 'Email service not configured. Please check GMAIL_USER and GMAIL_APP_PASSWORD environment variables.' },
        { status: 500 }
      );
    }

    // Format order type for display
    const orderTypeText = [
      orderType?.clothes && "Clothes",
      orderType?.blankets && "Blankets"
    ].filter(Boolean).join(" and ") || "Laundry";

    // Format expected pickup date if provided
    const pickupDateText = expectedPickupDate 
      ? new Date(expectedPickupDate).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Manila',
        })
      : "To be determined";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background-color: #ffffff; 
              padding: 30px; 
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .order-card {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #3b82f6;
            }
            .tracking-id {
              background-color: #dbeafe;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              margin: 20px 0;
              border: 2px dashed #3b82f6;
            }
            .tracking-id h3 {
              margin: 0 0 10px 0;
              color: #1e40af;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .tracking-number {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              font-family: 'Courier New', monospace;
              letter-spacing: 2px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
            }
            .info-value {
              color: #1e293b;
              text-align: right;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              background-color: #fef3c7;
              color: #92400e;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #64748b;
              font-size: 14px;
            }
            .tips {
              background-color: #f0fdf4;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #10b981;
              margin: 20px 0;
            }
            .tips h4 {
              margin: 0 0 10px 0;
              color: #065f46;
            }
            .tips ul {
              margin: 0;
              padding-left: 20px;
            }
            .tips li {
              color: #047857;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧺 NorthEnd Laundry</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Trusted Laundry Service</p>
            </div>
            <div class="content">
              <h2 style="color: #1e293b; margin-top: 0;">Hello, ${customerName}! 👋</h2>
              <p style="font-size: 16px;">Thank you for choosing NorthEnd Laundry! Your laundry has been successfully received and is now being processed.</p>
              
              <div class="tracking-id">
                <h3>📋 Your Tracking ID</h3>
                <div class="tracking-number">${orderId}</div>
                <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">Save this ID to track your laundry</p>
              </div>

              <div class="order-card">
                <h3 style="margin-top: 0; color: #1e293b;">Laundry Details</h3>
                <div class="info-row">
                  <span class="info-label">Laundry ID:</span>
                  <span class="info-value"><strong>${orderId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Service Type:</span>
                  <span class="info-value">${orderTypeText}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value"><span class="status-badge">Pending</span></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Expected Pickup:</span>
                  <span class="info-value">${pickupDateText}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Drop Off Date:</span>
                  <span class="info-value">${new Date().toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Manila',
                  })}</span>
                </div>
              </div>

              <div class="tips">
                <h4>💡 What's Next?</h4>
                <ul>
                  <li>We'll notify you when your laundry is being processed</li>
                  <li>You'll receive another email when your laundry is ready for pickup</li>
                  <li>Use your tracking ID (${orderId}) to check your laundry status anytime</li>
                  <li>Payment will be processed when you pick up your laundry</li>
                </ul>
              </div>

              <center>
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?id=${orderId}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" fillcolor="#3b82f6">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;">Track Your Laundry</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                  <tr>
                    <td bgcolor="#3b82f6" style="border-radius: 6px; padding: 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?id=${orderId}" target="_blank" style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5;">Track Your Laundry</a>
                    </td>
                  </tr>
                </table>
                <!--<![endif]-->
              </center>

              <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">
                Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}" style="color: #3b82f6; text-decoration: none;">${process.env.GMAIL_USER}</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} NorthEnd Laundry. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This email was sent to ${to}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to,
      subject: `Laundry Confirmed - ${orderId} | NorthEnd Laundry`,
      html,
    });

    console.log('✅ Order email sent successfully!', { to, orderId, messageId: result.messageId });

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      orderId,
      message: `Email successfully sent to ${to}`,
    });
  } catch (error: any) {
    console.error('❌ Error in send-order-email API:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send order email',
        details: error.code || 'Unknown error',
      },
      { status: 500 }
    );
  }
}