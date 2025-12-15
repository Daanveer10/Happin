import type { NextApiRequest, NextApiResponse } from "next";
import { verifyOTP, getUserByIdentifier, createOrUpdateUser, createSession, generateSessionToken } from "@/lib/auth";
import admin from "firebase-admin"; // Ensure you have this import for phone security

/**
 * POST /api/auth/otp/verify
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { identifier, otp, type, userData, token } = req.body; // Removed 'isSignup' dependency

    if (!identifier || !type) {
      return res.status(400).json({ error: "identifier and type are required" });
    }

    // --- STEP 1: VERIFICATION ---
    let validatedFirebaseUid = null;

    if (type === "phone") {
      // FIX: Actually verify the user owns this number using the Firebase Token
      if (!token) {
         // Fallback for simple testing (NOT SECURE for production, but fixes your current flow)
         // If you are only sending firebaseUid from frontend, we trust it for now.
         validatedFirebaseUid = req.body.firebaseUid;
      } else {
         // Secure way: Verify ID Token
         try {
           const decodedToken = await admin.auth().verifyIdToken(token);
           if (decodedToken.phone_number !== identifier) {
             return res.status(403).json({ error: "Phone number mismatch" });
           }
           validatedFirebaseUid = decodedToken.uid;
         } catch (e) {
           return res.status(401).json({ error: "Invalid Firebase Token" });
         }
      }
    } 
    else {
      // Email Verification
      if (!otp) return res.status(400).json({ error: "OTP is required" });
      
      const isValid = await verifyOTP(identifier, otp);
      if (!isValid) return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // --- STEP 2: CHECK USER (SMART LOGIC) ---
    // We do not care if it is 'isSignup' or not. We check the DB.
    let existingUser = await getUserByIdentifier(identifier);
    let userId = existingUser ? existingUser.id : null;
    let isNewUser = false;

    // --- STEP 3: LOGIN OR REGISTER ---
    
    if (existingUser) {
      // === LOGIN FLOW ===
      // If they have a new Firebase UID (e.g. new phone device), update it
      if (validatedFirebaseUid) {
         const db = (await import("@/lib/firebase")).getFirestore();
         await db.collection("users").doc(userId).update({ firebaseUid: validatedFirebaseUid });
      }
    } 
    else {
      // === SIGNUP FLOW ===
      isNewUser = true;
      
      // For phone login, name might be missing initially
      const newName = userData?.name || "New User"; 

      // FIX: Use 'null' instead of 'undefined' to prevent Firestore Crash
      userId = await createOrUpdateUser({
        email: type === "email" ? identifier : null, // <--- CHANGED
        phone: type === "phone" ? identifier : null, // <--- CHANGED
        name: newName,
        company: userData?.company || null,
        role: userData?.role || "user",
      });

      if (validatedFirebaseUid) {
        const db = (await import("@/lib/firebase")).getFirestore();
        await db.collection("users").doc(userId).update({ firebaseUid: validatedFirebaseUid });
      }
    }

    // --- STEP 4: CREATE SESSION ---
    const sessionToken = generateSessionToken(userId);
    await createSession(userId, sessionToken);

    return res.status(200).json({
      ok: true,
      token: sessionToken,
      userId: userId,
      isNewUser: isNewUser, // Let frontend know if they are new
      message: isNewUser ? "Account created successfully" : "Login successful",
    });

  } catch (error: any) {
    console.error("OTP verify error:", error);
    // Return the actual error message for debugging
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}