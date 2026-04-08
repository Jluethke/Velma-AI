/**
 * Trigger Engine — Event-Triggered Chain Execution
 * ==================================================
 * Enables cron-scheduled, webhook-triggered, and connector-driven
 * chain execution. Triggers persist at ~/.skillchain/triggers.json.
 *
 * Trigger types:
 * - cron: Fires on a cron schedule (e.g., "0 9 * * 1" for Monday 9am)
 * - webhook: Fires when a webhook endpoint receives a POST
 * - connector: Fires on connector events (bank transaction, calendar, health)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TriggerType = "cron" | "webhook" | "connector";

export interface TriggerDef {
  /** Unique trigger ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Trigger type */
  type: TriggerType;
  /** Cron expression (for cron type) or event pattern (for connector type) */
  pattern: string;
  /** Chain to execute when triggered */
  chain_name: string;
  /** Context data to pass to the chain */
  config: Record<string, unknown>;
  /** Whether the trigger is active */
  enabled: boolean;
  /** When created */
  created_at: string;
  /** Last time this trigger fired */
  last_fired_at: string | null;
  /** Total number of times fired */
  fire_count: number;
  /** Webhook secret (for webhook type) */
  webhook_secret?: string;
}

export interface TriggerEvent {
  trigger_id: string;
  chain_name: string;
  fired_at: string;
  source: TriggerType;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Trigger Engine
// ---------------------------------------------------------------------------

export class TriggerEngine {
  private triggersPath: string;
  private triggers: TriggerDef[];
  private cronTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private webhookServer: Server | null = null;
  private webhookPort: number;
  private eventLog: TriggerEvent[] = [];
  private onTriggerFire?: (event: TriggerEvent) => void;

  constructor(
    onTriggerFire?: (event: TriggerEvent) => void,
    webhookPort: number = 3180,
  ) {
    const dir = join(homedir(), ".skillchain");
    mkdirSync(dir, { recursive: true });
    this.triggersPath = join(dir, "triggers.json");
    this.triggers = this.load();
    this.onTriggerFire = onTriggerFire;
    this.webhookPort = webhookPort;

    // Start cron timers for enabled triggers
    this.startAllCrons();
  }

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a new trigger.
   */
  createTrigger(
    name: string,
    type: TriggerType,
    pattern: string,
    chainName: string,
    config: Record<string, unknown> = {},
  ): TriggerDef {
    // Validate cron pattern (basic check)
    if (type === "cron" && !this.isValidCron(pattern)) {
      throw new Error(`Invalid cron pattern: "${pattern}". Expected 5 fields: minute hour day month weekday`);
    }

    const trigger: TriggerDef = {
      id: randomUUID().slice(0, 12),
      name,
      type,
      pattern,
      chain_name: chainName,
      config,
      enabled: true,
      created_at: new Date().toISOString(),
      last_fired_at: null,
      fire_count: 0,
    };

    if (type === "webhook") {
      trigger.webhook_secret = randomUUID().slice(0, 16);
    }

    this.triggers.push(trigger);
    this.save();

    // Start cron if applicable
    if (type === "cron" && trigger.enabled) {
      this.startCron(trigger);
    }

    return trigger;
  }

  /**
   * List all triggers with optional type filter.
   */
  listTriggers(typeFilter?: TriggerType): TriggerDef[] {
    if (typeFilter) {
      return this.triggers.filter(t => t.type === typeFilter);
    }
    return [...this.triggers];
  }

  /**
   * Get a specific trigger by ID.
   */
  getTrigger(triggerId: string): TriggerDef | null {
    return this.triggers.find(t => t.id === triggerId) ?? null;
  }

  /**
   * Delete a trigger.
   */
  deleteTrigger(triggerId: string): boolean {
    const idx = this.triggers.findIndex(t => t.id === triggerId);
    if (idx < 0) return false;

    // Stop cron if running
    this.stopCron(triggerId);

    this.triggers.splice(idx, 1);
    this.save();
    return true;
  }

  /**
   * Enable or disable a trigger.
   */
  setEnabled(triggerId: string, enabled: boolean): boolean {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (!trigger) return false;

    trigger.enabled = enabled;

    if (trigger.type === "cron") {
      if (enabled) this.startCron(trigger);
      else this.stopCron(triggerId);
    }

    this.save();
    return true;
  }

  /**
   * Manually fire a trigger (for testing).
   */
  fireTrigger(triggerId: string, payload: Record<string, unknown> = {}): TriggerEvent | null {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (!trigger) return null;

    return this.handleFire(trigger, payload);
  }

  /**
   * Get recent trigger events.
   */
  getEventLog(limit: number = 20): TriggerEvent[] {
    return this.eventLog.slice(-limit);
  }

  // -----------------------------------------------------------------------
  // Cron scheduling
  // -----------------------------------------------------------------------

  private startAllCrons(): void {
    for (const trigger of this.triggers) {
      if (trigger.type === "cron" && trigger.enabled) {
        this.startCron(trigger);
      }
    }
  }

  private startCron(trigger: TriggerDef): void {
    // Stop existing timer if any
    this.stopCron(trigger.id);

    // Parse cron and calculate next interval
    // Simple implementation: check every minute if the cron matches
    const timer = setInterval(() => {
      if (this.cronMatches(trigger.pattern)) {
        this.handleFire(trigger, { source: "cron", pattern: trigger.pattern });
      }
    }, 60_000); // Check every minute

    this.cronTimers.set(trigger.id, timer);
  }

