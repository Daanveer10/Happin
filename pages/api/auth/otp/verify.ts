import type { NextApiRequest, NextApiResponse } from "next";
import { verifyOTP, getUserByIdentifier, createOrUpdateUser, createSession, generateSessionToken } from "@/lib/auth";

/**
 * POST /api/auth/otp/verify
 * Verify OTP and create/login user
 * Body: { identifier: string, otp: string, type: "email" | "phone", isSignup: boolean, userData?: { name, company, role } }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { identifier, otp, type, isSignup, userData, firebaseUid } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({ error: "identifier and type are required" });
    }

    if (type !== "email" && type !== "phone") {
      return res.status(400).json({ error: "type must be 'email' or 'phone'" });
    }

    // For phone auth, Firebase Auth already verified the OTP on client-side
    // We just need to sync with our backend
    if (type === "phone" && firebaseUid) {
      // Phone OTP was verified by Firebase Auth, skip OTP verification
      // Just proceed to user creation/login
    } else {
      // For email, verify OTP from Firestore
      if (!otp) {
        return res.status(400).json({ error: "OTP is required for email verification" });
      }
      
      const isValid = await verifyOTP(identifier, otp);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }
    }

    // Check if user exists
    const existingUser = await getUserByIdentifier(identifier);

    if (isSignup) {
      // Signup flow
      if (existingUser) {
        return res.status(400).json({ error: "User already exists. Please login instead." });
      }

      if (!userData || !userData.name) {
        return res.status(400).json({ error: "User data (name) is required for signup" });
      }

      // Create new user
      const userId = await createOrUpdateUser({
        email: type === "email" ? identifier : undefined,
        phone: type === "phone" ? identifier : undefined,
        name: userData.name,
        company: userData.company,
        role: userData.role,
      });

      // Store Firebase UID if provided (for phone auth)
      if (firebaseUid) {
        const db = (await import("@/lib/firebase")).getFirestore();
        if (db) {
          await db.collection("users").doc(userId).update({
            firebaseUid,
          });
        }
      }

      // Create session
      const sessionToken = generateSessionToken(userId);
      await createSession(userId, sessionToken);

      return res.status(200).json({
        ok: true,
        token: sessionToken,
        userId,
        message: "Account created successfully",
      });
    } else {
      // Login flow
      if (!existingUser) {
        return res.status(404).json({ error: "User not found. Please sign up first." });
      }

      // Store Firebase UID if provided (for phone auth)
      if (firebaseUid) {
        const db = (await import("@/lib/firebase")).getFirestore();
        if (db) {
          await db.collection("users").doc(existingUser.id).update({
            firebaseUid,
          });
        }
      }

      // Create session
      const sessionToken = generateSessionToken(existingUser.id);
      await createSession(existingUser.id, sessionToken);

      return res.status(200).json({
        ok: true,
        token: sessionToken,
        userId: existingUser.id,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          company: existingUser.company,
          role: existingUser.role,
        },
        message: "Login successful",
      });
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
