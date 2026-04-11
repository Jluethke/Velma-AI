/**
 * /start — Host session creation front door.
 * Pick a use case, give it a name, create the session, share the guest link.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useVelma } from '../contexts/VelmaContext';

// ── Session storage ───────────────────────────────────────────────────────────

export interface StoredSession {
  id: string;
  hostToken: string;
  guestTokens: string[];
  title: string;
  flowSlug: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_KEY = 'flowfabric-sessions-v1';
export const API_KEY_STORAGE = 'flowfabric-anthropic-key';

export function getSavedSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch { return []; }
}

function saveSession(s: StoredSession) {
  const all = getSavedSessions().filter(x => x.id !== s.id);
  localStorage.setItem(SESSION_KEY, JSON.stringify([s, ...all].slice(0, 20)));
}

// ── Use-case cards ────────────────────────────────────────────────────────────

interface UseCase {
  slug: string;
  label: string;
  description: string;
  example: string;
  color: string;
  icon: string;
}

const USE_CASES: UseCase[] = [
  {
    slug: 'freelance-brief',
    label: 'Hire a freelancer',
    description: 'Align on scope, rate, timeline, and deliverables before signing anything.',
    example: 'e.g. "Logo design for a fintech startup"',
    color: 'var(--cyan)',
    icon: '🤝',
  },
  {
    slug: 'co-founder-alignment',
    label: 'Co-founder alignment',
    description: 'Get both visions, equity expectations, and working styles on the table before you build.',
    example: 'e.g. "Joining forces on a B2B SaaS idea"',
    color: 'var(--purple)',
    icon: '🚀',
  },
  {
    slug: 'contract-scope-alignment',
    label: 'Contract / negotiation',
    description: 'Understand each side\'s firm limits and flexible positions before the hard conversation.',
    example: 'e.g. "Agency retainer terms"',
    color: 'var(--green)',
    icon: '📋',
  },
  {
    slug: 'kitchen-renovation',
    label: 'Home project',
    description: 'Builder and homeowner align on scope, budget, timeline, and expectations upfront.',
    example: 'e.g. "Kitchen renovation in Austin"',
    color: 'var(--gold)',
    icon: '🏠',
  },
  {
    slug: 'salary-negotiation',
    label: 'Job offer / salary',
    description: 'Both sides understand priorities before the conversation — less awkward, better outcome.',
    example: 'e.g. "Senior engineer offer"',
    color: 'var(--cyan)',
    icon: '💼',
  },
  {
    slug: 'partnership',
    label: 'Business partnership',
    description: 'Two companies or individuals exploring a joint venture, referral deal, or integration.',
    example: 'e.g. "Co-marketing arrangement"',
    color: 'var(--purple)',
    icon: '🔗',
  },
];

// ── Created state ─────────────────────────────────────────────────────────────

function SessionCreated({
  session,
  useCase,
  onEnter,
}: {
  session: StoredSession;
  useCase: UseCase;
  onEnter: () => void;
}) {
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedGuest, setCopiedGuest] = useState(false);
  const { witnessEvent } = useVelma();

  const base = window.location.origin;
  const hostUrl = `${base}/fabric/${session.id}?hostToken=${session.hostToken}`;
  const guestUrl = `${base}/fabric/${session.id}?guestToken=${session.guestTokens[0]}`;

  const copy = (text: string, which: 'host' | 'guest') => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'host') {
        setCopiedHost(true);
        setTimeout(() => setCopiedHost(false), 2000);
      } else {
        setCopiedGuest(true);
        setTimeout(() => setCopiedGuest(false), 2000);
        witnessEvent('guest_link_copied', 'guest_link_copied', 'session_created');
      }
    });
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in-up">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{useCase.icon}</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Session created
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {session.title || useCase.label}
        </p>
      </div>

      {/* How it works reminder */}
      <div className="glass-card p-5 mb-6" style={{ borderColor: 'rgba(56,189,248,0.15)' }}>
        <div className="flex flex-col gap-4">
          {[
            { n: '1', text: 'You answer the questions on your end. Your answers stay private.' },
            { n: '2', text: 'Send the guest link to the other person. They answer on their end.' },
            { n: '3', text: 'Once both sides submit, Claude synthesises the results and shows you both the same neutral analysis.' },
          ].map(step => (
            <div key={step.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--cyan)', border: '1px solid rgba(56,189,248,0.2)' }}>
                {step.n}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your link */}
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          Your link (host)
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={hostUrl}
            className="flex-1 text-xs font-mono rounded-lg px-3 py-2.5"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', outline: 'none' }}
          />
          <button
            onClick={() => copy(hostUrl, 'host')}
            className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            style={{
              background: copiedHost ? 'rgba(74,222,128,0.12)' : 'rgba(56,189,248,0.08)',
              border: `1px solid ${copiedHost ? 'rgba(74,222,128,0.3)' : 'rgba(56,189,248,0.2)'}`,
              color: copiedHost ? 'var(--green)' : 'var(--cyan)',
              transition: 'all 0.2s',
            }}
          >
            {copiedHost ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Guest link */}
      <div className="mb-6">
        <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          Send this to the other person (guest)
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={guestUrl}
            className="flex-1 text-xs font-mono rounded-lg px-3 py-2.5"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', outline: 'none' }}
          />
          <button
            onClick={() => copy(guestUrl, 'guest')}
            className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            style={{
              background: copiedGuest ? 'rgba(74,222,128,0.12)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${copiedGuest ? 'rgba(74,222,128,0.3)' : 'rgba(167,139,250,0.2)'}`,
              color: copiedGuest ? 'var(--green)' : 'var(--purple)',
              transition: 'all 0.2s',
            }}
          >
            {copiedGuest ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
          They don\u2019t need an account. Just send them the link.
        </p>
      </div>

      {/* Enter your session */}
      <button
        onClick={onEnter}
        className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer"
      >
        Enter your session and answer first \u2192
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FabricStart() {
  const navigate = useNavigate();
  const { witnessEvent } = useVelma();
  const { address } = useAccount();
  const [selected, setSelected] = useState<UseCase | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<StoredSession | null>(null);

  const hasApiKey = Boolean(localStorage.getItem(API_KEY_STORAGE)?.trim());

  const handleCreate = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fabric/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowSlug: selected.slug,
          title: title.trim() || selected.label,
          maxGuests: 1,
          walletAddress: address,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as {
        id: string;
        hostToken: string;
        guestTokens: string[];
        expiresAt: number;
      };
      const session: StoredSession = {
        id: data.id,
        hostToken: data.hostToken,
        guestTokens: data.guestTokens,
        title: title.trim() || selected.label,
        flowSlug: selected.slug,
        createdAt: Date.now(),
        expiresAt: data.expiresAt,
      };
      saveSession(session);
      setCreated(session);
      witnessEvent('session_created', 'session_created', 'session_created');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const enterSession = () => {
    if (!created) return;
    navigate(`/fabric/${created.id}?hostToken=${created.hostToken}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-up 0.4s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>

      {created && selected ? (
        <SessionCreated session={created} useCase={selected} onEnter={enterSession} />
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              What are you working through?
            </h1>
            <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
              Pick a use case. Both sides answer privately. Claude shows you where you\u2019re aligned.
            </p>
          </div>

          {/* Use case grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {USE_CASES.map(uc => (
              <button
                key={uc.slug}
                onClick={() => { setSelected(uc); setTitle(''); }}
                className="text-left p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selected?.slug === uc.slug
                    ? `rgba(56,189,248,0.06)`
                    : 'var(--bg-secondary)',
                  border: `1px solid ${selected?.slug === uc.slug ? uc.color : 'var(--border)'}`,
                  outline: 'none',
                  transform: selected?.slug === uc.slug ? 'translateY(-2px)' : 'none',
                  boxShadow: selected?.slug === uc.slug ? `0 4px 20px ${uc.color}18` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div className="text-2xl mb-2">{uc.icon}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: selected?.slug === uc.slug ? uc.color : 'var(--text-primary)' }}>
                  {uc.label}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {uc.description}
                </div>
              </button>
            ))}
          </div>

          {/* Session config — slides in when a use case is selected */}
          {selected && (
            <div className="glass-card p-6 animate-fade-in-up" style={{ borderColor: `${selected.color}20` }}>
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                  Give it a name (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={selected.example}
                  maxLength={80}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = selected.color; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>

              {/* API key nudge — only shown if not yet configured */}
              {!hasApiKey && (
                <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>🔑</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    A Claude API key is needed to run synthesis.{' '}
                    <a href="/settings" style={{ color: 'var(--gold)', textDecoration: 'none', borderBottom: '1px solid rgba(251,191,36,0.3)' }}>
                      Set it up once in Settings \u2192
                    </a>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs mb-4" style={{ color: 'var(--red)' }}>{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Creating session\u2026' : `Create ${selected.label.toLowerCase()} session \u2192`}
              </button>

              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                {hasApiKey ? 'Claude API key configured. Guests just need the link.' : 'Session creation is free. API key only needed at synthesis time.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
