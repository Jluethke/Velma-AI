/**
 * FirstRunSetup — one-time welcome modal for new visitors.
 * Shows once when no API key is configured and the user hasn't dismissed it.
 * Guides them to get an Anthropic key so flows actually work on first run.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DISMISSED_KEY = 'ff-welcome-dismissed';
const API_KEY_STORAGE = 'flowfabric-anthropic-key';

export default function FirstRunSetup() {
  const [visible, setVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const hasKey = Boolean(localStorage.getItem(API_KEY_STORAGE)?.trim());
    if (!dismissed && !hasKey) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed.startsWith('sk-ant-')) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
      localStorage.setItem(DISMISSED_KEY, '1');
      setSaved(true);
      setTimeout(() => {
        setVisible(false);
        navigate('/explore');
      }, 1200);
    }
  };

  const isValidKey = apiKey.trim().startsWith('sk-ant-');

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl p-7"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 60px rgba(0,255,200,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold gradient-text" style={{ letterSpacing: '-0.02em' }}>Flow</span>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Fabric</span>
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            One thing before you start
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            FlowFabric runs AI flows and pipelines through Anthropic's Claude.
            Add your API key below — new accounts get <strong style={{ color: 'var(--green)' }}>free credits</strong> that cover dozens of runs.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-5">
          {[
            { n: '1', text: 'Go to console.anthropic.com/settings/keys', link: 'https://console.anthropic.com/settings/keys' },
            { n: '2', text: 'Create a new key (free account gets credits)' },
            { n: '3', text: 'Paste it here' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: 'rgba(0,255,200,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)' }}>
                {step.n}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {step.link ? (
                  <a href={step.link} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--cyan)', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,200,0.3)' }}>
                    {step.text}
                  </a>
                ) : step.text}
              </span>
            </div>
          ))}
        </div>

        {/* Key input */}
        {saved ? (
          <div className="py-3 rounded-lg text-sm font-semibold text-center"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: 'var(--green)' }}>
            ✓ Key saved — taking you to Flows
          </div>
        ) : (
          <>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-2.5 rounded-lg text-sm mb-3 outline-none"
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${isValidKey ? 'rgba(0,255,200,0.4)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                transition: 'border-color 0.2s',
              }}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!isValidKey}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all"
                style={{
                  background: isValidKey ? 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(0,255,200,0.05))' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isValidKey ? 'rgba(0,255,200,0.4)' : 'var(--border)'}`,
                  color: isValidKey ? 'var(--cyan)' : 'var(--text-secondary)',
                  opacity: isValidKey ? 1 : 0.6,
                  fontFamily: 'inherit',
                }}
              >
                Save & Start
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2.5 rounded-lg text-sm cursor-pointer"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
              >
                Skip
              </button>
            </div>

            <p className="text-[10px] text-center mt-3" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
              Stored locally in your browser. Never sent to our servers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
