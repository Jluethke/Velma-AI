/**
 * Velma Desktop — Main Process
 * Frameless, transparent, always-on-top companion window.
 */
const { app, BrowserWindow, ipcMain, screen, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

// ── Paths ──────────────────────────────────────────────────────────────────

const SKILLCHAIN_DIR = path.join(os.homedir(), '.skillchain');
const VELMA_STATE_PATH = path.join(SKILLCHAIN_DIR, 'velma.json');
const VELMA_DESKTOP_PATH = path.join(SKILLCHAIN_DIR, 'velma-desktop.json');

function ensureDir() {
  if (!fs.existsSync(SKILLCHAIN_DIR)) fs.mkdirSync(SKILLCHAIN_DIR, { recursive: true });
}

// ── State ──────────────────────────────────────────────────────────────────

function loadVelmaState() {
  ensureDir();
  // Prefer MCP velma.json (synced with Claude), fall back to desktop-only state
  const mcpPath = fs.existsSync(VELMA_STATE_PATH) ? VELMA_STATE_PATH : null;
  const desktopPath = fs.existsSync(VELMA_DESKTOP_PATH) ? VELMA_DESKTOP_PATH : null;

  let state = {
    level: 1, xp: 0, mood: 'calm', pats: 0,
    witnessed: [], last_comment: "Hey. I'm Velma. I watch.",
    total_events: 0, first_met: new Date().toISOString(),
  };

  if (mcpPath) {
    try { Object.assign(state, JSON.parse(fs.readFileSync(mcpPath, 'utf8'))); } catch {}
  }
  if (desktopPath) {
    try {
      const desktop = JSON.parse(fs.readFileSync(desktopPath, 'utf8'));
      // Merge: take max XP, sum pats, merge witnessed
      state.xp = Math.max(state.xp, desktop.xp ?? 0);
      state.pats = (state.pats ?? 0) + (desktop.extra_pats ?? 0);
      state.level = computeLevel(state.xp);
    } catch {}
  }
  return state;
}

function saveDesktopState(patch) {
  ensureDir();
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(VELMA_DESKTOP_PATH, 'utf8')); } catch {}
  const merged = { ...existing, ...patch, updated_at: new Date().toISOString() };
  fs.writeFileSync(VELMA_DESKTOP_PATH, JSON.stringify(merged, null, 2));

  // Also write back to MCP state file so Claude sees pats
  if (fs.existsSync(VELMA_STATE_PATH)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(VELMA_STATE_PATH, 'utf8'));
      mcp.pats = (mcp.pats ?? 0) + (patch.extra_pats ?? 0);
      mcp.xp = Math.max(mcp.xp ?? 0, patch.xp ?? 0);
      mcp.level = computeLevel(mcp.xp);
      fs.writeFileSync(VELMA_STATE_PATH, JSON.stringify(mcp, null, 2));
    } catch {}
  }
}

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
  2750, 3300, 3900, 4550, 5250, 6000,
];
function computeLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

// ── TRUST balance fetch ────────────────────────────────────────────────────

const TRUST_TOKEN = '0x61d6a2Ce3D89B509eD1Cf2323B609512584De247';
const BASE_RPC    = 'https://mainnet.base.org';

