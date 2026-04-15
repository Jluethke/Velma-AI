/**
 * VelmaChatPanel — Velma's discovery mode + inline flow runner + Discovery listing creator.
 *
 * Three surfaces:
 *   velma     — finds the right flow or drafts a Discovery listing for your situation
 *   flow      — runs a chosen flow inline via /api/chat; user never leaves
 *   listing   — shows a pre-filled Discovery listing card with one-click post
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useSkills } from '../hooks/useSkills';
import { useCreateListing } from '../hooks/useDiscovery';
import { formatFlowName } from '../utils/formatFlowName';
import type { VelmaState } from '../hooks/useVelmaCompanion';

// ── Types ──────────────────────────────────────────────────────────────────

interface ParsedListing {
  title: string;
  flow: string;
  role: 'host' | 'guest';
  description: string;
  tags: string[];
}

interface ChatMessage {
  role: 'velma' | 'user';
  content: string;
  display: string;
  suggestions?: FlowSuggestion[];
  path?: string[];
  listing?: ParsedListing;
  isSystem?: boolean;
}

interface FlowSuggestion {
  slug: string;
  reason: string;
}

// ── Persistence ────────────────────────────────────────────────────────────

const CHAT_KEY = 'flowfabric-velma-chat-v1';
const MAX_HISTORY = 10;

function saveChatHistory(messages: ChatMessage[]) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_HISTORY))); } catch { /* ignore */ }
}
function loadChatHistory(): ChatMessage[] {
  try { const r = localStorage.getItem(CHAT_KEY); if (r) return JSON.parse(r) as ChatMessage[]; } catch { /* ignore */ }
  return [];
}
function clearChatHistory() { localStorage.removeItem(CHAT_KEY); }

// ── Location helpers ───────────────────────────────────────────────────────

function describeLocation(pathname: string, search = ''): string {
  if (pathname === '/' || pathname === '') return 'the homepage';
  if (pathname.startsWith('/flow/')) return `the "${formatFlowName(pathname.slice(6))}" flow page`;
  if (pathname.startsWith('/skill/')) return `the "${formatFlowName(pathname.slice(7))}" flow page`;
  if (pathname.startsWith('/explore') || pathname.startsWith('/flows') || pathname.startsWith('/skills')) return 'the flow library';
  if (pathname.startsWith('/studio')) {
    const tab = new URLSearchParams(search).get('tab');
    if (tab === 'chain') return 'the chain composer';
    return 'Flow Studio';
  }
  if (pathname.startsWith('/discover/matches')) return 'your Discovery matches';
  if (pathname.startsWith('/discover/new')) return 'the Discovery listing form';
  if (pathname.startsWith('/discover')) return 'the Discovery board';
  if (pathname.startsWith('/chains')) return 'the chains library';
  if (pathname.startsWith('/fabric/')) return 'a live Fabric session';
  if (pathname.startsWith('/portal')) return 'the portal';
  if (pathname.startsWith('/dashboard')) return 'your dashboard';
  if (pathname.startsWith('/profile')) return 'your profile';
  if (pathname.startsWith('/install')) return 'the install guide';
  if (pathname.startsWith('/pricing')) return 'the pricing page';
  if (pathname.startsWith('/get-started')) return 'the getting-started guide';
  return 'FlowFabric';
}

