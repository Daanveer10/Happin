import admin from "firebase-admin";
import { getFirestore } from "./firebase";
import type { Timestamp } from "firebase-admin/firestore";

export type Channel = "whatsapp" | "slack" | "email" | "linkedin" | "sms" | "generic";

export interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface MessageParticipant {
  name: string;
  email?: string;
  phone?: string;
  userId?: string;
  avatar?: string;
}

export interface Message {
  id?: string;
  channel: Channel;
  channelId: string;
  threadId?: string;
  from: MessageParticipant;
  to?: MessageParticipant[];
  subject?: string;
  body: string;
  htmlBody?: string;
  attachments?: MessageAttachment[];
  receivedAt: Timestamp | Date | string;
  sentAt?: Timestamp | Date | string;
  read: boolean;
  archived: boolean;
  priority?: number;
  priorityReason?: string;
  summary?: string;
  category?: string;
  tags?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  intent?: string; // "question" | "request" | "complaint" | "info" | "spam" | "other"
  actionRequired?: boolean;
  keyPoints?: string[];
  actionItems?: string[];
  channelData: Record<string, any>;
  aiProcessed: boolean;
  aiProcessedAt?: Timestamp | Date | string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

// Helper function to convert Timestamp | Date | string to Date
function toDate(value: Timestamp | Date | string): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  // It's a Timestamp - check if it has toDate method
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate();
  }
  return new Date();
}

export async function saveMessage(message: Omit<Message, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const now = new Date();
  const messageData: Omit<Message, "id"> = {
    ...message,
    read: message.read ?? false,
    archived: message.archived ?? false,
    aiProcessed: message.aiProcessed ?? false,
    receivedAt: message.receivedAt || now,
    createdAt: now,
    updatedAt: now,
  };

  // Convert dates to Firestore Timestamps
  const firestoreMessage: any = {
    ...messageData,
    receivedAt: admin.firestore.Timestamp.fromDate(toDate(messageData.receivedAt)),
    createdAt: admin.firestore.Timestamp.fromDate(toDate(messageData.createdAt)),
    updatedAt: admin.firestore.Timestamp.fromDate(toDate(messageData.updatedAt)),
  };

  if (messageData.sentAt) {
    firestoreMessage.sentAt = admin.firestore.Timestamp.fromDate(toDate(messageData.sentAt));
  }
  if (messageData.aiProcessedAt) {
    firestoreMessage.aiProcessedAt = admin.firestore.Timestamp.fromDate(toDate(messageData.aiProcessedAt));
  }

  const ref = await db.collection("messages").add(firestoreMessage);
  return ref.id;
}

export async function getMessages(options?: {
  channel?: Channel;
  unreadOnly?: boolean;
  limit?: number;
  startAfter?: string;
}): Promise<Message[]> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  let query: FirebaseFirestore.Query = db.collection("messages");

  if (options?.channel) {
    query = query.where("channel", "==", options.channel);
  }

  if (options?.unreadOnly) {
    query = query.where("read", "==", false);
  }

  query = query.orderBy("receivedAt", "desc");

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.startAfter) {
    const startDoc = await db.collection("messages").doc(options.startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Message[];
}

export async function markAsRead(messageId: string): Promise<void> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  await db.collection("messages").doc(messageId).update({
    read: true,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

export async function updateMessagePriority(
  messageId: string,
  priority: number,
  reason?: string
): Promise<void> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  await db.collection("messages").doc(messageId).update({
    priority,
    priorityReason: reason,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

