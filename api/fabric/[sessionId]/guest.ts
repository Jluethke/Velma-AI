/**
 * POST /api/fabric/:sessionId/guest
 * ===================================
 * Guest submits their side of the session.
 * No auth required — the sessionId itself is the secret.
 *
 * Body: { data: Record<string, unknown>, sharedFields?: string[] }
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getSession, saveSession, publicView } from "../_store.js";

export default function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

  const sessionId = req.query?.sessionId;
  if (!sessionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "sessionId is required" }));
    return;
  }

  const session = getSession(sessionId);
  if (!session) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found or expired" }));
    return;
  }

  if (session.guest.submitted) {
    res.writeHead(409, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Guest has already submitted" }));
    return;
  }

  const body = (req.body ?? {}) as {
    data?: Record<string, unknown>;
    sharedFields?: string[];
  };

  if (!body.data || typeof body.data !== "object") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "data object is required" }));
    return;
  }

  session.guest.data = body.data;
  session.guest.sharedFields = body.sharedFields ?? [];
  session.guest.submitted = true;

  if (session.host.submitted) {
    session.synthesis.status = "ready";
  }

  saveSession(session);

  const view = { ...publicView(session), readyForSynthesis: session.host.submitted && session.guest.submitted };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(view));
}
