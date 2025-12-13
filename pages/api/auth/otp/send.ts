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
    try {
      if (type === "email") {
        await sendEmailOTP(identifier, otp);
      } else {
        await sendSMSOTP(identifier, otp);
      }
    } catch (error) {
      console.error("OTP sending error:", error);
      // In development, we still return success even if sending fails
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Failed to send OTP" });
      }
    }

    return res.status(200).json({
      ok: true,
      message: `OTP sent to ${type === "email" ? "email" : "phone"}`,
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
