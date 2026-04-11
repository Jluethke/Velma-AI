/**
 * GET /api/:action
 * ==================
 * Top-level portal data endpoints. All return empty/zeroed shapes until
 * an on-chain indexer or off-chain aggregation service is wired up.
 * The frontend hooks have fallbacks so these just need to return 200.
 *
 * Routes:
 *   GET /api/trainer      → TrainerCard
 *   GET /api/achievements → Achievement[]
 *   GET /api/skilldex     → Skilldex
 *   GET /api/quests       → Quest[]
 *   GET /api/evolutions   → { skill, tier }[]
 */

import type { IncomingMessage, ServerResponse } from 'http';

type Req = IncomingMessage & { query?: Record<string, string> };

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// ── Trainer ───────────────────────────────────────────────────────────────

function handleTrainer(_req: Req, res: ServerResponse) {
  json(res, 200, {
    level: 1,
    title: 'Newborn',
    xp: 0,
    xp_next: 50,
    xp_progress: 0,
    streak: 0,
    streak_best: 0,
    streak_multiplier: 1.0,
    skills_discovered: 0,
    skills_total: 0,
    chains_completed: 0,
    chains_total: 0,
    achievements_unlocked: 0,
    achievements_total: 0,
    total_skill_runs: 0,
    total_chain_runs: 0,
  });
}

// ── Achievements ──────────────────────────────────────────────────────────

function handleAchievements(_req: Req, res: ServerResponse) {
  json(res, 200, []);
}

// ── Skilldex ──────────────────────────────────────────────────────────────

function handleSkilldex(_req: Req, res: ServerResponse) {
  json(res, 200, {
    total_discovered: 0,
    total_skills: 0,
    percent: 0,
    categories: {},
  });
}

// ── Quests ────────────────────────────────────────────────────────────────

function handleQuests(_req: Req, res: ServerResponse) {
  json(res, 200, [
    { text: 'Run any skill', xp: 25, completed: false, type: 'daily' },
    { text: 'Complete a chain', xp: 50, completed: false, type: 'daily' },
    { text: 'Discover a new skill', xp: 75, completed: false, type: 'daily' },
    { text: 'Validate a community skill', xp: 100, completed: false, type: 'daily' },
  ]);
}

// ── Evolutions ────────────────────────────────────────────────────────────

function handleEvolutions(_req: Req, res: ServerResponse) {
  json(res, 200, []);
}

// ── Router ────────────────────────────────────────────────────────────────

const ROUTES: Record<string, (req: Req, res: ServerResponse) => void> = {
  trainer:      handleTrainer,
  achievements: handleAchievements,
  skilldex:     handleSkilldex,
  quests:       handleQuests,
  evolutions:   handleEvolutions,
};

export default function handler(req: Req, res: ServerResponse) {
  if (req.method !== 'GET') { json(res, 405, { error: 'Method not allowed' }); return; }

  const action = req.query?.action;

  if (!action || !ROUTES[action]) {
    json(res, 404, { error: `Unknown action: ${action ?? '(none)'}` });
    return;
  }

  return ROUTES[action](req, res);
}
