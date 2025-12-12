import type { NextApiRequest, NextApiResponse } from "next";
import { saveMessage } from "@/lib/messageStore";
import { processMessageWithAI } from "@/lib/ai";
import type { Channel } from "@/lib/messageStore";

/**
 * Slack Webhook Handler
 * Handles Slack events via Event Subscriptions
 * 
 * Webhook URL: https://your-domain.vercel.app/api/webhooks/slack
 * Configure in Slack App Settings: Event Subscriptions > Request URL
 * 
 * Required Events:
 * - message.channels (messages in public channels)
 * - message.groups (messages in private channels)
 * - message.im (direct messages)
 * - message.mpim (group direct messages)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, challenge, event, team_id } = req.body;

    // URL verification challenge (required by Slack)
    if (type === "url_verification") {
      return res.status(200).json({ challenge });
    }

    // Handle event callbacks
    if (type === "event_callback" && event) {
      // Only process message events
      if (event.type !== "message" || event.subtype) {
        // Skip bot messages, edits, deletes, etc. (can be customized)
        if (event.subtype && !["thread_broadcast"].includes(event.subtype)) {
          return res.status(200).json({ ok: true, skipped: "subtype" });
        }
      }

      const {
        text,
        user,
        channel,
        ts,
        thread_ts,
        files,
        blocks,
      } = event;

      if (!text && !files && !blocks) {
        return res.status(200).json({ ok: true, skipped: "no content" });
      }

      // Get user info (in production, you'd cache this or fetch from Slack API)
      const userName = user || "unknown";
      const channelName = channel || "unknown";

      // Extract text from blocks if available (Slack's rich formatting)
      let messageBody = text || "";
      if (blocks && !text) {
        // Simple extraction from blocks (can be enhanced)
        messageBody = blocks
          .map((block: any) => {
            if (block.type === "section" && block.text?.text) {
              return block.text.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");
      }

      // Extract attachments
      const attachments = [];
      if (files && Array.isArray(files)) {
        files.forEach((file: any) => {
          attachments.push({
            name: file.name || "attachment",
            url: file.url_private || file.permalink || "",
            type: file.mimetype || "unknown",
            size: file.size,
          });
        });
      }

      const messageId = await saveMessage({
        channel: "slack",
        channelId: ts,
        threadId: thread_ts,
        from: {
          name: userName,
          userId: user,
        },
        body: messageBody,
        attachments: attachments.length > 0 ? attachments : undefined,
        receivedAt: new Date(parseFloat(ts) * 1000), // Slack ts is Unix timestamp
        read: false,
        archived: false,
        channelData: {
          slackChannel: channelName,
          slackTeam: team_id,
          slackThreadTs: thread_ts,
          slackBlocks: blocks,
        },
        aiProcessed: false,
      });

      // Process with AI asynchronously
      const savedMessage = {
        channel: "slack" as Channel,
        channelId: ts,
        threadId: thread_ts,
        from: { name: userName, userId: user },
        body: messageBody,
        attachments: attachments.length > 0 ? attachments : undefined,
        receivedAt: new Date(parseFloat(ts) * 1000),
        read: false,
        archived: false,
        channelData: {
          slackChannel: channelName,
          slackTeam: team_id,
          slackThreadTs: thread_ts,
          slackBlocks: blocks,
        },
        aiProcessed: false,
      };

      processMessageWithAI(messageId, savedMessage as any).catch((err) =>
        console.error("AI processing failed:", err)
      );

      return res.status(200).json({ ok: true, messageId });
    }

    // Unknown event type
    return res.status(200).json({ ok: true, note: "Event type not processed" });
  } catch (error) {
    console.error("Slack webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
