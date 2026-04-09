/**
 * SkillRunner — inline skill execution panel.
 * Streams AI responses from the FlowFabric runtime.
 */
import { useState, useRef, useEffect } from 'react';
import { useSkillRunner } from '../hooks/useSkillRunner';

interface SkillRunnerProps {
  skillName: string;
  skillDescription: string;
  onClose: () => void;
}

export default function SkillRunner({ skillName, skillDescription, onClose }: SkillRunnerProps) {
  const { state, startSkill, sendMessage, stop, reset } = useSkillRunner();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-start the skill
  useEffect(() => {
    startSkill(skillName, skillDescription);
    return () => reset();
  }, [skillName]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleSend = () => {
    if (!input.trim() || state.status === 'streaming') return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div
      className="fixed inset-0 z-[998] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col animate-fade-in-up"
        style={{
          maxHeight: '100vh',
          height: '100dvh',
          borderTop: '2px solid rgba(56, 189, 248, 0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(56,189,248,0.04), rgba(167,139,250,0.04))',
          }}
        >
          <div>
            <span className="text-sm font-semibold gradient-text">
              {skillName}
            </span>
            <span
              className="text-xs ml-2"
              style={{
                color: state.status === 'streaming' ? 'var(--cyan)' : 'var(--text-secondary)',
                ...(state.status === 'streaming' ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}),
              }}
            >
              {state.status === 'streaming' ? 'running...' : state.status === 'waiting' ? 'your turn' : state.status === 'error' ? 'error' : state.status === 'idle' ? 'starting...' : 'done'}
            </span>
          </div>
          <div className="flex gap-2">
            {state.status === 'streaming' && (
              <button
                onClick={stop}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' }}
              >
                Stop
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
          {state.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  maxWidth: '85%',
                  ...(msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(0,255,200,0.1))',
                        border: '1px solid rgba(56,189,248,0.2)',
                        color: 'var(--text-primary)',
                      }
                    : {
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }),
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {state.status === 'streaming' && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3 text-xs"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              >
                AI is working...
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div
              className="text-xs p-3 rounded-xl"
              style={{
                background: 'rgba(248,113,113,0.08)',
                color: 'var(--red)',
                border: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              {state.error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(state.status === 'waiting' || state.status === 'error') && (
          <div
            className="px-4 py-3 flex gap-2 shrink-0"
            style={{
              borderTop: '1px solid var(--border)',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              autoFocus
              className="flex-1"
              style={{
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`px-5 rounded-xl text-sm font-semibold cursor-pointer ${input.trim() ? 'btn-primary' : ''}`}
              style={{
                ...(!input.trim()
                  ? {
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                    }
                  : { color: 'var(--cyan)' }),
              }}
            >
              Send
            </button>
          </div>
        )}

        {state.status === 'streaming' && (
          <div
            className="px-4 py-3 text-center shrink-0"
            style={{
              borderTop: '1px solid var(--border)',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            <span
              className="text-xs"
              style={{
                color: 'var(--cyan)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              AI is working...
            </span>
          </div>
        )}
      </div>

      {/* Mobile: full-screen override */}
      <style>{`
        @media (max-width: 639px) {
          .glass-card[style] {
            border-radius: 0 !important;
            max-height: 100dvh !important;
            height: 100dvh !important;
          }
        }
      `}</style>
    </div>
  );
}
