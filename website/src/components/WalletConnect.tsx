import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const rawBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      const wei = parseInt(rawBalance as string, 16);
      const eth = wei / 1e18;
      setBalance(eth.toFixed(4));
    } catch {
      setBalance(null);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    } catch {
      // User rejected or error
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [fetchBalance]);

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
        style={{
          background: 'rgba(0, 255, 200, 0.06)',
          border: '1px solid rgba(0, 255, 200, 0.25)',
          color: 'var(--cyan)',
        }}
        title="Click to disconnect"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}
        />
        <span style={{ color: 'var(--text-primary)' }}>{truncateAddress(address)}</span>
        {balance && (
          <span style={{ color: 'var(--text-secondary)' }}>{balance} ETH</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs cursor-pointer transition-all"
      style={{
        background: connecting ? 'rgba(0, 255, 200, 0.04)' : 'transparent',
        border: '1px solid rgba(0, 255, 200, 0.3)',
        color: 'var(--cyan)',
        boxShadow: 'none',
      }}
      onMouseEnter={(e) => {
        if (!connecting) {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 200, 0.15), inset 0 0 20px rgba(0, 255, 200, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(0, 255, 200, 0.3)';
      }}
    >
      {connecting ? (
        <>
          <span className="animate-spin" style={{ display: 'inline-block' }}>&#9676;</span>
          Connecting...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
