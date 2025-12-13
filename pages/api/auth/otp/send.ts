import type { NextApiRequest, NextApiResponse } from "next";
import { generateOTP, storeOTP } from "@/lib/auth";
import { sendEmailOTP } from "@/lib/otpService";

/**
 * POST /api/auth/otp/send
 * Send OTP to email or phone
 * Body: { identifier: string, type: "email" | "phone" }
 * 
 * For phone: Returns verificationId for Firebase Auth
 * For email: Generates and stores OTP in Firestore
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { identifier, type } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({ error: "identifier and type are required" });
    }

    if (type !== "email" && type !== "phone") {
      return res.status(400).json({ error: "type must be 'email' or 'phone'" });
    }

    // Validate email format
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Generate OTP for email
      const otp = generateOTP();

      // Store OTP in Firestore
      await storeOTP(identifier, otp, type);

      // Send email OTP (logs to console if SendGrid not configured)
      try {
        await sendEmailOTP(identifier, otp);
      } catch (error) {
        console.error("Email OTP sending error:", error);
        // Continue - OTP is stored and logged
      }

      // Check if SendGrid is configured
      const hasSendGrid = !!process.env.SENDGRID_API_KEY;

      return res.status(200).json({
        ok: true,
        message: hasSendGrid ? "OTP sent to email" : "OTP generated (check logs or response)",
        otp: hasSendGrid ? undefined : otp, // Include OTP if SendGrid not configured
        warning: hasSendGrid ? undefined : "SENDGRID_API_KEY not configured. OTP logged to console and included in response for testing.",
      });
    } else {
      // Phone authentication - handled client-side with Firebase Auth
      // Return instructions for client-side implementation
      return res.status(200).json({
        ok: true,
        message: "Use Firebase Auth on client-side for phone authentication",
        useFirebaseAuth: true,
        phone: identifier,
        note: "Phone OTP should be sent using Firebase Auth's signInWithPhoneNumber on the client side",
      });
    }
  } catch (error: any) {
    console.error("OTP send error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
