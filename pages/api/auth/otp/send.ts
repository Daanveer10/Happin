// pages/api/auth/otp/send.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { generateOTP, storeOTP } from "@/lib/auth"; // Your DB helpers
import { sendEmailOTP } from "@/lib/otpService"; // Your Nodemailer/SendGrid wrapper

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { identifier, type } = req.body;

  try {
    // --- 1. EMAIL LOGIC ---
    if (type === "email") {
      const otp = generateOTP(); 
      await storeOTP(identifier, otp, type); // Save to DB

      // IMPORTANT: If this fails, we catch the error so the server doesn't crash
      try {
        await sendEmailOTP(identifier, otp);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ error: "Could not send email. Check server logs." });
      }

      // SECURITY FIX: Do NOT send 'otp' in this response!
      return res.status(200).json({ 
        ok: true, 
        message: "OTP sent to email" 
      });
    } 

    // --- 2. PHONE LOGIC ---
    else if (type === "phone") {
      return res.status(200).json({
        ok: true,
        useFirebaseAuth: true, // This flag tells frontend to run signInWithPhoneNumber
      });
    }

  } catch (error: any) {
    console.error("Send Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
