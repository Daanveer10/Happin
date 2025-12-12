import type { NextApiRequest, NextApiResponse } from "next";
import { saveMessage } from "@/lib/messageStore";
import { processMessageWithAI } from "@/lib/ai";
import type { Channel } from "@/lib/messageStore";

/**
 * Email Webhook Handler
 * Handles incoming emails via SendGrid, Mailgun, or similar services
 * 
 * SendGrid Webhook URL: https://your-domain.vercel.app/api/webhooks/email
 * Configure in SendGrid: Settings > Inbound Parse
 * 
 * Mailgun Webhook URL: https://your-domain.vercel.app/api/webhooks/email
 * Configure in Mailgun: Receiving > Routes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // SendGrid format
    if (req.body.headers) {
      const headers = req.body.headers;
      const from = headers.from || req.body.from;
      const to = headers.to || req.body.to;
      const subject = headers.subject || req.body.subject;
      const text = req.body.text || req.body["body-plain"] || "";
      const html = req.body.html || req.body["body-html"] || "";
      const messageId = headers["message-id"] || req.body["Message-Id"];

      // Parse email addresses
      const parseEmail = (emailStr: string) => {
        const match = emailStr.match(/(.+?)\s*<(.+?)>/) || [null, emailStr, emailStr];
        return {
          name: match[1]?.trim() || match[2]?.split("@")[0] || "Unknown",
          email: match[2]?.trim() || match[1]?.trim() || "",
        };
      };

      const fromParsed = parseEmail(from);
      const toParsed = Array.isArray(to) ? to.map(parseEmail) : [parseEmail(to)];

      // Extract attachments (SendGrid/Mailgun format)
      const attachments = [];
      if (req.body.attachments) {
        const atts = typeof req.body.attachments === "string" 
          ? JSON.parse(req.body.attachments) 
          : req.body.attachments;
        
        Object.keys(atts).forEach((key) => {
          attachments.push({
            name: key,
            url: atts[key],
            type: "unknown",
          });
        });
      }

      // Parse date
      const dateHeader = headers.date || req.body.Date || new Date().toISOString();
      const sentAt = new Date(dateHeader);

      const savedMessageId = await saveMessage({
        channel: "email",
        channelId: messageId || `email-${Date.now()}`,
        threadId: headers["in-reply-to"] || headers["references"],
        from: {
          name: fromParsed.name,
          email: fromParsed.email,
        },
        to: toParsed,
        subject,
        body: text || html.replace(/<[^>]*>/g, "").substring(0, 500), // Strip HTML if no text
        htmlBody: html || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        receivedAt: new Date(),
        sentAt,
        read: false,
        archived: false,
        channelData: {
          emailMessageId: messageId,
          emailHeaders: headers,
          emailThreadId: headers["in-reply-to"] || headers["references"],
        },
        aiProcessed: false,
      });

      // Process with AI
      const savedMessage = {
        channel: "email" as Channel,
        channelId: messageId || `email-${Date.now()}`,
        threadId: headers["in-reply-to"] || headers["references"],
        from: { name: fromParsed.name, email: fromParsed.email },
        to: toParsed,
        subject,
        body: text || html.replace(/<[^>]*>/g, "").substring(0, 500),
        htmlBody: html || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        receivedAt: new Date(),
        sentAt,
        read: false,
        archived: false,
        channelData: {
          emailMessageId: messageId,
          emailHeaders: headers,
          emailThreadId: headers["in-reply-to"] || headers["references"],
        },
        aiProcessed: false,
      };

      processMessageWithAI(savedMessageId, savedMessage as any).catch((err) =>
        console.error("AI processing failed:", err)
      );

      return res.status(200).json({ ok: true, messageId: savedMessageId });
    }

    // Mailgun format (alternative)
    if (req.body["sender"] || req.body["recipient"]) {
      const from = req.body.sender || req.body.from;
      const to = req.body.recipient || req.body.to;
      const subject = req.body.subject || "";
      const text = req.body["body-plain"] || req.body.text || "";
      const html = req.body["body-html"] || req.body.html || "";

      const parseEmail = (emailStr: string) => {
        const match = emailStr.match(/(.+?)\s*<(.+?)>/) || [null, emailStr, emailStr];
        return {
          name: match[1]?.trim() || match[2]?.split("@")[0] || "Unknown",
          email: match[2]?.trim() || match[1]?.trim() || "",
        };
      };

      const fromParsed = parseEmail(from);
      const toParsed = Array.isArray(to) ? to.map(parseEmail) : [parseEmail(to)];

      const savedMessageId = await saveMessage({
        channel: "email",
        channelId: req.body["Message-Id"] || `email-${Date.now()}`,
        from: {
          name: fromParsed.name,
          email: fromParsed.email,
        },
        to: toParsed,
        subject,
        body: text || html.replace(/<[^>]*>/g, "").substring(0, 500),
        htmlBody: html || undefined,
        receivedAt: new Date(),
        read: false,
        archived: false,
        channelData: {
          emailMessageId: req.body["Message-Id"],
        },
        aiProcessed: false,
      });

      const savedMessage = {
        channel: "email" as Channel,
        channelId: req.body["Message-Id"] || `email-${Date.now()}`,
        from: { name: fromParsed.name, email: fromParsed.email },
        to: toParsed,
        subject,
        body: text || html.replace(/<[^>]*>/g, "").substring(0, 500),
        htmlBody: html || undefined,
        receivedAt: new Date(),
        read: false,
        archived: false,
        channelData: {
          emailMessageId: req.body["Message-Id"],
        },
        aiProcessed: false,
      };

      processMessageWithAI(savedMessageId, savedMessage as any).catch((err) =>
        console.error("AI processing failed:", err)
      );

      return res.status(200).json({ ok: true, messageId: savedMessageId });
    }

    return res.status(400).json({ error: "Unsupported email format" });
  } catch (error) {
    console.error("Email webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