function getChips(pathname: string, search: string, state: VelmaState): string[] {
  const isNew = state.flows_run === 0;
  const tab = new URLSearchParams(search).get('tab');

  if (pathname.startsWith('/flow/') || pathname.startsWith('/skill/')) {
    const slug = pathname.startsWith('/flow/') ? pathname.slice(6) : pathname.slice(7);
    const name = formatFlowName(slug);
    return [`What does ${name} actually do?`, 'What should I run after this?', 'Is there a better fit for me?'];
  }
  if (pathname.startsWith('/explore') || pathname.startsWith('/flows') || pathname.startsWith('/skills')) {
    return ['Help me find the right flow', 'Show me career flows', 'Show me money flows', 'I have a big decision to make'];
  }
  if (pathname.startsWith('/discover/matches')) {
    return ['Explain my top match', 'Should I accept this?', 'Help me compare my matches', 'Draft a response for me'];
  }
  if (pathname.startsWith('/discover')) {
    return ["I need a co-founder", "I'm looking for clients", "I want to offer my skills", 'Help me write a listing'];
  }
  if (pathname.startsWith('/studio') || pathname.startsWith('/compose')) {
    if (tab === 'chain') return ['How do I chain flows together?', 'Build me a career chain', 'Build me a money chain'];
    return ['How do I create a new flow?', 'What makes a good flow?', 'I have a workflow to convert'];
  }
  if (pathname.startsWith('/chains')) {
    return ['What chains are available?', 'How do I run a chain?', 'Build me a custom chain'];
  }
  if (pathname.startsWith('/portal')) {
    return ['How do I earn more XP?', 'What are the tiers?', 'How does staking work?'];
  }
  if (pathname.startsWith('/dashboard')) {
    return ['What should I run next?', 'Show my progress', 'How do I level up faster?'];
  }
  if (isNew) {
    return ['What can FlowFabric actually do?', 'Help with a career decision', 'I need a budget', 'I have a big decision to make', 'My situation is complicated'];
  }
  return ['What should I run next?', 'Help me with a decision', 'Money advice', 'Career move', 'My situation is complicated'];
}

function getFollowUpChips(msg: ChatMessage): string[] {
  if (msg.listing) {
    return ['Make the title stronger', 'Add more context to description', 'Change my role', 'Show flows to prepare first'];
  }
  if (msg.suggestions && msg.suggestions.length > 0) {
    const firstName = formatFlowName(msg.suggestions[0].slug);
    const chips: string[] = [`Tell me more about ${firstName}`];
    if (msg.path && msg.path.length > 1) {
      chips.push('Walk me through the path');
    } else if (msg.suggestions.length >= 2) {
      chips.push('Give me a suggested order');
    }
    chips.push('Show me different options');
    return chips;
  }
  return ["Give me more detail", "That doesn't quite fit", "What should I do first?"];
}

// ── Parse Velma responses ──────────────────────────────────────────────────

function parseListing(block: string): ParsedListing | undefined {
  const get = (key: string) =>
    block.match(new RegExp(`^${key}:\\s*(.+)`, 'm'))?.[1]?.trim() ?? '';
  const title = get('title');
  const flow = get('flow');
  if (!title || !flow) return undefined;
  const rawRole = get('role');
  const role: 'host' | 'guest' = rawRole.startsWith('guest') ? 'guest' : 'host';
  return {
    title,
    flow,
    role,
    description: get('description'),
    tags: get('tags').split(',').map(t => t.trim()).filter(Boolean),
  };
}

function parseResponse(raw: string): {
  display: string;
  suggestions: FlowSuggestion[];
  path: string[];
  listing?: ParsedListing;
} {
  // LISTING: block
  const listingMatch = raw.match(/LISTING:\s*\n([\s\S]*?)(?=\n\nFLOWS:|\n\nPATH:|$)/);
  const listing = listingMatch?.[1] ? parseListing(listingMatch[1]) : undefined;

  // FLOWS: block
  const flowsMatch = raw.match(/FLOWS:\s*\n([\s\S]*?)(?:\n\nPATH:|$)/);
  const suggestions: FlowSuggestion[] = [];
  if (flowsMatch?.[1]) {
    for (const line of flowsMatch[1].split('\n')) {
      const m = line.match(/^[-*]\s*([a-z0-9-]+):\s*(.+)/);
      if (m) suggestions.push({ slug: m[1].trim(), reason: m[2].trim() });
    }
  }

  // PATH: line
  const pathMatch = raw.match(/PATH:\s*([^\n]+)/);
  const path = pathMatch?.[1]
    ? pathMatch[1].split(/→|->/).map(s => s.trim()).filter(Boolean)
    : [];

  // Display: strip all structured blocks
  const display = raw
    .replace(/\n*LISTING:\s*\n[\s\S]*?(?=\n\nFLOWS:|\n\nPATH:|$)/, '')
    .replace(/\n*FLOWS:\s*\n[\s\S]*?(?=\n\nPATH:|$)/, '')
    .replace(/\n*PATH:[^\n]+/, '')
    .trim();

  return { display, suggestions, path, listing };
}

