import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore, getInitError } from "@/lib/firebase";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const firestoreConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const firestore = getFirestore();
  const initError = getInitError();
  
  res.status(200).json({
    ok: true,
    service: "happin",
    env: process.env.NODE_ENV || "development",
    firestoreConfigured,
    firestoreInitialized: !!firestore,
    error: initError || null,
    envVarLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
    message: firestoreConfigured 
      ? (firestore 
          ? "Firestore is ready" 
          : `Firestore env var set but initialization failed: ${initError || "Unknown error"}`)
      : "FIREBASE_SERVICE_ACCOUNT not set in environment variables"
  });
}

