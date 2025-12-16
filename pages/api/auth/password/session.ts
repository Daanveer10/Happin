import type { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";
import { getFirestore } from "@/lib/firebase";
import {
  createOrUpdateUser,
  createSession,
  generateSessionToken,
  getUserByIdentifier,
} from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, userData } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  const db = getFirestore();
  if (!db) {
    return res.status(500).json({ error: "Firebase not initialized" });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid idToken" });
  }

  const email = decoded.email;
  if (!email) {
    return res.status(400).json({ error: "Email missing from token" });
  }

  let existingUser = await getUserByIdentifier(email);
  let userId: string;
  let isNewUser = false;

  const name =
    userData?.name ||
    decoded.name ||
    (email.includes("@") ? email.split("@")[0] : "User");

  const company = userData?.company || null;
  const role = userData?.role || "user";

  if (existingUser) {
    userId = existingUser.id;
    await db.collection("users").doc(userId).update({
      name,
      company,
      role,
      lastLoginAt: admin.firestore.Timestamp.now(),
      verified: true,
    });
  } else {
    isNewUser = true;
    userId = await createOrUpdateUser({
      email,
      name,
      company: company || undefined,
      role,
    });
  }

  const sessionToken = generateSessionToken(userId);
  await createSession(userId, sessionToken);

  return res.status(200).json({
    ok: true,
    token: sessionToken,
    userId,
    isNewUser,
    message: isNewUser ? "Account created successfully" : "Login successful",
  });
}

