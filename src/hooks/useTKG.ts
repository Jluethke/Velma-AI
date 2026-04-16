/**
 * useTKG — client-side Temporal Knowledge Graph hook.
 *
 * The TKG lives in Python/Node on the server. This hook maintains
 * a localStorage mirror that the frontend can read and write.
 *
 * Key: "flowfabric-tkg-v1"
 * Format: TKGAssertion[]
 *
 * The MCP tools (tkg_write / tkg_query) also write to ~/.skillchain/fabric/tkg.json.
 * When flows run in the browser (FlowRunner), completed steps emit observations here.
 */

import { useState, useCallback, useEffect } from 'react';

export interface TKGAssertion {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  importance: number;
  valid_from: string;
  valid_to: string | null;
  status: 'active' | 'invalidated_by_contradiction' | 'invalidated_by_retraction' | 'expired';
  source_agent: string;
  derivation_kind: 'observed' | 'inferred' | 'assumed' | 'consensus_validated';
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'flowfabric-tkg-v1';
const HALF_LIFE_DAYS = 30;

function computeImportance(a: TKGAssertion): number {
  if (a.derivation_kind === 'consensus_validated') return a.confidence;
  if (a.predicate.startsWith('constraint:')) return a.confidence;
  const elapsedDays = (Date.now() - new Date(a.valid_from).getTime()) / 86_400_000;
  return a.confidence * Math.pow(0.5, elapsedDays / HALF_LIFE_DAYS);
}

function loadAll(): TKGAssertion[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveAll(assertions: TKGAssertion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assertions));
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useTKG() {
  const [assertions, setAssertions] = useState<TKGAssertion[]>(() => loadAll());

  // Refresh from localStorage when window regains focus
  useEffect(() => {
    const onFocus = () => setAssertions(loadAll());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const active = assertions.filter(a => a.status === 'active');

  /** Write an assertion. Contradiction detection: same subject+predicate, different object → invalidate lower-confidence. */
  const write = useCallback((
    subject: string,
    predicate: string,
    object: string,
    opts: Partial<Omit<TKGAssertion, 'id' | 'subject' | 'predicate' | 'object'>> = {}
  ): TKGAssertion => {
    const all = loadAll();
    const now = new Date().toISOString();
    const newAssertion: TKGAssertion = {
      id: generateId(),
      subject,
      predicate,
      object,
      confidence: opts.confidence ?? 0.9,
      importance: opts.confidence ?? 0.9,
      valid_from: opts.valid_from ?? now,
      valid_to: opts.valid_to ?? null,
      status: 'active',
      source_agent: opts.source_agent ?? 'browser',
      derivation_kind: opts.derivation_kind ?? 'observed',
      metadata: opts.metadata,
    };

    // Contradiction check
    const updated = all.map(a => {
      if (a.status !== 'active') return a;
      if (a.subject === subject && a.predicate === predicate && a.object !== object) {
        if (newAssertion.confidence >= a.confidence) {
          return { ...a, status: 'invalidated_by_contradiction' as const };
        }
        // Existing wins — mark new as lower priority (don't add it)
        newAssertion.status = 'invalidated_by_contradiction';
      }
      return a;
    });

    updated.push(newAssertion);
    saveAll(updated);
    setAssertions(updated);
    return newAssertion;
  }, []);

  /** Query active assertions with optional filters + relevance scoring. */
  const query = useCallback((opts: {
    subject?: string;
    predicate?: string;
    queryText?: string;
    topK?: number;
    minConfidence?: number;
  } = {}): TKGAssertion[] => {
    let candidates = loadAll().filter(a => a.status === 'active');
    if (opts.subject) candidates = candidates.filter(a => a.subject === opts.subject);
    if (opts.predicate) candidates = candidates.filter(a => a.predicate === opts.predicate);
    if (opts.minConfidence) candidates = candidates.filter(a => a.confidence >= opts.minConfidence!);

    const q = (opts.queryText || '').toLowerCase();
    const qTokens = q.split(/\s+/).filter(Boolean);

    const scored = candidates.map(a => {
      const text = `${a.subject} ${a.predicate} ${a.object}`.toLowerCase();
      const overlap = qTokens.length > 0
        ? qTokens.filter(t => text.includes(t)).length / qTokens.length
        : 1;
      const importance = computeImportance(a);
      const ageSec = (Date.now() - new Date(a.valid_from).getTime()) / 1000;
      const recency = Math.exp(-ageSec / (7 * 86400));
      const score = 0.35 * a.confidence + 0.30 * importance + 0.20 * recency + 0.15 * overlap;
      return { assertion: { ...a, importance }, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, opts.topK ?? 20).map(s => s.assertion);
  }, []);

  /** Emit a flow step observation — called by FlowRunner on step complete. */
  const observeFlowStep = useCallback((
    flowSlug: string,
    stepAlias: string,
    status: 'completed' | 'failed',
    durationMs: number,
  ) => {
    const claim = status === 'completed'
      ? `${flowSlug}/${stepAlias} completed in ${Math.round(durationMs)}ms`
      : `${flowSlug}/${stepAlias} failed`;
    write(
      `flow:${flowSlug}`,
      'step_result',
      claim,
      { confidence: status === 'completed' ? 0.95 : 0.80, derivation_kind: 'observed',
        source_agent: 'flow-runner', metadata: { flowSlug, stepAlias, status, durationMs } }
    );
  }, [write]);

  /** Emit a flow completion observation. */
  const observeFlowComplete = useCallback((
    flowSlug: string,
    success: boolean,
    domain: string,
  ) => {
    write(
      `flow:${flowSlug}`,
      'flow_result',
      success ? `${flowSlug} completed successfully` : `${flowSlug} finished with errors`,
      { confidence: success ? 0.92 : 0.75, derivation_kind: 'inferred',
        source_agent: 'flow-runner', metadata: { flowSlug, domain, success } }
    );
  }, [write]);

  const stats = {
    total: assertions.length,
    active: active.length,
    invalidated: assertions.filter(a => a.status.startsWith('invalidated')).length,
    subjects: new Set(active.map(a => a.subject)).size,
  };

  return { assertions: active, write, query, observeFlowStep, observeFlowComplete, stats };
}
