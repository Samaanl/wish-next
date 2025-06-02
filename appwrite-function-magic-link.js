// Appwrite Function for Magic Link Authentication with Resend
import { Client, Account } from "node-appwrite";
import fetch from "node-fetch";

export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] ?? "");

  const account = new Account(client);

  // Handle magic link email sending
  if (req.path === "/send-magic-link") {
    try {
      const body = req.body;
      const { email, userId, secret, url } = body;

      if (!email || !userId || !secret || !url) {
        return res.json(
          {
            success: false,
            error: "Missing required parameters: email, userId, secret, url",
          },
          400
        );
      }

      log(`Sending magic link email to: ${email}`);

      // Prepare the magic link URL
      const magicLinkUrl = `${url}?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`;

      // Prepare email content
      const emailSubject = "Your Magic Link to Wish Generator";
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Sign in to Wish Generator</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
            .footer { text-align: center; padding: 20px 0; font-size: 14px; color: #666; }
            .security-note { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✨ Wish Generator</div>
            </div>
            
            <div class="content">
              <h2>Sign in to your account</h2>
              <p>Click the button below to securely sign in to Wish Generator. This link will expire in 1 hour for your security.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLinkUrl}" class="button">Sign In to Wish Generator</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                ${magicLinkUrl}
              </p>
            </div>
            
            <div class="security-note">
              <strong>Security Note:</strong> If you didn't request this sign-in link, you can safely ignore this email. The link will expire automatically.
            </div>
            
            <div class="footer">
              <p>This email was sent to ${email}</p>
              <p>Wish Generator - Create personalized wishes with AI</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        Sign in to Wish Generator
        
        Click the link below to securely sign in to your account:
        ${magicLinkUrl}
        
        This link will expire in 1 hour for your security.
        
        If you didn't request this sign-in link, you can safely ignore this email.
        
        ---
        This email was sent to ${email}
        Wish Generator - Create personalized wishes with AI
      `;

      // Send email using Resend API
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.FROM_EMAIL || "Wish Generator <noreply@yourdomain.com>", // Use env variable or default
          to: [email],
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(
          `Resend API error: ${emailData.message || "Failed to send email"}`
        );
      }

      log(`Magic link email sent successfully. Email ID: ${emailData.id}`);

      return res.json({
        success: true,
        message: "Magic link email sent successfully",
        emailId: emailData.id,
      });
    } catch (err) {
      error(`Error sending magic link email: ${err.message}`);
      return res.json(
        {
          success: false,
          error: err.message,
        },
        500
      );
    }
  }

  // Handle webhook verification for magic link
  if (req.path === "/verify-magic-link") {
    try {
      const body = req.body;
      const { userId, secret } = body;

      if (!userId || !secret) {
        return res.json(
          {
            success: false,
            error: "Missing required parameters: userId, secret",
          },
          400
        );
      }

      log(`Verifying magic link for user: ${userId}`);

      // The verification is handled by Appwrite SDK on the client side
      // This endpoint can be used for additional logging or custom logic
      return res.json({
        success: true,
        message: "Magic link verification processed",
      });
    } catch (err) {
      error(`Error verifying magic link: ${err.message}`);
      return res.json(
        {
          success: false,
          error: err.message,
        },
        500
      );
    }
  }

  // Default response
  return res.json(
    {
      success: false,
      error: "Endpoint not found",
    },
    404
  );
};
