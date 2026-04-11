/**
 * /discover/matches — Your listings + AI-scored matches
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  useMyListings,
  useMatches,
  useRespondToMatch,
  useRefreshMatches,
  useUpdateListingStatus,
  type DiscoveryListing,
  type EnrichedMatch,
} from '../hooks/useDiscovery';

function formatFlow(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7.5 ? 'var(--green)' : score >= 5 ? 'var(--gold)' : 'var(--purple)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '30px' }}>{score.toFixed(1)}</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EnrichedMatch['status'] }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    pending:   { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.04)',      border: 'rgba(255,255,255,0.08)' },
    accepted:  { color: 'var(--green)',           bg: 'rgba(74,222,128,0.08)',       border: 'rgba(74,222,128,0.2)' },
    converted: { color: 'var(--green)',           bg: 'rgba(74,222,128,0.08)',       border: 'rgba(74,222,128,0.2)' },
    rejected:  { color: 'var(--red)',             bg: 'rgba(248,113,113,0.08)',      border: 'rgba(248,113,113,0.2)' },
    expired:   { color: 'rgba(161,161,170,0.5)',  bg: 'rgba(255,255,255,0.02)',      border: 'rgba(255,255,255,0.06)' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 8px', borderRadius: '6px',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  onAccept,
  onReject,
  accepting,
}: {
  match: EnrichedMatch;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  accepting: boolean;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const ml = match.matched_listing;
  const isPending  = match.status === 'pending';
  const isAccepted = match.status === 'accepted' || match.status === 'converted';

  const shareListingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/discover?listing=${match.matched_listing_id}`
    : '';

  return (
    <div style={{
      background: isAccepted ? 'rgba(74,222,128,0.03)' : 'rgba(28,28,34,0.7)',
      border: isAccepted ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--border)',
      borderRadius: '14px', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '12px',
      opacity: match.status === 'rejected' || match.status === 'expired' ? 0.5 : 1,
    }}>
      {/* Score + status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <ScoreBar score={match.score} />
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Matched listing */}
      {ml && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '12px',
        }}>
          <div style={{ display: 'flex', gap: '7px', marginBottom: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: ml.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
              background: ml.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${ml.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '5px', padding: '2px 7px',
            }}>
              {ml.role}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatFlow(ml.flow_slug)}</span>
            <button
              onClick={() => navigator.clipboard.writeText(shareListingUrl)}
              title="Copy link to this listing"
              style={{
                background: 'none', border: 'none', color: 'rgba(161,161,170,0.4)',
                fontSize: '11px', cursor: 'pointer', padding: 0, marginLeft: 'auto',
              }}
            >
              ⎘ link
            </button>
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', margin: '0 0 5px' }}>
            {ml.title}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
            {ml.description.length > 110 ? ml.description.slice(0, 110) + '…' : ml.description}
          </p>
          {ml.market && (
            <span style={{
              display: 'inline-block', marginTop: '7px',
              fontSize: '11px', color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '5px', padding: '2px 7px',
            }}>
              {ml.market}
            </span>
          )}
        </div>
      )}

      {/* AI intro */}
      <div style={{
        background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)',
        borderRadius: '10px', padding: '10px 13px',
      }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Why Claude matched you
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
          {match.ai_intro_text}
        </p>

        {match.ai_reasoning && (
          <>
            <button
              onClick={() => setShowReasoning(v => !v)}
              style={{
                background: 'none', border: 'none', color: 'var(--purple)',
                fontSize: '11px', cursor: 'pointer', padding: '6px 0 0', display: 'block',
              }}
            >
              {showReasoning ? '− Hide reasoning' : '+ Show reasoning'}
            </button>
            {showReasoning && (
              <p style={{ color: 'rgba(161,161,170,0.7)', fontSize: '11px', lineHeight: 1.6, margin: '6px 0 0', fontStyle: 'italic' }}>
                {match.ai_reasoning}
              </p>
            )}
          </>
        )}
      </div>

      {/* Fabric session link */}
      {isAccepted && match.fabric_session_id && (
        <a
          href={`/fabric/${match.fabric_session_id}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '10px', padding: '9px',
            fontSize: '13px', fontWeight: 600, color: 'var(--green)', textDecoration: 'none',
          }}
        >
          Open Fabric session →
        </a>
      )}

      {/* Actions */}
      {isPending && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onReject(match.id)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '9px', padding: '8px 14px',
              fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Pass
          </button>
          <button
            onClick={() => onAccept(match.id)}
            disabled={accepting}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.08))',
              border: '1px solid rgba(167,139,250,0.35)',
              borderRadius: '9px', padding: '8px',
              fontSize: '12px', fontWeight: 700, color: 'var(--purple)',
              cursor: accepting ? 'not-allowed' : 'pointer', opacity: accepting ? 0.7 : 1,
            }}
          >
            {accepting ? 'Creating session…' : 'Accept — start session →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Listing status menu ──────────────────────────────────────────────────────

function ListingStatusMenu({
  listing,
  onUpdate,
}: {
  listing: DiscoveryListing;
  onUpdate: (status: 'active' | 'paused' | 'closed') => void;
}) {
  const [open, setOpen] = useState(false);

  const options: { label: string; status: 'active' | 'paused' | 'closed'; color?: string }[] = [
    { label: 'Set active', status: 'active' },
    { label: 'Pause', status: 'paused' },
    { label: 'Close listing', status: 'closed', color: 'var(--red)' },
  ].filter(o => o.status !== listing.status);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '7px', padding: '4px 10px', fontSize: '11px',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}
      >
        {listing.status} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 100,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '6px', minWidth: '140px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {options.map(opt => (
            <button
              key={opt.status}
              onClick={() => { onUpdate(opt.status); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none',
                padding: '8px 12px', fontSize: '12px', borderRadius: '6px',
                color: opt.color ?? 'var(--text-primary)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Listing section ──────────────────────────────────────────────────────────

function ListingSection({ listing }: { listing: DiscoveryListing }) {
  const respond       = useRespondToMatch();
  const refresh       = useRefreshMatches();
  const updateStatus  = useUpdateListingStatus();
  const { data: matches = [], isLoading } = useMatches(listing.id);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState('');

  const pendingCount = matches.filter(m => m.status === 'pending').length;

  const handleAccept = async (matchId: string) => {
    setAcceptingId(matchId);
    try {
      const result = await respond.mutateAsync({ matchId, action: 'accept' });
      if (result.guestUrl) setSessionUrl(result.guestUrl);
    } finally {
      setAcceptingId(null);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/discover?listing=${listing.id}`
    : '';

  return (
    <div style={{ marginBottom: '36px' }}>
      {/* Listing row */}
      <div style={{
        background: listing.status !== 'active' ? 'rgba(28,28,34,0.4)' : 'rgba(28,28,34,0.6)',
        border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: '14px', padding: '14px 18px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        opacity: listing.status !== 'active' ? 0.7 : 1,
      }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <div style={{ display: 'flex', gap: '7px', marginBottom: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: listing.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
              background: listing.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${listing.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '5px', padding: '2px 7px',
            }}>
              {listing.role}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatFlow(listing.flow_slug)}</span>
            {pendingCount > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: 700, color: 'var(--purple)',
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: '20px', padding: '2px 8px',
              }}>
                {pendingCount} match{pendingCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            {listing.title}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            title="Copy share link"
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '7px', padding: '4px 10px', fontSize: '11px',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            onClick={() => refresh.mutate(listing.id)}
            disabled={refresh.isPending}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '7px', padding: '4px 10px', fontSize: '11px',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {refresh.isPending ? '…' : '↻'}
          </button>
          <ListingStatusMenu
            listing={listing}
            onUpdate={status => updateStatus.mutate({ listingId: listing.id, status })}
          />
        </div>
      </div>

      {/* Session banner */}
      {sessionUrl && (
        <div style={{
          background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
        }}>
          <p style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
            Fabric session created
          </p>
          <a
            href={sessionUrl} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--green)', textDecoration: 'none',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: '8px', padding: '5px 13px',
            }}
          >
            Open →
          </a>
        </div>
      )}

      {/* Matches */}
      {listing.status !== 'active' ? (
        <p style={{ color: 'rgba(161,161,170,0.4)', fontSize: '12px', padding: '8px 0' }}>
          Listing is {listing.status} — no new matches will be scored.
        </p>
      ) : isLoading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>Loading matches…</p>
      ) : matches.length === 0 ? (
        <div style={{
          background: 'rgba(28,28,34,0.4)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '20px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px' }}>
            No matches yet — Claude is scanning the board.
          </p>
          <button
            onClick={() => refresh.mutate(listing.id)}
            style={{
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '8px', padding: '7px 14px', fontSize: '12px',
              color: 'var(--purple)', cursor: 'pointer',
            }}
          >
            Check now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onAccept={handleAccept}
              onReject={id => respond.mutate({ matchId: id, action: 'reject' })}
              accepting={acceptingId === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DiscoveryMatches() {
  const { address } = useAccount();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('listingId');

  const { data: myListings = [], isLoading } = useMyListings();

  const sorted = highlightId
    ? [...myListings.filter(l => l.id === highlightId), ...myListings.filter(l => l.id !== highlightId)]
    : myListings;

  const activeCount  = myListings.filter(l => l.status === 'active').length;
  const pausedCount  = myListings.filter(l => l.status === 'paused').length;
  const closedCount  = myListings.filter(l => l.status === 'closed').length;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <Link to="/discover" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', marginBottom: '20px',
        }}>
          ← Discovery board
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Your matches
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Accept a match to start a Fabric session.
            </p>
          </div>
          <Link to="/discover/new?mode=quick" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
            fontWeight: 600, color: 'var(--purple)', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            + New listing
          </Link>
        </div>

        {/* Stats */}
        {myListings.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { label: 'Active', count: activeCount, color: 'var(--green)' },
              { label: 'Paused', count: pausedCount, color: 'var(--gold)' },
              { label: 'Closed', count: closedCount, color: 'var(--text-secondary)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: s.color }}>{s.count}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!address ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)', borderRadius: '18px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
              Connect your wallet to see your listings and matches.
            </p>
          </div>
        ) : isLoading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '40px 0' }}>Loading…</p>
        ) : sorted.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)', borderRadius: '18px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 20px' }}>
              No listings yet.
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
              Post your first listing
            </Link>
          </div>
        ) : (
          sorted.map(listing => (
            <ListingSection key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  );
}
