/**
 * useVelmaMemory — Conversation threads + memory context from existing L0-L3/TKG.
 *
 * Conversations: separate threads with titles (like ChatGPT/Claude).
 * Memory: reads from VelmaState (L0 identity, behavioral history) and
 *         the client-side TKG (knowledge assertions) — NOT a separate store.
 *
 * The L0-L3 tiered memory lives in the MCP server. The TKG lives in
 * localStorage via useTKG. VelmaState tracks behavioral data. This module
 * reads from those existing sources to build Velma's context — no duplication.
 */

import type { VelmaState } from './useVelmaCompanion';
import { formatFlowName } from '../utils/formatFlowName';

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

// ── Storage keys ──────────────────────────────────────────────────

const INDEX_KEY = 'flowfabric-velma-convos-v2';
const CONVO_PREFIX = 'flowfabric-velma-convo-';
const TKG_KEY = 'flowfabric-tkg-v1';
const OLD_CHAT_KEY = 'flowfabric-velma-chat-v1';
const OLD_MEMORY_KEY = 'flowfabric-velma-memory-v1'; // redundant store we're removing

// ── Conversation index ────────────────────────────────────────────

interface ConversationIndex {
  conversations: { id: string; title: string; updated: string; messageCount: number }[];
  activeId: string | null;
}

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

  if (convo.title === 'New conversation') {
    const firstUser = messages.find(m => m.role === 'user');
    if (firstUser) {
      convo.title = firstUser.display.slice(0, 60) + (firstUser.display.length > 60 ? '...' : '');
    }
  }

  saveConversation(convo);

  const index = loadIndex();
  const entry = index.conversations.find(c => c.id === id);
  if (entry) {
    entry.title = convo.title;
    entry.updated = convo.updated;
    entry.messageCount = messages.length;
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

// ── Memory context from EXISTING infrastructure ───────────────────
// Reads from VelmaState (behavioral) + TKG (knowledge). No separate store.

interface TKGAssertionRaw {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  status: string;
  derivation_kind: string;
  valid_from: string;
}

function loadTKGAssertions(): TKGAssertionRaw[] {
  try {
    const raw = localStorage.getItem(TKG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return [];
}

/**
 * Build memory context from VelmaState + TKG for injection into Velma's prompt.
 * This reads from the EXISTING L0-L3 infrastructure — no separate memory store.
 */
export function getMemoryContext(state: VelmaState): string {
  const sections: string[] = [];

  // L0: Identity / behavioral profile
  const identity: string[] = [];
  if (state.flows_run > 0) identity.push(`Has run ${state.flows_run} flow${state.flows_run > 1 ? 's' : ''} total`);
  if (state.flows_completed.length > 0) {
    const recent = state.flows_completed.slice(-5).map(formatFlowName);
    identity.push(`Recently completed: ${recent.join(', ')}`);
  }
  if (state.chains_run > 0) identity.push(`Has run ${state.chains_run} chain${state.chains_run > 1 ? 's' : ''}`);
  if (state.streak > 1) identity.push(`${state.streak}-day streak`);
  if (state.level > 1) identity.push(`Level ${state.level}`);
  if (identity.length > 0) sections.push(`User profile: ${identity.join('. ')}.`);

  // L1: Recent witnessed events (behavioral facts)
  const recentEvents = state.witnessed
    .slice(-10)
    .filter(e => !e.startsWith('page_visited') && e !== 'visited portal')
    .map(e => {
      if (e.startsWith('flow_start:')) return `Started ${formatFlowName(e.slice(11))}`;
      if (e.startsWith('flow_complete:')) return `Finished ${formatFlowName(e.slice(14))}`;
      if (e.startsWith('chain_complete:')) return `Completed chain ${formatFlowName(e.slice(15))}`;
      return e.replace(/_/g, ' ');
    });
  if (recentEvents.length > 0) sections.push(`Recent activity: ${recentEvents.join('. ')}.`);

  // L2/L3: TKG knowledge assertions (active, high-confidence)
  const assertions = loadTKGAssertions()
    .filter(a => a.status === 'active' && a.confidence >= 0.7)
    .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())
    .slice(0, 15);

  if (assertions.length > 0) {
    const knowledge = assertions.map(a => `${a.subject} ${a.predicate} ${a.object}`);
    sections.push(`Known facts:\n${knowledge.map(k => `- ${k}`).join('\n')}`);
  }

  if (sections.length === 0) return '';
  return `\n\nREMEMBERED ABOUT THIS USER (from existing memory tiers):\n${sections.join('\n')}`;
}

// ── Legacy migration ──────────────────────────────────────────────

export function migrateLegacyChat() {
  // Nuke the old flat chat buffer (had "slug" contamination)
  localStorage.removeItem(OLD_CHAT_KEY);
  // Nuke the redundant memory store we created by mistake
  localStorage.removeItem(OLD_MEMORY_KEY);
}
