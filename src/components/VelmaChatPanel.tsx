/**
 * VelmaChatPanel — Velma's interview / discovery mode.
 * Context-aware: knows what page you're on and what you've done.
 * Quick-tap chips so you don't have to type from scratch.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSkills } from '../hooks/useSkills';
import { formatFlowName } from '../utils/formatFlowName';
import type { VelmaState } from '../hooks/useVelmaCompanion';

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'velma' | 'user';
  content: string;
  display: string;
  suggestions?: FlowSuggestion[];
  path?: string[];
}

interface FlowSuggestion {
  slug: string;
  reason: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

/** Describe the current page in human terms */
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
  if (pathname.startsWith('/compose')) return 'the chain composer';
  if (pathname.startsWith('/chains')) return 'the chains library';
  if (pathname.startsWith('/discover')) return 'Fabric Discovery';
  if (pathname.startsWith('/fabric/')) return 'a live Fabric session';
  if (pathname.startsWith('/portal')) return 'the portal';
  if (pathname.startsWith('/dashboard')) return 'your dashboard';
  if (pathname.startsWith('/profile')) return 'your profile';
  if (pathname.startsWith('/install')) return 'the install guide';
  if (pathname.startsWith('/pricing')) return 'the pricing page';
  if (pathname.startsWith('/get-started')) return 'the getting-started guide';
  return 'FlowFabric';
}

