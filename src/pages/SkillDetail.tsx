import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSkill, useSkills } from '../hooks/useSkills';
import Badge from '../components/Badge';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className || ''}`}
      style={{ background: 'rgba(255,255,255,0.04)' }}
    />
  );
}

export default function SkillDetail() {
  const { name } = useParams<{ name: string }>();
  const { data: skillData, isLoading: skillLoading } = useSkill(name || '');
  const { data: allSkills } = useSkills();


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

  // Loading state
  if (skillLoading) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 max-w-5xl mx-auto">
        <SkeletonBlock className="h-4 w-40 mb-8" />
        <SkeletonBlock className="h-10 w-72 mb-4" />
        <div className="flex gap-2 mb-6">
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-6 w-24" />
          <SkeletonBlock className="h-6 w-28" />
        </div>
        <SkeletonBlock className="h-24 w-full mb-8" />
        <SkeletonBlock className="h-16 w-full mb-8" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    );
  }

  // Error state: skill not found
  if (!skillMeta && !skillLoading) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold mt-20" style={{ color: '#ff6b6b' }}>
          Skill Not Found
        </h1>
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          No skill matching "{name}" exists in the registry.
        </p>
        <Link
          to="/skills"
          className="inline-block mt-8 px-6 py-3 rounded-lg text-sm no-underline transition-all"
          style={{
            border: '1px solid var(--border)',
            color: '#00ffc8',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 200, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Back to Skills
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
      {/* Back link */}
      <Link
        to="/skills"
        className="inline-flex items-center gap-1.5 text-xs no-underline mb-8 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00ffc8')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <span>&larr;</span>
        <span>Back to Skills</span>
      </Link>

      {/* Header */}
      <h1
        className="text-3xl md:text-4xl font-bold mb-4"
        style={{ color: '#00ffc8', textShadow: '0 0 40px rgba(0, 255, 200, 0.15)' }}
      >
        {skillMeta.name}
      </h1>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Badge label={skillMeta.domain} variant="domain" />
        <Badge label={skillMeta.license} variant={licenseVariant} />
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(0, 255, 200, 0.08)',
            color: '#00ffc8',
          }}
        >
          {skillMeta.execution_pattern}
        </span>
      </div>

      {/* Run Section */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Try this skill
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Downloads a small launcher script. Double-click to run this skill interactively in Claude Code.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => {
              if (!name) return;
              const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
              const ts = new Date().toISOString().slice(0, 10);
              const isWin = navigator.userAgent.includes('Windows');

              // Use claude -p to send an initial prompt so it starts immediately
              // CLAUDE.md provides context, -p kicks off the action
              const prompt = `Run the SkillChain skill "${name}". Call start_skill_run with skill name "${name}", then call get_skill to read the full definition. Ask me for any required inputs, then execute each phase step by step using record_phase. When all phases are done, call complete_skill_run. Start now.`;

              if (isWin) {
                const bat = [
                  '@echo off',
                  `title SkillChain: ${safeName}`,
                  `set "WS=%USERPROFILE%\\SkillChain-Runs\\${safeName}-${ts}"`,
                  `if not exist "%WS%" mkdir "%WS%"`,
                  `cd /d "%WS%"`,
                  '',
                  ':: Check for Claude Code',
                  'where claude >nul 2>nul',
                  'if %errorlevel% neq 0 (',
                  '    echo   Claude Code not found. Installing...',
                  '    where npm >nul 2>nul',
                  '    if %errorlevel% neq 0 (',
                  '        echo   ERROR: Install Node.js from https://nodejs.org',
                  '        pause',
                  '        exit /b 1',
                  '    )',
                  '    npm install -g @anthropic-ai/claude-code',
                  ')',
                  '',
                  `echo   Running ${name}...`,
                  'echo.',
                  `claude -p "${prompt.replace(/"/g, "'")}"`,
                  'echo.',
                  'pause',
                ].join('\n');

                const b = new Blob([bat], { type: 'application/bat' });
                const u = URL.createObjectURL(b);
                const a = document.createElement('a'); a.href = u; a.download = `Run-${safeName}.bat`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(u);
              } else {
                const sh = [
                  '#!/bin/bash',
                  `WS="$HOME/SkillChain-Runs/${safeName}-${ts}"`,
                  `mkdir -p "$WS"`,
                  `cd "$WS"`,
                  '',
                  'if ! command -v claude &> /dev/null; then',
                  '    echo "Installing Claude Code..."',
                  '    npm install -g @anthropic-ai/claude-code 2>/dev/null || {',
                  '        echo "Install Node.js from https://nodejs.org first"',
                  '        exit 1',
                  '    }',
                  'fi',
                  '',
                  `echo "Running ${name}..."`,
                  `claude -p '${prompt.replace(/'/g, "'\\''")}'`,
                ].join('\n');

                const b = new Blob([sh], { type: 'application/x-sh' });
                const u = URL.createObjectURL(b);
                const a = document.createElement('a'); a.href = u; a.download = `Run-${safeName}.sh`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(u);
              }
            }}
            className="px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(0,200,255,0.12), rgba(0,255,200,0.12))',
              border: '1px solid rgba(0,200,255,0.3)',
              color: '#00c8ff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Run in Claude Code — Free
          </button>

          <Link
            to="/compose"
            className="px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all no-underline text-center"
            style={{
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.2)',
              color: 'var(--gold)',
            }}
          >
            Chain with other skills &rarr;
          </Link>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          This is one skill. With TRUST tokens, you can chain multiple skills together in the Composer.
        </p>
      </div>

      {/* Description */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Description
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>
          {description}
        </p>
      </div>

      {/* Tags */}
      {skillMeta.tags.length > 0 && (
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(26,26,46,0.6)',
            border: '1px solid var(--border)',
          }}
        >
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
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
        }}
      >
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
              color: '#00ffc8',
              border: '1px solid rgba(0, 255, 200, 0.2)',
            }}
          >
            WT
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
              The Wayfinder Trust
            </div>
          </div>
        </div>
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Related Skills in {skillMeta.domain}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedSkills.map(rs => {
              const rsLicenseVariant: 'open' | 'commercial' | 'proprietary' =
                rs.license === 'OPEN' ? 'open' : rs.license === 'COMMERCIAL' ? 'commercial' : 'proprietary';
              return (
                <Link
                  key={rs.name}
                  to={`/skill/${rs.name}`}
                  className="no-underline p-5 rounded-xl transition-all block"
                  style={{
                    background: 'rgba(26,26,46,0.6)',
                    border: '1px solid var(--border)',
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
                    <h3 className="text-sm font-semibold" style={{ color: '#00ffc8' }}>
                      {rs.name}
                    </h3>
                    <span
                      className="text-xs font-bold"
                      style={{ color: rs.free ? '#00ff88' : '#ffd700' }}
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
    </div>
  );
}