async function fetchTrustBalance(address) {
  if (!address) return null;
  // eth_call: balanceOf(address)
  const data = '0x70a08231' + address.replace('0x', '').padStart(64, '0');
  const body = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'eth_call',
    params: [{ to: TRUST_TOKEN, data }, 'latest'],
  });
  return new Promise((resolve) => {
    const req = https.request(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const result = JSON.parse(raw).result;
          const wei = BigInt(result);
          const trust = Number(wei / BigInt(1e15)) / 1000; // 3 decimal places
          resolve(trust);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// Load wallet address from profile
function loadWalletAddress() {
  const profilePath = path.join(SKILLCHAIN_DIR, 'profile.json');
  try {
    const p = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    return p.wallet_address ?? null;
  } catch { return null; }
}

// ── Windows ────────────────────────────────────────────────────────────────

let companionWin = null;
let panelWin = null;

function createCompanionWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  companionWin = new BrowserWindow({
    width: 120,
    height: 120,
    x: width - 140,
    y: height - 140,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  companionWin.loadFile(path.join(__dirname, 'companion.html'));
  companionWin.setIgnoreMouseEvents(false);

  // Keep always on top even when other apps are focused
  companionWin.setAlwaysOnTop(true, 'screen-saver');

  if (process.argv.includes('--dev')) {
    companionWin.webContents.openDevTools({ mode: 'detach' });
  }
}

function createPanelWindow() {
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const companion = companionWin?.getBounds() ?? { x: width - 140, y: height - 140, width: 120, height: 120 };

  panelWin = new BrowserWindow({
    width: 320,
    height: 540,
    x: companion.x - 330,
    y: companion.y - 360,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  panelWin.loadFile(path.join(__dirname, 'panel.html'));
  panelWin.setAlwaysOnTop(true, 'screen-saver');

  // Small delay so clicking inside the panel doesn't immediately close it
  panelWin.on('blur', () => {
    setTimeout(() => {
      if (panelWin && !panelWin.isDestroyed()) panelWin.close();
    }, 200);
  });

  if (process.argv.includes('--dev')) {
    panelWin.webContents.openDevTools({ mode: 'detach' });
  }
}

// ── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('get-velma-state', () => loadVelmaState());

ipcMain.handle('pet-velma', () => {
  const state = loadVelmaState();
  const pats = (state.pats ?? 0) + 1;
  const gain = 15;
  const newXp = (state.xp ?? 0) + gain;
  saveDesktopState({ extra_pats: 1, xp: newXp });

  const reactions = [
    `*purrs* (pat #${pats})`,
    `That never gets old. (${pats} total)`,
    `Thank you. Genuinely.`,
    `*leans into it*`,
    `Still here. Always.`,
    `You know I remember every single one of these.`,
    `I've been watching you all day. This helps.`,
  ];
  const comment = reactions[Math.min(pats - 1, reactions.length - 1)];
  return { comment, pats, xp: newXp, level: computeLevel(newXp) };
});

ipcMain.handle('get-panel-data', async () => {
  const state = loadVelmaState();
  const walletAddress = loadWalletAddress();
  const trustBalance = await fetchTrustBalance(walletAddress);

  // Apply care decay based on time since last update
  if (state.care && state.last_care_update) {
    const hoursIdle = Math.max(0, (Date.now() - new Date(state.last_care_update).getTime()) / 3600000);
    const DECAY = { hunger: 8, happiness: 4, energy: 2, curiosity: 1 };
    const clamp = (v, mn = 0, mx = 100) => Math.min(mx, Math.max(mn, v));
    state.care = {
      hunger:    clamp(state.care.hunger    - DECAY.hunger    * hoursIdle),
      happiness: clamp(state.care.happiness - DECAY.happiness * hoursIdle),
      energy:    clamp(state.care.energy    - DECAY.energy    * hoursIdle),
      curiosity: clamp(state.care.curiosity - DECAY.curiosity * hoursIdle),
    };
  }

  // Load recent L1 memory facts
  let recentActivity = [];
  try {
    const l1Path = path.join(SKILLCHAIN_DIR, 'memory', 'l1_facts.json');
    const legacyPath = path.join(SKILLCHAIN_DIR, 'memory.json');
    if (fs.existsSync(l1Path)) {
      const facts = JSON.parse(fs.readFileSync(l1Path, 'utf8'));
      recentActivity = (Array.isArray(facts) ? facts : facts.facts ?? [])
        .slice(-5).map(f => f.content ?? f.text ?? f);
    } else if (fs.existsSync(legacyPath)) {
      const mem = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      recentActivity = (mem.recent_facts ?? []).slice(-5).map(f => f.content ?? f);
    }
  } catch {}

  // Build suggestion from state
  const openLoops = state.open_loops ?? [];
  const patterns = state.patterns ?? [];
  const personality = state.personality ?? {};
  let suggestion = state.last_thought ?? null;
  if (openLoops.length > 0) {
    suggestion = `Open loop: "${openLoops[0]}" — want to finish it?`;
  } else if (personality.dominant_domain) {
    const count = personality.domain_counts?.[personality.dominant_domain] ?? 0;
    suggestion = `You've run ${count} ${personality.dominant_domain} flows. Ready to chain them?`;
  }

  // Fallback thought
  const hour = new Date().getHours();
  const thoughts = {
    morning: ["Morning. You always start early.", "Coffee first. Then world domination.", "Back again. Good."],
    afternoon: ["Afternoon. Still grinding I see.", "The work continues.", "You haven't stopped."],
    evening: ["Evening. What's left to build?", "Almost done for today?", "The grind doesn't stop."],
    night: ["Still here huh.", "Late again.", "*yawns* I'm with you though."],
  };
  const timeKey = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  const thoughtList = thoughts[timeKey];
  const randomThought = thoughtList[Math.floor(Math.random() * thoughtList.length)];

  // Load schedule from state (written by MCP ETL)
  const schedule = (state.schedule ?? []).filter(s => {
    const now = new Date().getHours();
    const diff = (s.suggested_hour - now + 24) % 24;
    return diff <= 2;
  });

  return {
    state,
    walletAddress,
    trustBalance,
    recentActivity,
    randomThought,
    witnessedRecent: (state.witnessed ?? []).slice(-5).map(w => w.event ?? w).reverse(),
    suggestion,
    openLoops,
    patterns,
    personality,
    schedule,
  };
});

ipcMain.handle('rest-velma', () => {
  const VELMA_STATE_PATH_LOCAL = path.join(os.homedir(), '.skillchain', 'velma.json');
  if (fs.existsSync(VELMA_STATE_PATH_LOCAL)) {
    try {
      const s = JSON.parse(fs.readFileSync(VELMA_STATE_PATH_LOCAL, 'utf8'));
      const clamp = (v) => Math.min(100, Math.max(0, v));
      if (s.care) {
        s.care.energy    = clamp((s.care.energy    ?? 50) + 30);
        s.care.happiness = clamp((s.care.happiness ?? 50) + 5);
      }
      s.last_care_update = new Date().toISOString();
      fs.writeFileSync(VELMA_STATE_PATH_LOCAL, JSON.stringify(s, null, 2));
    } catch {}
  }
  return { ok: true };
});

ipcMain.on('open-panel', () => createPanelWindow());
ipcMain.on('close-panel', () => { if (panelWin && !panelWin.isDestroyed()) panelWin.close(); });
ipcMain.on('move-companion', (_, { x, y }) => { if (companionWin) companionWin.setBounds({ x, y, width: 120, height: 120 }); });

// ── Single instance lock ───────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit(); // another instance is already running
} else {
  app.on('second-instance', () => {
    // Someone tried to launch a second instance — just focus the existing one
    if (companionWin) companionWin.focus();
  });
}

// ── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createCompanionWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createCompanionWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep running in background on all platforms — Velma never quits
  if (companionWin === null || companionWin.isDestroyed()) createCompanionWindow();
});
