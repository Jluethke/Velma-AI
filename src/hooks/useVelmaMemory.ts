/**
 * useVelmaMemory — Velma's butler memory + conversation threads.
 *
 * Two layers:
 *   1. Conversations — separate threads with titles, like ChatGPT/Claude
 *   2. Memory — persistent facts Velma remembers across all conversations
 *
 * Conversations are stored individually by ID.
 * Memory is a separate store that grows over time and gets injected
 * into every new conversation's system context.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'velma' | 'user';
  content: string;
  display: string;
  suggestions?: FlowSuggestion[];
  path?: string[];
  listing?: ParsedListing;
  isSystem?: boolean;
}

export interface FlowSuggestion {
  slug: string;
  reason: string;
}

export interface ParsedListing {
  title: string;
  flow: string;
  role: 'host' | 'guest';
  description: string;
  tags: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created: string;
  updated: string;
}

export interface VelmaMemoryEntry {
  fact: string;
  source: string;      // conversation ID where this was learned
  learned: string;     // ISO timestamp
  category: 'preference' | 'context' | 'goal' | 'history';
}

interface ConversationIndex {
  conversations: { id: string; title: string; updated: string; messageCount: number }[];
  activeId: string | null;
}

// ── Storage keys ──────────────────────────────────────────────────

const INDEX_KEY = 'flowfabric-velma-convos-v2';
const CONVO_PREFIX = 'flowfabric-velma-convo-';
const MEMORY_KEY = 'flowfabric-velma-memory-v1';
const OLD_CHAT_KEY = 'flowfabric-velma-chat-v1'; // legacy — nuke on first load

// ── Index operations ──────────────────────────────────────────────

function loadIndex(): ConversationIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return { conversations: [], activeId: null };
}

function saveIndex(index: ConversationIndex) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* full */ }
}

// ── Conversation CRUD ─────────────────────────────────────────────

export function createConversation(firstMessage: ChatMessage): Conversation {
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const convo: Conversation = {
    id,
    title: 'New conversation',
    messages: [firstMessage],
    created: now,
    updated: now,
  };
  saveConversation(convo);

  const index = loadIndex();
  index.conversations.unshift({ id, title: convo.title, updated: now, messageCount: 1 });
  index.activeId = id;
  // Keep max 50 conversations
  if (index.conversations.length > 50) {
    const removed = index.conversations.splice(50);
    removed.forEach(c => localStorage.removeItem(CONVO_PREFIX + c.id));
  }
  saveIndex(index);
  return convo;
}

export function saveConversation(convo: Conversation) {
  try { localStorage.setItem(CONVO_PREFIX + convo.id, JSON.stringify(convo)); } catch { /* full */ }
}

export function loadConversation(id: string): Conversation | null {
  try {
    const raw = localStorage.getItem(CONVO_PREFIX + id);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return null;
}

export function loadActiveConversation(): Conversation | null {
  const index = loadIndex();
  if (!index.activeId) return null;
  return loadConversation(index.activeId);
}

export function listConversations(): ConversationIndex['conversations'] {
  return loadIndex().conversations;
}

export function setActiveConversation(id: string) {
  const index = loadIndex();
  index.activeId = id;
  saveIndex(index);
}

export function updateConversationMessages(id: string, messages: ChatMessage[]) {
  const convo = loadConversation(id);
  if (!convo) return;
  convo.messages = messages;
  convo.updated = new Date().toISOString();

  // Auto-title from first user message if still default
  if (convo.title === 'New conversation') {
    const firstUser = messages.find(m => m.role === 'user');
    if (firstUser) {
      convo.title = firstUser.display.slice(0, 60) + (firstUser.display.length > 60 ? '...' : '');
    }
  }

  saveConversation(convo);

  // Update index
  const index = loadIndex();
  const entry = index.conversations.find(c => c.id === id);
  if (entry) {
    entry.title = convo.title;
    entry.updated = convo.updated;
    entry.messageCount = messages.length;
    // Move to top
    const idx = index.conversations.indexOf(entry);
    if (idx > 0) {
      index.conversations.splice(idx, 1);
      index.conversations.unshift(entry);
    }
  }
  saveIndex(index);
}

export function deleteConversation(id: string) {
  localStorage.removeItem(CONVO_PREFIX + id);
  const index = loadIndex();
  index.conversations = index.conversations.filter(c => c.id !== id);
  if (index.activeId === id) {
    index.activeId = index.conversations[0]?.id ?? null;
  }
  saveIndex(index);
}

// ── Memory (butler) ───────────────────────────────────────────────

export function loadMemory(): VelmaMemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return [];
}

export function saveMemoryEntry(entry: VelmaMemoryEntry) {
  const mem = loadMemory();
  // Deduplicate by fact content (fuzzy)
  const exists = mem.some(m => m.fact.toLowerCase() === entry.fact.toLowerCase());
  if (!exists) {
    mem.push(entry);
    // Keep max 100 memories
    if (mem.length > 100) mem.shift();
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch { /* full */ }
  }
}

export function clearMemory() {
  localStorage.removeItem(MEMORY_KEY);
}

/**
 * Build a memory context string for injection into Velma's system prompt.
 * Returns empty string if no memories exist.
 */
export function getMemoryContext(): string {
  const mem = loadMemory();
  if (mem.length === 0) return '';

  const grouped: Record<string, string[]> = {
    preference: [],
    context: [],
    goal: [],
    history: [],
  };
  mem.forEach(m => grouped[m.category]?.push(m.fact));

  const sections: string[] = [];
  if (grouped.preference.length) sections.push(`Preferences: ${grouped.preference.join('. ')}`);
  if (grouped.goal.length) sections.push(`Goals: ${grouped.goal.join('. ')}`);
  if (grouped.context.length) sections.push(`Context: ${grouped.context.join('. ')}`);
  if (grouped.history.length) sections.push(`History: ${grouped.history.slice(-10).join('. ')}`);

  return `\n\nREMEMBERED ABOUT THIS USER:\n${sections.join('\n')}`;
}

/**
 * Extract memorable facts from a completed conversation.
 * Call this when a conversation goes idle or the user starts a new one.
 */
export function extractMemories(convo: Conversation) {
  const userMessages = convo.messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return;

  const now = new Date().toISOString();

  // Extract what flows they ran (from system messages)
  convo.messages.forEach(msg => {
    if (msg.isSystem && msg.content.startsWith('flow_start:')) {
      const flowName = msg.content.replace('flow_start:', '');
      saveMemoryEntry({
        fact: `Ran the ${flowName.replace(/-/g, ' ')} flow`,
        source: convo.id,
        learned: now,
        category: 'history',
      });
    }
  });

  // Extract topic from first user message as context
  const firstUser = userMessages[0];
  if (firstUser && firstUser.display.length > 10) {
    saveMemoryEntry({
      fact: `Asked about: ${firstUser.display.slice(0, 120)}`,
      source: convo.id,
      learned: now,
      category: 'context',
    });
  }
}

// ── Migration from legacy ─────────────────────────────────────────

export function migrateLegacyChat() {
  const old = localStorage.getItem(OLD_CHAT_KEY);
  if (!old) return;

  // Nuke the old cache (kills the "slug" ghost and any other stale data)
  localStorage.removeItem(OLD_CHAT_KEY);

  // Don't migrate the old messages — start fresh with clean conversations
  // The old format had the "slug" contamination and flat structure
}
