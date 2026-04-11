/**
 * /discover — Fabric Discovery board
 * Shows active listings from all users (excluding own).
 * Filter by flow, role, market. One-click to post a listing.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useListings, type DiscoveryListing } from '../hooks/useDiscovery';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onConnect,
  isOwn,
}: {
  listing: DiscoveryListing;
  onConnect: (listing: DiscoveryListing) => void;
  isOwn: boolean;
}) {
  const roleColor = listing.role === 'host' ? 'var(--cyan)' : 'var(--purple)';
  const roleBg = listing.role === 'host'
    ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)';
  const roleBorder = listing.role === 'host'
    ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)';

  return (
    <div style={{
      background: 'rgba(28,28,34,0.7)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.3)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      {/* Header row */}
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

      {/* Description */}
      <p style={{
        color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6,
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {listing.description}
      </p>

      {/* Tags + market */}
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

      {/* Action */}
      {!isOwn && (
        <button
          onClick={() => onConnect(listing)}
          style={{
            marginTop: '4px',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.06))',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--purple)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(167,139,250,0.12))';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.06))';
            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          }}
        >
          Request to align →
        </button>
      )}
    </div>
  );
}

// ─── Connect modal ────────────────────────────────────────────────────────────

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
  const [role] = useState<'host' | 'guest'>(listing.role === 'host' ? 'guest' : 'host');
  const [sessionUrl, setSessionUrl] = useState('');

  const handleSubmit = async () => {
    if (!walletAddress || !description.trim()) return;
    setStep('posting');

    try {
      // Create a listing for ourselves
      const createRes = await fetch('/api/discovery/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          flowSlug: listing.flow_slug,
          role,
          title,
          description,
        }),
      });
      const { listing: myListing } = await createRes.json();

      // Immediately score against this specific listing
      await fetch('/api/discovery/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: myListing.id }),
      });

      // Check if a match was created
      const matchRes = await fetch(`/api/discovery/matches?listingId=${myListing.id}`);
      const { matches } = await matchRes.json();

      if (matches?.length > 0) {
        // Accept the top match
        const topMatch = matches[0];
        const respondRes = await fetch('/api/discovery/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: topMatch.id,
            action: 'accept',
            walletAddress,
          }),
        });
        const { guestUrl } = await respondRes.json();
        setSessionUrl(guestUrl ?? '');
      }

      setStep('done');
    } catch {
      setStep('form');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {step === 'form' && (
          <>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>
              Request to align
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.6 }}>
              You'll take the <strong style={{ color: 'var(--text-primary)' }}>{role}</strong> role in this {formatFlow(listing.flow_slug)} flow.
              Tell the other party what you're looking for.
            </p>

            {!walletAddress && (
              <div style={{
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                color: 'var(--gold)', fontSize: '13px',
              }}>
                Connect your wallet to post a listing.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What you're looking for *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your situation, goals, and what a great match looks like..."
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', fontFamily: '"Inter", sans-serif',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
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
                  borderRadius: '10px', padding: '10px',
                  fontSize: '13px', fontWeight: 600,
                  color: walletAddress && description.trim() ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor: walletAddress && description.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send alignment request →
              </button>
            </div>
          </>
        )}

        {step === 'posting' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Finding the best match…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5L18 6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 8px' }}>
              {sessionUrl ? 'Match found — session ready' : 'Listing posted'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px' }}>
              {sessionUrl
                ? 'A Fabric session has been created. Share this link with the other party to begin.'
                : "Your listing is live on the Discovery board. You'll be notified when a match is found."}
            </p>
            {sessionUrl && (
              <div style={{
                background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                fontSize: '12px', color: 'var(--purple)', wordBreak: 'break-all',
                fontFamily: '"JetBrains Mono", monospace', cursor: 'pointer',
              }}
                onClick={() => navigator.clipboard.writeText(sessionUrl)}
                title="Click to copy"
              >
                {sessionUrl}
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
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
                    border: '1px solid rgba(167,139,250,0.4)', borderRadius: '10px',
                    padding: '10px', fontSize: '13px', fontWeight: 600,
                    color: 'var(--purple)', textDecoration: 'none',
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
  const [flowFilter, setFlowFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [connectTarget, setConnectTarget] = useState<DiscoveryListing | null>(null);

  const { data: listings = [], isLoading, error } = useListings({
    flowSlug: flowFilter || undefined,
    role: roleFilter || undefined,
  });

  // Exclude own listings
  const board = listings.filter(l =>
    !address || l.wallet_address !== address.toLowerCase()
  );
  const own = listings.filter(l =>
    address && l.wallet_address === address.toLowerCase()
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '16px',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--purple)', boxShadow: '0 0 6px rgba(167,139,250,0.6)',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fabric Discovery
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 10px' }}>
                Find your other side
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
                Post what you're looking for. Claude finds the best match from everyone who posted the other role. One tap to start a Fabric session.
              </p>
            </div>
            <Link
              to="/discover/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.08))',
                border: '1px solid rgba(167,139,250,0.35)', borderRadius: '12px',
                padding: '12px 22px', fontSize: '14px', fontWeight: 700,
                color: 'var(--purple)', textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              + Post a listing
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <input
            value={flowFilter}
            onChange={e => setFlowFilter(e.target.value)}
            placeholder="Filter by flow (e.g. freelancer-client)"
            style={{
              flex: '1 1 220px', background: 'rgba(28,28,34,0.8)', border: '1px solid var(--border)',
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
            <option value="host">Host only</option>
            <option value="guest">Guest only</option>
          </select>
        </div>

        {/* Own listings notice */}
        {own.length > 0 && (
          <div style={{
            background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              You have <strong style={{ color: 'var(--purple)' }}>{own.length}</strong> active listing{own.length > 1 ? 's' : ''} on the board.
            </span>
            <Link to="/discover/matches" style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--purple)', textDecoration: 'none',
            }}>
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
          <div style={{
            textAlign: 'center', padding: '60px 0', color: 'var(--red)',
            fontSize: '14px',
          }}>
            {String(error)}
          </div>
        ) : board.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)',
            borderRadius: '20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 20px' }}>
              {flowFilter || roleFilter
                ? 'No listings match your filters.'
                : 'No listings yet — be the first to post.'}
            </p>
            <Link
              to="/discover/new"
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {board.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onConnect={setConnectTarget}
                isOwn={false}
              />
            ))}
          </div>
        )}
      </div>

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
