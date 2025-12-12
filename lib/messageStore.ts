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
  channelData: Record<string, any>;
  aiProcessed: boolean;
  aiProcessedAt?: Timestamp | Date | string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
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
    receivedAt: db.Timestamp.fromDate(new Date(messageData.receivedAt)),
    createdAt: db.Timestamp.fromDate(new Date(messageData.createdAt)),
    updatedAt: db.Timestamp.fromDate(new Date(messageData.updatedAt)),
  };

  if (messageData.sentAt) {
    firestoreMessage.sentAt = db.Timestamp.fromDate(new Date(messageData.sentAt));
  }
  if (messageData.aiProcessedAt) {
    firestoreMessage.aiProcessedAt = db.Timestamp.fromDate(new Date(messageData.aiProcessedAt));
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
    updatedAt: db.Timestamp.now(),
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
    updatedAt: db.Timestamp.now(),
  });
}

