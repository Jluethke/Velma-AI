/**
 * /discover/new — Post a new Discovery listing
 * Multi-step form: flow → role → title → description → market/tags
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useCreateListing } from '../hooks/useDiscovery';

// ─── Well-known flows (curated list for the picker) ───────────────────────────

const POPULAR_FLOWS: { slug: string; label: string }[] = [
  { slug: 'freelancer-client', label: 'Freelancer / Client' },
  { slug: 'job-offer-negotiation', label: 'Job Offer Negotiation' },
  { slug: 'cofounder-alignment', label: 'Co-founder Alignment' },
  { slug: 'investor-founder-term-sheet', label: 'Investor / Founder' },
  { slug: 'business-partnership', label: 'Business Partnership' },
  { slug: 'real-estate-offer-negotiation', label: 'Real Estate Offer' },
  { slug: 'vendor-client-sow', label: 'Vendor / Client SOW' },
  { slug: 'consultant-engagement', label: 'Consulting Engagement' },
  { slug: 'financial-planner-client', label: 'Financial Planning' },
  { slug: 'coaching-executive-engagement', label: 'Executive Coaching' },
  { slug: 'media-creator-brand-deal', label: 'Creator Brand Deal' },
  { slug: 'startup-accelerator-founder', label: 'Startup Accelerator' },
  { slug: 'school-district-vendor', label: 'Ed-Tech Partnership' },
  { slug: 'interior-designer-client', label: 'Interior Design' },
  { slug: 'immigration-attorney-client', label: 'Immigration Attorney' },
  { slug: 'literary-agent-author', label: 'Literary Agent / Author' },
  { slug: 'personal-trainer-client', label: 'Personal Trainer' },
  { slug: 'therapy-intake-alignment', label: 'Therapy Intake' },
  { slug: 'wedding-vendor-couple', label: 'Wedding Planning' },
  { slug: 'mortgage-origination', label: 'Mortgage / Loan' },
];

type Step = 'flow' | 'role' | 'details' | 'review';

interface FormState {
  flowSlug: string;
  role: 'host' | 'guest' | '';
  title: string;
  description: string;
  market: string;
  tags: string;
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: i < current
              ? 'rgba(167,139,250,0.15)'
              : i === current
                ? 'rgba(167,139,250,0.12)'
                : 'rgba(255,255,255,0.04)',
            border: i <= current
              ? '1px solid rgba(167,139,250,0.4)'
              : '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {i < current ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="var(--purple)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: i === current ? 'var(--purple)' : 'var(--text-secondary)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {i + 1}
              </span>
            )}
          </div>
          <span style={{
            fontSize: '12px',
            color: i === current ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: i === current ? 600 : 400,
            display: i > 0 ? undefined : undefined,
          }}>
            {label}
          </span>
          {i < steps.length - 1 && (
            <div style={{
              width: '24px', height: '1px',
              background: i < current ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)',
              marginRight: '6px',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DiscoveryNew() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const createListing = useCreateListing();

  const [step, setStep] = useState<Step>('flow');
  const [form, setForm] = useState<FormState>({
    flowSlug: '',
    role: '',
    title: '',
    description: '',
    market: '',
    tags: '',
  });
  const [customFlow, setCustomFlow] = useState('');

  const steps = ['Flow', 'Role', 'Details', 'Review'];
  const stepIndex = ['flow', 'role', 'details', 'review'].indexOf(step);

  const set = (k: keyof FormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!address) return;
    const tags = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const listing = await createListing.mutateAsync({
        flowSlug: form.flowSlug,
        role: form.role as 'host' | 'guest',
        title: form.title,
        description: form.description,
        market: form.market || undefined,
        tags,
      });
      navigate(`/discover/matches?listingId=${listing.id}`);
    } catch {
      // error handled by mutation state
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.06) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Back link */}
        <Link to="/discover" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none',
          fontSize: '13px', marginBottom: '32px',
        }}>
          ← Discovery board
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Post a listing
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 32px' }}>
          Claude will match you with the best counterpart from the Discovery board.
        </p>

        <StepIndicator current={stepIndex} steps={steps} />

        {/* ── Step 1: Flow ── */}
        {step === 'flow' && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Which flow?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Pick the type of alignment session you're looking to have.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {POPULAR_FLOWS.map(f => (
                <button
                  key={f.slug}
                  onClick={() => { set('flowSlug', f.slug); setStep('role'); }}
                  style={{
                    background: form.flowSlug === f.slug
                      ? 'rgba(167,139,250,0.1)' : 'rgba(28,28,34,0.7)',
                    border: form.flowSlug === f.slug
                      ? '1px solid rgba(167,139,250,0.4)' : '1px solid var(--border)',
                    borderRadius: '12px', padding: '12px 16px',
                    textAlign: 'left', cursor: 'pointer',
                    color: form.flowSlug === f.slug ? 'var(--purple)' : 'var(--text-primary)',
                    fontSize: '14px', fontWeight: 500, transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 8px' }}>
                Or enter a custom flow slug:
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={customFlow}
                  onChange={e => setCustomFlow(e.target.value)}
                  placeholder="e.g. architect-contractor-handoff"
                  style={{
                    flex: 1, background: 'rgba(9,9,11,0.6)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '9px 14px', fontSize: '13px',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                <button
                  onClick={() => { if (customFlow.trim()) { set('flowSlug', customFlow.trim()); setStep('role'); } }}
                  disabled={!customFlow.trim()}
                  style={{
                    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: '10px', padding: '9px 16px', fontSize: '13px',
                    fontWeight: 600, color: 'var(--purple)', cursor: 'pointer',
                  }}
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Role ── */}
        {step === 'role' && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              What's your role?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              In <strong style={{ color: 'var(--text-primary)' }}>{form.flowSlug.replace(/-/g, ' ')}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {(['host', 'guest'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { set('role', r); setStep('details'); }}
                  style={{
                    background: form.role === r
                      ? r === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)'
                      : 'rgba(28,28,34,0.7)',
                    border: form.role === r
                      ? r === 'host' ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(167,139,250,0.3)'
                      : '1px solid var(--border)',
                    borderRadius: '14px', padding: '18px 20px',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  <p style={{
                    color: r === 'host' ? 'var(--cyan)' : 'var(--purple)',
                    fontWeight: 700, fontSize: '15px', margin: '0 0 4px', textTransform: 'capitalize',
                  }}>
                    {r}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                    {r === 'host'
                      ? 'You're initiating the session — you set the context and invite the other party.'
                      : 'You're joining an existing need — you bring the skill, service, or resource.'}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('flow')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '13px', cursor: 'pointer', padding: 0,
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Details ── */}
        {step === 'details' && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Tell them what you need
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              This is what Claude uses to find your best match.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Looking for an executive coach in the SaaS space"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What are you looking for? Who would be the ideal match? What constraints matter? Be specific — Claude uses this to score fit."
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', fontFamily: '"Inter", sans-serif',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Market / Location <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input
                  value={form.market}
                  onChange={e => set('market', e.target.value)}
                  placeholder="e.g. US · SaaS · Series A"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tags <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma-separated, optional)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="e.g. remote, B2B, fintech, $500k ARR"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('role')}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!form.title.trim() || !form.description.trim()}
                style={{
                  flex: 1,
                  background: form.title.trim() && form.description.trim()
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))'
                    : 'rgba(255,255,255,0.04)',
                  border: form.title.trim() && form.description.trim()
                    ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '10px',
                  fontSize: '13px', fontWeight: 600,
                  color: form.title.trim() && form.description.trim()
                    ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor: form.title.trim() && form.description.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review + Post ── */}
        {step === 'review' && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Review your listing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              This is what other users and Claude will see.
            </p>

            <div style={{
              background: 'rgba(28,28,34,0.8)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', gap: '14px',
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: form.role === 'host' ? 'var(--cyan)' : 'var(--purple)',
                  background: form.role === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)',
                  border: `1px solid ${form.role === 'host' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`,
                  borderRadius: '6px', padding: '2px 8px',
                }}>
                  {form.role}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {form.flowSlug.replace(/-/g, ' ')}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', margin: 0 }}>
                {form.title}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {form.description}
              </p>
              {(form.market || form.tags) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {form.market && (
                    <span style={{
                      fontSize: '11px', color: 'var(--text-secondary)',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px', padding: '2px 8px',
                    }}>
                      {form.market}
                    </span>
                  )}
                  {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
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
            </div>

            {!address && (
              <div style={{
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                color: 'var(--gold)', fontSize: '13px',
              }}>
                Connect your wallet to post this listing.
              </div>
            )}

            {createListing.error && (
              <div style={{
                background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                color: 'var(--red)', fontSize: '13px',
              }}>
                {String(createListing.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('details')}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                ← Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={!address || createListing.isPending}
                style={{
                  flex: 1,
                  background: address
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))'
                    : 'rgba(255,255,255,0.04)',
                  border: address
                    ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '10px',
                  fontSize: '13px', fontWeight: 700,
                  color: address ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor: address ? 'pointer' : 'not-allowed',
                }}
              >
                {createListing.isPending ? 'Posting…' : 'Post listing — find my match →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
