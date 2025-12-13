import type { NextApiRequest, NextApiResponse } from "next";
import { verifySession, getUser } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Get current user from session token
 * Header: Authorization: Bearer <token>
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const userId = await verifySession(token);

    if (!userId) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

