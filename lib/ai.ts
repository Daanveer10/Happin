import admin from "firebase-admin";
import Groq from "groq-sdk";
import { getFirestore } from "./firebase";
import type { Message } from "./messageStore";

interface AIPriorityResult {
  priority: number; // 1-5 (1 = urgent, 5 = low)
  reason: string;
  category: string;
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  intent?: string; // "question" | "request" | "complaint" | "info" | "spam"
  actionRequired?: boolean;
}

interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
}

// Initialize Groq client (falls back to null if API key not set)
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groqClient) return groqClient;
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("Groq API key not set, using heuristic-based AI");
    return null;
  }
  
  try {
    groqClient = new Groq({ apiKey });
    return groqClient;
  } catch (error) {
    console.error("Failed to initialize Groq client:", error);
    return null;
  }
}

/**
 * Analyze message priority using AI (Groq if available, otherwise heuristics)
 */
export async function analyzePriority(message: Message): Promise<AIPriorityResult> {
  const client = getGroqClient();
  
  if (client) {
    return await analyzePriorityWithGroq(client, message);
  } else {
    return await analyzePriorityWithHeuristics(message);
  }
}

/**
 * Analyze priority using Groq
 */
async function analyzePriorityWithGroq(client: Groq, message: Message): Promise<AIPriorityResult> {
  const text = `${message.subject ? `Subject: ${message.subject}\n\n` : ""}${message.body}`;
  const channel = message.channel;
  
  const prompt = `Analyze this business message and determine its priority, category, sentiment, and intent.

Message:
${text}

Channel: ${channel}

Respond with a JSON object containing:
- priority: number 1-5 (1=urgent/critical, 2=high, 3=medium, 4=low, 5=very low/spam)
- reason: brief explanation for the priority
- category: one of "urgent", "question", "task", "info", "spam", "complaint", "request"
- tags: array of relevant tags (e.g., ["urgent", "deadline", "customer"])
- sentiment: "positive", "neutral", or "negative"
- intent: "question", "request", "complaint", "info", "spam", or "other"
- actionRequired: boolean indicating if action is needed

Consider:
- Urgency indicators (deadlines, ASAP, emergency)
- Whether it's a question requiring a response
- If it's a task or request
- Sentiment (positive/negative can affect priority)
- Channel context (WhatsApp/SMS often more urgent than email)
- Spam indicators

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that analyzes business messages for priority and categorization. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const result = JSON.parse(content);
    
    return {
      priority: Math.max(1, Math.min(5, result.priority || 3)),
      reason: result.reason || "AI-analyzed priority",
      category: result.category || "info",
      tags: Array.isArray(result.tags) ? result.tags : [],
      sentiment: result.sentiment || "neutral",
      intent: result.intent,
      actionRequired: result.actionRequired ?? true,
    };
  } catch (error) {
    console.error("Groq priority analysis failed, falling back to heuristics:", error);
    return await analyzePriorityWithHeuristics(message);
  }
}

/**
 * Analyze priority using heuristics (fallback when OpenAI not available)
 */
async function analyzePriorityWithHeuristics(message: Message): Promise<AIPriorityResult> {
  const body = message.body.toLowerCase();
  const subject = message.subject?.toLowerCase() || "";
  const text = `${subject} ${body}`;
  
  let priority = 3; // Default: medium
  let reason = "Standard priority";
  let category = "info";
  const tags: string[] = [];
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let intent: string = "info";
  let actionRequired = false;
  
  // Urgent keywords
  if (/\b(urgent|asap|immediately|emergency|critical|important|deadline|today|now)\b/i.test(text)) {
    priority = 1;
    reason = "Contains urgent keywords";
    category = "urgent";
    tags.push("urgent");
    actionRequired = true;
  }
  
  // Question detection
  if (/\?/.test(message.body) || /\b(question|help|support|issue|problem|how|what|when|where|why)\b/i.test(text)) {
    priority = Math.min(priority, 2);
    category = "question";
    intent = "question";
    tags.push("question");
    actionRequired = true;
  }
  
  // Task/Request detection
  if (/\b(task|todo|action|required|need|please|can you|could you|would you)\b/i.test(text)) {
    priority = Math.min(priority, 2);
    category = "task";
    intent = "request";
    tags.push("task");
    actionRequired = true;
  }
  
  // Complaint detection
  if (/\b(complaint|unhappy|dissatisfied|wrong|error|mistake|problem|issue|bad service)\b/i.test(text)) {
    priority = Math.min(priority, 2);
    category = "complaint";
    intent = "complaint";
    tags.push("complaint");
    actionRequired = true;
  }
  
  // Spam detection
  if (/\b(spam|unsubscribe|opt-out|click here|limited time|act now|buy now|free money)\b/i.test(text)) {
    priority = 5;
    category = "spam";
    intent = "spam";
    tags.push("spam");
    actionRequired = false;
  }
  
  // Sentiment analysis
  const positiveWords = /\b(great|thanks|thank you|excellent|awesome|good|happy|pleased|appreciate|love)\b/i;
  const negativeWords = /\b(bad|terrible|angry|frustrated|disappointed|problem|issue|error|hate|worst)\b/i;
  
  if (positiveWords.test(text)) {
    sentiment = "positive";
    tags.push("positive");
  } else if (negativeWords.test(text)) {
    sentiment = "negative";
    priority = Math.min(priority, 2);
    tags.push("negative");
  }
  
  // Channel-based priority adjustments
  if (message.channel === "whatsapp" || message.channel === "sms") {
    priority = Math.min(priority, 2);
    tags.push("personal");
  }
  
  // Email with multiple recipients might be lower priority
  if (message.channel === "email" && message.to && message.to.length > 3) {
    priority = Math.min(priority, 4);
  }
  
  return {
    priority,
    reason,
    category,
    tags,
    sentiment,
    intent,
    actionRequired,
  };
}

/**
 * Generate AI summary of a message
 */
export async function generateSummary(message: Message): Promise<AISummaryResult> {
  const client = getGroqClient();
  
  if (client) {
    return await generateSummaryWithGroq(client, message);
  } else {
    return await generateSummaryWithHeuristics(message);
  }
}

/**
 * Generate summary using Groq
 */
async function generateSummaryWithGroq(client: Groq, message: Message): Promise<AISummaryResult> {
  const text = `${message.subject ? `Subject: ${message.subject}\n\n` : ""}${message.body}`;
  
  const prompt = `Summarize this business message concisely and extract key information.

Message:
${text}

Respond with a JSON object containing:
- summary: a brief 1-2 sentence summary of the main point
- keyPoints: array of 2-4 key points or important details
- actionItems: array of any action items or tasks mentioned (empty array if none)

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that summarizes business messages. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const result = JSON.parse(content);
    
    return {
      summary: result.summary || message.body.substring(0, 150) + "...",
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
    };
  } catch (error) {
    console.error("Groq summary generation failed, falling back to heuristics:", error);
    return await generateSummaryWithHeuristics(message);
  }
}

