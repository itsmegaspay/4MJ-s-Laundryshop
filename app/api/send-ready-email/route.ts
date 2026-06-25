import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, customerName, orderId, weight, pricing } = body;

    if (!to || !customerName || !orderId || !pricing) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email HTML
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
            .status-banner {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .status-banner h2 {
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .status-banner p {
              margin: 0;
              opacity: 0.95;
              font-size: 15px;
            }
            .order-card {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .order-card h3 {
              margin-top: 0;
              color: #1e293b;
              font-size: 18px;
            }
            .order-id-box {
              background-color: #dbeafe;
              padding: 12px;
              border-radius: 6px;
              text-align: center;
              margin: 15px 0;
              border: 2px dashed #3b82f6;
            }
            .order-id-box strong {
              font-size: 18px;
              color: #1e40af;
              font-family: 'Courier New', monospace;
              letter-spacing: 1px;
            }
            .weight-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .weight-table tr {
              border-bottom: 1px solid #e2e8f0;
            }
            .weight-table tr:last-child {
              border-bottom: none;
            }
            .weight-table td {
              padding: 12px 8px;
            }
            .weight-table td:first-child {
              color: #64748b;
              font-weight: 600;
            }
            .weight-table td:nth-child(2) {
              color: #1e293b;
              text-align: center;
            }
            .weight-table td:last-child {
              text-align: right;
              font-weight: 600;
              color: #1e293b;
            }
            .total-section {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 2px solid #cbd5e1;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-row .label {
              font-size: 18px;
              font-weight: 600;
              color: #475569;
            }
            .total-row .amount {
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
            }
            .pickup-notice {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
            }
            .pickup-notice h4 {
              margin: 0 0 10px 0;
              color: #92400e;
              font-size: 16px;
            }
            .pickup-notice p {
              margin: 5px 0;
              color: #78350f;
            }
            .pickup-notice strong {
              color: #92400e;
            }
            .info-box {
              background-color: #f0fdf4;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #10b981;
              margin: 20px 0;
            }
            .info-box h4 {
              margin: 0 0 10px 0;
              color: #065f46;
            }
            .info-box ul {
              margin: 0;
              padding-left: 20px;
            }
            .info-box li {
              color: #047857;
              margin: 5px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #10b981;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #64748b;
              font-size: 14px;
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
              <h2 style="color: #1e293b; margin-top: 0;">Great News, ${customerName}! 🎉</h2>
              <p style="font-size: 16px;">Your laundry is clean, fresh, and ready for pickup!</p>
              
              <div class="status-banner">
                <h2>✅ READY FOR PICKUP</h2>
                <p>Your order has been completed and is waiting for you</p>
              </div>

              <div class="order-card">
                <h3>Order Summary</h3>
                <div class="order-id-box">
                  <strong>${orderId}</strong>
                </div>
                
                ${weight ? `
                <table class="weight-table">
                  <tbody>
                    ${weight.clothes > 0 ? `
                    <tr>
                      <td>Clothes</td>
                      <td>${weight.clothes} kg</td>
                      <td>₱${pricing.clothesPrice?.toFixed(2) || '0.00'}</td>
                    </tr>
                    ` : ''}
                    ${weight.blanketsLight > 0 ? `
                    <tr>
                      <td>Light Blankets</td>
                      <td>${weight.blanketsLight} kg</td>
                      <td>₱${pricing.blanketsLightPrice?.toFixed(2) || '0.00'}</td>
                    </tr>
                    ` : ''}
                    ${weight.blanketsThick > 0 ? `
                    <tr>
                      <td>Thick Blankets</td>
                      <td>${weight.blanketsThick} kg</td>
                      <td>₱${pricing.blanketsThickPrice?.toFixed(2) || '0.00'}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                </table>
                ` : ''}
              </div>
              
              <div class="total-section">
                <div class="total-row">
                  <span class="label">Total Amount Due:</span>
                  <span class="amount">₱${pricing.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="pickup-notice">
                <h4>📍 Ready for Pickup Now!</h4>
                <p><strong>Please come pick up your laundry at your earliest convenience.</strong></p>
                <p style="margin-top: 10px;">💳 Payment can be made at the time of pickup</p>
                <p>🕒 Store Hours: [Your Store Hours Here]</p>
              </div>

              <div class="info-box">
                <h4>💡 What to Bring:</h4>
                <ul>
                  <li>Your Order ID: <strong>${orderId}</strong></li>
                  <li>Payment for ₱${pricing.totalPrice.toFixed(2)}</li>
                  <li>Valid ID (if required)</li>
                </ul>
              </div>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track?id=${orderId}" class="button" style="color: #ffffff !important; text-decoration: none; background-color: #10b981;">
                  View Order Details
                </a>
              </center>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">
                Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}" style="color: #10b981;">${process.env.GMAIL_USER}</a>
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing NorthEnd Laundry!</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} NorthEnd Laundry. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This email was sent to ${to}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    const result = await sendEmail({
      to,
      subject: `Your Laundry is Ready for Pickup! - Order ${orderId} | NorthEnd Laundry`,
      html,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending ready email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}