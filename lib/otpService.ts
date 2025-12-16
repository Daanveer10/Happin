// OTP sending service using Firebase
// Phone: Uses Firebase Auth (built-in SMS)
// Email: Uses Firestore to store OTP, sends via email service or logs for dev

import { getFirestore } from "./firebase";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

// Nodemailer (Gmail) transporter
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS; // Use an App Password for Gmail

const mailTransporter =
  gmailUser && gmailPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      })
    : null;

export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  // Always log for debugging
  console.log(`[OTP] Email OTP for ${email}: ${otp}`);

  if (!mailTransporter) {
    console.warn(
      "[OTP] Nodemailer Gmail transporter not configured. Set GMAIL_USER and GMAIL_PASS to send real emails."
    );
    return;
  }

  try {
    await mailTransporter.sendMail({
      from: `"Happin" <${gmailUser}>`,
      to: email,
              subject: "Your Happin Login Code",
      html: `
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
    });
    } catch (error) {
    console.error("Email sending failed (Nodemailer Gmail):", error);
    // Do not throw – OTP is still stored in Firestore and logged
  }
}

// Phone OTP is handled by Firebase Auth, so this is just a placeholder
export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  // Phone OTP is handled by Firebase Auth's signInWithPhoneNumber
  // This function is kept for compatibility but phone auth uses Firebase directly
  console.log(`[OTP] Phone OTP for ${phone}: ${otp}`);
  console.log(`[OTP] Note: Phone OTP should use Firebase Auth's built-in SMS`);
}
