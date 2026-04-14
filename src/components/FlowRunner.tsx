/**
 * FlowRunner — simple chat interface for running a flow.
 * User describes their situation, AI streams structured output.
 * No phase parsing, no form fields, no friction.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import Badge from './Badge';

interface FlowRunnerProps {
  skillName: string;
  skillDescription: string;
  skillContent: string;
  skillManifest: Record<string, unknown>;
  domain?: string;
  onClose: () => void;
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
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll output as it streams
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus textarea on open
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const run = async () => {
    if (!input.trim() || status === 'running') return;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStatus('running');
    setOutput('');
    setError('');

    const systemPrompt = `You are running the "${skillName}" flow.

${skillDescription}

The user will describe their situation. Execute the full flow for them — work through each phase step by step, showing your analysis and delivering structured, actionable output. Use markdown formatting with clear headers for each section. Be thorough, specific, and practical.`;

    const userKey = typeof window !== 'undefined'
      ? localStorage.getItem('flowfabric-anthropic-key') ?? ''
      : '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userKey ? { 'X-User-API-Key': userKey } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: input.trim() }],
          system: systemPrompt,
          skill_name: skillName,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setStatus('error');
          setError('API_KEY_REQUIRED');
          return;
        }
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
              setOutput(fullText);
            }
          } catch { /* skip */ }
        }
      }

      setStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error');
      setError((err as Error).message);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStatus('done');
  };

  const reset = () => {
    abortRef.current?.abort();
    setOutput('');
    setInput('');
    setStatus('idle');
    setError('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

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
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold gradient-text">{skillName}</span>
            {domain && <Badge label={domain} variant="domain" />}
            {status === 'running' && (
              <span className="text-xs animate-pulse" style={{ color: 'var(--cyan)' }}>running...</span>
            )}
            {status === 'done' && (
              <span className="text-xs" style={{ color: 'var(--green)' }}>complete</span>
            )}
          </div>
          <div className="flex gap-2">
            {status === 'running' && (
              <button onClick={stop} className="btn-secondary text-xs px-3 py-1.5 cursor-pointer" style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}>
                Stop
              </button>
            )}
            {(status === 'done' || status === 'error') && (
              <button onClick={reset} className="btn-secondary text-xs px-3 py-1.5 cursor-pointer" style={{ color: 'var(--cyan)' }}>
                Run Again
              </button>
            )}
            <button onClick={onClose} className="btn-secondary text-xs px-3 py-1.5 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              Close
            </button>
          </div>
        </div>

        {/* Output area */}
        <div ref={outputRef} className="flex-1 overflow-y-auto px-5 py-5" style={{ minHeight: 0 }}>

          {/* Idle: description */}
          {status === 'idle' && (
            <div className="mb-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {skillDescription}
              </p>
            </div>
          )}

          {/* Output streaming */}
          {(status === 'running' || status === 'done') && output && (
            <div className="mb-4">
              <RichText text={output} />
              {status === 'running' && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: 'var(--cyan)', borderRadius: '1px' }} />
              )}
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            error === 'API_KEY_REQUIRED' ? (
              <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="text-2xl mb-3">🔑</div>
                <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>API Key Required</h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                  FlowFabric needs an Anthropic API key to run flows. New accounts get free credits.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-lg text-xs font-semibold no-underline"
                    style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--gold)' }}>
                    Get a free key →
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--red)' }}>Error</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            )
          )}
        </div>

        {/* Input area */}
        {(status === 'idle' || status === 'running') && (
          <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
                }}
                placeholder={`Describe your situation for ${skillName.replace(/-/g, ' ')}...`}
                rows={3}
                disabled={status === 'running'}
                className="w-full resize-none outline-none pr-20"
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  opacity: status === 'running' ? 0.5 : 1,
                }}
              />
              <button
                onClick={run}
                disabled={!input.trim() || status === 'running'}
                className="absolute right-3 bottom-3 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: input.trim() && status !== 'running' ? 'rgba(0,255,200,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${input.trim() && status !== 'running' ? 'rgba(0,255,200,0.4)' : 'var(--border)'}`,
                  color: input.trim() && status !== 'running' ? 'var(--cyan)' : 'var(--text-secondary)',
                  opacity: !input.trim() || status === 'running' ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {status === 'running' ? '...' : 'Run ↵'}
              </button>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
              Cmd+Enter to run · Powered by {typeof window !== 'undefined' && localStorage.getItem('flowfabric-anthropic-key') ? 'Claude' : 'Gemini'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
