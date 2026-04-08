/**
 * SkillPalette — skill list sidebar + custom skill creator for the chain composer.
 */
import { useState, useMemo } from 'react';

export interface PaletteSkill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  /** True if this skill was created by the user in this session */
  isCustom?: boolean;
}

interface SkillPaletteProps {
  skills: PaletteSkill[];
  onAddSkill: (skill: PaletteSkill) => void;
  /** Called when user creates a brand new custom skill */
  onCreateSkill?: (skill: PaletteSkill) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  life: '#00ff88', career: '#00ffc8', business: '#a855f7', health: '#22c55e',
  engineering: '#00bfff', finance: '#ffd700', marketing: '#ff69b4',
  ai: '#a855f7', data: '#00bfff', learning: '#00ffc8', legal: '#ffa500',
  thinking: '#88ccff', meta: '#888', custom: '#ff8c00', general: '#888',
};

function getDomainColor(domain: string): string {
  const key = domain.toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return DOMAIN_COLORS.general;
}

const DOMAINS = ['engineering', 'business', 'marketing', 'finance', 'career', 'life', 'health', 'thinking', 'learning', 'data', 'ai', 'legal', 'meta', 'custom'];

export default function SkillPalette({ skills, onAddSkill, onCreateSkill }: SkillPaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Creator form state
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('custom');
  const [newDescription, setNewDescription] = useState('');
  const [newInputs, setNewInputs] = useState('');
  const [newOutputs, setNewOutputs] = useState('');

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

  const handleCreateSkill = () => {
    const safeName = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
    if (!safeName || safeName.length < 3) return;

    const skill: PaletteSkill = {
      name: safeName,
      domain: newDomain,
      description: newDescription,
      tags: safeName.split('-').filter(t => t.length > 2),
      inputs: newInputs.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean),
      outputs: newOutputs.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean),
      isCustom: true,
    };

    if (onCreateSkill) onCreateSkill(skill);
    // Also immediately add to canvas
    onAddSkill(skill);

    // Reset form
    setNewName('');
    setNewDescription('');
    setNewInputs('');
    setNewOutputs('');
    setShowCreator(false);
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        background: 'rgba(10, 10, 15, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
            Skills
          </h3>
          <button
            onClick={() => onCreateSkill ? setShowCreator(!showCreator) : alert('Connect wallet with TRUST tokens to create custom skills')}
            style={{
              background: showCreator ? 'rgba(255,140,0,0.15)' : onCreateSkill ? 'rgba(0,255,200,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showCreator ? 'rgba(255,140,0,0.3)' : onCreateSkill ? 'rgba(0,255,200,0.2)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '4px',
              color: showCreator ? '#ff8c00' : onCreateSkill ? 'var(--cyan)' : 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '3px 8px',
              fontWeight: 600,
            }}
          >
            {showCreator ? 'Cancel' : '+ Create Skill'}
          </button>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          Click to add, or create a new skill
        </p>
      </div>

      {/* Custom Skill Creator */}
      {showCreator && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,140,0,0.2)',
          background: 'rgba(255,140,0,0.03)',
        }}>
          <div style={{ fontSize: '11px', color: '#ff8c00', fontWeight: 600, marginBottom: '8px' }}>
            New Custom Skill
          </div>

          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="skill-name (e.g., release-notes-generator)"
            style={inputStyle}
          />

          <textarea
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Describe what this skill does in natural language. Claude will use skill-from-workflow to build it when the chain runs."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />

          <select
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <input
            type="text"
            value={newInputs}
            onChange={e => setNewInputs(e.target.value)}
            placeholder="Inputs (comma-separated): repo_url, branch"
            style={inputStyle}
          />

          <input
            type="text"
            value={newOutputs}
            onChange={e => setNewOutputs(e.target.value)}
            placeholder="Outputs (comma-separated): release_notes, changelog"
            style={inputStyle}
          />

          <button
            onClick={handleCreateSkill}
            disabled={newName.length < 3}
            style={{
              width: '100%',
              padding: '6px',
              background: newName.length >= 3 ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${newName.length >= 3 ? 'rgba(255,140,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '4px',
              color: newName.length >= 3 ? '#ff8c00' : 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              cursor: newName.length >= 3 ? 'pointer' : 'default',
              fontWeight: 600,
              marginTop: '4px',
            }}
          >
            Create + Add to Canvas
          </button>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
            Custom skills are built by Claude during chain execution using skill-from-workflow
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '8px 16px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search 176 skills..."
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
              <button
                onClick={() => setExpandedDomain(isExpanded && !search ? null : domain)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '6px 8px', background: 'transparent',
                  border: 'none', cursor: 'pointer', borderRadius: '4px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {domain}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
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
                    textAlign: 'left', borderRadius: '4px', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title={skill.description}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{skill.name}</span>
                    {skill.isCustom && (
                      <span style={{ fontSize: '8px', color: '#ff8c00', background: 'rgba(255,140,0,0.1)', padding: '0 3px', borderRadius: '2px' }}>new</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '10px', color: 'rgba(255,255,255,0.35)',
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
          <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            No skills match "{search}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        {skills.length} skills ({skills.filter(s => s.isCustom).length} custom)
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '11px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  marginBottom: '6px',
};
