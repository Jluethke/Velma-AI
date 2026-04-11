/**
 * POST /api/fabric/:sessionId/guest
 * ===================================
 * Guest submits their side of the session.
 * Authenticated by guestToken — each guest slot has a unique token.
 *
 * Body: { guestToken: string, data: Record<string, unknown>, sharedFields?: string[] }
 */

import type { IncomingMessage, ServerResponse } from "http";
import { getSession, saveSession, publicView } from "../_store.js";

export default async function handler(
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

  const session = await getSession(sessionId);
  if (!session) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found or expired" }));
    return;
  }

  const body = (req.body ?? {}) as {
    guestToken?: string;
    data?: Record<string, unknown>;
    sharedFields?: string[];
  };

  if (!body.guestToken || typeof body.guestToken !== "string") {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "guestToken is required" }));
    return;
  }

  const slotIndex = session.guestTokens.indexOf(body.guestToken);
  if (slotIndex === -1) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid guest token" }));
    return;
  }

  if (session.guests[slotIndex]?.submitted) {
    res.writeHead(409, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Guest has already submitted" }));
    return;
  }

  if (!body.data || typeof body.data !== "object") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "data object is required" }));
    return;
  }

  session.guests[slotIndex] = {
    submitted: true,
    data: body.data,
    sharedFields: body.sharedFields ?? [],
  };

  const bothReady =
    session.host.submitted &&
    session.guests.filter(g => g?.submitted).length === session.maxGuests;

  if (bothReady) {
    session.synthesis.status = "ready";
  }

  await saveSession(session);

  // Return public metadata + only this guest's own submitted data.
  // The host's raw data and other guests' data are intentionally omitted.
  const view = {
    ...publicView(session),
    myData: body.data,
    slotIndex,
    readyForSynthesis: bothReady,
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(view));
}
