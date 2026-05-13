// lib/email.ts
import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Send email function
export const sendEmail = async (data: EmailPayload) => {
  const mailOptions = {
    from: `"4MJ's Laundry" <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send welcome email template
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  tempPassword: string,
  role: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧺 4MJ's Laundry</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Your account has been created as a <strong>${role}</strong> member of the 4MJ's Laundry team.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signin" class="button">Sign In Now</a>
            
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to 4MJ's Laundry - Your Account Details",
    html,
  });
};

// Send order status email template
export const sendOrderStatusEmail = async (
  to: string,
  customerName: string,
  orderNumber: string,
  status: string,
  customTemplate?: string
) => {
  const defaultTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-in-progress { background-color: #dbeafe; color: #1e40af; }
          .status-ready { background-color: #e9d5ff; color: #6b21a8; }
          .status-completed { background-color: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧺 4MJ's Laundry</h1>
          </div>
          <div class="content">
            <h2>Hello, {{customerName}}!</h2>
            <p>Your order <strong>{{orderNumber}}</strong> has been updated.</p>
            
            <p>Current Status: <span class="status status-{{status}}">{{statusLabel}}</span></p>
            
            <p>Thank you for choosing 4MJ's Laundry!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact us.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  let html = customTemplate || defaultTemplate;
  const statusLabel = status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  html = html
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{status}}/g, status)
    .replace(/{{statusLabel}}/g, statusLabel);

  return sendEmail({
    to,
    subject: `Order ${orderNumber} - Status Update`,
    html,
  });
};