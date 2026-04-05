import { useState } from 'react';

export default function HeroSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('pip install skillchain');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 255, 200, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(170, 136, 255, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(0, 255, 136, 0.04) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 8s ease infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up"
          style={{ color: '#ffffff', lineHeight: 1.1 }}
        >
          Trade AI Skills,{' '}
          <span className="block md:inline" style={{
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Not Promises
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ color: 'var(--text-secondary)', animationDelay: '0.15s' }}
        >
          AI skills that work with any agent. Publish once, works everywhere.
          Validated by shadow testing, owned by creators, trusted by mathematics.
        </p>

        {/* Terminal CTA */}
        <div
          className="inline-flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all animate-fade-in-up animate-pulse-glow"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            animationDelay: '0.3s',
          }}
          onClick={handleCopy}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
          <span className="text-sm md:text-base font-medium" style={{ color: 'var(--cyan)' }}>
            pip install skillchain
          </span>
          <span
            className="text-xs px-2 py-1 rounded ml-2"
            style={{
              background: copied ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 255, 200, 0.1)',
              color: copied ? 'var(--green)' : 'var(--text-secondary)',
            }}
          >
            {copied ? 'copied!' : 'copy'}
          </span>
        </div>

        {/* Secondary CTAs */}
        <div className="flex items-center justify-center gap-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <a href="/whitepaper" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Read the whitepaper
          </a>
          <span style={{ color: 'var(--border)' }}>|</span>
          <a href="https://github.com" className="text-sm no-underline transition-colors" style={{ color: 'var(--text-secondary)' }}>
            View on GitHub
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="relative z-10 mt-16 md:mt-24 w-full max-w-4xl mx-auto animate-fade-in-up"
        style={{ animationDelay: '0.6s' }}
      >
        <div
          className="flex flex-wrap items-center justify-center gap-4 md:gap-8 px-6 py-4 rounded-xl"
          style={{
            background: 'rgba(26, 26, 46, 0.6)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {[
            { value: '5+', label: 'AI Platforms', color: 'var(--cyan)' },
            { value: '16', label: 'Genesis Skills', color: 'var(--purple)' },
            { value: '8', label: 'Smart Contracts', color: 'var(--gold)' },
            { value: '1B', label: 'Token Supply', color: 'var(--green)' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
              {i < 3 && <span className="hidden md:inline ml-4" style={{ color: 'var(--border)' }}>&bull;</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