/**
 * Generate summary using heuristics (fallback)
 */
async function generateSummaryWithHeuristics(message: Message): Promise<AISummaryResult> {
  const text = message.body;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Simple summary: first sentence or first 150 chars
  const summary = sentences[0]?.trim() || text.substring(0, 150) + "...";
  
  // Extract key points (sentences with question marks, action words, or important keywords)
  const keyPoints = sentences
    .filter(s => {
      const lower = s.toLowerCase();
      return (
        /\?/.test(s) ||
        /\b(must|should|need|required|action|task|important|deadline|urgent)\b/i.test(lower) ||
        lower.length > 50 // Longer sentences often contain more info
      );
    })
    .slice(0, 4)
    .map(s => s.trim());
  
  // Extract action items (sentences with action verbs)
  const actionItems = sentences
    .filter(s => {
      const lower = s.toLowerCase();
      return /\b(please|can you|could you|need to|must|should|action|task|todo)\b/i.test(lower);
    })
    .slice(0, 3)
    .map(s => s.trim().replace(/^please\s+/i, ""));
  
  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [summary],
    actionItems: actionItems.length > 0 ? actionItems : [],
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
    const updateData: any = {
      priority: priorityResult.priority,
      priorityReason: priorityResult.reason,
      category: priorityResult.category,
      tags: priorityResult.tags,
      sentiment: priorityResult.sentiment,
      summary: summaryResult.summary,
      aiProcessed: true,
      aiProcessedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    
    // Add optional fields if present
    if (priorityResult.intent) updateData.intent = priorityResult.intent;
    if (priorityResult.actionRequired !== undefined) updateData.actionRequired = priorityResult.actionRequired;
    if (summaryResult.keyPoints && summaryResult.keyPoints.length > 0) {
      updateData.keyPoints = summaryResult.keyPoints;
    }
    if (summaryResult.actionItems && summaryResult.actionItems.length > 0) {
      updateData.actionItems = summaryResult.actionItems;
    }
    
    await db.collection("messages").doc(messageId).update(updateData);
  } catch (error) {
    console.error(`Failed to process message ${messageId} with AI:`, error);
    // Don't throw - allow message to be saved without AI processing
  }
}

/**
 * Batch process multiple messages with AI
 */
export async function batchProcessMessages(messageIds: string[]): Promise<void> {
  const db = getFirestore();
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (messageId) => {
        try {
          const doc = await db.collection("messages").doc(messageId).get();
          if (doc.exists) {
            const message = { id: doc.id, ...doc.data() } as Message;
            await processMessageWithAI(messageId, message);
          }
        } catch (error) {
          console.error(`Failed to process message ${messageId} in batch:`, error);
        }
      })
    );
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < messageIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
