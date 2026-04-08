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
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          maxHeight: '85vh',
          height: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {skillName}
            </span>
            <span className="text-xs ml-2" style={{ color: state.status === 'streaming' ? 'var(--cyan)' : 'var(--text-secondary)' }}>
              {state.status === 'streaming' ? 'running...' : state.status === 'waiting' ? 'your turn' : state.status === 'error' ? 'error' : state.status === 'idle' ? 'starting...' : 'done'}
            </span>
          </div>
          <div className="flex gap-2">
            {state.status === 'streaming' && (
              <button
                onClick={stop}
                className="text-xs px-3 py-1 rounded cursor-pointer"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)' }}
              >
                Stop
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 rounded cursor-pointer"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
                className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'var(--cyan)' : 'var(--bg-secondary)',
                  color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {state.status === 'error' && (
            <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.15)' }}>
              {state.error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(state.status === 'waiting' || state.status === 'error') && (
          <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              autoFocus
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 rounded-lg text-sm font-semibold cursor-pointer"
              style={{
                background: input.trim() ? 'var(--cyan)' : 'var(--bg-secondary)',
                color: input.trim() ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Send
            </button>
          </div>
        )}

        {state.status === 'streaming' && (
          <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI is working...</span>
          </div>
        )}
      </div>
    </div>
  );
}
