/**
 * POST /api/fabric/:sessionId/host
 * =================================
 * Host submits their side of the session.
 * Authenticated by hostToken (in body or Authorization header).
 *
 * Body: { hostToken: string, data: Record<string, unknown>, sharedFields?: string[] }
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getSession, saveSession, publicView } from "../_store.js";

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

  const sessionId = req.query?.sessionId;
  if (!sessionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "sessionId is required" }));
    return;
  }

  const session = await getSession(sessionId);
  if (!session) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found or expired" }));
    return;
  }

  const body = (req.body ?? {}) as {
    hostToken?: string;
    data?: Record<string, unknown>;
    sharedFields?: string[];
  };

  const authHeader = (req.headers?.authorization ?? "") as string;
  const providedToken =
    body.hostToken ??
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined);

  if (!providedToken || providedToken !== session.hostToken) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid hostToken" }));
    return;
  }

  if (!body.data || typeof body.data !== "object") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "data object is required" }));
    return;
  }

  session.host.data = body.data;
  session.host.sharedFields = body.sharedFields ?? [];
  session.host.submitted = true;

  if (session.guest.submitted) {
    session.synthesis.status = "ready";
  }

  await saveSession(session);

  const view = { ...publicView(session), readyForSynthesis: session.host.submitted && session.guest.submitted };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(view));
}
