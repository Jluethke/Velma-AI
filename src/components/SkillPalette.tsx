/**
 * SkillPalette — skill browser sidebar for the chain composer.
 * Shows marketplace skills grouped by domain.
 * Meta/creation tools only visible to TRUST holders.
 */
import { useState, useMemo } from 'react';

export interface PaletteSkill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  isCustom?: boolean;
}

interface SkillPaletteProps {
  skills: PaletteSkill[];
  onAddSkill: (skill: PaletteSkill) => void;
  isPremium?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  life: '#4ade80', career: '#38bdf8', business: '#a78bfa', health: '#4ade80',
  engineering: '#38bdf8', finance: '#fbbf24', marketing: '#f472b6',
  ai: '#a78bfa', data: '#38bdf8', learning: '#38bdf8', legal: '#fb923c',
  thinking: '#94a3b8', meta: '#fbbf24', custom: '#fb923c', general: '#71717a',
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain.toLowerCase()] ?? DOMAIN_COLORS.general;
}

export default function SkillPalette({ skills, onAddSkill, isPremium }: SkillPaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Premium domains: hidden from free users, shown with PRO badge for TRUST holders
  const PREMIUM_DOMAINS = new Set(['meta', 'ai', 'engineering', 'legal']);

  const visibleSkills = useMemo(() => {
    return isPremium ? skills : skills.filter(s => !PREMIUM_DOMAINS.has(s.domain));
  }, [skills, isPremium]);

  const filtered = useMemo(() => {
    if (!search) return visibleSkills;
    const q = search.toLowerCase();
    return visibleSkills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [visibleSkills, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, PaletteSkill[]> = {};
    for (const skill of filtered) {
      const domain = skill.domain || 'general';
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(skill);
    }
    // Sort premium domains at the top for TRUST holders
    return Object.entries(groups).sort(([a], [b]) => {
      const aP = PREMIUM_DOMAINS.has(a) ? 0 : 1;
      const bP = PREMIUM_DOMAINS.has(b) ? 0 : 1;
      if (aP !== bP) return aP - bP;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
          Skills
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--text-secondary)' }}>
          Click to add to canvas
        </p>
      </div>

      {/* Premium upsell for meta skills */}
      {!isPremium && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(251, 191, 36, 0.04)',
          borderBottom: '1px solid rgba(251, 191, 36, 0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--gold)' }}>
            Pro skills unlock with TRUST
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'var(--text-secondary)' }}>
            Engineering, AI, Legal, and skill creation tools
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '8px 16px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills..."
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Skill list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
        {grouped.map(([domain, domainSkills]) => {
          const color = getDomainColor(domain);
          const isExpanded = expandedDomain === domain || !!search;
          const isPro = PREMIUM_DOMAINS.has(domain);

          return (
            <div key={domain} style={{ marginBottom: '4px' }}>
              <button
                onClick={() => setExpandedDomain(isExpanded && !search ? null : domain)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '6px 8px', background: 'transparent',
                  border: 'none', cursor: 'pointer', borderRadius: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {domain === 'meta' ? 'Creation Tools' : domain === 'ai' ? 'AI & Agents' : domain === 'engineering' ? 'Engineering' : domain === 'legal' ? 'Legal & IP' : domain}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {domainSkills.length} {isExpanded ? '\u2212' : '+'}
                </span>
              </button>

              {isExpanded && domainSkills.map(skill => (
                <button
                  key={skill.name}
                  onClick={() => onAddSkill(skill)}
                  style={{
                    width: '100%', display: 'block', padding: '6px 8px 6px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', borderRadius: '4px',
                  }}
                  title={skill.description}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{skill.name}</span>
                    {isPro && (
                      <span style={{ fontSize: '8px', color: 'var(--gold)', background: 'rgba(251,191,36,0.1)', padding: '0 3px', borderRadius: '2px' }}>PRO</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '10px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '230px',
                  }}>
                    {skill.description || `${skill.inputs.length} in / ${skill.outputs.length} out`}
                  </div>
                </button>
              ))}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
            No skills match "{search}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
      }}>
        {isPremium ? 'All skills + creation tools' : 'Browse skills'}
      </div>
    </div>
  );
}
