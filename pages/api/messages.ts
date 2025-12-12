import type { NextApiRequest, NextApiResponse } from "next";
import { getMessages, markAsRead, updateMessagePriority } from "@/lib/messageStore";
import type { Channel } from "@/lib/messageStore";

/**
 * GET /api/messages - Fetch messages
 * Query params:
 *   - channel?: Channel type filter
 *   - unreadOnly?: boolean
 *   - limit?: number (default: 50)
 *   - startAfter?: message ID for pagination
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const channel = req.query.channel as Channel | undefined;
      const unreadOnly = req.query.unreadOnly === "true";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const startAfter = req.query.startAfter as string | undefined;

      const messages = await getMessages({
        channel,
        unreadOnly,
        limit,
        startAfter,
      });

      // Convert Firestore Timestamps to ISO strings for JSON serialization
      const serializedMessages = messages.map((msg: any) => {
        const serialized: any = { ...msg };
        if (msg.receivedAt?.toDate) serialized.receivedAt = msg.receivedAt.toDate().toISOString();
        if (msg.sentAt?.toDate) serialized.sentAt = msg.sentAt.toDate().toISOString();
        if (msg.createdAt?.toDate) serialized.createdAt = msg.createdAt.toDate().toISOString();
        if (msg.updatedAt?.toDate) serialized.updatedAt = msg.updatedAt.toDate().toISOString();
        if (msg.aiProcessedAt?.toDate) serialized.aiProcessedAt = msg.aiProcessedAt.toDate().toISOString();
        return serialized;
      });

      return res.status(200).json({ messages: serializedMessages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { messageId, action, ...data } = req.body;

      if (!messageId || !action) {
        return res.status(400).json({ error: "Missing messageId or action" });
      }

      switch (action) {
        case "markRead":
          await markAsRead(messageId);
          return res.status(200).json({ ok: true });

        case "updatePriority":
          if (typeof data.priority !== "number") {
            return res.status(400).json({ error: "Priority must be a number" });
          }
          await updateMessagePriority(messageId, data.priority, data.reason);
          return res.status(200).json({ ok: true });

        default:
          return res.status(400).json({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error updating message:", error);
      return res.status(500).json({ error: "Failed to update message" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

