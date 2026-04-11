/**
 * /settings — One-time configuration for FlowFabric.
 * Currently: Anthropic API key setup for Fabric synthesis.
 */
import { useState, useEffect } from 'react';
import { API_KEY_STORAGE } from './FabricStart';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE) ?? '';
    setApiKey(stored);
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setSaved(false);
  };

  const isValid = apiKey.trim().startsWith('sk-');
  const isEmpty = !apiKey.trim();

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            One-time setup. Your data stays on this device.
          </p>
        </div>

        {/* Claude API key section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🤖</span>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Claude API Key
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Required to run neutral synthesis in Fabric sessions
              </p>
            </div>
          </div>

          <div className="text-xs rounded-xl px-4 py-3 mb-5 leading-relaxed"
            style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--cyan)' }}>How it works:</strong> When you trigger synthesis in a Fabric session, your key is read from here and sent directly to Anthropic to run the AI analysis. It's never stored on our servers — only in your browser's local storage.
            {' '}<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
              style={{ color: 'var(--cyan)', textDecoration: 'none', borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
              Get a key at console.anthropic.com →
            </a>
          </div>

          <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
            style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            Anthropic API Key
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setSaved(false); }}
              placeholder="sk-ant-..."
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px',
                fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' as const,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              className="px-3 rounded-lg text-xs cursor-pointer shrink-0"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Validation hint */}
          {!isEmpty && !isValid && (
            <p className="text-xs mb-3" style={{ color: 'var(--red)' }}>
              API keys start with <code>sk-</code>
            </p>
          )}
          {isValid && (
            <p className="text-xs mb-3" style={{ color: 'var(--green)' }}>
              Key looks valid.
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isEmpty || !isValid}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
              style={{
                background: saved ? 'rgba(74,222,128,0.1)' : 'rgba(56,189,248,0.1)',
                border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'rgba(56,189,248,0.25)'}`,
                color: saved ? 'var(--green)' : 'var(--cyan)',
                opacity: isEmpty || !isValid ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {saved ? 'Saved!' : 'Save key'}
            </button>
            {!isEmpty && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 rounded-lg text-sm cursor-pointer"
                style={{
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.15)',
                  color: 'var(--red)',
                  transition: 'all 0.2s',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Desktop app upsell */}
        <div className="glass-card p-5" style={{ borderColor: 'rgba(167,139,250,0.15)' }}>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '1px' }}>💻</span>
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Using Claude Desktop?
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                If you have the FlowFabric MCP server installed, your API key is already configured — you can create and synthesize sessions directly from Claude without ever touching this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
