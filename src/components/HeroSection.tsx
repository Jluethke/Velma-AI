import { useState } from 'react';
import InstallModal from './InstallModal';

export default function HeroSection() {
  const [showInstall, setShowInstall] = useState(false);

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
          Make your AI{' '}
          <span className="block md:inline" style={{
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            actually reliable
          </span>
        </h1>

        <p
          className="text-base md:text-lg mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ color: 'var(--text-secondary)', animationDelay: '0.15s' }}
        >
          Fix broken code automatically &middot; Validate outputs across models &middot; Run proven skills instead of guessing
        </p>

        {/* Primary CTA — Try it now */}
        <a
          href="#live-demo"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl no-underline cursor-pointer transition-all animate-fade-in-up animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(170,136,255,0.15))',
            border: '1px solid rgba(0,255,200,0.3)',
            animationDelay: '0.3s',
            color: 'var(--cyan)',
          }}
        >
          <span className="text-sm md:text-base font-semibold">
            Try it now
          </span>
        </a>

        {/* Secondary CTA — Download */}
        <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => setShowInstall(true)}
            className="text-xs no-underline cursor-pointer transition-colors bg-transparent border-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            or download SkillChain — it's free
          </button>
        </div>

        {/* Powered by badge */}
        <div
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: 'rgba(170,136,255,0.08)',
              border: '1px solid rgba(170,136,255,0.2)',
              color: 'var(--purple)',
            }}
          >
            Powered by SkillChain
          </span>
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
            { value: '126+', label: 'Proven Skills', color: 'var(--cyan)' },
            { value: '92+', label: 'Automated Workflows', color: 'var(--purple)' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
              {i < 1 && <span className="hidden md:inline ml-4" style={{ color: 'var(--border)' }}>&bull;</span>}
            </div>
          ))}
        </div>
      </div>

      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}
    </section>
  );
}
