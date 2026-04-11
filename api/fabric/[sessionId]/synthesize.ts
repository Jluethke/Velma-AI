/**
 * POST /api/fabric/:sessionId/synthesize
 * ========================================
 * Trigger or complete synthesis for a session.
 * Authenticated by hostToken.
 *
 * Body: { hostToken: string, output?: string }
 *
 * Pass `output` to write the synthesis result (Claude's combined analysis).
 * Omit `output` to just mark both sides as ready-to-synthesize (Claude will
 * call this again with output once it runs the flow).
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

  const body = (req.body ?? {}) as { hostToken?: string; output?: string };

  const authHeader = (req.headers?.authorization ?? "") as string;
  const providedToken =
    body.hostToken ??
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined);

  if (!providedToken || providedToken !== session.hostToken) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid hostToken" }));
    return;
  }

  if (!session.host.submitted || !session.guest.submitted) {
    res.writeHead(422, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Both sides must be submitted before synthesis",
      hostSubmitted: session.host.submitted,
      guestSubmitted: session.guest.submitted,
    }));
    return;
  }

  session.synthesis.status = "ready";
  if (typeof body.output === "string") {
    session.synthesis.output = body.output;
    session.synthesis.status = "complete";
  }

  await saveSession(session);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(publicView(session)));
}
