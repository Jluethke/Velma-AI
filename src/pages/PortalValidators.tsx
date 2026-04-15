import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { CONTRACTS, NodeRegistryABI, TrustOracleABI } from '../contracts';
import { useSkills } from '../hooks/useSkills';
import { formatFlowName } from '../utils/formatFlowName';

// ── Validator count colour thresholds ──────────────────────────────────
function validatorColor(count: number): string {
  if (count < 5) return 'var(--gold)';
  if (count < 10) return '#f59e0b'; // amber
  return 'var(--green)';
}

function validatorBg(count: number): string {
  if (count < 5) return 'rgba(255,215,0,0.10)';
  if (count < 10) return 'rgba(245,158,11,0.10)';
  return 'rgba(0,255,136,0.08)';
}

// ── Domain badge ───────────────────────────────────────────────────────
function DomainBadge({ domain }: { domain: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(0,255,200,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
    >
      {domain}
    </span>
  );
}

// ── Tooltip wrapper ────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className="absolute bottom-full left-1/2 mb-2 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap z-50"
          style={{
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,35,0.96)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ── How validation works explainer ────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '1', label: 'Register your node', detail: 'Stake TRUST to join the validator network' },
    { n: '2', label: 'Run shadow executions', detail: 'Replay flows against live inputs in a sandboxed environment' },
    { n: '3', label: 'Earn TRUST for accuracy', detail: 'Rewards scale with your trust score and agreement rate' },
  ];
  return (
    <div
      className="glass-card rounded-xl p-5 mb-6"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
        How validation works
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(0,255,200,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.25)' }}
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {s.label}
              </div>
              <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                {s.detail}
              </div>
            </div>
            {i < steps.length - 1 && (
              <span className="hidden sm:block self-center text-xs" style={{ color: 'var(--border)' }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Register CTA card (shown when user has no node) ───────────────────
function RegisterCTA() {
  return (
    <div
      className="glass-card rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{ border: '1px solid rgba(0,255,200,0.25)', background: 'rgba(0,255,200,0.04)' }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--cyan)' }}
          />
          <span className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>Be the first validator on the network</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Register your node to start earning TRUST. Early validators shape the network's trust foundation.
        </p>
      </div>
      <Tooltip text="Node registration UI coming — contract is live">
        <button
          disabled
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed opacity-50"
          style={{ background: 'rgba(0,255,200,0.12)', border: '1px solid var(--cyan)', color: 'var(--cyan)' }}
        >
          Register Node
        </button>
      </Tooltip>
    </div>
  );
}

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

  const { data: skills = [] } = useSkills();

  const totalNodes = nodeCount ? Number(nodeCount) : null;
  const myTrustScore = myTrust ? (Number(myTrust) / 1e18).toFixed(2) : null;
  const userHasNode = totalNodes !== null && totalNodes > 0;

  // Sort flows by validatorCount ascending (most in need first)
  const sortedFlows = [...skills].sort(
    (a, b) => (a.validatorCount ?? 0) - (b.validatorCount ?? 0)
  );

  return (
    <>
      {/* Summary cards — node count is live from chain */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

      {/* How it works */}
      <HowItWorks />

      {/* Register CTA if user has no node */}
      {!userHasNode && <RegisterCTA />}

      {/* Validation queue */}
      <div className="glass-card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Validation Queue</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Flows sorted by validator need — lowest coverage first
              </div>
            </div>
            {sortedFlows.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,255,200,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,255,200,0.2)' }}
              >
                {sortedFlows.length} flows
              </span>
            )}
          </div>
        </div>

        {sortedFlows.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text-secondary)' }}>
            No flows registered yet.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sortedFlows.map(skill => {
              const vc = skill.validatorCount ?? 0;
              const sr = skill.successRate ?? null;
              const needsBadgeColor = validatorColor(vc);
              const needsBadgeBg = validatorBg(vc);

              return (
                <div
                  key={skill.name}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Flow name + domain */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {formatFlowName(skill.name)}
                      </span>
                      <DomainBadge domain={skill.domain} />
                    </div>
                    {skill.description && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {skill.description}
                      </div>
                    )}
                  </div>

                  {/* Validator count */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: needsBadgeBg, color: needsBadgeColor }}
                    >
                      {vc} {vc === 1 ? 'validator' : 'validators'}
                    </span>
                  </div>

                  {/* Success rate */}
                  <div className="hidden md:flex flex-col items-end flex-shrink-0 w-20">
                    {sr !== null ? (
                      <span className="text-xs font-medium" style={{ color: sr >= 90 ? 'var(--green)' : sr >= 80 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                        {sr}% success
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
                    )}
                  </div>

                  {/* Validate button */}
                  <div className="flex-shrink-0">
                    {userHasNode ? (
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                          background: 'rgba(0,255,200,0.12)',
                          border: '1px solid var(--cyan)',
                          color: 'var(--cyan)',
                          cursor: 'pointer',
                        }}
                      >
                        Validate
                      </button>
                    ) : (
                      <Tooltip text="Register node to validate">
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed opacity-40"
                          style={{
                            background: 'rgba(136,136,170,0.08)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Validate
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
