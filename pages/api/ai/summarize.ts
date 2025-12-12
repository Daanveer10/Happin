import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "@/lib/firebase";
import { generateSummary, analyzePriority } from "@/lib/ai";
import type { Message } from "@/lib/messageStore";

/**
 * POST /api/ai/summarize
 * Summarize a message or conversation
 * Body: { messageId?: string, text?: string, channel?: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messageId, text, channel } = req.body;

    if (messageId) {
      // Summarize existing message from Firestore
      const db = getFirestore();
      if (!db) {
        return res.status(500).json({ error: "Firestore not initialized" });
      }

      const doc = await db.collection("messages").doc(messageId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Message not found" });
      }

      const message = { id: doc.id, ...doc.data() } as Message;
      const summary = await generateSummary(message);
      const priority = await analyzePriority(message);

      return res.status(200).json({
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        priority: priority.priority,
        priorityReason: priority.reason,
        category: priority.category,
        tags: priority.tags,
        sentiment: priority.sentiment,
      });
    } else if (text) {
      // Summarize provided text
      const message: Message = {
        channel: (channel as any) || "generic",
        channelId: "temp",
        from: { name: "User" },
        body: text,
        receivedAt: new Date(),
        read: false,
        archived: false,
        channelData: {},
        aiProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const summary = await generateSummary(message);
      const priority = await analyzePriority(message);

      return res.status(200).json({
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        priority: priority.priority,
        priorityReason: priority.reason,
        category: priority.category,
        tags: priority.tags,
        sentiment: priority.sentiment,
      });
    } else {
      return res.status(400).json({ error: "Either messageId or text is required" });
    }
  } catch (error) {
    console.error("Error summarizing:", error);
    return res.status(500).json({ error: "Failed to summarize" });
  }
}
