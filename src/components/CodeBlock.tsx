import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: string;
}

export default function CodeBlock({ code, filename, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightBash = (line: string) => {
    if (line.trimStart().startsWith('#')) {
      return <span style={{ color: 'var(--text-secondary)' }}>{line}</span>;
    }
    if (line.trimStart().startsWith('$')) {
      const parts = line.split(/(\$\s*)/);
      return (
        <>
          <span style={{ color: 'var(--text-secondary)' }}>{parts[0]}{parts[1]}</span>
          <span style={{ color: 'var(--cyan)' }}>{parts.slice(2).join('')}</span>
        </>
      );
    }
    // Highlight commands (first word after optional whitespace)
    const match = line.match(/^(\s*)([\w-]+)(.*)/);
    if (match && language === 'bash') {
      return (
        <>
          {match[1]}
          <span style={{ color: 'var(--cyan)' }}>{match[2]}</span>
          <span style={{ color: 'var(--text-primary)' }}>{match[3]}</span>
        </>
      );
    }
    return line;
  };

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ background: '#0d0d14', border: '1px solid var(--border)' }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--red)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--gold)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--green)' }} />
          {filename && (
            <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{filename}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded transition-colors cursor-pointer"
          style={{
            color: copied ? 'var(--green)' : 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
          }}
        >
          {copied ? 'copied!' : 'copy'}
        </button>
      </div>
      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed m-0">
        <code>
          {code.split('\n').map((line, i) => (
            <div key={i}>
              {language === 'bash' ? highlightBash(line) : line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
