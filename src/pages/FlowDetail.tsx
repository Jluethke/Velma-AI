import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSkill, useSkills } from '../hooks/useSkills';
import { useGateCheck } from '../hooks/useGateCheck';
import Badge from '../components/Badge';
import FlowRunner from '../components/FlowRunner';
import { formatFlowName } from '../utils/formatFlowName';

// Premium domains that require TRUST to run
const BUILDER_DOMAINS = new Set(['engineering', 'ai']);
const CREATOR_DOMAINS = new Set(['legal', 'meta']);

/** Toast banner for tier-gating messages */
function ToastBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-6 left-1/2 z-[999] animate-fade-in-up"
      style={{ transform: 'translateX(-50%)', maxWidth: '90vw' }}
    >
      <div
        className="glass-card flex items-center gap-3 px-5 py-3 rounded-xl text-sm"
        style={{
          color: 'var(--gold)',
          border: '1px solid rgba(255,215,0,0.3)',
        }}
      >
        <span style={{ fontSize: '1.1em' }}>&#x1f512;</span>
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 cursor-pointer"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '16px' }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default function FlowDetail() {
  const { name } = useParams<{ name: string }>();
  const { data: skillData } = useSkill(name || '');
  const { data: allSkills } = useSkills();
  const { canChain, canPublish } = useGateCheck();
  const [showRunner, setShowRunner] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Find the matching skill from the list for metadata (domain, tags, license, etc.)
  const skillMeta = useMemo(() => {
    if (!allSkills || !name) return null;
    return allSkills.find(s => s.name === name) || null;
  }, [allSkills, name]);

  // Related skills: same domain, exclude current, top 3
  const relatedSkills = useMemo(() => {
    if (!skillMeta || !allSkills) return [];
    return allSkills
      .filter(s => s.domain === skillMeta.domain && s.name !== skillMeta.name)
      .slice(0, 3);
  }, [skillMeta, allSkills]);

  // Error state: skill not found
  if (!skillMeta) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold mt-20" style={{ color: 'var(--red)' }}>
          Flow Not Found
        </h1>
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          No flow matching "{name}" exists in the registry.
        </p>
        <Link
          to="/flows"
          className="btn-secondary inline-block mt-8 px-6 py-3 text-sm no-underline"
          style={{ color: 'var(--cyan)' }}
        >
          Back to Flows
        </Link>
      </div>
    );
  }

  if (!skillMeta) return null;

  const licenseVariant: 'open' | 'commercial' | 'proprietary' =
    skillMeta.license === 'OPEN' ? 'open' : skillMeta.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';

  // Content preview from manifest description or raw content
  const description =
    (skillData?.manifest?.description as string) ||
    skillMeta.description ||
    (skillData?.content ? skillData.content.slice(0, 200) + (skillData.content.length > 200 ? '...' : '') : '');

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-5xl mx-auto">
      {/* Toast banner for tier gating */}
      {toast && <ToastBanner message={toast} onDismiss={() => setToast(null)} />}

      {/* Back link */}
      <Link
        to="/flows"
        className="inline-flex items-center gap-1.5 text-xs no-underline mb-8 transition-colors animate-fade-in-up"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <span>&larr;</span>
        <span>Back to Flows</span>
      </Link>

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text animate-fade-in-up stagger-1">
        {formatFlowName(skillMeta.name)}
      </h1>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in-up stagger-2">
        <Badge label={skillMeta.domain} variant="domain" />
        <Badge label={skillMeta.license} variant={licenseVariant} />
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(0, 255, 200, 0.08)',
            color: 'var(--cyan)',
          }}
        >
          {skillMeta.execution_pattern}
        </span>
      </div>

      {/* Run Section */}
      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up stagger-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Try this flow
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Run this flow directly in your browser. An AI assistant will guide you through it interactively.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => {
              if (!name || !skillMeta) return;
              // Check if this skill requires TRUST
              const domain = skillMeta.domain?.toLowerCase() || '';
              if (CREATOR_DOMAINS.has(domain) && !canPublish) {
                setToast('Creator tier (2,500 TRUST) required for Legal & Meta skills');
                return;
              }
              if (BUILDER_DOMAINS.has(domain) && !canChain) {
                setToast('Builder tier (500 TRUST) required for Engineering & AI skills');
                return;
              }
              setShowRunner(true);
            }}
            className="btn-primary px-6 py-3 text-sm font-semibold cursor-pointer w-full sm:w-auto"
            style={{ color: 'var(--cyan)' }}
          >
            {(() => {
              const domain = skillMeta?.domain?.toLowerCase() || '';
              if (CREATOR_DOMAINS.has(domain)) return 'Run — Creator Tier';
              if (BUILDER_DOMAINS.has(domain)) return 'Run — Builder Tier';
              return 'Run This Flow — Free';
            })()}
          </button>

          <Link
            to="/studio?tab=chain"
            className="btn-secondary px-6 py-3 text-sm font-semibold cursor-pointer no-underline text-center w-full sm:w-auto"
            style={{ color: 'var(--gold)' }}
          >
            Connect with other flows &rarr;
          </Link>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          This is one flow. With TRUST tokens, you can connect multiple flows into chains in the Composer.
        </p>
      </div>

      {/* Description */}
      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up stagger-4">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Description
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {description}
        </p>
      </div>

      {/* Tags */}
      {skillMeta.tags.length > 0 && (
        <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up stagger-5">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {skillMeta.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(136, 136, 170, 0.1)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(136, 136, 170, 0.15)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Creator */}
      <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Creator
        </h2>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.15), rgba(170, 136, 255, 0.15))',
              color: 'var(--cyan)',
              border: '1px solid rgba(0, 255, 200, 0.2)',
            }}
          >
            WT
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              The Wayfinder Trust
            </div>
          </div>
        </div>
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <div className="animate-fade-in-up">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Related Flows in {skillMeta.domain}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedSkills.map(rs => {
              const rsLicenseVariant: 'open' | 'commercial' | 'proprietary' =
                rs.license === 'OPEN' ? 'open' : rs.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';
              return (
                <Link
                  key={rs.name}
                  to={`/flow/${rs.name}`}
                  className="glass-card no-underline p-5 rounded-xl block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>
                      {formatFlowName(rs.name)}
                    </h3>
                    <span
                      className="text-xs font-bold"
                      style={{ color: rs.free ? 'var(--green)' : 'var(--gold)' }}
                    >
                      {rs.free ? 'FREE' : `${rs.price} TRUST`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge label={rs.domain} variant="domain" />
                    <Badge label={rs.license} variant={rsLicenseVariant} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {rs.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Flow Runner */}
      {showRunner && name && (
        <FlowRunner
          skillName={name}
          skillDescription={description}
          skillContent={skillData?.content || ''}
          skillManifest={(skillData?.manifest as Record<string, unknown>) || {}}
          domain={skillMeta?.domain}
          onClose={() => setShowRunner(false)}
        />
      )}
    </div>
  );
}
