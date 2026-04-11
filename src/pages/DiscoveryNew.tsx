/**
 * /discover/new — Post a new Discovery listing
 *
 * Two paths:
 *   Quick — describe in plain text → Claude infers flow + role → review
 *   Browse — category grid → role → details → review
 */

import { useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useCreateListing, useInferListing, type InferredListing } from '../hooks/useDiscovery';

// ─── Flow categories ──────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: 'Work & Career',
    flows: [
      { slug: 'freelancer-client', label: 'Freelance Project' },
      { slug: 'job-offer-negotiation', label: 'Job Offer' },
      { slug: 'coaching-executive-engagement', label: 'Executive Coaching' },
      { slug: 'personal-trainer-client', label: 'Personal Training' },
      { slug: 'executive-search-engagement', label: 'Executive Search' },
    ],
  },
  {
    name: 'Business & Investment',
    flows: [
      { slug: 'investor-founder-term-sheet', label: 'Investor / Founder' },
      { slug: 'cofounder-alignment', label: 'Co-founder Alignment' },
      { slug: 'startup-accelerator-founder', label: 'Accelerator / Founder' },
      { slug: 'business-partnership', label: 'Business Partnership' },
      { slug: 'vendor-client-sow', label: 'Vendor / Client' },
      { slug: 'consultant-engagement', label: 'Consulting' },
      { slug: 'technology-partnership', label: 'Tech Partnership' },
      { slug: 'workforce-outsourcing', label: 'Workforce / Outsourcing' },
    ],
  },
  {
    name: 'Finance & Legal',
    flows: [
      { slug: 'financial-planner-client', label: 'Financial Planning' },
      { slug: 'mortgage-origination', label: 'Mortgage / Loan' },
      { slug: 'immigration-attorney-client', label: 'Immigration' },
      { slug: 'cpa-firm-client', label: 'Accounting / Tax' },
      { slug: 'audit-engagement', label: 'Audit' },
      { slug: 'wealth-management-engagement', label: 'Wealth Management' },
    ],
  },
  {
    name: 'Creative & Media',
    flows: [
      { slug: 'media-creator-brand-deal', label: 'Brand Deal' },
      { slug: 'literary-agent-author', label: 'Author / Agent' },
      { slug: 'recording-studio-artist', label: 'Recording Studio' },
      { slug: 'creative-agency-client', label: 'Creative Agency' },
      { slug: 'pr-agency-client', label: 'PR Agency' },
      { slug: 'talent-management-engagement', label: 'Talent Management' },
    ],
  },
  {
    name: 'Life & Services',
    flows: [
      { slug: 'real-estate-offer-negotiation', label: 'Real Estate Offer' },
      { slug: 'residential-buyer-agent', label: 'Buyer / Agent' },
      { slug: 'interior-designer-client', label: 'Interior Design' },
      { slug: 'therapy-intake-alignment', label: 'Therapy Intake' },
      { slug: 'wedding-vendor-couple', label: 'Wedding Planning' },
      { slug: 'school-district-vendor', label: 'Ed-Tech' },
      { slug: 'veterinary-practice-client', label: 'Veterinary' },
      { slug: 'hoa-homeowner-dispute', label: 'HOA / Homeowner' },
    ],
  },
];

type Step = 'start' | 'quick' | 'browse' | 'role' | 'details' | 'review';

interface FormState {
  flowSlug: string;
  role: 'host' | 'guest' | '';
  title: string;
  description: string;
  market: string;
  tags: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '6px 12px',
        fontSize: '12px', fontWeight: active ? 600 : 400,
        color: active ? 'var(--purple)' : 'var(--text-secondary)',
        cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.25)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }
      }}
    >
      {label}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--text-secondary)',
      fontSize: '13px', cursor: 'pointer', padding: '0 0 24px', display: 'block',
    }}>
      ← Back
    </button>
  );
}

