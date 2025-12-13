import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function Signup() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    company: "",
    role: "",
  });
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpFromResponse, setOtpFromResponse] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA for phone auth
  useEffect(() => {
    if (type === "phone" && auth && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container-signup", {
          size: "invisible",
        });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
      }
    }
  }, [type]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userData.name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setOtpFromResponse(null);

    try {
      if (type === "phone" && auth) {
        // Use Firebase Auth for phone
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container-signup", {
            size: "invisible",
          });
        }

        const confirmationResult = await signInWithPhoneNumber(
          auth,
          identifier,
          recaptchaVerifierRef.current
        );
        
        setVerificationId(confirmationResult.verificationId);
        setStep("otp");
      } else {
        // Use API for email
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to send OTP");
        }

        // Store OTP if returned (for testing when SendGrid not configured)
        if (data.otp) {
          setOtpFromResponse(data.otp);
        }

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
      if (type === "phone" && verificationId && auth) {
        // Verify phone OTP using Firebase Auth
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        // Now sync with our backend user system
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: firebaseUser.phoneNumber || identifier,
            otp,
            type: "phone",
            isSignup: true,
            userData,
            firebaseUid: firebaseUser.uid,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify OTP");
        }

        // Store token
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.userId);
        localStorage.setItem("firebase_uid", firebaseUser.uid);

        // Redirect to inbox
        router.push("/");
      } else {
        // Verify email OTP via API
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            otp,
            type,
            isSignup: true,
            userData,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify OTP");
        }

        // Store token
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.userId);

        // Redirect to inbox
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up for Happin</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === "details" ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                value={userData.company}
                onChange={(e) => setUserData({ ...userData, company: e.target.value })}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role (Optional)
              </label>
              <input
                type="text"
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                placeholder="Manager, Developer, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sign up with
              </label>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setType("email")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    type === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  onClick={() => setType("phone")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    type === "phone"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📱 Phone
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "email" ? "Email Address *" : "Phone Number *"}
              </label>
              <input
                type={type === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={type === "email" ? "you@example.com" : "+1234567890"}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !userData.name.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                We sent a verification code to:
              </p>
              <p className="font-medium text-gray-900">{identifier}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              />
              {otpFromResponse && (
                <p className="mt-2 text-sm text-blue-600">
                  Your OTP: <strong>{otpFromResponse}</strong> (SendGrid not configured)
                </p>
              )}
            </div>
            
            {/* Hidden reCAPTCHA container for phone auth */}
            <div id="recaptcha-container-signup"></div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError("");
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Sign Up"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

