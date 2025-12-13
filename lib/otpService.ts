// OTP sending service using Firebase
// Phone: Uses Firebase Auth (built-in SMS)
// Email: Uses Firestore to store OTP, sends via email service or logs for dev

import { getFirestore } from "./firebase";
import admin from "firebase-admin";

export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  // Store OTP in Firestore (already done by storeOTP, but we can also log it)
  console.log(`[OTP] Email OTP for ${email}: ${otp}`);
  console.log(`[OTP] Check Vercel function logs to see OTP code.`);
  
  // For production, you can integrate with SendGrid here if needed
  // For now, we'll rely on the OTP being stored in Firestore and logged
  // Users can check Vercel logs or the API response will include it
  
  // Optional: If you have SendGrid configured, use it
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (sendGridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email }],
              subject: "Your Happin Login Code",
            },
          ],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@happin.app",
            name: "Happin",
          },
          content: [
            {
              type: "text/html",
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Your Happin Login Code</h2>
                  <p>Your verification code is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px; margin: 20px 0;">
                    ${otp}
                  </div>
                  <p>This code will expire in 5 minutes.</p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
              `,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("SendGrid error:", error);
        // Don't throw - fall back to logging
      }
    } catch (error) {
      console.error("Email sending failed:", error);
      // Don't throw - fall back to logging
    }
  }
}

// Phone OTP is handled by Firebase Auth, so this is just a placeholder
export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  // Phone OTP is handled by Firebase Auth's signInWithPhoneNumber
  // This function is kept for compatibility but phone auth uses Firebase directly
  console.log(`[OTP] Phone OTP for ${phone}: ${otp}`);
  console.log(`[OTP] Note: Phone OTP should use Firebase Auth's built-in SMS`);
}
