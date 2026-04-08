/**
 * SkillPalette — draggable skill list sidebar for the chain composer.
 * Shows marketplace skills grouped by domain, with search filtering.
 */
import { useState, useMemo } from 'react';

export interface PaletteSkill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
}

interface SkillPaletteProps {
  skills: PaletteSkill[];
  onAddSkill: (skill: PaletteSkill) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  life: '#00ff88',
  career: '#00ffc8',
  business: '#a855f7',
  health: '#22c55e',
  developer: '#00bfff',
  backend: '#00bfff',
  finance: '#ffd700',
  money: '#ffd700',
  creative: '#ff69b4',
  education: '#00ffc8',
  ai: '#a855f7',
  general: '#888',
};

function getDomainColor(domain: string): string {
  const key = domain.toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return DOMAIN_COLORS.general;
}

export default function SkillPalette({ skills, onAddSkill }: SkillPaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return skills;
    const q = search.toLowerCase();
    return skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [skills, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, PaletteSkill[]> = {};
    for (const skill of filtered) {
      const domain = skill.domain || 'general';
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(skill);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div
      style={{
        width: '260px',
        height: '100%',
        background: 'rgba(10, 10, 15, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
          Skill Palette
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          Click a skill to add it to the canvas
        </p>
      </div>

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
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Skill list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
        {grouped.map(([domain, domainSkills]) => {
          const color = getDomainColor(domain);
          const isExpanded = expandedDomain === domain || !!search;

          return (
            <div key={domain} style={{ marginBottom: '4px' }}>
              {/* Domain header */}
              <button
                onClick={() => setExpandedDomain(isExpanded && !search ? null : domain)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {domain}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  {domainSkills.length} {isExpanded ? '−' : '+'}
                </span>
              </button>

              {/* Skills in domain */}
              {isExpanded && domainSkills.map(skill => (
                <button
                  key={skill.name}
                  onClick={() => onAddSkill(skill)}
                  style={{
                    width: '100%',
                    display: 'block',
                    padding: '6px 8px 6px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: '4px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title={skill.description}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    {skill.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.35)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '210px',
                  }}>
                    {skill.description || `${skill.inputs.length} in / ${skill.outputs.length} out`}
                  </div>
                </button>
              ))}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            No skills match "{search}"
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        {skills.length} skills available
      </div>
    </div>
  );
}
