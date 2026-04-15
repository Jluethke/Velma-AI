import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, TrustTokenABI, SkillRegistryABI } from '../contracts';

function MarketplaceContent({ address }: { address: `0x${string}` }) {
  // Read balance for display
  const { data: rawBalance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // Read total registered skills from contract
  const { data: skillCount } = useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'skillCount',
  });

  const balance = rawBalance ? parseFloat(formatUnits(rawBalance as bigint, 18)) : 0;
  const onChainSkills = skillCount ? Number(skillCount) : null;

  return (
    <>
      {/* Balance bar */}
      <div className="flex items-center justify-between mb-8 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your Balance</div>
            <div className="text-lg font-bold" style={{ color: 'var(--gold)' }}>{balance.toLocaleString()} TRUST</div>
          </div>
          {onChainSkills !== null && (
            <div className="pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>On-chain Flows</div>
              <div className="text-lg font-bold" style={{ color: 'var(--cyan)' }}>{onChainSkills}</div>
            </div>
          )}
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>

      {/* Empty state */}
      <div
        className="glass-card flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(170,136,255,0.1)', border: '1px solid rgba(170,136,255,0.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Marketplace launching soon</h2>
        <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          All flows are free to run today — paid tiers coming with TRUST token integration.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(170,136,255,0.1)', border: '1px solid rgba(170,136,255,0.25)', color: 'var(--purple)' }}
          >
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}

export default function PortalMarketplace() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Marketplace</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Flow Marketplace</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Browse, purchase, and deploy verified AI flows with TRUST tokens
      </p>

      {isConnected && address ? (
        <MarketplaceContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to Marketplace" />
      )}
    </div>
  );
}
