import { useState, useEffect } from 'react';

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

const MCP_URL = 'https://flowfabric.io/api/mcp';

const CLAUDE_WEB_LINK = `https://claude.ai/settings/integrations/add?url=${encodeURIComponent(MCP_URL)}&name=${encodeURIComponent('FlowFabric Skills')}`;

const DESKTOP_CONFIG = {
  mcpServers: {
    flowfabric: {
      url: MCP_URL,
    },
  },
};

function configPath(platform: Platform) {
  switch (platform) {
    case 'mac':
      return '~/Library/Application Support/Claude/claude_desktop_config.json';
    case 'windows':
      return '%APPDATA%\\Claude\\claude_desktop_config.json';
    case 'linux':
      return '~/.config/Claude/claude_desktop_config.json';
    default:
      return '~/.config/Claude/claude_desktop_config.json';
  }
}

function downloadConfig() {
  const blob = new Blob([JSON.stringify(DESKTOP_CONFIG, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'claude_desktop_config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function Install() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [tab, setTab] = useState<'web' | 'desktop'>('web');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
  };

  const btnPrimary = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '12px',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: 'var(--cyan)',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
  };

  const btnSecondary = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '12px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
  };

  const stepStyle = {
    display: 'flex' as const,
    gap: '16px',
    marginBottom: '20px',
  };

  const stepNumber = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: 'var(--cyan)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  };

  const codeBlock = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: 'var(--text-primary)',
    overflowX: 'auto' as const,
    position: 'relative' as const,
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Connect{' '}
            <span style={{ color: 'var(--cyan)' }}>FlowFabric</span>{' '}
            to Claude
          </h1>
          <p
            className="text-base"
            style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}
          >
            Give Claude access to 120+ structured AI skills — budgeting, career coaching, business planning, and more.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex gap-2 mb-8 p-1 rounded-xl mx-auto"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            maxWidth: '360px',
          }}
        >
          <button
            onClick={() => setTab('web')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'web' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: tab === 'web' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
              color: tab === 'web' ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            Claude Web
          </button>
          <button
            onClick={() => setTab('desktop')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'desktop' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: tab === 'desktop' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
              color: tab === 'desktop' ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            Claude Desktop
          </button>
        </div>

        {/* Claude Web tab */}
        {tab === 'web' && (
          <div style={cardStyle}>
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: 'var(--text-primary)', marginTop: 0 }}
            >
              Connect via Claude.ai
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              One click — opens Claude and adds FlowFabric as an integration.
            </p>

            <div style={stepStyle}>
              <div style={stepNumber}>1</div>
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Click the button below to open Claude with FlowFabric pre-configured:
                </p>
                <a
                  href={CLAUDE_WEB_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={btnPrimary}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Add to Claude
                </a>
              </div>
            </div>

            <div style={stepStyle}>
              <div style={stepNumber}>2</div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Confirm the integration in Claude's settings when prompted.
                </p>
              </div>
            </div>

            <div style={{ ...stepStyle, marginBottom: 0 }}>
              <div style={stepNumber}>3</div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Start a new conversation and ask Claude to use FlowFabric — for example:
                </p>
                <p
                  className="text-sm mt-2 italic"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  "Help me build a monthly budget" or "Search FlowFabric skills for career coaching"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Claude Desktop tab */}
        {tab === 'desktop' && (
          <div style={cardStyle}>
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: 'var(--text-primary)', marginTop: 0 }}
            >
              Connect via Claude Desktop
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Add FlowFabric to your Claude Desktop config file.
            </p>

            <div style={stepStyle}>
              <div style={stepNumber}>1</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Download the config file or copy the JSON below:
                </p>
                <div className="flex gap-3 flex-wrap mb-4">
                  <button onClick={downloadConfig} style={btnPrimary}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Config
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(DESKTOP_CONFIG, null, 2),
                        setCopied,
                      )
                    }
                    style={btnSecondary}
                  >
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <div style={codeBlock}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(DESKTOP_CONFIG, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div style={stepStyle}>
              <div style={stepNumber}>2</div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Place the file (or merge the JSON) at:
                </p>
                <code
                  className="text-xs mt-1 block"
                  style={{
                    color: 'var(--cyan)',
                    background: 'var(--bg-secondary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  {configPath(platform)}
                </code>
              </div>
            </div>

            <div style={{ ...stepStyle, marginBottom: 0 }}>
              <div style={stepNumber}>3</div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Restart Claude Desktop. FlowFabric tools will appear automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What you get */}
        <div className="mt-10" style={cardStyle}>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)', marginTop: 0 }}
          >
            What you get
          </h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              {
                label: 'list_skills',
                desc: 'Browse all 120+ skills with domains and descriptions',
              },
              {
                label: 'search_skills',
                desc: 'Find skills by keyword or natural language query',
              },
              {
                label: 'get_skill',
                desc: 'Read the full skill definition and phases',
              },
              {
                label: 'run_skill',
                desc: 'Start guided skill execution inside Claude',
              },
            ].map((tool) => (
              <div
                key={tool.label}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <code
                  className="text-xs font-semibold block mb-1"
                  style={{ color: 'var(--cyan)' }}
                >
                  {tool.label}
                </code>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)', margin: 0 }}
                >
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* URL for advanced users */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            MCP endpoint:{' '}
            <code
              className="text-xs"
              style={{ color: 'var(--cyan)' }}
            >
              {MCP_URL}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
