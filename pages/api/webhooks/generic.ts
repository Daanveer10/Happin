
import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "@/lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const payload = req.body || {};
  console.log("[generic webhook] payload:", JSON.stringify(payload));

  try {
    const db = getFirestore();
    if (db) {
      const doc = {
        receivedAt: new Date().toISOString(),
        channel: "generic",
        body: payload
      };
      const ref = await db.collection("messages").add(doc);
      console.log("Wrote message to Firestore id:", ref.id);
      return res.status(200).json({ ok: true, id: ref.id });
    } else {
      // Firestore not configured — still respond ok for webhook testing
      return res.status(200).json({ ok: true, note: "Firestore not configured" });
    }
  } catch (err) {
    console.error("Error writing to Firestore:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

