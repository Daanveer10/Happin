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

  // Convert dates to Firestore Timestamps and remove undefined values
  const firestoreMessage: any = {
    receivedAt: admin.firestore.Timestamp.fromDate(toDate(messageData.receivedAt)),
    createdAt: admin.firestore.Timestamp.fromDate(toDate(messageData.createdAt)),
    updatedAt: admin.firestore.Timestamp.fromDate(toDate(messageData.updatedAt)),
    channel: messageData.channel,
    channelId: messageData.channelId,
    from: messageData.from,
    body: messageData.body,
    read: messageData.read,
    archived: messageData.archived,
    aiProcessed: messageData.aiProcessed,
    channelData: messageData.channelData || {},
  };

  // Add optional fields only if they exist and are not undefined
  if (messageData.threadId) firestoreMessage.threadId = messageData.threadId;
  if (messageData.to && Array.isArray(messageData.to) && messageData.to.length > 0) {
    firestoreMessage.to = messageData.to;
  }
  if (messageData.subject) firestoreMessage.subject = messageData.subject;
  if (messageData.htmlBody) firestoreMessage.htmlBody = messageData.htmlBody;
  if (messageData.attachments && messageData.attachments.length > 0) {
    firestoreMessage.attachments = messageData.attachments;
  }
  if (messageData.sentAt) {
    firestoreMessage.sentAt = admin.firestore.Timestamp.fromDate(toDate(messageData.sentAt));
  }
  if (messageData.aiProcessedAt) {
    firestoreMessage.aiProcessedAt = admin.firestore.Timestamp.fromDate(toDate(messageData.aiProcessedAt));
  }
  if (messageData.priority !== undefined) firestoreMessage.priority = messageData.priority;
  if (messageData.priorityReason) firestoreMessage.priorityReason = messageData.priorityReason;
  if (messageData.summary) firestoreMessage.summary = messageData.summary;
  if (messageData.category) firestoreMessage.category = messageData.category;
  if (messageData.tags && messageData.tags.length > 0) firestoreMessage.tags = messageData.tags;
  if (messageData.sentiment) firestoreMessage.sentiment = messageData.sentiment;
  if (messageData.intent) firestoreMessage.intent = messageData.intent;
  if (messageData.actionRequired !== undefined) firestoreMessage.actionRequired = messageData.actionRequired;
  if (messageData.keyPoints && messageData.keyPoints.length > 0) firestoreMessage.keyPoints = messageData.keyPoints;
  if (messageData.actionItems && messageData.actionItems.length > 0) firestoreMessage.actionItems = messageData.actionItems;

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

