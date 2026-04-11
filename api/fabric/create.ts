/**
 * POST /api/fabric/create
 * ========================
 * Create a new Fabric session.
 *
 * Body: { flowSlug: string, title?: string }
 * Returns: { sessionId, guestUrl, hostToken, expiresAt }
 */

import type { IncomingMessage, ServerResponse } from "http";
import { createSession } from "./_store.js";

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = (req.body ?? {}) as { flowSlug?: string; title?: string };

  if (!body.flowSlug || typeof body.flowSlug !== "string") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "flowSlug is required" }));
    return;
  }

  const session = await createSession(body.flowSlug, body.title);

  const host = req.headers?.host ?? "flowfabric.io";
  const baseUrl = process.env.FABRIC_BASE_URL ?? `https://${host}`;
  const guestUrl = `${baseUrl}/fabric/${session.id}`;

  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    sessionId: session.id,
    guestUrl,
    hostToken: session.hostToken,
    expiresAt: session.expiresAt,
  }));
}
