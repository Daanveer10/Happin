import type { NextApiRequest, NextApiResponse } from "next";
import { saveMessage } from "@/lib/messageStore";
import { processMessageWithAI } from "@/lib/ai";
import type { Channel } from "@/lib/messageStore";

/**
 * Twilio Webhook Handler
 * Handles WhatsApp and SMS messages via Twilio
 * 
 * Webhook URL: https://your-domain.vercel.app/api/webhooks/twilio
 * Configure in Twilio Console: Messaging > Settings > Webhooks
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      MessageSid,
      AccountSid,
      From,
      To,
      Body,
      NumMedia,
      MediaUrl0,
      MediaContentType0,
      MessageStatus,
      DateSent,
    } = req.body;

    if (!MessageSid || !From || !Body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Determine channel (WhatsApp if from whatsapp: number, otherwise SMS)
    const channel: Channel = From.startsWith("whatsapp:") ? "whatsapp" : "sms";
    const fromNumber = From.replace("whatsapp:", "").replace("+", "");
    const toNumber = To.replace("whatsapp:", "").replace("+", "");

    // Extract attachments if present
    const attachments = [];
    if (NumMedia && parseInt(NumMedia) > 0) {
      for (let i = 0; i < parseInt(NumMedia); i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const contentType = req.body[`MediaContentType${i}`];
        if (mediaUrl) {
          attachments.push({
            name: `attachment-${i}`,
            url: mediaUrl,
            type: contentType || "unknown",
          });
        }
      }
    }

    // Parse sender name (could be from WhatsApp profile or just number)
    const senderName = req.body.ProfileName || `+${fromNumber}`;

    const messageId = await saveMessage({
      channel,
      channelId: MessageSid,
      from: {
        name: senderName,
        phone: fromNumber,
      },
      to: [
        {
          name: `+${toNumber}`,
          phone: toNumber,
        },
      ],
      body: Body,
      attachments: attachments.length > 0 ? attachments : undefined,
      receivedAt: new Date(),
      sentAt: DateSent ? new Date(DateSent) : undefined,
      read: false,
      archived: false,
      channelData: {
        twilioSid: MessageSid,
        accountSid: AccountSid,
        whatsappFrom: From,
        messageStatus: MessageStatus,
      },
      aiProcessed: false,
    });

    // Process with AI asynchronously (don't wait for it)
    const savedMessage = {
      channel,
      channelId: MessageSid,
      from: { name: senderName, phone: fromNumber },
      to: [{ name: `+${toNumber}`, phone: toNumber }],
      body: Body,
      attachments: attachments.length > 0 ? attachments : undefined,
      receivedAt: new Date(),
      sentAt: DateSent ? new Date(DateSent) : undefined,
      read: false,
      archived: false,
      channelData: {
        twilioSid: MessageSid,
        accountSid: AccountSid,
        whatsappFrom: From,
        messageStatus: MessageStatus,
      },
      aiProcessed: false,
    };

    // Process AI in background (fire and forget)
    processMessageWithAI(messageId, savedMessage as any).catch((err) =>
      console.error("AI processing failed:", err)
    );

    // Return TwiML response (required by Twilio)
    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
