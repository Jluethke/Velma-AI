import { useState } from 'react';

const BASE_URL = 'https://velma-ai.vercel.app';

export default function InstallModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const macCmd = `curl -sSL ${BASE_URL}/install.sh | bash`;
  const winCmd = `irm ${BASE_URL}/install.bat -OutFile install.bat; .\\install.bat`;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 max-w-lg w-full relative"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 60px rgba(0,255,200,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg cursor-pointer"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
        >
          &#10005;
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Install SkillChain
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          One command. No pip, no git, no setup. Works with Claude Code, GPT, Cursor, and more.
        </p>

        {/* Mac/Linux */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>
              Mac / Linux
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 font-mono text-sm cursor-pointer transition-all"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              color: 'var(--green)',
            }}
            onClick={() => copy(macCmd, 'mac')}
          >
            <span className="flex-1 overflow-x-auto whitespace-nowrap">
              <span style={{ color: 'var(--text-secondary)' }}>$ </span>{macCmd}
            </span>
            <span className="text-xs px-2 py-1 rounded flex-shrink-0" style={{
              background: copied === 'mac' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)',
              color: copied === 'mac' ? 'var(--green)' : 'var(--text-secondary)',
            }}>
              {copied === 'mac' ? 'Copied!' : 'Copy'}
            </span>
          </div>
        </div>

        {/* Windows */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--purple)' }}>
              Windows (PowerShell)
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 font-mono text-sm cursor-pointer transition-all"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              color: 'var(--green)',
            }}
            onClick={() => copy(winCmd, 'win')}
          >
            <span className="flex-1 overflow-x-auto whitespace-nowrap">
              <span style={{ color: 'var(--text-secondary)' }}>PS&gt; </span>{winCmd}
            </span>
            <span className="text-xs px-2 py-1 rounded flex-shrink-0" style={{
              background: copied === 'win' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)',
              color: copied === 'win' ? 'var(--green)' : 'var(--text-secondary)',
            }}>
              {copied === 'win' ? 'Copied!' : 'Copy'}
            </span>
          </div>
        </div>

        {/* What happens */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>What happens:</p>
          <ol className="text-xs space-y-1 pl-4" style={{ color: 'var(--text-secondary)' }}>
            <li>Installs Python if needed</li>
            <li>Installs SkillChain SDK + 120 skills + 65 chains</li>
            <li>Auto-configures your AI agent (Claude Code, etc.)</li>
            <li>Creates your trainer profile</li>
          </ol>
          <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
            Then just restart Claude Code and talk normally. Say <span style={{ color: 'var(--cyan)' }}>"help me budget"</span> or <span style={{ color: 'var(--cyan)' }}>"review my code"</span> — it finds the right skill chain.
          </p>
        </div>
      </div>
    </div>
  );
}