function NextBtn({ onClick, disabled, label = 'Continue →' }: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%',
      background: disabled
        ? 'rgba(255,255,255,0.04)'
        : 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.1))',
      border: disabled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(167,139,250,0.4)',
      borderRadius: '12px', padding: '12px',
      fontSize: '14px', fontWeight: 700,
      color: disabled ? 'var(--text-secondary)' : 'var(--purple)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '8px',
    }}>
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DiscoveryNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  const createListing = useCreateListing();
  const inferListing = useInferListing();

  // If ?mode=quick is set, start directly on the quick step
  const initialStep: Step = searchParams.get('mode') === 'quick' ? 'quick' : 'start';
  const [step, setStep] = useState<Step>(initialStep);

  const [quickText, setQuickText] = useState('');
  const [flowSearch, setFlowSearch] = useState('');
  const [form, setForm] = useState<FormState>({
    flowSlug: '', role: '', title: '', description: '', market: '', tags: '',
  });

  const set = (k: keyof FormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Filtered flows for the browse step
  const filteredCategories = useMemo(() => {
    if (!flowSearch.trim()) return CATEGORIES;
    const q = flowSearch.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      flows: cat.flows.filter(f =>
        f.label.toLowerCase().includes(q) || f.slug.includes(q)
      ),
    })).filter(cat => cat.flows.length > 0);
  }, [flowSearch]);

  // Apply inferred data to the form
  const applyInferred = (inferred: InferredListing) => {
    setForm({
      flowSlug: inferred.flowSlug,
      role: inferred.role,
      title: inferred.title,
      description: inferred.description,
      market: '',
      tags: inferred.tags.join(', '),
    });
    setStep('review');
  };

  const handleQuickInfer = async () => {
    if (!quickText.trim()) return;
    try {
      const result = await inferListing.mutateAsync(quickText);
      applyInferred(result);
    } catch {
      // stay on quick step, error shown via inferListing.error
    }
  };

  const handleSubmit = async () => {
    if (!address) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
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
    } catch { /* error shown via createListing.error */ }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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

        <Link to="/discover" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none',
          fontSize: '13px', marginBottom: '32px',
        }}>
          ← Discovery board
        </Link>

        {/* ── Start ── */}
        {step === 'start' && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Post a listing
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 36px' }}>
              Tell Claude what you're looking for. It'll find the right flow and the right person.
            </p>

            {/* Quick post card */}
            <div style={{
              background: 'rgba(28,28,34,0.8)', border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: '18px', padding: '28px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                }}>
                  ✦
                </div>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', margin: 0 }}>
                    Quick Post
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                    Describe it — Claude picks the rest
                  </p>
                </div>
              </div>

              <textarea
                value={quickText}
                onChange={e => setQuickText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && quickText.trim()) handleQuickInfer(); }}
                placeholder="I'm looking for a co-founder with a technical background for my SaaS startup. We're pre-seed, focused on B2B..."
                rows={4}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: '18px',
                  background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '12px 14px',
                  fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                  resize: 'none', outline: 'none', fontFamily: '"Inter", sans-serif',
                  caretColor: 'var(--purple)',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.35)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />

              <button
                onClick={handleQuickInfer}
                disabled={!quickText.trim() || inferListing.isPending}
                style={{
                  marginTop: '12px', width: '100%',
                  background: quickText.trim() && !inferListing.isPending
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(167,139,250,0.12))'
                    : 'rgba(255,255,255,0.04)',
                  border: quickText.trim() ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '11px',
                  fontSize: '14px', fontWeight: 700,
                  color: quickText.trim() ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor: quickText.trim() && !inferListing.isPending ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {inferListing.isPending ? (
                  <>
                    <span style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '2px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--purple)',
                      animation: 'disc-spin 0.7s linear infinite', display: 'inline-block',
                    }} />
                    Finding your flow…
                  </>
                ) : 'Find my match type →'}
              </button>
              <style>{`@keyframes disc-spin { to { transform: rotate(360deg); } }`}</style>

              {inferListing.error && (
                <p style={{ color: 'var(--red)', fontSize: '12px', margin: '8px 0 0' }}>
                  {String(inferListing.error)} — try again
                </p>
              )}
              <p style={{ color: 'rgba(161,161,170,0.5)', fontSize: '11px', margin: '10px 0 0', textAlign: 'right' }}>
                ⌘ + Enter
              </p>
            </div>

            {/* Browse option */}
            <button
              onClick={() => setStep('browse')}
              style={{
                width: '100%', background: 'rgba(28,28,34,0.5)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '18px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', margin: '0 0 3px' }}>
                  Browse flows
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                  Pick from 40+ flows organized by category
                </p>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>›</span>
            </button>
          </>
        )}

        {/* ── Quick post (standalone) ── */}
        {step === 'quick' && (
          <>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              What are you looking for?
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Describe it in plain English. Claude will figure out the flow, role, and title.
            </p>
            <textarea
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && quickText.trim()) handleQuickInfer(); }}
              placeholder="I'm looking for an executive coach who specializes in Series A startup founders…"
              rows={6}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '14px 16px',
                fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6,
                resize: 'none', outline: 'none', fontFamily: '"Inter", sans-serif',
                caretColor: 'var(--purple)', marginBottom: '12px',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.35)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            {inferListing.error && (
              <p style={{ color: 'var(--red)', fontSize: '12px', margin: '0 0 12px' }}>
                Couldn't infer the flow. Try rephrasing.
              </p>
            )}
            <BackBtn onClick={() => setStep('start')} />
            <NextBtn
              onClick={handleQuickInfer}
              disabled={!quickText.trim() || inferListing.isPending}
              label={inferListing.isPending ? 'Figuring it out…' : 'Find my flow →'}
            />
          </>
        )}

        {/* ── Browse: category grid ── */}
        {step === 'browse' && (
          <>
            <BackBtn onClick={() => setStep('start')} />
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Pick a flow
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Select the type of alignment session you want to have.
            </p>

            <input
              value={flowSearch}
              onChange={e => setFlowSearch(e.target.value)}
              placeholder="Search flows…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(9,9,11,0.6)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '9px 14px',
                fontSize: '13px', color: 'var(--text-primary)', outline: 'none', marginBottom: '20px',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.3)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            />

            {filteredCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
                  No flows match "{flowSearch}"
                </p>
                <button
                  onClick={() => { set('flowSlug', flowSearch.trim()); setStep('role'); }}
                  style={{
                    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '12px',
                    color: 'var(--purple)', cursor: 'pointer',
                  }}
                >
                  Use "{flowSearch}" as custom slug
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredCategories.map(cat => (
                  <div key={cat.name}>
                    <p style={{
                      fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      margin: '0 0 10px',
                    }}>
                      {cat.name}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {cat.flows.map(f => (
                        <Pill
                          key={f.slug}
                          label={f.label}
                          active={form.flowSlug === f.slug}
                          onClick={() => { set('flowSlug', f.slug); setStep('role'); }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Role ── */}
        {step === 'role' && (
          <>
            <BackBtn onClick={() => setStep('browse')} />
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              What's your role?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              In <strong style={{ color: 'var(--text-primary)' }}>{form.flowSlug.replace(/-/g, ' ')}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['host', 'guest'] as const).map(r => (
                <button key={r} onClick={() => { set('role', r); setStep('details'); }} style={{
                  background: form.role === r
                    ? r === 'host' ? 'rgba(56,189,248,0.08)' : 'rgba(167,139,250,0.08)'
                    : 'rgba(28,28,34,0.7)',
                  border: form.role === r
                    ? r === 'host' ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(167,139,250,0.3)'
                    : '1px solid var(--border)',
                  borderRadius: '14px', padding: '18px 20px', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                  <p style={{
                    color: r === 'host' ? 'var(--cyan)' : 'var(--purple)',
                    fontWeight: 700, fontSize: '15px', margin: '0 0 4px', textTransform: 'capitalize',
                  }}>{r}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                    {r === 'host'
                      ? 'You're initiating — you have the need or the project.'
                      : 'You're responding — you bring the skill, service, or resource.'}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Details ── */}
        {step === 'details' && (
          <>
            <BackBtn onClick={() => setStep('role')} />
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Describe what you need
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              The more specific, the better Claude's matches.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '8px' }}>
              {[
                { key: 'title' as const, label: 'Title', placeholder: 'e.g. Looking for an executive coach in SaaS', rows: undefined },
                { key: 'description' as const, label: 'What you're looking for *', placeholder: 'Describe your goals, situation, and ideal match…', rows: 5 },
                { key: 'market' as const, label: 'Market / Location (optional)', placeholder: 'e.g. US · B2B · Series A', rows: undefined },
                { key: 'tags' as const, label: 'Tags — comma-separated (optional)', placeholder: 'remote, fintech, $500k ARR', rows: undefined },
              ].map(field => (
                <div key={field.key}>
                  <label style={{
                    fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                    display: 'block', marginBottom: '6px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {field.label}
                  </label>
                  {field.rows ? (
                    <textarea
                      value={form[field.key]}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', padding: '10px 14px',
                        fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                        resize: 'vertical', outline: 'none', fontFamily: '"Inter", sans-serif',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.3)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  ) : (
                    <input
                      value={form[field.key]}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', padding: '10px 14px',
                        fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.3)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  )}
                </div>
              ))}
            </div>

            <NextBtn
              onClick={() => setStep('review')}
              disabled={!form.title.trim() || !form.description.trim()}
            />
          </>
        )}

        {/* ── Review ── */}
        {step === 'review' && (
          <>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px', margin: '0 0 6px' }}>
              Review your listing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 24px' }}>
              Claude will use this to score your matches. You can edit anything before posting.
            </p>

            {/* Preview card */}
            <div style={{
              background: 'rgba(28,28,34,0.8)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '16px', padding: '22px', marginBottom: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                <button
                  onClick={() => setStep(step === 'review' ? 'details' : 'review')}
                  style={{
                    background: 'none', border: 'none', color: 'var(--purple)',
                    fontSize: '11px', cursor: 'pointer', padding: 0, marginLeft: 'auto',
                  }}
                >
                  Edit
                </button>
              </div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', margin: 0 }}>
                {form.title || <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(no title)</span>}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {form.description || <span style={{ opacity: 0.5 }}>(no description)</span>}
              </p>
              {(form.market || form.tags) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
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

            {/* Edit links */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => setStep('details')} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', padding: 0,
              }}>
                ← Edit details
              </button>
              <button onClick={() => setStep('role')} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', padding: 0,
              }}>
                Change role
              </button>
              <button onClick={() => setStep('browse')} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', padding: 0,
              }}>
                Change flow
              </button>
            </div>

            {!address && (
              <div style={{
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                color: 'var(--gold)', fontSize: '13px',
              }}>
                Connect your wallet to post.
              </div>
            )}

            {createListing.error && (
              <div style={{
                background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                color: 'var(--red)', fontSize: '13px',
              }}>
                {String(createListing.error)}
              </div>
            )}

            <NextBtn
              onClick={handleSubmit}
              disabled={!address || createListing.isPending || !form.title.trim() || !form.description.trim() || !form.flowSlug || !form.role}
              label={createListing.isPending ? 'Posting…' : 'Post — find my match →'}
            />
          </>
        )}

      </div>
    </div>
  );
}