  private stopCron(triggerId: string): void {
    const timer = this.cronTimers.get(triggerId);
    if (timer) {
      clearInterval(timer);
      this.cronTimers.delete(triggerId);
    }
  }

  /**
   * Check if a cron pattern matches the current time.
   * Supports standard 5-field cron: minute hour day month weekday
   */
  private cronMatches(pattern: string): boolean {
    const now = new Date();
    const fields = pattern.trim().split(/\s+/);
    if (fields.length !== 5) return false;

    const [minute, hour, day, month, weekday] = fields;

    return (
      this.fieldMatches(minute, now.getMinutes()) &&
      this.fieldMatches(hour, now.getHours()) &&
      this.fieldMatches(day, now.getDate()) &&
      this.fieldMatches(month, now.getMonth() + 1) &&
      this.fieldMatches(weekday, now.getDay())
    );
  }

  private fieldMatches(field: string, value: number): boolean {
    if (field === "*") return true;

    // Handle */N (every N)
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2));
      return !isNaN(step) && step > 0 && value % step === 0;
    }

    // Handle comma-separated values
    if (field.includes(",")) {
      return field.split(",").some(f => parseInt(f) === value);
    }

    // Handle ranges (e.g., 1-5)
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return value >= start && value <= end;
    }

    // Direct match
    return parseInt(field) === value;
  }

  private isValidCron(pattern: string): boolean {
    const fields = pattern.trim().split(/\s+/);
    if (fields.length !== 5) return false;

    const validField = (f: string): boolean => {
      if (f === "*") return true;
      if (f.startsWith("*/")) return !isNaN(parseInt(f.slice(2)));
      if (f.includes(",")) return f.split(",").every(v => !isNaN(parseInt(v)));
      if (f.includes("-")) {
        const parts = f.split("-");
        return parts.length === 2 && parts.every(v => !isNaN(parseInt(v)));
      }
      return !isNaN(parseInt(f));
    };

    return fields.every(validField);
  }

  // -----------------------------------------------------------------------
  // Webhook server
  // -----------------------------------------------------------------------

  /**
   * Start the webhook HTTP listener.
   */
  startWebhookServer(): { port: number } {
    if (this.webhookServer) {
      return { port: this.webhookPort };
    }

    this.webhookServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      this.handleWebhookRequest(req, res);
    });

    this.webhookServer.listen(this.webhookPort, "127.0.0.1", () => {
      // Server started
    });

    // Don't let the webhook server keep the process alive
    this.webhookServer.unref();

    return { port: this.webhookPort };
  }

  /**
   * Stop the webhook server.
   */
  stopWebhookServer(): void {
    if (this.webhookServer) {
      this.webhookServer.close();
      this.webhookServer = null;
    }
  }

  private handleWebhookRequest(req: IncomingMessage, res: ServerResponse): void {
    // Only accept POST /trigger/:id
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${this.webhookPort}`);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts.length !== 2 || pathParts[0] !== "trigger") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use POST /trigger/:trigger_id" }));
      return;
    }

    const triggerId = pathParts[1];
    const trigger = this.triggers.find(t => t.id === triggerId && t.type === "webhook");

    if (!trigger) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Webhook trigger '${triggerId}' not found` }));
      return;
    }

    if (!trigger.enabled) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Trigger is disabled" }));
      return;
    }

    // Check webhook secret (from query param or header)
    const providedSecret = url.searchParams.get("secret") ?? req.headers["x-webhook-secret"];
    if (trigger.webhook_secret && providedSecret !== trigger.webhook_secret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid webhook secret" }));
      return;
    }

    // Read body
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      let payload: Record<string, unknown> = {};
      try { payload = body ? JSON.parse(body) : {}; } catch { payload = { raw: body }; }

      const event = this.handleFire(trigger, { ...payload, source: "webhook" });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        trigger_id: trigger.id,
        chain_name: trigger.chain_name,
        fired_at: event?.fired_at,
      }));
    });
  }

  // -----------------------------------------------------------------------
  // Fire handler
  // -----------------------------------------------------------------------

  private handleFire(trigger: TriggerDef, payload: Record<string, unknown>): TriggerEvent {
    const event: TriggerEvent = {
      trigger_id: trigger.id,
      chain_name: trigger.chain_name,
      fired_at: new Date().toISOString(),
      source: trigger.type,
      payload: { ...trigger.config, ...payload },
    };

    // Update trigger stats
    trigger.last_fired_at = event.fired_at;
    trigger.fire_count += 1;
    this.save();

    // Log event
    this.eventLog.push(event);
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100);
    }

    // Notify callback
    if (this.onTriggerFire) {
      try { this.onTriggerFire(event); } catch { /* */ }
    }

    return event;
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  private load(): TriggerDef[] {
    if (existsSync(this.triggersPath)) {
      try { return JSON.parse(readFileSync(this.triggersPath, "utf-8")); } catch { /* */ }
    }
    return [];
  }

  private save(): void {
    writeFileSync(this.triggersPath, JSON.stringify(this.triggers, null, 2), "utf-8");
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Stop all timers and servers. Call on process exit.
   */
  shutdown(): void {
    for (const [id] of this.cronTimers) {
      this.stopCron(id);
    }
    this.stopWebhookServer();
  }
}