function openingMessage(state: VelmaState, pathname: string, search: string): ChatMessage {
  const lastFlow = state.witnessed.slice().reverse()
    .find(e => e.startsWith('flow_complete:'))?.replace('flow_complete:', '');
  const page = describeLocation(pathname, search);

  let text: string;
  if (pathname.startsWith('/discover/matches')) {
    text = "You're on your Discovery matches. Want me to explain a match, help you compare, or draft a response?";
  } else if (pathname.startsWith('/discover')) {
    text = "You're on the Discovery board. Tell me what kind of person you're looking for — I'll draft a listing.";
  } else if (state.flows_run === 0) {
    text = `You're on ${page}. What are you trying to figure out? I'll show you what FlowFabric can do for that.`;
  } else if (lastFlow) {
    text = `You just finished ${formatFlowName(lastFlow)}. What's next?`;
  } else if (state.flows_run >= 10) {
    text = "Back again. What are we solving?";
  } else {
    text = `You're on ${page}. What do you need?`;
  }
  return { role: 'velma', content: text, display: text };
}

// ── Stream helper ──────────────────────────────────────────────────────────

async function streamResponse(
  resp: Response,
  onDelta: (full: string, display: string, suggestions: FlowSuggestion[], path: string[], listing?: ParsedListing) => void,
  flowMode: boolean,
): Promise<string> {
  const reader = resp.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const chunk = JSON.parse(raw);
        const delta = chunk?.delta?.text ?? '';
        if (delta) {
          full += delta;
          if (flowMode) {
            onDelta(full, full, [], []);
          } else {
            const parsed = parseResponse(full);
            onDelta(full, parsed.display, parsed.suggestions, parsed.path, parsed.listing);
          }
        }
      } catch { /* skip */ }
    }
  }
  return full;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ThinkingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: color, opacity: 0.65, display: 'inline-block',
          animation: `velma-dot-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function SuggestionCard({ slug, reason, color, onClose, onRun }: {
  slug: string; reason: string; color: string;
  onClose: () => void; onRun: (slug: string, name: string) => void;
}) {
  const name = formatFlowName(slug);
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}28`,
      borderRadius: '9px', overflow: 'hidden', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}44`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}28`}
    >
      <div style={{ padding: '9px 11px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'monospace' }}>{name}</span>
          <Link to={`/flow/${slug}`} onClick={onClose}
            style={{ fontSize: '9px', color, opacity: 0.6, flexShrink: 0, textDecoration: 'none' }}
            title="Open flow page">
            Open ↗
          </Link>
        </div>
        <p style={{ margin: 0, fontSize: '10px', color: '#889', lineHeight: 1.4 }}>{reason}</p>
      </div>
      <button
        onClick={() => onRun(slug, name)}
        style={{
          display: 'block', width: '100%', padding: '6px 11px',
          borderTop: `1px solid ${color}18`, background: `${color}0c`,
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
          color, transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${color}1e`}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${color}0c`}
      >
        ▶ Run now
      </button>
    </div>
  );
}

function PathDisplay({ path, onClose }: { path: string[]; onClose: () => void }) {
  return (
    <div style={{
      background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)',
      borderRadius: '9px', padding: '9px 11px', marginTop: '6px',
    }}>
      <div style={{ fontSize: '9px', color: '#ffd70088', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', fontFamily: 'monospace' }}>
        Suggested path
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {path.map((slug, i) => (
          <span key={slug} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Link to={`/flow/${slug}`} onClick={onClose} style={{
              fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
              color: '#ffd700', textDecoration: 'none',
              background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '6px', padding: '2px 7px',
            }}>
              {formatFlowName(slug)}
            </Link>
            {i < path.length - 1 && <span style={{ color: '#446', fontSize: '10px' }}>→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function SystemDivider({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
      <div style={{ flex: 1, height: '1px', background: `${color}18` }} />
      <span style={{ fontSize: '9px', color: `${color}66`, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', background: `${color}18` }} />
    </div>
  );
}

// ── Discovery listing card ─────────────────────────────────────────────────

function DiscoveryCard({
  listing, walletConnected, posting, posted, postedUrl, onPost,
}: {
  listing: ParsedListing;
  walletConnected: boolean;
  posting: boolean;
  posted: boolean;
  postedUrl: string | null;
  onPost: () => void;
}) {
  const roleColor = listing.role === 'host' ? 'var(--cyan)' : '#aa88ff';
  const roleBg   = listing.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(170,136,255,0.08)';
  const roleBorder = listing.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(170,136,255,0.2)';

  return (
    <div style={{
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: '10px', overflow: 'hidden',
      background: 'rgba(167,139,250,0.04)',
    }}>
      {/* Header label */}
      <div style={{
        padding: '7px 11px 5px',
        borderBottom: '1px solid rgba(167,139,250,0.12)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ fontSize: '9px', color: '#aa88ff', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', fontWeight: 700 }}>
          Discovery listing
        </span>
        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
          color: roleColor, background: roleBg, border: `1px solid ${roleBorder}`,
          fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase',
        }}>
          {listing.role}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '9px 11px 7px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ccd', marginBottom: '5px', fontFamily: 'monospace', lineHeight: 1.4 }}>
          {listing.title}
        </div>
        <div style={{ fontSize: '10px', color: '#778', lineHeight: 1.5, marginBottom: '6px' }}>
          {listing.description}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#556', fontFamily: 'monospace' }}>
            {listing.flow.replace(/-/g, ' ')}
          </span>
          {listing.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '9px', color: '#445', padding: '0 5px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      {posted ? (
        <div style={{
          padding: '7px 11px', borderTop: '1px solid rgba(74,222,128,0.15)',
          background: 'rgba(74,222,128,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'monospace', fontWeight: 700 }}>
            ✓ Posted to Discovery
          </span>
          {postedUrl && (
            <Link to={postedUrl} style={{ fontSize: '9px', color: 'var(--green)', textDecoration: 'none', opacity: 0.8 }}>
              View matches →
            </Link>
          )}
        </div>
      ) : !walletConnected ? (
        <div style={{
          padding: '7px 11px', borderTop: '1px solid rgba(255,215,0,0.12)',
          background: 'rgba(255,215,0,0.03)',
          fontSize: '9px', color: 'rgba(255,215,0,0.7)', fontFamily: 'monospace',
        }}>
          Connect wallet (top right) to post →
        </div>
      ) : (
        <button
          onClick={onPost}
          disabled={posting}
          style={{
            display: 'block', width: '100%', padding: '7px 11px',
            borderTop: '1px solid rgba(167,139,250,0.15)',
            background: 'rgba(167,139,250,0.08)',
            border: 'none', cursor: posting ? 'default' : 'pointer',
            fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
            color: '#aa88ff', transition: 'background 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={e => { if (!posting) (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.15)'; }}
          onMouseLeave={e => { if (!posting) (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.08)'; }}
        >
          {posting ? 'Posting…' : '▶ Post to Discovery'}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const ANTHROPIC_KEY_STORAGE = 'flowfabric-anthropic-key';

export default function VelmaChatPanel({
  velmaState,
  color,
  onClose,
  onSwitchToStats,
}: {
  velmaState: VelmaState;
  color: string;
  onClose: () => void;
  onSwitchToStats: () => void;
}) {
  const { data: skills = [] } = useSkills();
  const location = useLocation();
  const navigate = useNavigate();
  const { address } = useAccount();
  const createListing = useCreateListing();

  const pathname = location.pathname;
  const search = location.search;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const history = loadChatHistory();
    if (history.length > 0) return history;
    return [openingMessage(velmaState, pathname, search)];
  });
  const [input, setInput] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [wide, setWide] = useState(false);

  // Track which message indices have been posted to Discovery
  const [postedListings, setPostedListings] = useState<Map<number, string>>(new Map()); // idx → listing url
  const [postingIdx, setPostingIdx] = useState<number | null>(null);

  // Flow mode
  const [activeFlow, setActiveFlow] = useState<{ slug: string; name: string } | null>(null);
  const [flowStartIdx, setFlowStartIdx] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chips = getChips(pathname, search, velmaState);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const userKey = () => localStorage.getItem(ANTHROPIC_KEY_STORAGE)?.trim() || '';

  // ── Post a Discovery listing from a chat message ─────────────────────────

  const handlePostListing = useCallback(async (listing: ParsedListing, msgIdx: number) => {
    if (!address || postingIdx !== null) return;
    setPostingIdx(msgIdx);
    try {
      const result = await createListing.mutateAsync({
        flowSlug: listing.flow,
        role: listing.role,
        title: listing.title,
        description: listing.description,
        tags: listing.tags,
      });
      const url = `/discover/matches?listingId=${result.id}`;
      setPostedListings(prev => new Map(prev).set(msgIdx, url));

      // Velma confirms in chat
      const confirmMsg: ChatMessage = {
        role: 'velma',
        content: 'listing_posted',
        display: `Posted. AI is scoring matches now — check your matches when ready.`,
        isSystem: true,
      };
      setMessages(prev => {
        const updated = [...prev, confirmMsg];
        saveChatHistory(updated);
        return updated;
      });
    } catch (err) {
      const errMsg: ChatMessage = {
        role: 'velma',
        content: 'listing_error',
        display: `Couldn't post the listing. (${(err as Error).message})`,
        isSystem: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setPostingIdx(null);
    }
  }, [address, postingIdx, createListing]);

  // ── Start a flow inline ──────────────────────────────────────────────────

  const startFlow = useCallback(async (slug: string, name: string) => {
    if (streaming) return;

    const divMsg: ChatMessage = {
      role: 'velma',
      content: `flow_start:${slug}`,
      display: `Running ${name}.`,
      isSystem: true,
    };

    const startIdx = messages.length + 1;
    setActiveFlow({ slug, name });
    setFlowStartIdx(startIdx);
    setStreaming(true);

    const placeholder: ChatMessage = { role: 'velma', content: '', display: '' };
    setMessages(prev => [...prev, divMsg, placeholder]);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userKey() ? { 'X-User-API-Key': userKey() } : {}),
        },
        body: JSON.stringify({
          skill_name: slug,
          messages: [{ role: 'user', content: 'Begin' }],
        }),
      });

      if (!resp.ok || !resp.body) throw new Error(`API ${resp.status}`);

      const full = await streamResponse(
        resp,
        (_, display) => {
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'velma', content: _, display },
          ]);
        },
        true,
      );

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'velma', content: full, display: full },
      ]);
    } catch (err) {
      const errMsg = `Couldn't start ${name}. (${(err as Error).message})`;
      setMessages(prev => [...prev.slice(0, -1), { role: 'velma', content: errMsg, display: errMsg }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  // ── Exit flow ────────────────────────────────────────────────────────────

  const exitFlow = useCallback(() => {
    const exitMsg: ChatMessage = {
      role: 'velma',
      content: 'flow_end',
      display: 'Back with Velma. What else can I help with?',
      isSystem: true,
    };
    setMessages(prev => {
      const updated = [...prev, exitMsg];
      saveChatHistory(updated);
      return updated;
    });
    setActiveFlow(null);
    setFlowStartIdx(0);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────

  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userContent = pasteText.trim()
      ? `Context I'm sharing:\n\n${pasteText.trim()}\n\n---\n\n${text}`
      : text;

    const userMsg: ChatMessage = { role: 'user', content: userContent, display: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setPasteText('');
    setPasteMode(false);
    setStreaming(true);

    const placeholder: ChatMessage = { role: 'velma', content: '', display: '' };
    setMessages(prev => [...prev, placeholder]);

    try {
      let resp: Response;

      if (activeFlow) {
        const flowHistory = updatedMessages
          .slice(flowStartIdx)
          .filter(m => !m.isSystem)
          .map(m => ({ role: m.role === 'velma' ? 'assistant' : 'user', content: m.content }));

        resp = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userKey() ? { 'X-User-API-Key': userKey() } : {}),
          },
          body: JSON.stringify({ skill_name: activeFlow.slug, messages: flowHistory }),
        });
      } else {
        resp = await fetch('/api/velma', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userKey() ? { 'X-User-API-Key': userKey() } : {}),
          },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({
              role: m.role === 'velma' ? 'assistant' : 'user',
              content: m.content,
            })),
            skills: skills.map(s => ({ name: s.name, domain: s.domain, description: s.description })),
            context: { page: describeLocation(pathname, search) },
          }),
        });
      }

      if (!resp.ok || !resp.body) throw new Error(`API error ${resp.status}`);

      const isFlowMode = activeFlow !== null;
      const full = await streamResponse(
        resp,
        (raw, display, suggestions, path, listing) => {
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'velma', content: raw, display, suggestions, path, listing },
          ]);
        },
        isFlowMode,
      );

      const { display, suggestions, path, listing } = isFlowMode
        ? { display: full, suggestions: [], path: [], listing: undefined }
        : parseResponse(full);

      const finalMessages = [
        ...updatedMessages,
        { role: 'velma' as const, content: full, display, suggestions, path, listing },
      ];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      // If Velma produced a listing and we're on the discover page, auto-widen for better view
      if (listing && !wide) setWide(true);

    } catch (err) {
      const errMsg = `Something went wrong. (${(err as Error).message})`;
      setMessages(prev => [...prev.slice(0, -1), { role: 'velma', content: errMsg, display: errMsg }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, pasteText, skills, streaming, pathname, search, activeFlow, flowStartIdx, wide]);

  const send = useCallback(() => sendText(input.trim()), [sendText, input]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => {
    clearChatHistory();
    setMessages([openingMessage(velmaState, pathname, search)]);
    setInput('');
    setPasteText('');
    setPasteMode(false);
    setActiveFlow(null);
    setFlowStartIdx(0);
    setPostedListings(new Map());
  };

  const locationLabel = describeLocation(pathname, search).replace(/^the /, '');

  // ── Render ───────────────────────────────────────────────────────────────

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div style={isMobile ? {
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      maxHeight: '100dvh',
      background: 'rgba(0,8,18,0.99)',
      border: 'none',
      borderRadius: 0,
      display: 'flex', flexDirection: 'column',
      boxShadow: 'none',
      animation: 'velma-bubble-in 0.2s ease',
      overflow: 'hidden',
      zIndex: 9999,
    } : {
      position: 'absolute', bottom: '80px', right: 0,
      width: wide ? '480px' : '340px',
      background: 'rgba(0,8,18,0.97)',
      border: `1px solid ${activeFlow ? '#ffd70033' : `${color}33`}`,
      borderRadius: '14px',
      display: 'flex', flexDirection: 'column',
      maxHeight: '580px',
      boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${activeFlow ? '#ffd70011' : `${color}11`}`,
      animation: 'velma-bubble-in 0.25s ease',
      overflow: 'hidden',
      transition: 'width 0.2s ease, border-color 0.3s ease',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px',
        borderBottom: `1px solid ${activeFlow ? '#ffd70018' : `${color}18`}`,
        flexShrink: 0,
        background: activeFlow ? 'rgba(255,215,0,0.03)' : 'transparent',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: activeFlow ? '#ffd700' : color,
            boxShadow: `0 0 6px ${activeFlow ? '#ffd700' : color}`,
            animation: streaming ? 'velma-pulse 1s ease-in-out infinite' : 'none',
          }} />
          {activeFlow ? (
            <>
              <span style={{ color: '#ffd700', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>
                {activeFlow.name}
              </span>
              <button
                onClick={exitFlow}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace', color: '#ffd70077', padding: '0 4px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ffd700'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#ffd70077'}
              >
                ← Velma
              </button>
            </>
          ) : (
            <>
              <span style={{ color, fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>Velma</span>
              <span style={{ fontSize: '9px', color: '#446', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                {streaming ? 'thinking' : locationLabel}
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <button onClick={() => setWide(v => !v)} title={wide ? 'Collapse' : 'Expand'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '3px 5px', fontFamily: 'monospace', color: wide ? color : '#335', opacity: 0.8 }}>
            {wide ? '⟨' : '⟩'}
          </button>
          <button onClick={reset} title="New conversation"
            style={{ background: 'none', border: 'none', color: '#335', cursor: 'pointer', fontSize: '12px', padding: '3px 5px', fontFamily: 'monospace' }}>
            ↺
          </button>
          <button onClick={onSwitchToStats}
            style={{ background: 'none', border: 'none', color: '#446', cursor: 'pointer', fontSize: '11px', padding: '3px 5px', fontFamily: 'monospace' }}>
            stats
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#446', cursor: 'pointer', fontSize: '17px', lineHeight: 1, padding: '3px 5px' }}>
            ×
          </button>
        </div>
      </div>

      {/* Message feed */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        scrollbarWidth: 'thin', scrollbarColor: '#1a2a3a transparent',
      }}>
        {messages.map((msg, i) => {
          if (msg.isSystem) {
            const isFlowStart = msg.content.startsWith('flow_start');
            const isListing = msg.content === 'listing_posted' || msg.content === 'listing_error';
            return (
              <SystemDivider
                key={i}
                text={msg.display}
                color={isFlowStart ? '#ffd700' : isListing ? '#aa88ff' : color}
              />
            );
          }

          const isLastVelma = msg.role === 'velma' && !streaming && i === messages.length - 1 && msg.display;

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'velma' ? 'flex-start' : 'flex-end', gap: '6px' }}>

              {/* Bubble */}
              <div style={{
                maxWidth: '95%',
                background: msg.role === 'velma'
                  ? (activeFlow ? 'rgba(255,215,0,0.06)' : `${color}0e`)
                  : '#0d1e2e',
                border: `1px solid ${msg.role === 'velma'
                  ? (activeFlow ? 'rgba(255,215,0,0.15)' : `${color}22`)
                  : '#1a2a3a'}`,
                borderRadius: msg.role === 'velma' ? '4px 10px 10px 10px' : '10px 4px 10px 10px',
                padding: '8px 10px',
              }}>
                {streaming && i === messages.length - 1 && !msg.display ? (
                  <ThinkingDots color={activeFlow ? '#ffd700' : color} />
                ) : (
                  <p style={{
                    margin: 0, fontSize: '11.5px', lineHeight: 1.6,
                    color: msg.role === 'velma' ? '#bcd' : '#99b',
                    fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.display}
                  </p>
                )}
              </div>

              {/* Discovery listing card */}
              {!activeFlow && msg.listing && (
                <div style={{ width: '100%' }}>
                  <DiscoveryCard
                    listing={msg.listing}
                    walletConnected={!!address}
                    posting={postingIdx === i}
                    posted={postedListings.has(i)}
                    postedUrl={postedListings.get(i) ?? null}
                    onPost={() => handlePostListing(msg.listing!, i)}
                  />
                </div>
              )}

              {/* Flow suggestions */}
              {!activeFlow && msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ fontSize: '9px', color: '#446', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'monospace', marginTop: '2px' }}>
                    Suggested flows
                  </div>
                  {msg.suggestions.map(s => (
                    <SuggestionCard
                      key={s.slug}
                      slug={s.slug}
                      reason={s.reason}
                      color={color}
                      onClose={onClose}
                      onRun={startFlow}
                    />
                  ))}
                </div>
              )}

              {/* Path */}
              {!activeFlow && msg.path && msg.path.length > 1 && (
                <PathDisplay path={msg.path} onClose={onClose} />
              )}

              {/* View matches CTA if just posted */}
              {!activeFlow && postedListings.has(i) && (
                <button
                  onClick={() => { navigate(postedListings.get(i)!); onClose(); }}
                  style={{
                    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '8px', padding: '5px 12px',
                    fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                    color: '#aa88ff', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.08)'}
                >
                  View your matches →
                </button>
              )}

              {/* Chips */}
              {isLastVelma && !activeFlow && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                  {(i === 0 ? chips : getFollowUpChips(msg)).map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendText(chip)}
                      style={{
                        background: `${color}08`, border: `1px solid ${color}22`,
                        borderRadius: '20px', padding: '4px 10px',
                        fontSize: '10px', color: '#99b', fontFamily: 'monospace',
                        cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.4,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}18`;
                        (e.currentTarget as HTMLElement).style.borderColor = `${color}44`;
                        (e.currentTarget as HTMLElement).style.color = '#bcd';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}08`;
                        (e.currentTarget as HTMLElement).style.borderColor = `${color}22`;
                        (e.currentTarget as HTMLElement).style.color = '#99b';
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Paste area */}
      {pasteMode && (
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your resume, financial data, contract, or any document here..."
            rows={4}
            style={{
              width: '100%', resize: 'none',
              background: '#060f1a', border: `1px solid ${color}22`,
              borderRadius: '8px', padding: '8px 10px',
              fontSize: '10px', color: '#99b', fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
            }}
          />
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: `1px solid ${activeFlow ? '#ffd70018' : `${color}18`}`,
        display: 'flex', flexDirection: 'column', gap: '7px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={activeFlow ? `Reply to ${activeFlow.name}…` : 'Ask anything…'}
            rows={2}
            disabled={streaming}
            style={{
              flex: 1, resize: 'none',
              background: '#060f1a',
              border: `1px solid ${activeFlow ? 'rgba(255,215,0,0.2)' : `${color}22`}`,
              borderRadius: '8px', padding: '8px 10px',
              fontSize: '11px', color: '#bcd', fontFamily: 'monospace',
              outline: 'none', lineHeight: 1.5, opacity: streaming ? 0.5 : 1,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            style={{
              padding: '8px 12px', borderRadius: '8px',
              background: input.trim() && !streaming
                ? (activeFlow ? 'rgba(255,215,0,0.15)' : `${color}18`)
                : '#0a1624',
              border: `1px solid ${input.trim() && !streaming
                ? (activeFlow ? 'rgba(255,215,0,0.4)' : `${color}44`)
                : '#1a2a3a'}`,
              color: input.trim() && !streaming ? (activeFlow ? '#ffd700' : color) : '#334',
              cursor: input.trim() && !streaming ? 'pointer' : 'default',
              fontSize: '14px', lineHeight: 1, flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {streaming ? '…' : '↑'}
          </button>
        </div>

        {!activeFlow && (
          <button
            onClick={() => setPasteMode(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '10px', fontFamily: 'monospace', textAlign: 'left',
              color: pasteMode ? color : '#446', padding: 0, transition: 'color 0.15s',
            }}
          >
            {pasteMode ? '✓ document attached' : '+ attach document (resume, contract, data…)'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes velma-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.65; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
