import type { NextApiRequest, NextApiResponse } from "next";
import { generateOTP, storeOTP } from "@/lib/auth";
import { sendEmailOTP, sendSMSOTP } from "@/lib/otpService";

/**
 * POST /api/auth/otp/send
 * Send OTP to email or phone
 * Body: { identifier: string, type: "email" | "phone" }
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
    }

    // Validate phone format (basic)
    if (type === "phone") {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(identifier.replace(/\s/g, ""))) {
        return res.status(400).json({ error: "Invalid phone format. Use international format: +1234567890" });
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    await storeOTP(identifier, otp, type);

    // Send OTP
    let otpSent = false;
    let sendError: string | null = null;
    
    try {
      if (type === "email") {
        await sendEmailOTP(identifier, otp);
        otpSent = true;
      } else {
        await sendSMSOTP(identifier, otp);
        otpSent = true;
      }
    } catch (error: any) {
      console.error("OTP sending error:", error);
      sendError = error?.message || "Failed to send OTP";
      // Check if credentials are configured
      const hasEmailConfig = !!process.env.SENDGRID_API_KEY;
      const hasSMSConfig = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
      
      if ((type === "email" && !hasEmailConfig) || (type === "phone" && !hasSMSConfig)) {
        // Credentials not configured - still return success with OTP for testing
        console.log(`[OTP] Credentials not configured - returning OTP in response for testing`);
        return res.status(200).json({
          ok: true,
          message: `OTP generated (${type === "email" ? "SendGrid" : "Twilio"} not configured - check logs or response for OTP)`,
          otp, // Include OTP in response when credentials not configured
          warning: `${type === "email" ? "SENDGRID_API_KEY" : "Twilio credentials"} not configured. OTP is in response for testing.`,
        });
      }
      
      // If credentials are configured but sending failed, return error
      return res.status(500).json({ 
        error: sendError || "Failed to send OTP",
        hint: "Check Vercel function logs for OTP code",
      });
    }

    // Check if credentials are configured
    const hasEmailConfig = !!process.env.SENDGRID_API_KEY;
    const hasSMSConfig = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const credentialsConfigured = (type === "email" && hasEmailConfig) || (type === "phone" && hasSMSConfig);

    return res.status(200).json({
      ok: true,
      message: `OTP sent to ${type === "email" ? "email" : "phone"}`,
      // Include OTP in response if credentials not configured (for testing)
      ...(!credentialsConfigured && { 
        otp,
        warning: `${type === "email" ? "SendGrid" : "Twilio"} not configured. OTP logged to console and included here for testing.`,
      }),
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
