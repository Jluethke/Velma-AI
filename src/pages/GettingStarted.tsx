import { Link } from 'react-router-dom';

// ── Shared style helpers ──────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '28px 32px',
};

const codeBlock: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '14px 18px',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: '13px',
  color: 'var(--cyan)',
  overflowX: 'auto' as const,
  lineHeight: 1.7,
  margin: '0',
};

const stepNum: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'rgba(56,189,248,0.1)',
  border: '1px solid rgba(56,189,248,0.25)',
  color: 'var(--cyan)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 700,
  flexShrink: 0,
};

const sectionHeading: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  marginTop: 0,
  marginBottom: '8px',
};

// ── Chat bubble components ────────────────────────────────────────

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
      <div style={{
        maxWidth: '80%',
        background: 'rgba(56,189,248,0.1)',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: '14px 14px 4px 14px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--text-primary)',
        lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
}

function ClaudeBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginBottom: '8px' }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))',
        border: '1px solid rgba(56,189,248,0.25)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: 'var(--cyan)',
        fontWeight: 700,
      }}>
        C
      </div>
      <div style={{
        maxWidth: '85%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '4px 14px 14px 14px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
      }}>
        {children}
      </div>
    </div>
  );
}

function ChatWindow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
    }}>
      {children}
    </div>
  );
}

// ── Memory tier badge ─────────────────────────────────────────────

