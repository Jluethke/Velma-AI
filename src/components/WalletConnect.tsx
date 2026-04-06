/**
 * @deprecated — Use RainbowKit's ConnectButton instead.
 * Kept for backwards compatibility if referenced elsewhere.
 */
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnect() {
  return <ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />;
}
