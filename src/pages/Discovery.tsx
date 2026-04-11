/**
 * /discover — Fabric Discovery board
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useListings, type DiscoveryListing } from '../hooks/useDiscovery';

function formatFlow(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── What is this? banner ─────────────────────────────────────────────────────

function ExplainerBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)',
      borderRadius: '12px', marginBottom: '24px', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          What is Fabric Discovery?
        </span>
        <span style={{
          fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          display: 'inline-block',
        }}>
          ›
        </span>
      </button>
      {open && (
        <div style={{
          padding: '4px 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['Post intent', 'Describe what you\'re looking for — a co-founder, a client, a coach, an investor.'],
              ['Claude finds your match', 'AI scores every compatible listing on the board and ranks the best fit.'],
              ['Accept → Fabric session', 'One tap creates a private two-party session. Both sides submit independently. Claude synthesizes.'],
            ].map(([title, body]) => (
              <li key={title} style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                  background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: 'var(--purple)', fontWeight: 700,
                }}>
                  {['1','2','3'][['Post intent','Claude finds your match','Accept → Fabric session'].indexOf(title ?? '')]}
                </span>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>{title} </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{body}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onConnect,
  onViewDetail,
  isOwn,
  highlighted,
  cardRef,
}: {
  listing: DiscoveryListing;
  onConnect: (l: DiscoveryListing) => void;
  onViewDetail: (l: DiscoveryListing) => void;
  isOwn: boolean;
  highlighted: boolean;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const roleColor = listing.role === 'host' ? 'var(--cyan)' : 'var(--purple)';
  const roleBg   = listing.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)';
  const roleBorder = listing.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)';

  return (
    <div
      ref={cardRef}
      style={{
        background: highlighted ? 'rgba(167,139,250,0.06)' : 'rgba(28,28,34,0.7)',
        border: highlighted ? '1px solid rgba(167,139,250,0.4)' : '1px solid var(--border)',
        borderRadius: '16px', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        transition: 'border-color 0.2s, transform 0.2s, background 0.2s',
        cursor: 'pointer',
        scrollMarginTop: '100px',
      }}
      onClick={() => onViewDetail(listing)}
      onMouseEnter={e => {
        if (!highlighted) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.3)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        if (!highlighted) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLDivElement).style.transform = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: roleColor, background: roleBg, border: `1px solid ${roleBorder}`,
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {listing.role}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {formatFlow(listing.flow_slug)}
            </span>
            {isOwn && (
              <span style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--gold)',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '6px', padding: '2px 8px',
              }}>
                yours
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', margin: 0, lineHeight: 1.4 }}>
            {listing.title}
          </p>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(161,161,170,0.5)', flexShrink: 0, paddingTop: '2px' }}>
          {timeAgo(listing.created_at)}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
        {listing.description.length > 140 ? listing.description.slice(0, 140) + '…' : listing.description}
      </p>

      {(listing.market || listing.tags.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {listing.market && (
            <span style={{
              fontSize: '11px', color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {listing.market}
            </span>
          )}
          {listing.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              fontSize: '11px', color: 'rgba(161,161,170,0.7)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {!isOwn && (
        <button
          onClick={e => { e.stopPropagation(); onConnect(listing); }}
          style={{
            marginTop: '4px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.06))',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: '10px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 600, color: 'var(--purple)',
            cursor: 'pointer', transition: 'all 0.2s ease', width: '100%',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(167,139,250,0.12))';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.06))';
            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          }}
        >
          Request to align →
        </button>
      )}
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({
  listing,
  onConnect,
  onClose,
  walletAddress,
}: {
  listing: DiscoveryListing;
  onConnect: (l: DiscoveryListing) => void;
  onClose: () => void;
  walletAddress?: string;
}) {
  const isOwn = !!walletAddress && listing.wallet_address === walletAddress.toLowerCase();
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/discover?listing=${listing.id}`
    : '';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: listing.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
              background: listing.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${listing.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '6px', padding: '3px 10px',
            }}>
              {listing.role}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {formatFlow(listing.flow_slug)}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', width: '28px', height: '28px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', lineHeight: 1,
            flexShrink: 0,
          }}>
            ×
          </button>
        </div>

        <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '20px', margin: '0 0 14px', lineHeight: 1.3 }}>
          {listing.title}
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 18px' }}>
          {listing.description}
        </p>

        {(listing.market || listing.tags.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {listing.market && (
              <span style={{
                fontSize: '12px', color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', padding: '3px 10px',
              }}>
                {listing.market}
              </span>
            )}
            {listing.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '12px', color: 'rgba(161,161,170,0.8)',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '6px', padding: '3px 10px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <p style={{ fontSize: '11px', color: 'rgba(161,161,170,0.5)', margin: '0 0 20px' }}>
          Posted {timeAgo(listing.created_at)}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isOwn && (
            <button
              onClick={() => { onConnect(listing); onClose(); }}
              style={{
                flex: 2, minWidth: '160px',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
                border: '1px solid rgba(167,139,250,0.4)', borderRadius: '10px', padding: '10px',
                fontSize: '13px', fontWeight: 700, color: 'var(--purple)', cursor: 'pointer',
              }}
            >
              Request to align →
            </button>
          )}
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); }}
            title="Copy share link"
            style={{
              flex: 1, minWidth: '80px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '10px',
              fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Connect modal (post counter-listing) ─────────────────────────────────────

function ConnectModal({
  listing,
  onClose,
  walletAddress,
}: {
  listing: DiscoveryListing;
  onClose: () => void;
  walletAddress?: string;
}) {
  const [step, setStep] = useState<'form' | 'posting' | 'done'>('form');
  const [title, setTitle] = useState(`Looking to align on ${formatFlow(listing.flow_slug)}`);
  const [description, setDescription] = useState('');
  const role: 'host' | 'guest' = listing.role === 'host' ? 'guest' : 'host';
  const [sessionUrl, setSessionUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!walletAddress || !description.trim()) return;
    setStep('posting');
    try {
      const createRes = await fetch('/api/discovery/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, flowSlug: listing.flow_slug, role, title, description }),
      });
      const { listing: myListing } = await createRes.json() as { listing: { id: string } };

      await fetch('/api/discovery/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: myListing.id }),
      });

      const matchRes = await fetch(`/api/discovery/matches?listingId=${myListing.id}`);
      const { matches } = await matchRes.json() as { matches: Array<{ id: string }> };

      if (matches?.length > 0) {
        const respondRes = await fetch('/api/discovery/respond', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: matches[0].id, action: 'accept', walletAddress }),
        });
        const result = await respondRes.json() as { guestUrl?: string };
        setSessionUrl(result.guestUrl ?? '');
      }
      setStep('done');
    } catch {
      setStep('form');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {step === 'form' && (
          <>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '17px', margin: '0 0 6px' }}>
              Request to align
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 22px', lineHeight: 1.6 }}>
              You'll take the <strong style={{ color: 'var(--text-primary)' }}>{role}</strong> role.
              Describe what you're bringing to this session.
            </p>

            {!walletAddress && (
              <div style={{
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                color: 'var(--gold)', fontSize: '13px',
              }}>
                Connect your wallet to continue.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Title
                </label>
                <input value={title} onChange={e => setTitle(e.target.value)} style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '9px 13px',
                  fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What you're bringing *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your situation, what you're offering, and what a great match looks like…"
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '9px 13px',
                    fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', fontFamily: '"Inter", sans-serif',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.3)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '10px', fontSize: '13px',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!walletAddress || !description.trim()}
                style={{
                  flex: 2,
                  background: walletAddress && description.trim()
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))'
                    : 'rgba(255,255,255,0.04)',
                  border: walletAddress && description.trim()
                    ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 700,
                  color: walletAddress && description.trim() ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor: walletAddress && description.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send request →
              </button>
            </div>
          </>
        )}

        {step === 'posting' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
              animation: 'cm-spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Matching you…
            </p>
            <style>{`@keyframes cm-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5L18 6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '17px', margin: '0 0 8px' }}>
              {sessionUrl ? 'Session ready' : 'Listing posted'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 20px' }}>
              {sessionUrl
                ? 'Share this link with your match to start the Fabric session.'
                : 'Your listing is live. Check your matches for updates.'}
            </p>
            {sessionUrl && (
              <div
                onClick={copyUrl}
                style={{
                  background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  fontSize: '12px', color: 'var(--purple)', wordBreak: 'break-all',
                  fontFamily: '"JetBrains Mono", monospace', cursor: 'pointer',
                  userSelect: 'all',
                }}
              >
                {copied ? '✓ Copied!' : sessionUrl}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '10px', fontSize: '13px',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                Close
              </button>
              {sessionUrl && (
                <a
                  href={sessionUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
                    borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600,
                    color: 'var(--green)', textDecoration: 'none',
                  }}
                >
                  Open session →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Discovery() {
  const { address } = useAccount();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('listing');

  const [flowFilter, setFlowFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [connectTarget, setConnectTarget] = useState<DiscoveryListing | null>(null);
  const [detailTarget, setDetailTarget] = useState<DiscoveryListing | null>(null);

  const highlightRef = useRef<HTMLDivElement | null>(null);

  const { data: listings = [], isLoading, error } = useListings({
    flowSlug: flowFilter || undefined,
    role: roleFilter || undefined,
  });

  const board = listings.filter(l => !address || l.wallet_address !== address.toLowerCase());
  const own   = listings.filter(l => !!address && l.wallet_address === address.toLowerCase());

  // Scroll to highlighted card
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
  }, [highlightId, listings]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '14px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--purple)', boxShadow: '0 0 6px rgba(167,139,250,0.6)', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fabric Discovery
                </span>
                {listings.length > 0 && (
                  <span style={{ fontSize: '11px', color: 'rgba(167,139,250,0.7)' }}>
                    · {listings.length} active
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Find your other side
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: 0, maxWidth: '500px' }}>
                Post what you need. Claude finds the best match. One tap to align.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/discover/new?mode=quick"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.08))',
                  border: '1px solid rgba(167,139,250,0.4)', borderRadius: '12px',
                  padding: '11px 20px', fontSize: '14px', fontWeight: 700,
                  color: 'var(--purple)', textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                ✦ Quick post
              </Link>
              <Link
                to="/discover/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '8px 20px', fontSize: '13px',
                  color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                Browse flows
              </Link>
            </div>
          </div>

          <ExplainerBanner />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            value={flowFilter}
            onChange={e => setFlowFilter(e.target.value)}
            placeholder="Filter by flow…"
            style={{
              flex: '1 1 200px', background: 'rgba(28,28,34,0.8)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '9px 14px', fontSize: '13px',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              background: 'rgba(28,28,34,0.8)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '9px 14px', fontSize: '13px',
              color: roleFilter ? 'var(--text-primary)' : 'var(--text-secondary)',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All roles</option>
            <option value="host">Host</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        {/* Own listings notice */}
        {own.length > 0 && (
          <div style={{
            background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: '12px', padding: '11px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              You have <strong style={{ color: 'var(--purple)' }}>{own.length}</strong> active listing{own.length > 1 ? 's' : ''}.
            </span>
            <Link to="/discover/matches" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--purple)', textDecoration: 'none' }}>
              View matches →
            </Link>
          </div>
        )}

        {/* Board */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Loading listings…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--red)', fontSize: '14px' }}>
            {String(error)}
          </div>
        ) : board.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)', borderRadius: '20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 20px' }}>
              {flowFilter || roleFilter ? 'No listings match your filters.' : 'No listings yet — be the first.'}
            </p>
            <Link
              to="/discover/new?mode=quick"
              style={{
                display: 'inline-flex', padding: '10px 20px',
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                color: 'var(--purple)', textDecoration: 'none',
              }}
            >
              Post the first listing
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {board.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onConnect={setConnectTarget}
                onViewDetail={setDetailTarget}
                isOwn={false}
                highlighted={listing.id === highlightId}
                cardRef={listing.id === highlightId ? highlightRef : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {detailTarget && !connectTarget && (
        <DetailModal
          listing={detailTarget}
          onConnect={l => { setDetailTarget(null); setConnectTarget(l); }}
          onClose={() => setDetailTarget(null)}
          walletAddress={address}
        />
      )}

      {connectTarget && (
        <ConnectModal
          listing={connectTarget}
          walletAddress={address}
          onClose={() => setConnectTarget(null)}
        />
      )}
    </div>
  );
}
