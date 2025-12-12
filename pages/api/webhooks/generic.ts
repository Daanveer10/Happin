import type { NextApiRequest, NextApiResponse } from "next";
import { saveMessage } from "@/lib/messageStore";
import { processMessageWithAI } from "@/lib/ai";
import type { Channel } from "@/lib/messageStore";

/**
 * Generic Webhook Handler
 * Handles any webhook that doesn't have a specific handler
 * Useful for testing or custom integrations
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body || {};
  console.log("[generic webhook] payload:", JSON.stringify(payload));

  try {
    // Extract common fields from payload
    const from = payload.from || payload.sender || { name: "Unknown", email: payload.email };
    const body = payload.body || payload.text || payload.message || JSON.stringify(payload);
    const subject = payload.subject || payload.title;
    const channel = (payload.channel as Channel) || "generic";

    const messageId = await saveMessage({
      channel,
      channelId: payload.id || `generic-${Date.now()}`,
      from: typeof from === "string" ? { name: from } : from,
      to: payload.to ? (Array.isArray(payload.to) ? payload.to : [payload.to]) : undefined,
      subject,
      body,
      receivedAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      sentAt: payload.sentAt ? new Date(payload.sentAt) : undefined,
      read: false,
      archived: false,
      channelData: payload,
      aiProcessed: false,
    });

    // Process with AI
    const savedMessage = {
      channel,
      channelId: payload.id || `generic-${Date.now()}`,
      from: typeof from === "string" ? { name: from } : from,
      to: payload.to ? (Array.isArray(payload.to) ? payload.to : [payload.to]) : undefined,
      subject,
      body,
      receivedAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      sentAt: payload.sentAt ? new Date(payload.sentAt) : undefined,
      read: false,
      archived: false,
      channelData: payload,
      aiProcessed: false,
    };

    processMessageWithAI(messageId, savedMessage as any).catch((err) =>
      console.error("AI processing failed:", err)
    );

    return res.status(200).json({ ok: true, id: messageId });
  } catch (err) {
    console.error("Error writing to Firestore:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