/** Opening chips — vary by page and user state */
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
  if (pathname.startsWith('/discover')) {
    return ['How does Discovery work?', 'I need help posting', 'Finding the right match'];
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

/** Follow-up chips — shown after each Velma response, tailored to what she said */
function getFollowUpChips(msg: ChatMessage): string[] {
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
  // Velma asked a question or gave general advice — offer escape hatches
  return ["Give me more detail", "That doesn't quite fit", "What should I do first?"];
}

/** Parse FLOWS: and PATH: sections out of Velma's response */
function parseResponse(raw: string): { display: string; suggestions: FlowSuggestion[]; path: string[] } {
  const flowsMatch = raw.match(/FLOWS:\s*\n([\s\S]*?)(?:\n\nPATH:|$)/);
  const pathMatch = raw.match(/PATH:\s*([^\n]+)/);

  const suggestions: FlowSuggestion[] = [];
  if (flowsMatch?.[1]) {
    for (const line of flowsMatch[1].split('\n')) {
      const m = line.match(/^[-*]\s*([a-z0-9-]+):\s*(.+)/);
      if (m) suggestions.push({ slug: m[1].trim(), reason: m[2].trim() });
    }
  }

  const path = pathMatch?.[1]
    ? pathMatch[1].split(/→|->/).map(s => s.trim()).filter(Boolean)
    : [];

  const display = raw
    .replace(/\n*FLOWS:\s*\n[\s\S]*?(?=\n\nPATH:|$)/, '')
    .replace(/\n*PATH:[^\n]+/, '')
    .trim();

  return { display, suggestions, path };
}

function openingMessage(state: VelmaState, pathname: string, search: string): ChatMessage {
  const lastFlow = state.witnessed.slice().reverse()
    .find(e => e.startsWith('flow_complete:'))?.replace('flow_complete:', '');
  const page = describeLocation(pathname, search);

  let text: string;
  if (state.flows_run === 0) {
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

// ── ThinkingDots ───────────────────────────────────────────────────────────

function ThinkingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: color, opacity: 0.65, display: 'inline-block',
            animation: `velma-dot-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Flow suggestion card ───────────────────────────────────────────────────

function SuggestionCard({ slug, reason, color, onClose }: {
  slug: string; reason: string; color: string; onClose: () => void;
}) {
  return (
    <Link
      to={`/flow/${slug}`}
      onClick={onClose}
      style={{
        display: 'block', textDecoration: 'none',
        background: `${color}08`, border: `1px solid ${color}28`,
        borderRadius: '9px', padding: '9px 11px',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}55`;
        (e.currentTarget as HTMLElement).style.background = `${color}12`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}28`;
        (e.currentTarget as HTMLElement).style.background = `${color}08`;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'monospace' }}>
          {formatFlowName(slug)}
        </span>
        <span style={{ fontSize: '9px', color, opacity: 0.7, flexShrink: 0 }}>Run →</span>
      </div>
      <p style={{ margin: 0, fontSize: '10px', color: '#889', lineHeight: 1.4 }}>{reason}</p>
    </Link>
  );
}

// ── Path display ───────────────────────────────────────────────────────────

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
            <Link
              to={`/flow/${slug}`}
              onClick={onClose}
              style={{
                fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                color: '#ffd700', textDecoration: 'none',
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: '6px', padding: '2px 7px',
              }}
            >
              {formatFlowName(slug)}
            </Link>
            {i < path.length - 1 && <span style={{ color: '#446', fontSize: '10px' }}>→</span>}
          </span>
        ))}
      </div>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chips = getChips(pathname, search, velmaState);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

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
      const userKey = localStorage.getItem(ANTHROPIC_KEY_STORAGE)?.trim() || '';
      const resp = await fetch('/api/velma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userKey ? { 'X-User-API-Key': userKey } : {}),
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

      if (!resp.ok || !resp.body) throw new Error(`API error ${resp.status}`);

      const reader = resp.body.getReader();
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
              const { display, suggestions, path } = parseResponse(full);
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'velma', content: full, display, suggestions, path },
              ]);
            }
          } catch { /* skip */ }
        }
      }

      const { display, suggestions, path } = parseResponse(full);
      const finalMessages = [
        ...updatedMessages,
        { role: 'velma' as const, content: full, display, suggestions, path },
      ];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (err) {
      const errMsg = `Something went wrong. (${(err as Error).message})`;
      setMessages(prev => [...prev.slice(0, -1), { role: 'velma', content: errMsg, display: errMsg }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, pasteText, skills, streaming, pathname, search]);

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
  };

  const locationLabel = describeLocation(pathname, search)
    .replace(/^the /, '')
    .replace(' (create new flows)', '');

  return (
    <div style={{
      position: 'absolute', bottom: '80px', right: 0,
      width: wide ? '480px' : '340px',
      background: 'rgba(0,8,18,0.97)',
      border: `1px solid ${color}33`,
      borderRadius: '14px',
      display: 'flex', flexDirection: 'column',
      maxHeight: '580px',
      boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${color}11`,
      animation: 'velma-bubble-in 0.25s ease',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: `1px solid ${color}18`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: color, boxShadow: `0 0 6px ${color}`,
            animation: streaming ? 'velma-pulse 1s ease-in-out infinite' : 'none',
          }} />
          <span style={{ color, fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>Velma</span>
          <span style={{ fontSize: '9px', color: '#446', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            {streaming ? 'thinking' : locationLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <button
            onClick={() => setWide(v => !v)}
            title={wide ? 'Collapse' : 'Expand'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '3px 5px', fontFamily: 'monospace', color: wide ? color : '#335', opacity: 0.8, transition: 'color 0.15s' }}
          >
            {wide ? '⟨' : '⟩'}
          </button>
          <button onClick={reset} title="New conversation"
            style={{ background: 'none', border: 'none', color: '#335', cursor: 'pointer', fontSize: '12px', padding: '3px 5px', fontFamily: 'monospace' }}>
            ↺
          </button>
          <button onClick={onSwitchToStats} title="View stats"
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
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'velma' ? 'flex-start' : 'flex-end', gap: '6px' }}>

            {/* Message bubble */}
            <div style={{
              maxWidth: '95%',
              background: msg.role === 'velma' ? `${color}0e` : '#0d1e2e',
              border: `1px solid ${msg.role === 'velma' ? `${color}22` : '#1a2a3a'}`,
              borderRadius: msg.role === 'velma' ? '4px 10px 10px 10px' : '10px 4px 10px 10px',
              padding: '8px 10px',
            }}>
              {streaming && i === messages.length - 1 && !msg.display ? (
                <ThinkingDots color={color} />
              ) : (
                <p style={{
                  margin: 0, fontSize: '11.5px', lineHeight: 1.55,
                  color: msg.role === 'velma' ? '#bcd' : '#99b',
                  fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                }}>
                  {msg.display}
                </p>
              )}
            </div>

            {/* Flow suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontSize: '9px', color: '#446', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'monospace', marginTop: '2px' }}>
                  Suggested flows
                </div>
                {msg.suggestions.map(s => (
                  <SuggestionCard key={s.slug} slug={s.slug} reason={s.reason} color={color} onClose={onClose} />
                ))}
              </div>
            )}

            {/* Suggested path */}
            {msg.path && msg.path.length > 1 && (
              <PathDisplay path={msg.path} onClose={onClose} />
            )}

            {/* Chips — opening chips on first message, follow-up chips on all later messages */}
            {msg.role === 'velma' && !streaming && i === messages.length - 1 && msg.display && (
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
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Paste document area */}
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
        padding: '10px 12px', borderTop: `1px solid ${color}18`,
        display: 'flex', flexDirection: 'column', gap: '7px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything…"
            rows={2}
            disabled={streaming}
            style={{
              flex: 1, resize: 'none',
              background: '#060f1a', border: `1px solid ${color}22`,
              borderRadius: '8px', padding: '8px 10px',
              fontSize: '11px', color: '#bcd', fontFamily: 'monospace',
              outline: 'none', lineHeight: 1.5,
              opacity: streaming ? 0.5 : 1,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            style={{
              padding: '8px 12px', borderRadius: '8px',
              background: input.trim() && !streaming ? `${color}18` : '#0a1624',
              border: `1px solid ${input.trim() && !streaming ? `${color}44` : '#1a2a3a'}`,
              color: input.trim() && !streaming ? color : '#334',
              cursor: input.trim() && !streaming ? 'pointer' : 'default',
              fontSize: '14px', lineHeight: 1, flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {streaming ? '…' : '↑'}
          </button>
        </div>

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
