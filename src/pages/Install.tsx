import { useState, useEffect } from 'react';

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

const MCP_URL = 'https://www.flowfabric.io/api/mcp';

const CLAUDE_WEB_LINK = 'https://claude.ai/settings/connectors?modal=add-custom-connector';

// Remote MCP (simpler, no local install needed)
const DESKTOP_CONFIG_REMOTE = {
  mcpServers: {
    flowfabric: {
      url: MCP_URL,
    },
  },
};

// Local MCP via npx (faster, works offline for cached flows, auto-updates)
const DESKTOP_CONFIG_LOCAL = {
  mcpServers: {
    flowfabric: {
      command: 'npx',
      args: ['-y', 'skillchain-mcp@latest'],
    },
  },
};

// Use local npx install — faster, auto-updates, works offline for cached flows
const DESKTOP_CONFIG = DESKTOP_CONFIG_LOCAL;

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

function downloadInstaller(platform: Platform) {
  const configJson = JSON.stringify(DESKTOP_CONFIG, null, 2);
  const configB64 = btoa(configJson);

  if (platform === 'windows') {
    const bat = `@echo off
title FlowFabric - Claude Desktop Setup
setlocal
set "PS=%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
set "CONFIG_DIR=%APPDATA%\\Claude"
set "CONFIG_FILE=%CONFIG_DIR%\\claude_desktop_config.json"

echo.
echo   FlowFabric - Connecting to Claude Desktop
echo.

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

:: Check if config already exists and has other servers
if exist "%CONFIG_FILE%" (
    echo   Existing config found. Adding FlowFabric...
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%CONFIG_FILE%';" ^
      "$c=Get-Content $p -Raw|ConvertFrom-Json;" ^
      "if(-not $c.mcpServers){$c|Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force};" ^
      "$c.mcpServers|Add-Member -NotePropertyName flowfabric -NotePropertyValue @{url='${MCP_URL}'} -Force;" ^
      "$c|ConvertTo-Json -Depth 10|Set-Content $p -Encoding UTF8"
) else (
    echo   Creating new config...
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "[IO.File]::WriteAllText('%CONFIG_FILE%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${configB64}')))"
)

echo.
echo   Done! FlowFabric is now connected to Claude Desktop.
echo   Restart Claude Desktop to activate.
echo.
pause
`;
    const blob = new Blob([bat], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FlowFabric-Connect.bat';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // Mac / Linux
    const configDir = platform === 'mac'
      ? '$HOME/Library/Application\\ Support/Claude'
      : '$HOME/.config/Claude';

    const sh = `#!/bin/bash
# FlowFabric - Claude Desktop Setup

CONFIG_DIR="${configDir}"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "  FlowFabric - Connecting to Claude Desktop"
echo ""

mkdir -p "$CONFIG_DIR"

if [ -f "$CONFIG_FILE" ]; then
    echo "  Existing config found. Adding FlowFabric..."
    # Merge into existing config using python (available on Mac/Linux)
    python3 -c "
import json, os
path = os.path.expanduser('${configDir.replace(/\\/g, '')}/claude_desktop_config.json')
try:
    with open(path) as f:
        config = json.load(f)
except:
    config = {}
if 'mcpServers' not in config:
    config['mcpServers'] = {}
config['mcpServers']['flowfabric'] = {'url': '${MCP_URL}'}
with open(path, 'w') as f:
    json.dump(config, f, indent=2)
print('  Done!')
"
else
    echo "  Creating new config..."
    echo '${configB64}' | base64 -d > "$CONFIG_FILE"
fi

echo ""
echo "  FlowFabric is now connected to Claude Desktop."
echo "  Restart Claude Desktop to activate."
echo ""
`;
    const blob = new Blob([sh], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FlowFabric-Connect.sh';
    a.click();
    URL.revokeObjectURL(url);
  }
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function Install() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [tab, setTab] = useState<'web' | 'desktop'>('desktop');
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
            Install{' '}
            <span className="gradient-text">FlowFabric</span>
          </h1>
          <p
            className="text-base"
            style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}
          >
            One install. Flows work automatically — say "I hate my job" and Claude runs a career pivot flow. No prompting needed.
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
            onClick={() => setTab('desktop')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'desktop' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: tab === 'desktop' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
              color: tab === 'desktop' ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            Desktop (Recommended)
          </button>
          <button
            onClick={() => setTab('web')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'web' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              border: tab === 'web' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
              color: tab === 'web' ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            Web
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
              Web connectors require you to say "use FlowFabric" to trigger flows. For automatic flow detection, use Desktop instead.
            </p>

            <div style={stepStyle}>
              <div style={stepNumber}>1</div>
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Copy the FlowFabric connector URL:
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <code
                    className="text-xs px-3 py-2 rounded-lg flex-1"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--cyan)', border: '1px solid var(--border)', wordBreak: 'break-all' }}
                  >
                    {MCP_URL}
                  </code>
                  <button
                    onClick={() => copyToClipboard(MCP_URL, setCopied)}
                    style={{ ...btnPrimary, padding: '8px 16px' }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div style={stepStyle}>
              <div style={stepNumber}>2</div>
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Open Claude's connector settings and paste the URL:
                </p>
                <a
                  href={CLAUDE_WEB_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={btnPrimary}
                >
                  Open Claude Settings &rarr;
                </a>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Click "Add custom connector" → paste the URL → confirm.
                </p>
              </div>
            </div>

            <div style={{ ...stepStyle, marginBottom: 0 }}>
              <div style={stepNumber}>3</div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Start a new conversation and ask Claude to use FlowFabric:
                </p>
                <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
                  "Help me build a monthly budget" or "Search FlowFabric flows for career coaching"
                </p>
              </div>
            </div>

            <div style={{ ...stepStyle, marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div style={{ ...stepNumber, background: 'rgba(248,113,113,0.1)', color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}>✕</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  To disconnect FlowFabric
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Go to <a href="https://claude.ai/settings/connectors" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>Claude Settings → Connectors</a> → find FlowFabric → click Remove.
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
                  <button onClick={() => downloadInstaller(platform)} style={btnPrimary}>
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
                desc: 'Browse all 120+ flows with domains and descriptions',
              },
              {
                label: 'search_skills',
                desc: 'Find flows by keyword or natural language query',
              },
              {
                label: 'get_skill',
                desc: 'Read the full flow definition and phases',
              },
              {
                label: 'run_skill',
                desc: 'Start guided flow execution inside Claude',
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
