import { Link } from 'react-router-dom';
import type { Skill } from '../hooks/useSkills';
import Badge from './Badge';

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const licenseVariant = skill.license === 'OPEN' ? 'open' : skill.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';

  return (
    <Link
      to={`/skill/${skill.name}`}
      className="group p-5 rounded-xl transition-all duration-300 flex flex-col gap-3 no-underline cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 255, 200, 0.3)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0, 255, 200, 0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>
          {skill.name}
        </h3>
        <span className="text-sm font-bold" style={{ color: skill.price === '0' ? 'var(--green)' : 'var(--gold)' }}>
          {skill.price === '0' ? 'FREE' : `${skill.price} TRUST`}
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <Badge label={skill.domain} variant="domain" />
        <Badge label={skill.license} variant={licenseVariant} />
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
        {skill.description}
      </p>

      {/* Execution pattern */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10 }}>
          {skill.execution_pattern}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {skill.tags.map(tag => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(136, 136, 170, 0.1)',
              color: 'var(--text-secondary)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
