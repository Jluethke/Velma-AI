import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { skills } from '../data/skills';
import { validationsBySkill } from '../data/validations';
import Badge from '../components/Badge';

export default function SkillDetail() {
  const { name } = useParams<{ name: string }>();
  const [copied, setCopied] = useState(false);
  const [buyHover, setBuyHover] = useState(false);

  const skill = skills.find(s => s.name === name);
  const validations = name ? validationsBySkill[name] ?? [] : [];

  const relatedSkills = useMemo(() => {
    if (!skill) return [];
    return skills
      .filter(s => s.domain === skill.domain && s.name !== skill.name)
      .slice(0, 3);
  }, [skill]);

  const mockPurchases = useMemo(() => {
    if (!skill) return 0;
    return Math.floor(skill.validatorCount * 12 + skill.successRate * 1.7);
  }, [skill]);

  if (!skill) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold mt-20" style={{ color: 'var(--red)' }}>
          Skill Not Found
        </h1>
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          No skill matching "{name}" exists in the registry.
        </p>
        <Link
          to="/explore"
          className="inline-block mt-8 px-6 py-3 rounded-lg text-sm no-underline transition-all"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--cyan)',
          }}
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const licenseVariant = skill.license === 'OPEN' ? 'open' : skill.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';
  const isPaid = skill.price !== '0';
  const executionPattern = ['trading-system', 'multi-agent-swarm', 'tick-engine'].includes(skill.name)
    ? 'Phase Pipeline'
    : 'ORPA Loop';

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(`skillchain import ${skill.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/explore" className="no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          Explore
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
        <div className="flex-1">
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: 'var(--cyan)', textShadow: '0 0 40px rgba(0, 255, 200, 0.15)' }}
          >
            {skill.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge label={skill.domain} variant="domain" />
            <Badge label={skill.license} variant={licenseVariant} />
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(0, 255, 200, 0.08)',
                color: 'var(--cyan)',
              }}
            >
              {executionPattern}
            </span>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {skill.description}
          </p>
        </div>

        {/* Price card */}
        <div
          className="rounded-xl p-6 min-w-[220px] flex flex-col items-center gap-3"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span className="text-3xl font-bold" style={{ color: isPaid ? 'var(--gold)' : 'var(--green)' }}>
            {isPaid ? `${skill.price} TRUST` : 'FREE'}
          </span>
          {isPaid ? (
            <button
              className="w-full px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all"
              style={{
                background: buyHover
                  ? 'linear-gradient(135deg, rgba(0, 255, 200, 0.2), rgba(170, 136, 255, 0.2))'
                  : 'linear-gradient(135deg, rgba(0, 255, 200, 0.12), rgba(170, 136, 255, 0.12))',
                border: '1px solid rgba(0, 255, 200, 0.3)',
                color: 'var(--cyan)',
                boxShadow: buyHover ? '0 0 30px rgba(0, 255, 200, 0.15)' : 'none',
              }}
              onMouseEnter={() => setBuyHover(true)}
              onMouseLeave={() => setBuyHover(false)}
            >
              Buy This Skill
            </button>
          ) : (
            <button
              className="w-full px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all"
              style={{
                background: buyHover
                  ? 'rgba(0, 255, 136, 0.15)'
                  : 'rgba(0, 255, 136, 0.08)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: 'var(--green)',
                boxShadow: buyHover ? '0 0 30px rgba(0, 255, 136, 0.1)' : 'none',
              }}
              onMouseEnter={() => setBuyHover(true)}
              onMouseLeave={() => setBuyHover(false)}
            >
              Install Free
            </button>
          )}
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {isPaid ? 'Requires wallet connection' : 'Open source license'}
          </span>
        </div>
      </div>

      {/* Stats + Install Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Stats Card */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            Performance
          </h3>

          {/* Success rate */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>Success Rate</span>
              <span style={{ color: 'var(--text-primary)' }}>{skill.successRate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${skill.successRate}%`,
                  background: skill.successRate >= 90
                    ? 'linear-gradient(90deg, var(--green), var(--cyan))'
                    : skill.successRate >= 80
                      ? 'linear-gradient(90deg, var(--cyan), var(--purple))'
                      : 'var(--gold)',
                  boxShadow: `0 0 10px ${skill.successRate >= 90 ? 'rgba(0,255,136,0.3)' : 'rgba(0,255,200,0.3)'}`,
                }}
              />
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--cyan)' }}>{skill.validatorCount}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Validators</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--purple)' }}>{mockPurchases}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Installs</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--green)' }}>{skill.tags.length}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Capabilities</div>
            </div>
          </div>
        </div>

        {/* Install + Creator Card */}
        <div className="flex flex-col gap-4">
          {/* Install command */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Install
            </h3>
            <div
              className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-all"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
              }}
              onClick={handleCopyInstall}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <code className="text-xs" style={{ color: 'var(--cyan)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>$ </span>
                skillchain import {skill.name}
              </code>
              <span className="text-xs ml-3" style={{ color: copied ? 'var(--green)' : 'var(--text-secondary)' }}>
                {copied ? 'copied!' : 'copy'}
              </span>
            </div>
          </div>

          {/* Creator info */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Creator
            </h3>
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
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Trust Score:</span>
                  <span style={{ color: 'var(--green)' }}>97.3</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--green)', boxShadow: '0 0 4px var(--green)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {skill.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-3 py-1.5 rounded-full transition-all cursor-default"
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

      {/* Validation History */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
          Validation History
        </h3>

        {validations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th className="text-left font-medium px-3 py-2">Validator</th>
                  <th className="text-left font-medium px-3 py-2">Result</th>
                  <th className="text-left font-medium px-3 py-2">Similarity</th>
                  <th className="text-left font-medium px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {validations.map((v, i) => (
                  <tr
                    key={i}
                    className="transition-all"
                    style={{ background: 'var(--bg-primary)' }}
                  >
                    <td className="px-3 py-2.5 rounded-l-lg font-mono" style={{ color: 'var(--purple)' }}>
                      {v.validator}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: v.result === 'PASS'
                            ? 'rgba(0, 255, 136, 0.12)'
                            : v.result === 'PARTIAL'
                              ? 'rgba(255, 215, 0, 0.12)'
                              : 'rgba(255, 68, 68, 0.12)',
                          color: v.result === 'PASS'
                            ? 'var(--green)'
                            : v.result === 'PARTIAL'
                              ? 'var(--gold)'
                              : 'var(--red)',
                        }}
                      >
                        {v.result}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-primary)' }}>
                      {(v.similarity * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2.5 rounded-r-lg" style={{ color: 'var(--text-secondary)' }}>
                      {v.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            No validation records yet.
          </p>
        )}
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            Related Skills in {skill.domain}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedSkills.map(rs => {
              const rsLicenseVariant = rs.license === 'OPEN' ? 'open' : rs.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';
              return (
                <Link
                  key={rs.name}
                  to={`/skill/${rs.name}`}
                  className="no-underline p-4 rounded-xl transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    display: 'block',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 200, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>{rs.name}</h4>
                    <span className="text-xs font-bold" style={{ color: rs.price === '0' ? 'var(--green)' : 'var(--gold)' }}>
                      {rs.price === '0' ? 'FREE' : `${rs.price} TRUST`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge label={rs.domain} variant="domain" />
                    <Badge label={rs.license} variant={rsLicenseVariant} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rs.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
