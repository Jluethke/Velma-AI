/**
 * /record/:sessionId
 *
 * Public verification page for a completed Fabric session.
 * No account needed. Shows the synthesis output and a SHA-256
 * fingerprint that anyone can use to verify the content hasn't changed.
 * Raw answers from either party are never exposed.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PublicSession {
  id: string;
  flowSlug: string;
  title?: string;
  createdAt: number;
  host: { submitted: boolean };
  guests: { submitted: boolean }[];
  synthesis: { status: string; output?: string };
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function formatFlowName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Injected keyframes ────────────────────────────────────────────

const KEYFRAMES = `
@keyframes record-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes record-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

function injectKeyframes() {
  if (document.getElementById('record-kf')) return;
  const s = document.createElement('style');
  s.id = 'record-kf';
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

// ── Fingerprint display ───────────────────────────────────────────

function FingerprintRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '16px', padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, flexShrink: 0, paddingTop: '2px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{
          color: 'var(--text-primary)', fontSize: '12px',
          fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
          wordBreak: 'break-all', textAlign: 'right',
        }}>
          {value}
        </span>
        {mono && (
          <button
            onClick={handleCopy}
            title="Copy"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: copied ? 'var(--green)' : 'var(--text-secondary)',
              fontSize: '11px', padding: '2px 4px', flexShrink: 0,
              transition: 'color 0.2s ease',
            }}
          >
            {copied ? '✓' : '⧉'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function FabricRecord() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<PublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [recordUrl, setRecordUrl] = useState('');

  useEffect(() => {
    injectKeyframes();
    setRecordUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!sessionId) { setLoading(false); setNotFound(true); return; }
    fetch(`/api/fabric/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.synthesis?.status !== 'complete') {
          setNotFound(!data);
          setLoading(false);
          return;
        }
        setSession(data as PublicSession);
        setLoading(false);
        if (data.synthesis.output) {
          sha256hex(data.synthesis.output).then(setFingerprint);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [sessionId]);

  const partyCount = session ? 1 + (session.guests?.length ?? 0) : 0;
  const title = session?.title ?? (session?.flowSlug ? formatFlowName(session.flowSlug) : '');

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
          animation: 'record-fade-in 0.3s ease both',
        }} />
      </div>
    );
  }

  // ── Not found / incomplete ────────────────────────────────────────
  if (notFound || !session || session.synthesis.status !== 'complete') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: '480px', textAlign: 'center',
          animation: 'record-fade-up 0.5s ease both',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '20px',
          }}>
            ⊘
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 700, margin: '0 0 10px' }}>
            Record not found
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 28px' }}>
            {session && session.synthesis.status !== 'complete'
              ? 'This session hasn\'t completed synthesis yet. Both parties need to submit before a record is created.'
              : 'This record doesn\'t exist or has expired. Fabric records are retained for 7 days.'}
          </p>
          <Link to="/" style={{
            display: 'inline-block',
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: '10px', padding: '10px 20px',
            color: 'var(--purple)', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Back to FlowFabric
          </Link>
        </div>
      </div>
    );
  }

  // ── Record ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
    }}>

      {/* Glow */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,139,250,0.06) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '600px', margin: '0 auto',
        padding: '0 20px 80px',
      }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{
          paddingTop: '56px', paddingBottom: '40px',
          animation: 'record-fade-up 0.5s ease both',
        }}>

          {/* Verified badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '20px', padding: '5px 14px 5px 10px', marginBottom: '24px',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-6" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--green)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Verified Fabric Record
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text-primary)',
            lineHeight: 1.15, margin: '0 0 12px',
          }}>
            {title}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
            {partyCount} {partyCount === 1 ? 'party' : 'parties'} completed this alignment session.
            Raw answers from each side were never shared — only this synthesis.
          </p>
        </div>

        {/* ── Synthesis output ───────────────────────────────────── */}
        <div style={{
          background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: '20px', padding: '28px',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          marginBottom: '20px',
          animation: 'record-fade-up 0.5s ease 0.1s both',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            Synthesis
          </p>
          <div style={{
            color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.85,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {session.synthesis.output}
          </div>
        </div>

        {/* ── Record metadata ────────────────────────────────────── */}
        <div style={{
          background: 'rgba(28,28,34,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '4px 20px',
          marginBottom: '20px',
          animation: 'record-fade-up 0.5s ease 0.2s both',
        }}>
          <FingerprintRow label="Session ID" value={session.id} mono />
          <FingerprintRow label="Flow" value={session.flowSlug} />
          <FingerprintRow label="Completed" value={formatDate(session.createdAt)} />
          <FingerprintRow label="Parties" value={`${partyCount}`} />
          {fingerprint && (
            <FingerprintRow
              label="SHA-256 fingerprint"
              value={`${fingerprint.slice(0, 16)}…${fingerprint.slice(-8)}`}
              mono
            />
          )}
          <div style={{ padding: '12px 0' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Record URL</span>
            <p style={{
              color: 'var(--text-secondary)', fontSize: '11px',
              fontFamily: '"JetBrains Mono", monospace',
              margin: '4px 0 0', wordBreak: 'break-all',
            }}>
              {recordUrl}
            </p>
          </div>
        </div>

        {/* ── Privacy note ───────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px', padding: '16px',
          animation: 'record-fade-up 0.5s ease 0.3s both',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
            <rect x="3" y="7" width="10" height="8" rx="2" stroke="rgba(161,161,170,0.5)" strokeWidth="1.4"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="rgba(161,161,170,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
            This record contains only the neutral synthesis. Each party's private answers were used only to generate
            this output and are never stored in retrievable form or shared with any counterpart.
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{
          marginTop: '40px', textAlign: 'center',
          animation: 'record-fade-up 0.5s ease 0.4s both',
        }}>
          <Link to="/" style={{
            color: 'var(--text-secondary)', fontSize: '12px', textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Powered by FlowFabric →
          </Link>
        </div>
      </div>
    </div>
  );
}
