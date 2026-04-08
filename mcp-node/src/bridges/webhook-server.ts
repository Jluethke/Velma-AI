/**
 * Webhook Server Bridge — REST API for external SkillChain integrations.
 * ======================================================================
 * Lightweight HTTP server providing REST endpoints for skill/chain
 * operations. Uses the shared service layer.
 *
 * Start: node dist/bridges/webhook-server.js
 * Default port: 3181 (configurable via SKILLCHAIN_API_PORT)
 *
 * Endpoints:
 *   GET  /api/skills          — List skills
 *   GET  /api/chains          — List chains
 *   POST /api/chains/search   — Search chains { query, max_results }
 *   POST /api/compose         — Compose chain { query, max_skills }
 *   GET  /api/trainer         — Get trainer card
 *   GET  /api/whatnow         — Get Velma recommendations
 *   POST /api/trigger/:id     — Fire a trigger
 */
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SkillChainService, type ServiceConfig } from "../service.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookServerConfig {
  port: number;
  apiKey?: string;
  serviceConfig: ServiceConfig;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export class WebhookServer {
  private service: SkillChainService;
  private config: WebhookServerConfig;
  private server: ReturnType<typeof createServer> | null = null;

  constructor(config: WebhookServerConfig) {
    this.config = config;
    this.service = new SkillChainService(config.serviceConfig);
  }

  /**
   * Start the webhook HTTP server.
   */
  start(): { port: number } {
    this.server = createServer((req, res) => this.handleRequest(req, res));

    this.server.listen(this.config.port, "0.0.0.0", () => {
      console.log(`SkillChain API server listening on port ${this.config.port}`);
    });

    return { port: this.config.port };
  }

  /**
   * Stop the server.
   */
  stop(): void {
    this.server?.close();
    this.server = null;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // API key authentication (if configured)
    if (this.config.apiKey) {
      const provided = req.headers["x-api-key"] ?? new URL(req.url ?? "/", "http://localhost").searchParams.get("api_key");
      if (provided !== this.config.apiKey) {
        this.json(res, 401, { error: "Invalid API key" });
        return;
      }
    }

    const url = new URL(req.url ?? "/", `http://localhost:${this.config.port}`);
    const path = url.pathname;

    try {
      // Route handling
      if (req.method === "GET" && path === "/api/skills") {
        this.json(res, 200, this.service.listSkills());
      }
      else if (req.method === "GET" && path === "/api/chains") {
        this.json(res, 200, this.service.listChains());
      }
      else if (req.method === "POST" && path === "/api/chains/search") {
        const body = await this.readBody(req);
        const query = body.query as string | undefined;
        const max_results = body.max_results as number | undefined;
        if (!query) {
          this.json(res, 400, { error: "query is required" });
          return;
        }
        this.json(res, 200, this.service.searchChains(query, max_results ?? 5));
      }
      else if (req.method === "POST" && path === "/api/compose") {
        const body = await this.readBody(req);
        const composeQuery = body.query as string | undefined;
        const max_skills = body.max_skills as number | undefined;
        const min_confidence = body.min_confidence as number | undefined;
        if (!composeQuery) {
          this.json(res, 400, { error: "query is required" });
          return;
        }
        this.json(res, 200, this.service.composeChain(composeQuery, max_skills ?? 5, min_confidence ?? 0.4));
      }
      else if (req.method === "GET" && path === "/api/trainer") {
        this.json(res, 200, this.service.getTrainerCard());
      }
      else if (req.method === "GET" && path === "/api/whatnow") {
        this.json(res, 200, this.service.whatNow());
      }
      else if (req.method === "GET" && path === "/api/health") {
        this.json(res, 200, {
          status: "ok",
          server: "skillchain-api",
          port: this.config.port,
          skills: this.service.listSkills().length,
          chains: this.service.listChains().length,
        });
      }
      else {
        this.json(res, 404, {
          error: "Not found",
          endpoints: [
            "GET  /api/skills",
            "GET  /api/chains",
            "POST /api/chains/search",
            "POST /api/compose",
            "GET  /api/trainer",
            "GET  /api/whatnow",
            "GET  /api/health",
          ],
        });
      }
    } catch (err) {
      this.json(res, 500, { error: (err as Error).message });
    }
  }

  private json(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, 2));
  }

  private readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({}); }
      });
    });
  }
}

// ---------------------------------------------------------------------------
// CLI entry point (when run directly)
// ---------------------------------------------------------------------------

const isMainModule = process.argv[1]?.includes("webhook-server");
if (isMainModule) {
  const port = parseInt(process.env.SKILLCHAIN_API_PORT ?? "3181");
  const apiKey = process.env.SKILLCHAIN_API_KEY;

  const homePath = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const marketplaceDirs = [
    join(homePath, ".skillchain", "marketplace"),
  ];
  const marketplaceDir = marketplaceDirs.find(d => existsSync(d)) ?? marketplaceDirs[0];

  const server = new WebhookServer({
    port,
    apiKey,
    serviceConfig: { marketplaceDir },
  });

  server.start();
  console.log(`API key: ${apiKey ? "required" : "disabled (set SKILLCHAIN_API_KEY to enable)"}`);
}
