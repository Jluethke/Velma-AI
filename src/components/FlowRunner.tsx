/**
 * FlowRunner — conversational chat interface for running a flow.
 * AI starts immediately by asking what it needs. User replies. Multi-turn.
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Badge from './Badge';
import { useVelma } from '../contexts/VelmaContext';

interface FlowRunnerProps {
  skillName: string;
  skillDescription: string;
  skillContent: string;
  skillManifest: Record<string, unknown>;
  domain?: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/* ── Markdown-lite renderer ─────────────────────────────────────── */
function RichText({ text }: { text: string }) {
  const html = useMemo(() => {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^#### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-size:0.85rem;color:var(--text-primary)">$1</h4>')
      .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 4px;font-size:0.9rem;color:var(--cyan)">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 6px;font-size:0.95rem;font-weight:600;color:var(--cyan)">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^(\s*)[-*] (.+)$/gm, '$1<li style="margin-left:16px;list-style:disc;margin-bottom:3px">$2</li>')
      .replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li style="margin-left:16px;list-style:decimal;margin-bottom:3px">$2</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }, [text]);

  return (
    <div
      className="text-sm leading-relaxed"
      style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function FlowRunner({ skillName, skillDescription, domain, onClose }: FlowRunnerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const velma = useVelma();

  const systemPrompt = `You are running the "${skillName}" flow.

${skillDescription}

This is a conversational flow. Greet the user briefly, then immediately ask the specific questions you need to execute this flow well. Ask only what you need — don't overwhelm them. Once you have enough information, produce the full structured output with clear sections. Be thorough, specific, and actionable. Use markdown for formatting.`;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const send = useCallback(async (userMessage: string, history: Message[]) => {
    if (streaming) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStreaming(true);
    setStreamingText('');
    setError('');

    const userKey = typeof window !== 'undefined'
      ? localStorage.getItem('flowfabric-anthropic-key') ?? ''
      : '';

    // Build messages array: history + new user message
    const apiMessages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userKey ? { 'X-User-API-Key': userKey } : {}),
        },
        body: JSON.stringify({
          messages: apiMessages,
          system: systemPrompt,
          skill_name: skillName,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        if (response.status === 401) { setError('API_KEY_REQUIRED'); setStreaming(false); return; }
        const err = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setStreamingText(fullText);
            }
          } catch { /* skip */ }
        }
      }

      // Commit the streamed message into history
      // Fire witnessFlowComplete once — on the first user-driven response (not the auto-start)
      setMessages(prev => {
        if (prev.length > 0 && !completedRef.current) {
          completedRef.current = true;
          velma.witnessFlowComplete(skillName, domain);
        }
        return [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: fullText },
        ];
      });
      setStreamingText('');
      setStreaming(false);
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setStreaming(false); return; }
      setError((err as Error).message);
      setStreaming(false);
    }
  }, [streaming, systemPrompt, skillName]);

  // Auto-start: AI opens the conversation
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    velma.witnessFlowStart(skillName, domain);
    send(`Start the ${skillName.replace(/-/g, ' ')} flow now.`, []);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    send(text, messages);
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setInput('');
    setError('');
    startedRef.current = false;
    completedRef.current = false;
    // Re-trigger auto-start
    setTimeout(() => {
      startedRef.current = true;
      velma.witnessFlowStart(skillName, domain);
      send(`Start the ${skillName.replace(/-/g, ' ')} flow now.`, []);
    }, 50);
  };

  const hasContent = messages.length > 0 || streamingText || streaming;

  return (
    <div
      className="fixed inset-0 z-[998] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl flex flex-col animate-fade-in-up"
        style={{ maxHeight: '92dvh', height: '92dvh', borderTop: '2px solid rgba(0,255,200,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,rgba(0,255,200,0.04),rgba(170,136,255,0.04))' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-semibold gradient-text truncate">{skillName.replace(/-/g, ' ')}</span>
            {domain && <span className="shrink-0"><Badge label={domain} variant="domain" /></span>}
            {streaming && (
              <span className="text-xs animate-pulse shrink-0" style={{ color: 'var(--cyan)' }}>...</span>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {hasContent && !streaming && (
              <button onClick={reset} className="btn-secondary text-xs px-2.5 py-1.5 cursor-pointer" style={{ color: 'var(--cyan)' }}>
                ↺
              </button>
            )}
            {streaming && (
              <button
                onClick={() => { abortRef.current?.abort(); setStreaming(false); }}
                className="btn-secondary text-xs px-2.5 py-1.5 cursor-pointer"
                style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}
              >
                ■
              </button>
            )}
            <button onClick={onClose} className="btn-secondary text-xs px-2.5 py-1.5 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: 0 }}>

          {/* API key error */}
          {error === 'API_KEY_REQUIRED' && (
            <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="text-2xl mb-3">🔑</div>
              <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>API Key Required</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                FlowFabric needs an Anthropic API key. New accounts get free credits.
              </p>
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                className="px-4 py-2 rounded-lg text-xs font-semibold no-underline"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--gold)' }}>
                Get a free key →
              </a>
            </div>
          )}

          {/* Generic error */}
          {error && error !== 'API_KEY_REQUIRED' && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--red)' }}>Error</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          )}

          {/* Committed messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3"
                style={msg.role === 'user' ? {
                  background: 'rgba(0,255,200,0.1)',
                  border: '1px solid rgba(0,255,200,0.2)',
                } : {
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                ) : (
                  <RichText text={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Streaming assistant message */}
          {(streaming || streamingText) && (
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                {streamingText ? (
                  <>
                    <RichText text={streamingText} />
                    <span className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: 'var(--cyan)', borderRadius: '1px' }} />
                  </>
                ) : (
                  <div className="flex gap-1 py-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cyan)', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); }
                if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={streaming ? 'AI is thinking...' : 'Reply...'}
              rows={2}
              disabled={streaming || !!error}
              className="w-full resize-none outline-none pr-20"
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                opacity: streaming || !!error ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || !!error}
              className="absolute right-3 bottom-3 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: input.trim() && !streaming ? 'rgba(0,255,200,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${input.trim() && !streaming ? 'rgba(0,255,200,0.4)' : 'var(--border)'}`,
                color: input.trim() && !streaming ? 'var(--cyan)' : 'var(--text-secondary)',
                opacity: !input.trim() || streaming ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              Send
            </button>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
