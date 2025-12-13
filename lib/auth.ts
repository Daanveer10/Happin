import { getFirestore } from "./firebase";
import admin from "firebase-admin";
import * as crypto from "crypto";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  createdAt: Date;
  lastLoginAt?: Date;
  verified: boolean;
  // Additional user details
  company?: string;
  role?: string;
  avatar?: string;
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Firestore with expiration (5 minutes)
export async function storeOTP(identifier: string, otp: string, type: "email" | "phone"): Promise<void> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiration

  await db.collection("otps").doc(identifier).set({
    otp,
    type,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    createdAt: admin.firestore.Timestamp.now(),
    verified: false,
  });
}

// Verify OTP
export async function verifyOTP(identifier: string, otp: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const doc = await db.collection("otps").doc(identifier).get();
  if (!doc.exists) return false;

  const data = doc.data();
  if (!data) return false;

  // Check if expired
  const expiresAt = data.expiresAt.toDate();
  if (expiresAt < new Date()) {
    await doc.ref.delete(); // Clean up expired OTP
    return false;
  }

  // Check if already verified
  if (data.verified) return false;

  // Verify OTP
  if (data.otp !== otp) return false;

  // Mark as verified
  await doc.ref.update({ verified: true });

  return true;
}

// Create or update user
export async function createOrUpdateUser(userData: {
  email?: string;
  phone?: string;
  name: string;
  company?: string;
  role?: string;
}): Promise<string> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const identifier = userData.email || userData.phone;
  if (!identifier) throw new Error("Email or phone required");

  // Check if user exists
  let userQuery;
  if (userData.email) {
    userQuery = await db.collection("users").where("email", "==", userData.email).limit(1).get();
  } else if (userData.phone) {
    userQuery = await db.collection("users").where("phone", "==", userData.phone).limit(1).get();
  }

  let userId: string;
  if (userQuery && !userQuery.empty) {
    // Update existing user
    const userDoc = userQuery.docs[0];
    userId = userDoc.id;
    await userDoc.ref.update({
      name: userData.name,
      company: userData.company,
      role: userData.role,
      lastLoginAt: admin.firestore.Timestamp.now(),
      verified: true,
    });
  } else {
    // Create new user
    const newUser = {
      email: userData.email,
      phone: userData.phone,
      name: userData.name,
      company: userData.company,
      role: userData.role,
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
      verified: true,
    };
    const docRef = await db.collection("users").add(newUser);
    userId = docRef.id;
  }

  return userId;
}

// Get user by ID
export async function getUser(userId: string): Promise<User | null> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    email: data.email,
    phone: data.phone,
    name: data.name,
    company: data.company,
    role: data.role,
    avatar: data.avatar,
    createdAt: data.createdAt.toDate(),
    lastLoginAt: data.lastLoginAt?.toDate(),
    verified: data.verified || false,
  };
}

// Get user by email or phone
export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  // Try email first
  let query = await db.collection("users").where("email", "==", identifier).limit(1).get();
  if (!query.empty) {
    const doc = query.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate(),
    } as User;
  }

  // Try phone
  query = await db.collection("users").where("phone", "==", identifier).limit(1).get();
  if (!query.empty) {
    const doc = query.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate(),
    } as User;
  }

  return null;
}

// Generate session token
export function generateSessionToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  return `${userId}:${token}`;
}

// Store session
export async function createSession(userId: string, token: string): Promise<void> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiration

  await db.collection("sessions").doc(token).set({
    userId,
    createdAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });
}

// Verify session
export async function verifySession(token: string): Promise<string | null> {
  const db = getFirestore();
  if (!db) throw new Error("Firestore not initialized");

  const doc = await db.collection("sessions").doc(token).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  // Check if expired
  const expiresAt = data.expiresAt.toDate();
  if (expiresAt < new Date()) {
    await doc.ref.delete(); // Clean up expired session
    return null;
  }

  return data.userId;
}
