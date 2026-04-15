import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, NodeRegistryABI, TrustOracleABI } from '../contracts';

function ValidatorContent({ address }: { address: `0x${string}` }) {
  // Read node count from contract
  const { data: nodeCount } = useReadContract({
    address: CONTRACTS.NodeRegistry,
    abi: NodeRegistryABI,
    functionName: 'nodeCount',
  });

  // Read current user's trust score
  const { data: myTrust } = useReadContract({
    address: CONTRACTS.TrustOracle,
    abi: TrustOracleABI,
    functionName: 'getTrustScore',
    args: [address],
  });

  const totalNodes = nodeCount ? Number(nodeCount) : null;
  const myTrustScore = myTrust ? (Number(myTrust) / 1e18).toFixed(2) : null;

  return (
    <>
      {/* Summary cards — node count is live from chain */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Registered Nodes</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--cyan)' }}>
            {totalNodes !== null ? totalNodes.toLocaleString() : '—'}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your Trust Score</div>
          <div className="text-xl font-bold mt-1" style={{ color: 'var(--gold)' }}>
            {myTrustScore ?? '—'}
          </div>
        </div>
        <div className="p-4 rounded-xl col-span-2 md:col-span-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Network Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Pre-mainnet</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div
        className="glass-card flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Validator network launching with mainnet</h2>
        <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Validators earn TRUST for reviewing and approving flows. Register your node when the network goes live.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', color: 'var(--green)' }}
          >
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}

export default function PortalValidators() {
  const { address, isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Validators</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Network Validators</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Trust-weighted validators securing the FlowFabric network
      </p>

      {isConnected && address ? (
        <ValidatorContent address={address} />
      ) : (
        <ConnectWalletPrompt title="Connect to View Validators" />
      )}
    </div>
  );
}
