import admin from "firebase-admin";
import { getFirestore } from "./firebase";
import type { Message } from "./messageStore";

interface AIPriorityResult {
  priority: number; // 1-5 (1 = urgent, 5 = low)
  reason: string;
  category: string;
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
}

interface AISummaryResult {
  summary: string;
  keyPoints: string[];
}

/**
 * Analyze message priority using AI
 * This uses OpenAI API (or similar) to determine message priority
 */
export async function analyzePriority(message: Message): Promise<AIPriorityResult> {
  // For now, return a simple heuristic-based priority
  // TODO: Integrate with OpenAI API or similar
  
  const body = message.body.toLowerCase();
  const subject = message.subject?.toLowerCase() || "";
  const text = `${subject} ${body}`;
  
  let priority = 3; // Default: medium
  let reason = "Standard priority";
  let category = "info";
  const tags: string[] = [];
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  
  // Urgent keywords
  if (/\b(urgent|asap|immediately|emergency|critical|important|deadline)\b/i.test(text)) {
    priority = 1;
    reason = "Contains urgent keywords";
    category = "urgent";
    tags.push("urgent");
  }
  
  // Question detection
  if (/\?/.test(message.body) || /\b(question|help|support|issue|problem)\b/i.test(text)) {
    priority = Math.min(priority, 2);
    category = "question";
    tags.push("question");
  }
  
  // Task detection
  if (/\b(task|todo|action|required|need|please)\b/i.test(text)) {
    priority = Math.min(priority, 2);
    category = "task";
    tags.push("task");
  }
  
  // Spam detection
  if (/\b(spam|unsubscribe|opt-out|click here|limited time)\b/i.test(text)) {
    priority = 5;
    category = "spam";
    tags.push("spam");
  }
  
  // Sentiment analysis (simple)
  const positiveWords = /\b(great|thanks|thank you|excellent|awesome|good|happy|pleased)\b/i;
  const negativeWords = /\b(bad|terrible|angry|frustrated|disappointed|problem|issue|error)\b/i;
  
  if (positiveWords.test(text)) {
    sentiment = "positive";
  } else if (negativeWords.test(text)) {
    sentiment = "negative";
    priority = Math.min(priority, 2); // Negative messages often need attention
  }
  
  // Channel-based priority adjustments
  if (message.channel === "whatsapp" || message.channel === "sms") {
    priority = Math.min(priority, 2); // Personal messages are often higher priority
  }
  
  return {
    priority,
    reason,
    category,
    tags,
    sentiment,
  };
}

/**
 * Generate AI summary of a message
 */
export async function generateSummary(message: Message): Promise<AISummaryResult> {
  // TODO: Integrate with OpenAI API for better summaries
  // For now, return a simple extract
  
  const text = message.body;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Simple summary: first sentence or first 150 chars
  const summary = sentences[0]?.trim() || text.substring(0, 150) + "...";
  
  // Extract key points (simple: sentences with question marks or action words)
  const keyPoints = sentences
    .filter(s => /\?/.test(s) || /\b(must|should|need|required|action|task)\b/i.test(s))
    .slice(0, 3)
    .map(s => s.trim());
  
  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [summary],
  };
}

/**
 * Process message with AI: analyze priority and generate summary
 */
export async function processMessageWithAI(messageId: string, message: Message): Promise<void> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  
  try {
    // Analyze priority
    const priorityResult = await analyzePriority(message);
    
    // Generate summary
    const summaryResult = await generateSummary(message);
    
    // Update message in Firestore
    await db.collection("messages").doc(messageId).update({
      priority: priorityResult.priority,
      priorityReason: priorityResult.reason,
      category: priorityResult.category,
      tags: priorityResult.tags,
      sentiment: priorityResult.sentiment,
      summary: summaryResult.summary,
      aiProcessed: true,
      aiProcessedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error(`Failed to process message ${messageId} with AI:`, error);
    // Don't throw - allow message to be saved without AI processing
  }
}

