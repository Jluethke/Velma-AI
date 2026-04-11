/**
 * /discover/matches — View matches for your listings
 * Shows all scored matches, accept/reject controls, and Fabric session links.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  useMyListings,
  useMatches,
  useRespondToMatch,
  useRefreshMatches,
  type DiscoveryListing,
  type EnrichedMatch,
} from '../hooks/useDiscovery';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFlow(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7.5 ? 'var(--green)' : score >= 5 ? 'var(--gold)' : 'var(--purple)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: '2px', transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '32px' }}>
        {score.toFixed(1)}
      </span>
    </div>
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
  onAccept: (matchId: string) => void;
  onReject: (matchId: string) => void;
  accepting: boolean;
}) {
  const ml = match.matched_listing;
  const isPending = match.status === 'pending';
  const isAccepted = match.status === 'accepted' || match.status === 'converted';

  return (
    <div style={{
      background: isAccepted
        ? 'rgba(74,222,128,0.03)' : 'rgba(28,28,34,0.7)',
      border: isAccepted
        ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--border)',
      borderRadius: '16px', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      opacity: match.status === 'rejected' ? 0.5 : 1,
      transition: 'opacity 0.2s ease',
    }}>
      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Match score
        </span>
        <div style={{ flex: 1, maxWidth: '180px' }}>
          <ScoreBar score={match.score} />
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '2px 8px', borderRadius: '6px',
          color: isAccepted ? 'var(--green)' : match.status === 'rejected' ? 'var(--red)' : 'var(--text-secondary)',
          background: isAccepted ? 'rgba(74,222,128,0.1)' : match.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
          border: isAccepted ? '1px solid rgba(74,222,128,0.2)' : match.status === 'rejected' ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.08)',
        }}>
          {match.status}
        </span>
      </div>

      {/* Matched listing */}
      {ml && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '14px',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: ml.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
              background: ml.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${ml.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {ml.role}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {formatFlow(ml.flow_slug)}
            </span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>
            {ml.title}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
            {ml.description.length > 110 ? ml.description.slice(0, 110) + '…' : ml.description}
          </p>
          {ml.market && (
            <span style={{
              display: 'inline-block', marginTop: '8px',
              fontSize: '11px', color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {ml.market}
            </span>
          )}
        </div>
      )}

      {/* AI intro text */}
      <div style={{
        background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)',
        borderRadius: '10px', padding: '12px 14px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Why Claude matched you
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
          {match.ai_intro_text}
        </p>
      </div>

      {/* Fabric session link (if accepted) */}
      {isAccepted && match.fabric_session_id && (
        <a
          href={`/fabric/${match.fabric_session_id}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '10px', padding: '10px',
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
              borderRadius: '10px', padding: '9px 16px',
              fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
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
              borderRadius: '10px', padding: '9px',
              fontSize: '13px', fontWeight: 700, color: 'var(--purple)',
              cursor: accepting ? 'not-allowed' : 'pointer',
              opacity: accepting ? 0.7 : 1,
            }}
          >
            {accepting ? 'Creating session…' : 'Accept — start Fabric session →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Listing section ──────────────────────────────────────────────────────────

function ListingSection({ listing }: { listing: DiscoveryListing }) {
  const respond = useRespondToMatch();
  const refresh = useRefreshMatches();
  const { data: matches = [], isLoading } = useMatches(listing.id);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<{ guestUrl: string; sessionId: string } | null>(null);

  const handleAccept = async (matchId: string) => {
    setAcceptingId(matchId);
    try {
      const result = await respond.mutateAsync({ matchId, action: 'accept' });
      if (result.guestUrl) {
        setSessionResult({ guestUrl: result.guestUrl, sessionId: result.sessionId ?? '' });
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = (matchId: string) => {
    respond.mutate({ matchId, action: 'reject' });
  };

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Listing header */}
      <div style={{
        background: 'rgba(28,28,34,0.6)', border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: '14px', padding: '16px 20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px',
      }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: listing.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
              background: listing.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${listing.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '6px', padding: '2px 8px',
            }}>
              {listing.role}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {formatFlow(listing.flow_slug)}
            </span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', margin: 0 }}>
            {listing.title}
          </p>
        </div>
        <button
          onClick={() => refresh.mutate(listing.id)}
          disabled={refresh.isPending}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          {refresh.isPending ? 'Refreshing…' : '↻ Refresh matches'}
        </button>
      </div>

      {/* Session result banner */}
      {sessionResult && (
        <div style={{
          background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <p style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
            Fabric session created!
          </p>
          <a
            href={sessionResult.guestUrl} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--green)', textDecoration: 'none',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: '8px', padding: '6px 14px',
            }}
          >
            Open session →
          </a>
        </div>
      )}

      {/* Matches */}
      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>
          Loading matches…
        </p>
      ) : matches.length === 0 ? (
        <div style={{
          background: 'rgba(28,28,34,0.4)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
            No matches yet. Claude is scanning the board.
          </p>
          <button
            onClick={() => refresh.mutate(listing.id)}
            style={{
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
              color: 'var(--purple)', cursor: 'pointer',
            }}
          >
            Check now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onAccept={handleAccept}
              onReject={handleReject}
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

  // Show the highlighted listing first
  const sorted = highlightId
    ? [
        ...myListings.filter(l => l.id === highlightId),
        ...myListings.filter(l => l.id !== highlightId),
      ]
    : myListings;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <Link to="/discover" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--text-secondary)', textDecoration: 'none',
            fontSize: '13px', marginBottom: '20px',
          }}>
            ← Discovery board
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Your matches
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Claude-scored matches for your active listings. Accept a match to start a Fabric session.
              </p>
            </div>
            <Link
              to="/discover/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '10px', padding: '9px 16px', fontSize: '13px',
                fontWeight: 600, color: 'var(--purple)', textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              + New listing
            </Link>
          </div>
        </div>

        {/* Content */}
        {!address ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)', borderRadius: '20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 8px' }}>
              Connect your wallet to see your listings and matches.
            </p>
          </div>
        ) : isLoading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '40px 0' }}>
            Loading your listings…
          </p>
        ) : sorted.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)', borderRadius: '20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 20px' }}>
              You don't have any active listings yet.
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
