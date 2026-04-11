/**
 * GET /api/fabric/:sessionId
 * ===========================
 * Returns the public session state (hostToken stripped).
 * Safe to call from guest browser.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getSession, publicView } from "./_store.js";

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
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

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(publicView(session)));
}
