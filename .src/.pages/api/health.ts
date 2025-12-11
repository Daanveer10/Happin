
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    service: "happin",
    env: process.env.NODE_ENV || "development",
    firestoreConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT
  });
}

