import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWalletPrompt({ title }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="rounded-xl p-10 text-center max-w-md"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 40px rgba(0, 255, 200, 0.04)',
        }}
      >
        {/* Wallet icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(0, 255, 200, 0.08)', border: '1px solid rgba(0, 255, 200, 0.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title || 'Connect Your Wallet'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Connect a wallet to access the Token Portal. View your TRUST balance, stake tokens, and participate in governance.
        </p>

        <div className="flex justify-center">
          <ConnectButton />
        </div>

        <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          Base Network &middot; Powered by TRUST token
        </p>
      </div>
    </div>
  );
}
