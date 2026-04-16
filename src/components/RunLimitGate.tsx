import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analytics } from '../hooks/useAnalytics';

interface RunLimitGateProps {
  runsUsed: number;
  runsMax: number;
  tier: string;
}

export default function RunLimitGate({ runsUsed, runsMax, tier }: RunLimitGateProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const remaining = runsMax - runsUsed;
  const atLimit = remaining <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Store email locally for now — integrate with email service later
    const emails = JSON.parse(localStorage.getItem('flowfabric-waitlist') || '[]');
    if (!emails.includes(email.trim())) {
      emails.push(email.trim());
      localStorage.setItem('flowfabric-waitlist', JSON.stringify(emails));
    }
    analytics.dailyLimitReached(tier);
    setSubmitted(true);
  };

  if (!atLimit && remaining > 1) return null;

  return (
    <div className="glass-card p-5 mb-6" style={{ borderColor: remaining <= 0 ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)' }}>
      {atLimit ? (
        <>
          <div className="text-sm font-semibold mb-2" style={{ color: 'var(--red)' }}>
            Daily limit reached
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            You've used all {runsMax} free runs today. Runs reset at midnight UTC.
          </p>
        </>
      ) : (
        <>
          <div className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>
            {remaining} run{remaining === 1 ? '' : 's'} remaining today
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            You've used {runsUsed} of {runsMax} free runs. Runs reset at midnight UTC.
          </p>
        </>
      )}

      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
          <label htmlFor="limit-gate-email" className="sr-only">Email address</label>
          <input
            id="limit-gate-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 text-xs px-3 py-2 rounded-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="text-xs px-4 py-2 rounded-lg font-semibold cursor-pointer"
            style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: 'var(--cyan)',
            }}
          >
            Notify me
          </button>
        </form>
      ) : (
        <p className="text-xs mb-3" style={{ color: 'var(--green)' }}>
          We'll let you know when new features drop.
        </p>
      )}

      <div className="flex gap-3">
        <Link
          to="/pricing"
          className="text-xs no-underline font-semibold"
          style={{ color: 'var(--cyan)' }}
        >
          Upgrade for more runs &rarr;
        </Link>
      </div>
    </div>
  );
}
