/**
 * /sessions — Your active Fabric sessions.
 * Reads from localStorage. No auth required.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSavedSessions, type StoredSession } from './FabricStart';

interface LiveStatus {
  hostSubmitted: boolean;
  guestsSubmitted: number;
  maxGuests: number;
  synthesisStatus: 'pending' | 'ready' | 'complete';
  synthesisOutput?: string;
  submissionDeadline: number;
}

function useSessionStatuses(sessions: StoredSession[]) {
  const [statuses, setStatuses] = useState<Record<string, LiveStatus>>({});

  useEffect(() => {
    if (sessions.length === 0) return;
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        sessions.map(async s => {
          const res = await fetch(`/api/fabric/${s.id}`);
          if (!res.ok) return null;
          const d = await res.json() as {
            host: { submitted: boolean };
            guests: { submitted: boolean }[];
            maxGuests: number;
            synthesis: { status: 'pending' | 'ready' | 'complete'; output?: string };
            submissionDeadline: number;
          };
          return {
            id: s.id,
            status: {
              hostSubmitted: d.host.submitted,
              guestsSubmitted: d.guests.filter(g => g.submitted).length,
              maxGuests: d.maxGuests,
              synthesisStatus: d.synthesis.status,
              synthesisOutput: d.synthesis.output,
              submissionDeadline: d.submissionDeadline,
            } satisfies LiveStatus,
          };
        })
      );
      const map: Record<string, LiveStatus> = {};
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          map[r.value.id] = r.value.status;
        }
      }
      setStatuses(map);
    };
    fetchAll();
  }, [sessions]);

  return statuses;
}

function countdown(ms: number): string {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function StatusPill({ s }: { s: LiveStatus }) {
  const remaining = s.submissionDeadline - Date.now();

  if (s.synthesisStatus === 'complete') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.2)' }}>
        Synthesis ready
      </span>
    );
  }
  if (s.synthesisStatus === 'ready') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.2)' }}>
        Synthesising\u2026
      </span>
    );
  }
  if (!s.hostSubmitted) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(56,189,248,0.08)', color: 'var(--cyan)', border: '1px solid rgba(56,189,248,0.15)' }}>
        Waiting for you \u2022 {countdown(remaining)}
      </span>
    );
  }
  if (s.guestsSubmitted < s.maxGuests) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(167,139,250,0.08)', color: 'var(--purple)', border: '1px solid rgba(167,139,250,0.15)' }}>
        Waiting for them \u2022 {countdown(remaining)}
      </span>
    );
  }
  return null;
}

function SessionCard({ session, status }: { session: StoredSession; status?: LiveStatus }) {
  const [copiedGuest, setCopiedGuest] = useState(false);

  const base = window.location.origin;
  const hostUrl = `/fabric/${session.id}?hostToken=${session.hostToken}`;
  const guestUrl = `${base}/fabric/${session.id}?guestToken=${session.guestTokens[0]}`;

  const copyGuest = () => {
    navigator.clipboard.writeText(guestUrl).then(() => {
      setCopiedGuest(true);
      setTimeout(() => setCopiedGuest(false), 2000);
    });
  };

  return (
    <div className="glass-card p-5" style={{ borderColor: 'rgba(56,189,248,0.1)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {session.title}
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            {session.flowSlug}
          </div>
        </div>
        {status && <StatusPill s={status} />}
      </div>

      <div className="flex gap-2 mt-4">
        <Link
          to={hostUrl}
          className="flex-1 text-center py-2 rounded-lg text-xs font-semibold no-underline"
          style={{
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.2)',
            color: 'var(--cyan)',
            transition: 'all 0.2s',
          }}
        >
          {status?.synthesisStatus === 'complete' ? 'View synthesis \u2192' : 'Open session \u2192'}
        </Link>
        {session.guestTokens.length > 0 && status?.synthesisStatus !== 'complete' && (
          <button
            onClick={copyGuest}
            className="px-3 py-2 rounded-lg text-xs cursor-pointer shrink-0"
            style={{
              background: copiedGuest ? 'rgba(74,222,128,0.08)' : 'rgba(167,139,250,0.06)',
              border: `1px solid ${copiedGuest ? 'rgba(74,222,128,0.2)' : 'rgba(167,139,250,0.15)'}`,
              color: copiedGuest ? 'var(--green)' : 'var(--purple)',
              transition: 'all 0.2s',
            }}
          >
            {copiedGuest ? 'Copied!' : 'Copy guest link'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Sessions() {
  const sessions = getSavedSessions();
  const statuses = useSessionStatuses(sessions);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Your sessions
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All sessions you\u2019ve hosted, saved locally.
            </p>
          </div>
          <Link
            to="/start"
            className="btn-primary px-5 py-2.5 text-sm font-semibold no-underline"
          >
            + New session
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No sessions yet
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Start one when you have something to work through with another person.
            </p>
            <Link to="/start" className="btn-primary px-6 py-3 text-sm font-semibold no-underline">
              Start an alignment session \u2192
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(s => (
              <SessionCard key={s.id} session={s} status={statuses[s.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