function Tier({ label, color, tokens, desc }: { label: string; color: string; tokens: string; desc: string }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}25`,
      borderRadius: '12px',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color, fontWeight: 700, fontSize: '14px' }}>{label}</span>
        <span style={{
          background: `${color}15`,
          color,
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '20px',
          border: `1px solid ${color}30`,
        }}>{tokens}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function GettingStarted() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-24" style={{ maxWidth: '760px', margin: '0 auto' }}>

      {/* ── Quick start for Fabric users ── */}
      <div style={{
        background: 'rgba(167,139,250,0.04)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap' as const,
      }}>
        <div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>
            Just want to align with someone?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            Start a Fabric session — no install needed. Both sides answer privately, Claude shows you the neutral synthesis.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' as const }}>
          <Link to="/start" style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
            border: '1px solid rgba(167,139,250,0.4)',
            borderRadius: '10px', padding: '10px 18px',
            fontSize: '13px', fontWeight: 600, color: 'var(--purple)', textDecoration: 'none',
          }}>
            Start a session →
          </Link>
          <Link to="/discover/new" style={{
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '10px', padding: '10px 18px',
            fontSize: '13px', fontWeight: 600, color: 'var(--cyan)', textDecoration: 'none',
          }}>
            Find a counterpart →
          </Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '20px',
          padding: '4px 14px',
          fontSize: '12px',
          color: 'var(--cyan)',
          fontWeight: 600,
          marginBottom: '20px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        }}>
          Claude Desktop + MCP
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginTop: 0,
            marginBottom: '20px',
          }}
        >
          The fastest way to run flows:{' '}
          <span className="gradient-text">Claude Desktop + MCP</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.75, maxWidth: '580px', margin: '0 auto 28px' }}>
          Install once. Then just talk to Claude. Every flow in the marketplace runs as a
          natural conversation — with memory, input collection, and step-by-step execution
          built in. Here's the thing: once it's set up, you never think about it again.
          You just describe what you need.
        </p>

        {/* Two paths */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '12px' }}>
          {[
            {
              label: 'Claude Desktop (recommended)',
              desc: 'Fully automatic. Say what you need — FlowFabric runs without any special prompting. Requires Claude Pro ($20/mo) + Claude Desktop app.',
              highlight: true,
            },
            {
              label: 'claude.ai Web + MCP',
              desc: 'Works, but you must prompt explicitly — start every message with "Use FlowFabric to..." Claude won\'t pick it up automatically. Requires Claude Pro → Settings → Integrations.',
              highlight: false,
            },
            {
              label: 'Web Composer',
              desc: 'Visual drag-and-drop canvas. Build and publish pipelines on-chain. Requires TRUST token.',
              highlight: false,
            },
          ].map(path => (
            <div
              key={path.label}
              style={{
                flex: '1 1 220px',
                maxWidth: '280px',
                background: path.highlight ? 'rgba(56,189,248,0.06)' : 'var(--bg-card)',
                border: `1px solid ${path.highlight ? 'rgba(56,189,248,0.25)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left' as const,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: path.highlight ? 'var(--cyan)' : 'var(--text-primary)', marginBottom: '6px' }}>
                {path.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{path.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '28px' }}>
          This guide covers the MCP path. The web Composer has its own UI — connect a wallet with 500 TRUST to unlock it.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <Link
            to="/install"
            className="btn-primary no-underline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600 }}
          >
            Download Installer &rarr;
          </Link>
          <Link
            to="/chains"
            className="btn-secondary no-underline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
          >
            Browse Flows
          </Link>
        </div>
      </div>

      {/* ── Section 1: Install ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', fontWeight: 800, fontSize: '14px' }}>1</div>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}>Install the MCP server</h2>
        </div>

        {/* Pro requirement callout */}
        <div style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '16px', lineHeight: 1, marginTop: '2px' }}>!</span>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--gold)', fontWeight: 600, marginBottom: '4px' }}>
              Claude Pro required
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              MCP requires <strong style={{ color: 'var(--text-primary)' }}>Claude Pro ($20/mo)</strong>. <strong style={{ color: 'var(--text-primary)' }}>Claude Desktop</strong> is strongly recommended — FlowFabric runs automatically with no special prompting. On <strong style={{ color: 'var(--text-primary)' }}>claude.ai web</strong> (Settings → Integrations), it works but you must start every message with "Use FlowFabric to..." — Claude won't pick it up automatically. Free tier does not support MCP. <a href="https://claude.ai/upgrade" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Upgrade to Pro →</a>
            </p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={stepNum}>1</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '10px', marginTop: 0 }}>
                The easiest path: go to the Install page and download the one-click installer for your platform. It handles everything.
              </p>
              <Link to="/install" className="btn-primary no-underline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>
                Go to Install page &rarr;
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={stepNum}>2</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '10px', marginTop: 0 }}>
                Or add it manually. Open your Claude Desktop config file:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '10px' }}>
                <code style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
                <code style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Windows: %APPDATA%\Claude\claude_desktop_config.json
                </code>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px', marginTop: 0 }}>
                Add this block:
              </p>
              <pre style={codeBlock}>{`{
  "mcpServers": {
    "flowfabric": {
      "command": "npx",
      "args": ["-y", "@jluethke/flowfabric@latest"]
    }
  }
}`}</pre>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={stepNum}>3</div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: 0 }}>
                Restart Claude Desktop. The FlowFabric tools will appear automatically — you'll see them in the tool list when you start a new conversation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: analyze_directory ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)', fontWeight: 800, fontSize: '14px' }}>2</div>
          <h2 style={{ ...sectionHeading, marginBottom: 0, color: 'var(--text-primary)' }}>
            Let FlowFabric learn about you first
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px', paddingLeft: '44px' }}>
          This is the part most people miss. Before you start running flows, run <code style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>analyze_directory</code> once. It scans a folder of your documents — resume, notes, projects, spreadsheets — and extracts themes, keywords, and signals to recommend the most relevant flows for your actual situation, not generic ones.
        </p>

        <div style={{ ...card, borderColor: 'rgba(167,139,250,0.15)' }}>
          <h3 style={{ color: 'var(--purple)', fontSize: '14px', fontWeight: 700, marginTop: 0, marginBottom: '16px' }}>
            Why this matters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Without it', desc: 'FlowFabric recommends based on what you say in the conversation.', accent: 'var(--red)' },
              { label: 'With it', desc: 'FlowFabric recommends based on what it finds in your files — usually more accurate.', accent: 'var(--green)' },
            ].map(item => (
              <div key={item.label} style={{ background: `${item.accent}08`, border: `1px solid ${item.accent}20`, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ color: item.accent, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>{item.label}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            How to trigger it
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', marginTop: 0 }}>
            Just tell Claude in plain language. It will ask you to confirm the folder path, scan your files, and return a ranked list of recommended flows with specific reasons for each.
          </p>

          <ChatWindow>
            <UserBubble>
              Analyze my Documents folder and recommend flows for me
            </UserBubble>
            <ClaudeBubble>
              I'll scan your Documents folder now — this takes a few seconds.<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Here's what I found:</strong><br />
              Themes detected: finance, freelance, career transitions, client management<br /><br />
              Key signals: "invoice", "client", "rate", "proposal", "portfolio", "interview prep"<br /><br />
              <strong style={{ color: 'var(--purple)' }}>Recommended flows for you:</strong><br />
              1. <strong>solopreneur-engine</strong> — found "invoice", "client", "rate" across 4 files<br />
              2. <strong>freelance-rate-calculator</strong> — financial data suggests active freelancing<br />
              3. <strong>portfolio-builder</strong> — project docs detected, no published portfolio found<br />
              4. <strong>interview-coach</strong> — "interview prep" notes from 3 months ago<br /><br />
              Want me to start with solopreneur-engine? I'll walk you through it step by step.
            </ClaudeBubble>
            <UserBubble>
              Yes, let's do solopreneur-engine
            </UserBubble>
            <ClaudeBubble>
              Let's go. First, what's your primary freelance service — consulting, design, development, writing, or something else?
            </ClaudeBubble>
          </ChatWindow>
        </div>
      </div>

      {/* ── Section 3: How to use it — real conversations ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', fontWeight: 800, fontSize: '14px' }}>3</div>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}>What conversations actually look like</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px', paddingLeft: '44px' }}>
          Here's the thing about FlowFabric flows: they're not one-shot prompts. Claude collects what it needs before starting, then guides you through structured steps. Here are four real examples.
        </p>

        {/* Example 1: Resume builder */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <code style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--cyan)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              resume-builder
            </code>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>career domain</span>
          </div>
          <ChatWindow>
            <UserBubble>Build my resume</UserBubble>
            <ClaudeBubble>
              I'll run the resume-builder flow. To get started, paste your current resume below — or if you don't have one, tell me your most recent role and I'll draft from scratch.
            </ClaudeBubble>
            <UserBubble>
              [pastes current resume]
            </UserBubble>
            <ClaudeBubble>
              Got it. What role are you targeting? Give me the job title and, if you have one, paste the job description — I'll tailor the resume language to match.
            </ClaudeBubble>
            <UserBubble>
              Senior Product Manager at a Series B fintech. Here's the JD: [pastes JD]
            </UserBubble>
            <ClaudeBubble>
              <strong style={{ color: 'var(--text-primary)' }}>Step 1 of 4 — Reframing your experience</strong><br /><br />
              I'm rewriting your bullet points to use impact-first language and pull in the keywords from the JD ("risk infrastructure", "cross-functional alignment", "0-to-1").<br /><br />
              Here's the revised experience section. Review it and tell me what to adjust before I move to the skills section...
            </ClaudeBubble>
          </ChatWindow>
        </div>

        {/* Example 2: Interview prep */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <code style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--purple)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              interview-coach
            </code>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>career domain</span>
          </div>
          <ChatWindow>
            <UserBubble>Help me prep for an interview at Stripe</UserBubble>
            <ClaudeBubble>
              Running interview-coach. Paste the job description so I can tailor the questions — or tell me the role and I'll pull common questions for that function at Stripe.
            </ClaudeBubble>
            <UserBubble>
              Staff Engineer, Payments Infrastructure. Here's the JD: [pastes JD]
            </UserBubble>
            <ClaudeBubble>
              <strong style={{ color: 'var(--text-primary)' }}>Phase 1 — Company and role research</strong><br /><br />
              Stripe's engineering culture emphasizes: API design quality, reliability at scale, strong opinions on system boundaries. For this role, expect deep dives on distributed systems, failure modes, and how you've handled ambiguity at scale.<br /><br />
              First practice question: "Tell me about a time you had to make a critical infrastructure decision with incomplete information. What was your process?"<br /><br />
              Answer when ready and I'll give you detailed feedback.
            </ClaudeBubble>
            <UserBubble>
              [gives answer]
            </UserBubble>
            <ClaudeBubble>
              Strong answer. Two things to tighten: you buried the outcome — lead with "we reduced p99 latency by 40%" before explaining how. Also, the Stripe interviewer will push on tradeoffs. Add one sentence about what you would do differently. Ready for the next question?
            </ClaudeBubble>
          </ChatWindow>
        </div>

        {/* Example 3: Budget builder */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <code style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--green)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              budget-builder
            </code>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>finance domain</span>
          </div>
          <ChatWindow>
            <UserBubble>I need a budget</UserBubble>
            <ClaudeBubble>
              Running budget-builder. What's your monthly take-home after tax? Rough estimate is fine.
            </ClaudeBubble>
            <UserBubble>Around $6,800</UserBubble>
            <ClaudeBubble>
              What are your fixed monthly expenses? Include rent/mortgage, subscriptions, loan payments — anything that doesn't change month to month.
            </ClaudeBubble>
            <UserBubble>
              Rent $2,200, car $380, phone $80, gym $45, streaming $35. That's about it for fixed.
            </UserBubble>
            <ClaudeBubble>
              <strong style={{ color: 'var(--text-primary)' }}>Step 2 — Spending analysis</strong><br /><br />
              Fixed costs: $2,740/mo (40% of take-home). You have $4,060 for variable spending and savings.<br /><br />
              What's your primary financial goal right now — building an emergency fund, paying down debt, or saving toward something specific?
            </ClaudeBubble>
          </ChatWindow>
        </div>

        {/* Example 4: what_now */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <code style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--gold)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
              what_now
            </code>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>meta — uses your history</span>
          </div>
          <ChatWindow>
            <UserBubble>What should I do right now?</UserBubble>
            <ClaudeBubble>
              Calling <code style={{ color: 'var(--gold)', fontSize: '12px' }}>what_now</code> — looking at your flow history and memory...<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Based on your recent sessions:</strong><br /><br />
              1. <strong>interview-coach</strong> — you have an interview at Stripe in 4 days and you've only done Phase 1 prep. High priority.<br />
              2. <strong>resume-builder</strong> — you finished your resume last week but never exported the final version. Quick win.<br />
              3. <strong>negotiation-prep</strong> — your memory shows a target salary of $220K. Once you get the offer, you'll want this ready.<br /><br />
              I'd suggest 30 minutes on interview-coach now. Want me to pick up where you left off?
            </ClaudeBubble>
            <UserBubble>Yes, pick up from where we left off</UserBubble>
            <ClaudeBubble>
              Loading your interview-coach session from 2 days ago... You completed behavioral questions and system design. We were about to start the negotiation prep module. Ready?
            </ClaudeBubble>
          </ChatWindow>
        </div>
      </div>

      {/* ── Section 4: Memory system ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 800, fontSize: '14px' }}>4</div>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}>How memory works — and why it compounds</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', paddingLeft: '44px' }}>
          The more you use FlowFabric, the smarter it gets. This isn't a generic claim — it's structural. FlowFabric uses a 4-layer memory architecture where every flow run makes the next one better. Here's how it's built.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '24px' }}>
          <Tier
            label="L0 — Identity (always active)"
            color="var(--cyan)"
            tokens="~50 tokens"
            desc="Your name, role, primary goal, top domains. Set once in your profile, always in context. Every flow knows who you are without you repeating it. This is why you never have to introduce yourself to a new flow."
          />
          <Tier
            label="L1 — Critical Facts (always active)"
            color="var(--purple)"
            tokens="~500 tokens"
            desc={`High-priority facts FlowFabric extracts from your conversations and flow outputs: "currently interviewing at 3 companies", "target salary $180K", "budget under $200/month". These persist across sessions and get injected into every flow automatically.`}
          />
          <Tier
            label="L2 — Flow Rooms (loaded on demand)"
            color="var(--gold)"
            tokens="per-flow"
            desc="Each flow you've run has its own room — a persistent memory space with everything that happened. Run resume-builder once and your resume lives in the resume room. Next time you run interview-coach, it reads your resume room automatically. You don't carry your resume around — it's just there."
          />
          <Tier
            label="Knowledge Graph (background)"
            color="var(--green)"
            tokens="always growing"
            desc={`Every flow output is parsed for facts: entities, relationships, dates. These build a private knowledge graph that connects your data: "Meridian Systems" links to "interview", "interview" links to "salary negotiation". When you run a new flow, relevant facts surface automatically — even ones you've forgotten about.`}
          />
        </div>

        <div style={{
          background: 'rgba(251,191,36,0.04)',
          border: '1px solid rgba(251,191,36,0.12)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--gold)' }}>The compounding effect:</strong> A flow you ran last month makes your next flow better. Your resume-builder run improves interview-coach. Your budget session improves financial planning flows. The system learns your situation without you having to re-explain it.
          </p>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
          You can view and manage everything in your{' '}
          <Link to="/memory" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>
            Memory page
          </Link>
          {' '}— see what FlowFabric knows about you, edit critical facts, and clear any room.
        </p>
      </div>

      {/* ── Section 5: Tips ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', fontWeight: 800, fontSize: '14px' }}>5</div>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}>Tips for getting the most out of it</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {[
            {
              tip: 'Paste your resume once, carry it everywhere',
              detail: 'Run resume-builder first. After that, every career-related flow — interview-coach, negotiation-prep, linkedin-optimizer — reads your resume from memory automatically. You never paste it again.',
            },
            {
              tip: '"Show me the plan first" before you commit',
              detail: 'Say "show me all the steps before we start" to see the full flow plan before execution. Good for longer flows where you want to know what you\'re getting into.',
            },
            {
              tip: 'Every flow collects what it needs before starting',
              detail: 'FlowFabric never starts a flow with missing inputs — it asks first. This is by design. No half-baked outputs from incomplete context.',
            },
            {
              tip: 'Claude remembers context between steps',
              detail: 'Within a flow session, everything you say carries forward. You can reference earlier answers without repeating yourself — "use the rate I mentioned earlier" works.',
            },
            {
              tip: 'Run analyze_directory periodically',
              detail: 'If you\'ve added new documents — a new project, a job offer letter, updated financials — re-run analyze_directory. It updates your recommendations to reflect where you actually are.',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--cyan)',
                marginTop: '7px',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {item.tip}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA footer ── */}
      <div style={{
        ...card,
        background: 'linear-gradient(135deg, rgba(56,189,248,0.05), rgba(167,139,250,0.05))',
        borderColor: 'rgba(56,189,248,0.15)',
        textAlign: 'center',
      }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, marginTop: 0, marginBottom: '8px' }}>
          Ready to install?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
          Five minutes to set up. Then just talk to Claude.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <Link
            to="/install"
            className="btn-primary no-underline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 600 }}
          >
            Download Installer &rarr;
          </Link>
          <Link
            to="/chains"
            className="btn-secondary no-underline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
          >
            Browse All Flows
          </Link>
        </div>
      </div>
    </div>
  );
}
