import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function Login() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpFromResponse, setOtpFromResponse] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // ✅ Initialize reCAPTCHA ONCE (client-side)
  useEffect(() => {
    if (type === "phone" && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  }, [type]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setOtpFromResponse(null);

    try {
      if (type === "phone") {
        if (!identifier.startsWith("+")) {
          throw new Error("Phone number must include country code (E.164 format)");
        }

        const confirmationResult = await signInWithPhoneNumber(
          auth,
          identifier,
          recaptchaVerifierRef.current!
        );

        setVerificationId(confirmationResult.verificationId);
        setStep("otp");

        // Reset reCAPTCHA after use
        recaptchaVerifierRef.current?.clear();
        recaptchaVerifierRef.current = null;
      } else {
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");

        if (data.otp) setOtpFromResponse(data.otp);
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (type === "phone" && verificationId) {
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: firebaseUser.phoneNumber,
            otp,
            type: "phone",
            isSignup: false,
            firebaseUid: firebaseUser.uid,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "OTP verification failed");

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.userId);
        localStorage.setItem("firebase_uid", firebaseUser.uid);

        router.push("/");
      } else {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp, type, isSignup: false }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "OTP verification failed");

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.userId);

        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* MUST exist before sending OTP */}
      <div id="recaptcha-container"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Happin</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {step === "input" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setType("email")}>📧 Email</button>
              <button type="button" onClick={() => setType("phone")}>📱 Phone</button>
            </div>

            <input
              type={type === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={type === "email" ? "you@example.com" : "+1234567890"}
              required
              className="w-full p-3 border rounded"
            />

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter OTP"
              className="w-full p-3 border rounded text-center text-xl"
            />

            <button
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
          </form>
        )}

        <p className="text-center mt-4 text-sm">
          Don’t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
