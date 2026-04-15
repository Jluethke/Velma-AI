/**
 * FlowStudio — Create a FlowFabric flow from natural language.
 * Uses existing flows (flow-from-workflow, prompt-to-flow-converter) as AI engines.
 */
import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSkill } from '../hooks/useSkills';

// ── Types ──────────────────────────────────────────────────────────────────

type Mode = 'description' | 'prompt';
type Tab = 'output' | 'skillmd' | 'manifest';

const DOMAINS = [
  'career', 'money', 'life', 'health', 'developer', 'business', 'legal',
  'real-estate', 'trading', 'content', 'education', 'relationships', 'home', 'meta',
];

// ── Parsing ────────────────────────────────────────────────────────────────

function parseOutput(raw: string): { skillMd: string; manifest: string } {
  // Look for fenced code blocks: ```markdown or ``` followed by # Flow Name
  const mdMatch = raw.match(/```(?:markdown|md)?\s*\n(#[\s\S]*?)```/);
  const jsonMatch = raw.match(/```(?:json)?\s*\n(\{[\s\S]*?\})\s*\n```/);

  let skillMd = '';
  let manifest = '';

  if (mdMatch) skillMd = mdMatch[1].trim();
  if (jsonMatch) {
    try { JSON.parse(jsonMatch[1]); manifest = jsonMatch[1].trim(); } catch { /* malformed */ }
  }

  // Fallback: look for # heading sections
  if (!skillMd) {
    const headingIdx = raw.search(/^# [A-Z]/m);
    if (headingIdx !== -1) {
      const afterHeading = raw.slice(headingIdx);
      const jsonStart = afterHeading.search(/^```json/m);
      skillMd = (jsonStart !== -1 ? afterHeading.slice(0, jsonStart) : afterHeading).trim();
    }
  }

  return { skillMd, manifest };
}

// ── System prompt builder ──────────────────────────────────────────────────

function buildSystemPrompt(skillContent: string, mode: Mode): string {
  const modeInstruction = mode === 'description'
    ? 'The user will describe a flow they want to create in plain language. Your job is to convert that description into a complete, publishable FlowFabric flow following the standard below.'
    : 'The user will provide an existing prompt or workflow they use. Your job is to convert it into a complete, publishable FlowFabric flow following the standard below.';

  return `${skillContent}

---
${modeInstruction}

When you have gathered enough information, output:
1. The complete skill.md content in a \`\`\`markdown code block
2. The complete manifest.json in a \`\`\`json code block

The manifest.json must include: name (slug, lowercase-hyphens), version ("1.0.0"), domain, tags (array), inputs (array), outputs (array), execution_pattern ("phase_pipeline" or "orpa"), price ("0"), license ("OPEN"), description (1-2 sentences).`;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function FlowStudio({ embedded }: { embedded?: boolean } = {}) {
  const [mode, setMode] = useState<Mode>('description');
  const [input, setInput] = useState('');
  const [domain, setDomain] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('output');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Load the appropriate skill's content
  const skillName = mode === 'description' ? 'flow-from-workflow' : 'prompt-to-flow-converter';
  const { data: skillData } = useSkill(skillName);

  const { skillMd, manifest } = parseOutput(output);

  const generate = useCallback(async () => {
    if (!input.trim() || streaming) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setOutput('');
    setStreaming(true);
    setActiveTab('output');
    setSubmitted(false);

    const userKey = localStorage.getItem('flowfabric-anthropic-key')?.trim() || '';
    const systemPrompt = skillData?.content
      ? buildSystemPrompt(skillData.content, mode)
      : `You are a FlowFabric flow generator. Convert the user's description into a complete FlowFabric flow with skill.md and manifest.json.`;

    const domainHint = domain ? `\n\nDomain: ${domain}` : '';
    const userMessage = input.trim() + domainHint;

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        signal: abort.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(userKey ? { 'X-User-API-Key': userKey } : {}),
        },
        body: JSON.stringify({
          skill_name: skillName,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
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
            if (delta) { full += delta; setOutput(full); }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setOutput(`Error: ${(err as Error).message}`);
      }
    } finally {
      setStreaming(false);
    }
  }, [input, domain, mode, skillData, skillName, streaming]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const hasOutput = output.length > 0;
  const hasParsed = skillMd.length > 0 || manifest.length > 0;

  return (
    <div className={embedded ? 'pb-16 px-4' : 'min-h-screen pt-24 pb-20 px-4'} style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div className="mb-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Flow Studio
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Create a flow
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          Describe what you want your flow to do. AI generates a complete, publishable flow definition
          following the FlowFabric standard — phases, quality gates, error handling, manifest.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['description', 'prompt'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
              fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s',
              background: mode === m ? 'var(--cyan)' : 'var(--bg-card)',
              color: mode === m ? '#000' : 'var(--text-secondary)',
              border: mode === m ? '1px solid var(--cyan)' : '1px solid var(--border)',
              fontWeight: mode === m ? 700 : 400,
            }}
          >
            {m === 'description' ? 'From description' : 'From existing prompt'}
          </button>
        ))}
      </div>

      {/* Input form */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', borderRadius: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {mode === 'description' ? 'What should this flow do?' : 'Paste your existing prompt'}
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === 'description'
            ? 'e.g. "Help someone figure out whether to quit their job. Ask about their situation, finances, goals. Give them a clear recommendation with pros/cons."'
            : 'Paste your working prompt here — the one that consistently gives you good results...'}
          rows={6}
          style={{
            width: '100%', resize: 'vertical', boxSizing: 'border-box',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '12px',
            fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6,
            fontFamily: mode === 'prompt' ? 'monospace' : 'inherit',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '8px 12px',
              fontSize: '12px', color: domain ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'monospace', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">Domain (optional)</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <button
            onClick={generate}
            disabled={!input.trim() || streaming}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: '8px', cursor: input.trim() && !streaming ? 'pointer' : 'default',
              background: input.trim() && !streaming ? 'var(--cyan)' : 'var(--bg-secondary)',
              color: input.trim() && !streaming ? '#000' : 'var(--text-secondary)',
              border: 'none', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
          >
            {streaming ? 'Generating…' : 'Generate Flow'}
          </button>
        </div>
      </div>

      {/* Output section */}
      {hasOutput && (
        <div className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {([
              { key: 'output', label: 'Raw output' },
              ...(hasParsed ? [
                { key: 'skillmd', label: 'skill.md' },
                { key: 'manifest', label: 'manifest.json' },
              ] : []),
            ] as { key: Tab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontFamily: 'monospace',
                  color: activeTab === tab.key ? 'var(--cyan)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--cyan)' : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {streaming && (
              <span style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--cyan)', opacity: 0.7 }}>
                generating…
              </span>
            )}
          </div>

          {/* Tab content */}
          <div style={{ padding: '16px', position: 'relative' }}>

            {/* Copy button */}
            {activeTab !== 'output' && (
              <button
                onClick={() => copy(activeTab === 'skillmd' ? skillMd : manifest, activeTab)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '4px 10px',
                  fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer',
                  color: copied === activeTab ? 'var(--green)' : 'var(--text-secondary)',
                  transition: 'color 0.15s',
                }}
              >
                {copied === activeTab ? 'Copied!' : 'Copy'}
              </button>
            )}

            {activeTab === 'output' && (
              <pre style={{
                margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontSize: '12px', lineHeight: 1.7,
                color: 'var(--text-primary)', fontFamily: 'monospace',
                maxHeight: '520px', overflowY: 'auto',
              }}>
                {output}{streaming ? '▋' : ''}
              </pre>
            )}

            {activeTab === 'skillmd' && (
              <pre style={{
                margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontSize: '12px', lineHeight: 1.7,
                color: 'var(--text-primary)', fontFamily: 'monospace',
                maxHeight: '520px', overflowY: 'auto',
                paddingRight: '60px',
              }}>
                {skillMd || '(not yet parsed — check Raw output tab)'}
              </pre>
            )}

            {activeTab === 'manifest' && (
              <pre style={{
                margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontSize: '12px', lineHeight: 1.7,
                color: 'var(--text-primary)', fontFamily: 'monospace',
                maxHeight: '520px', overflowY: 'auto',
                paddingRight: '60px',
              }}>
                {manifest || '(not yet parsed — check Raw output tab)'}
              </pre>
            )}
          </div>

          {/* Action bar */}
          {!streaming && hasParsed && (
            <div style={{
              padding: '12px 16px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
            }}>
              {!submitted ? (
                <>
                  <button
                    onClick={() => setSubmitted(true)}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                      background: 'var(--cyan)', color: '#000',
                      border: 'none', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace',
                    }}
                  >
                    Submit to Marketplace
                  </button>
                  <button
                    onClick={() => { setOutput(''); setActiveTab('output'); }}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: 'none', color: 'var(--text-secondary)',
                      border: '1px solid var(--border)', fontSize: '12px', fontFamily: 'monospace',
                    }}
                  >
                    Start over
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                    Copy the files → submit via{' '}
                    <a href="https://github.com/Jluethke/Velma-AI" target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
                      GitHub PR
                    </a>
                    {' '}or{' '}
                    <Link to="/portal/marketplace" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
                      portal
                    </Link>
                  </span>
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <div style={{
                    background: 'rgba(0,229,100,0.06)', border: '1px solid rgba(0,229,100,0.2)',
                    borderRadius: '10px', padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', fontFamily: 'monospace', marginBottom: '8px' }}>
                      Next: submit your flow
                    </div>
                    <ol style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                      <li>Copy the <strong style={{ color: 'var(--text-primary)' }}>skill.md</strong> and <strong style={{ color: 'var(--text-primary)' }}>manifest.json</strong> from the tabs above</li>
                      <li>Create a folder <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: '3px' }}>marketplace/your-flow-name/</code> in the repo</li>
                      <li>Add both files + open a PR, or use the{' '}
                        <Link to="/portal/marketplace" style={{ color: 'var(--cyan)' }}>portal submission</Link>
                      </li>
                    </ol>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <a
                        href="https://github.com/Jluethke/Velma-AI"
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                          fontFamily: 'monospace', fontWeight: 700, textDecoration: 'none',
                          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        Open GitHub →
                      </a>
                      <button
                        onClick={() => { copy(skillMd, 'skillmd-submit'); copy(manifest, 'manifest-submit'); }}
                        style={{
                          padding: '6px 14px', borderRadius: '6px', fontSize: '11px',
                          fontFamily: 'monospace', fontWeight: 700,
                          background: 'none', color: 'var(--text-secondary)',
                          border: '1px solid var(--border)', cursor: 'pointer',
                        }}
                      >
                        Copy both files
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state / helper */}
      {!hasOutput && !streaming && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          color: 'var(--text-secondary)', fontSize: '13px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⚡</div>
          <div style={{ marginBottom: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Powered by{' '}
            <Link to="/flow/flow-from-workflow" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
              flow-from-workflow
            </Link>
            {' '}and{' '}
            <Link to="/flow/prompt-to-flow-converter" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
              prompt-to-flow-converter
            </Link>
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
            Outputs a complete skill.md + manifest.json following the FlowFabric execution standard.<br />
            Quality-check with{' '}
            <Link to="/flow/flow-quality-scorer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>flow-quality-scorer</Link>
            {' '}· Improve with{' '}
            <Link to="/flow/flow-improver" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>flow-improver</Link>
          </div>
        </div>
      )}
    </div>
  );
}
