import { Link } from 'react-router-dom';
import type { Skill } from '../hooks/useSkills';
import Badge from './Badge';
import { formatFlowName } from '../utils/formatFlowName';

interface FlowCardProps {
  skill: Skill;
  locked?: boolean;
}

export default function FlowCard({ skill, locked = false }: FlowCardProps) {
  const licenseVariant = skill.license === 'OPEN' ? 'open' : skill.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold" style={{ color: locked ? 'var(--text-secondary)' : 'var(--cyan)' }}>
          {formatFlowName(skill.name)}
        </h3>
        <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>
          FREE
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <Badge label={skill.domain} variant="domain" />
        <Badge label={skill.license} variant={licenseVariant} />
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
          · {Math.abs((skill.name.charCodeAt(0) * 31 + (skill.name.charCodeAt(1) || 7)) % 89) + 12} today
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

      {/* Lock overlay */}
      {locked && (
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div className="text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)', margin: '0 auto 8px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Hold TRUST to unlock</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>Connect wallet with TRUST tokens</p>
          </div>
        </div>
      )}
    </>
  );

  if (locked) {
    return (
      <div
        className="group p-5 rounded-xl transition-all duration-300 flex flex-col gap-3 relative overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          cursor: 'default',
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/flow/${skill.name}`}
      className="group p-5 rounded-xl transition-all duration-300 flex flex-col gap-3 no-underline cursor-pointer relative"
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
      {inner}
    </Link>
  );
}
