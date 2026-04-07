import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSkill, useSkills } from '../hooks/useSkills';
import { downloadSkill, copyInstallCommand } from '../utils/downloadSkill';
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

  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

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

  const handleDownload = async () => {
    if (!name) return;
    setDownloadState('downloading');
    try {
      await downloadSkill(name);
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2500);
    } catch {
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  };

  const handleCopy = async () => {
    if (!name) return;
    try {
      await copyInstallCommand(name);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard can fail in some contexts; silently reset
      setCopyState('idle');
    }
  };

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

      {/* Install Section */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(26,26,46,0.6)',
          border: '1px solid var(--border)',
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          Install
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleDownload}
            disabled={downloadState === 'downloading'}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all flex-1 sm:flex-none"
            style={{
              background:
                downloadState === 'done'
                  ? 'rgba(0, 255, 136, 0.2)'
                  : downloadState === 'error'
                    ? 'rgba(255, 107, 107, 0.15)'
                    : 'rgba(0, 255, 136, 0.1)',
              border: `1px solid ${
                downloadState === 'done'
                  ? 'rgba(0, 255, 136, 0.4)'
                  : downloadState === 'error'
                    ? 'rgba(255, 107, 107, 0.3)'
                    : 'rgba(0, 255, 136, 0.25)'
              }`,
              color:
                downloadState === 'done'
                  ? '#00ff88'
                  : downloadState === 'error'
                    ? '#ff6b6b'
                    : '#00ff88',
              opacity: downloadState === 'downloading' ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (downloadState === 'idle') {
                e.currentTarget.style.background = 'rgba(0, 255, 136, 0.18)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.1)';
              }
            }}
            onMouseLeave={e => {
              if (downloadState === 'idle') {
                e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {downloadState === 'downloading'
              ? 'Downloading...'
              : downloadState === 'done'
                ? 'Downloaded!'
                : downloadState === 'error'
                  ? 'Download Failed'
                  : 'Download Skill'}
          </button>

          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all flex-1 sm:flex-none"
            style={{
              background: copyState === 'done' ? 'rgba(0, 255, 200, 0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${copyState === 'done' ? 'rgba(0, 255, 200, 0.3)' : 'var(--border)'}`,
              color: copyState === 'done' ? '#00ffc8' : '#ffffff',
            }}
            onMouseEnter={e => {
              if (copyState === 'idle') {
                e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={e => {
              if (copyState === 'idle') {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }
            }}
          >
            {copyState === 'done' ? 'Copied!' : 'Copy CLI Command'}
          </button>
        </div>

        {/* CLI code block */}
        <div
          className="rounded-lg px-4 py-3 font-mono text-sm"
          style={{
            background: '#0a0a1a',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>$ </span>
          <span style={{ color: '#00ffc8' }}>skillchain import {name}</span>
        </div>
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
