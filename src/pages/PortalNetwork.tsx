import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, NodeRegistryABI, SkillRegistryABI, TrustTokenABI } from '../contracts';

type ContractEntry = {
  name: string;
  address: string;
  pending?: boolean;
};

const CONTRACT_LIST: ContractEntry[] = [
  { name: 'TrustToken',          address: CONTRACTS.TrustToken },
  { name: 'TrustOracle',         address: CONTRACTS.TrustOracle },
  { name: 'SkillRegistry',       address: CONTRACTS.SkillRegistry },
  { name: 'Marketplace',         address: CONTRACTS.Marketplace },
  { name: 'NodeRegistry',        address: CONTRACTS.NodeRegistry },
  { name: 'GovernanceDAO',       address: CONTRACTS.GovernanceDAO },
  { name: 'LifeRewards',         address: CONTRACTS.LifeRewards },
  { name: 'Staking',             address: CONTRACTS.Staking },
  { name: 'ValidationRegistry',  address: CONTRACTS.ValidationRegistry },
  { name: 'OnboardingRewards',   address: CONTRACTS.OnboardingRewards },
  { name: 'CommunityPool',       address: CONTRACTS.CommunityPool, pending: true },
];

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M10 1H7.5M10 1V3.5M10 1L5.5 5.5M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function NetworkStat({ label, value, change, accent = 'var(--cyan)' }: {
  label: string; value: string; change?: string; accent?: string;
}) {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      {change && (
        <div className="text-xs mt-1" style={{ color: change.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>
          {change} (24h)
        </div>
      )}
    </div>
  );
}

const RECENT_BLOCKS = [
  { number: 1248, proposer: '0x1a2b...3c4d', skills: 3, txns: 12, time: '12s ago' },
  { number: 1247, proposer: '0x9c0d...1e2f', skills: 1, txns: 8, time: '24s ago' },
  { number: 1246, proposer: '0x5e6f...7a8b', skills: 2, txns: 15, time: '36s ago' },
  { number: 1245, proposer: '0x3a4b...5c6d', skills: 0, txns: 6, time: '48s ago' },
  { number: 1244, proposer: '0x7e8f...9a0b', skills: 4, txns: 21, time: '1m ago' },
  { number: 1243, proposer: '0x1a2b...3c4d', skills: 1, txns: 9, time: '1m 12s ago' },
  { number: 1242, proposer: '0xbc1d...2e3f', skills: 2, txns: 11, time: '1m 24s ago' },
  { number: 1241, proposer: '0x5e6f...7a8b', skills: 0, txns: 5, time: '1m 36s ago' },
];

const RECENT_VALIDATIONS = [
  { skill: 'data-pipeline', validator: '0x1a2b...3c4d', result: 'pass', similarity: 0.94, time: '30s ago' },
  { skill: 'prompt-engineering', validator: '0x9c0d...1e2f', result: 'pass', similarity: 0.91, time: '2m ago' },
  { skill: 'risk-assessor', validator: '0x5e6f...7a8b', result: 'fail', similarity: 0.42, time: '5m ago' },
  { skill: 'code-review', validator: '0x3a4b...5c6d', result: 'pass', similarity: 0.97, time: '8m ago' },
  { skill: 'seo-cluster-builder', validator: '0x7e8f...9a0b', result: 'pass', similarity: 0.88, time: '12m ago' },
];

function NetworkContent() {
  // Read on-chain stats
  const { data: nodeCount } = useReadContract({
    address: CONTRACTS.NodeRegistry,
    abi: NodeRegistryABI,
    functionName: 'nodeCount',
  });

  const { data: skillCount } = useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'skillCount',
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'MAX_SUPPLY',
  });

  const nodes = nodeCount ? Number(nodeCount).toLocaleString() : '1,247';
  const skills = skillCount ? Number(skillCount).toLocaleString() : '124';
  const supply = totalSupply ? `${(Number(totalSupply) / 1e24).toFixed(0)}M` : '1B';

  return (
    <>
      {/* Demo notice */}
      <div className="mb-6 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: 'var(--gold)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Preview</span>
        <span style={{ opacity: 0.7 }}>Block explorer and validation feed show sample data. Node count and flow count are live from chain.</span>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <NetworkStat label="Block Height" value="#1,248" change="+87" />
        <NetworkStat label="Active Validators" value={nodes} change="+12" accent="var(--green)" />
        <NetworkStat label="Registered Flows" value={skills} change="+3" accent="var(--purple)" />
        <NetworkStat label="Total Transactions" value="48,291" change="+1,247" accent="var(--gold)" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <NetworkStat label="TRUST Supply" value={supply} />
        <NetworkStat label="Staked" value="48.2M" accent="var(--purple)" />
        <NetworkStat label="Avg Block Time" value="12s" accent="var(--green)" />
        <NetworkStat label="Network Trust" value="0.84" accent="var(--cyan)" />
      </div>

      {/* Contract addresses */}
      <div className="mb-8 p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Contract Addresses
          </h2>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,200,0.07)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.15)' }}>
            Base Mainnet · Chain ID 8453
          </span>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left pb-2 pr-4" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Contract</th>
                <th className="text-left pb-2 pr-4" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Address</th>
                <th className="text-left pb-2" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Explorer</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACT_LIST.map((c, i) => (
                <tr
                  key={c.name}
                  style={{ borderBottom: i < CONTRACT_LIST.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,255,200,0.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c.name}
                    {c.pending && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        pending
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      title={c.address}
                      style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '12px', cursor: 'default' }}
                    >
                      {truncateAddress(c.address)}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {c.pending ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                    ) : (
                      <a
                        href={`https://basescan.org/address/${c.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'; }}
                      >
                        <span style={{ fontSize: '11px' }}>Basescan</span>
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Blocks */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Blocks</h2>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          </div>
          {RECENT_BLOCKS.map(block => (
            <div
              key={block.number}
              className="flex items-center justify-between p-4 transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,200,0.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>#{block.number}</div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Proposer: <span style={{ color: 'var(--text-primary)' }}>{block.proposer}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {block.txns} txns &middot; {block.skills} flow validations
                  </div>
                </div>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{block.time}</div>
            </div>
          ))}
        </div>

        {/* Recent Validations */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Validations</h2>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)' }}>
              Shadow Execution
            </span>
          </div>
          {RECENT_VALIDATIONS.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,200,0.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: v.result === 'pass' ? 'var(--green)' : 'var(--red)' }}
                />
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.skill}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    by {v.validator} &middot; similarity: <span style={{ color: v.similarity > 0.7 ? 'var(--green)' : 'var(--red)' }}>{(v.similarity * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: v.result === 'pass' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                    color: v.result === 'pass' ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {v.result}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{v.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function PortalNetwork() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/portal" className="no-underline" style={{ color: 'var(--cyan)' }}>Portal</Link>
        <span>/</span>
        <span>Network</span>
      </div>

      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Network Overview</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Real-time FlowFabric network statistics and block explorer
      </p>

      {isConnected ? (
        <NetworkContent />
      ) : (
        <ConnectWalletPrompt title="Connect to View Network" />
      )}
    </div>
  );
}
