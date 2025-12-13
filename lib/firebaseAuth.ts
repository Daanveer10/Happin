import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, User } from "firebase/auth";
import { auth } from "./firebaseClient";

// Initialize reCAPTCHA verifier for phone auth
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier(): RecaptchaVerifier {
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });

  return recaptchaVerifier;
}

// Send phone OTP using Firebase Auth
export async function sendPhoneOTP(phoneNumber: string): Promise<string> {
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }

  const verifier = getRecaptchaVerifier();
  
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    // Return the verification ID (we'll need this to verify the code)
    return confirmationResult.verificationId;
  } catch (error: any) {
    console.error("Firebase phone auth error:", error);
    throw new Error(error.message || "Failed to send phone OTP");
  }
}

// Verify phone OTP using Firebase Auth
export async function verifyPhoneOTP(verificationId: string, code: string): Promise<User> {
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }

  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase phone verification error:", error);
    throw new Error(error.message || "Invalid verification code");
  }
}

// Get current Firebase Auth user
export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

// Sign out
export async function signOut(): Promise<void> {
  if (!auth) return;
  await auth.signOut();
}

