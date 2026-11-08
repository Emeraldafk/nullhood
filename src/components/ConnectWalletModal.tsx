import React, { useState } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ROBINHOOD_CHAIN_ID, ROBINHOOD_EXPLORER_URL } from '../config/robinhoodChain';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectWallet: () => Promise<void>;
  pendingActionTitle?: string;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectWallet,
  pendingActionTitle = 'Voting & Trading Opinions',
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (walletName: string) => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await onConnectWallet();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to connect ${walletName}`;
      setErrorMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#232332] bg-[#12121a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative border-b border-[#21212e] bg-gradient-to-r from-[#151622] via-[#12121a] to-[#171924] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#227c9d] text-white shadow-md">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-fun text-lg font-black text-white">Connect Wallet</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#8c8c9e]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Robinhood Chain Testnet (46630)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-[#28283a] bg-[#1a1a26] p-2 text-[#8c8c9e] transition hover:text-white hover:bg-[#252538]"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Prompt reason callout banner */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-[#227c9d]/30 bg-[#227c9d]/10 px-3 py-2 text-xs text-[#53b3d4]">
            <Sparkles className="h-4 w-4 shrink-0 text-[#227c9d]" />
            <span>
              Connect your wallet to proceed with <strong>{pendingActionTitle}</strong> on Robinhood Chain.
            </span>
          </div>
        </div>

        {/* Modal Body: Wallet Selection List */}
        <div className="p-6 space-y-3">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <p className="font-bold">Connection Issue</p>
                <p className="text-[11px] text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Option 1: MetaMask */}
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => handleConnect('MetaMask')}
            className="group flex w-full items-center justify-between rounded-2xl border border-[#232332] bg-[#161622] p-3.5 transition-all hover:border-[#227c9d] hover:bg-[#1b1c2b] active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2761b]/15 text-[#e2761b] font-bold text-lg">
                🦊
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 font-fun text-sm font-bold text-white group-hover:text-[#53b3d4]">
                  <span>MetaMask</span>
                  {hasInjected && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                      Detected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7a7a8c]">Standard browser extension & mobile</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-[#7a7a8c] transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </button>

          {/* Option 2: Rabby Wallet */}
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => handleConnect('Rabby Wallet')}
            className="group flex w-full items-center justify-between rounded-2xl border border-[#232332] bg-[#161622] p-3.5 transition-all hover:border-[#227c9d] hover:bg-[#1b1c2b] active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 font-bold text-lg">
                🐰
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 font-fun text-sm font-bold text-white group-hover:text-[#53b3d4]">
                  <span>Rabby Wallet</span>
                  <span className="rounded-full bg-[#227c9d]/15 border border-[#227c9d]/30 px-2 py-0.5 font-mono text-[9px] font-bold text-[#53b3d4]">
                    Popular
                  </span>
                </div>
                <p className="text-[11px] text-[#7a7a8c]">Optimized multi-chain security</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-[#7a7a8c] transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </button>

          {/* Option 3: Coinbase Wallet */}
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => handleConnect('Coinbase Wallet')}
            className="group flex w-full items-center justify-between rounded-2xl border border-[#232332] bg-[#161622] p-3.5 transition-all hover:border-[#227c9d] hover:bg-[#1b1c2b] active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 font-bold text-lg">
                🔵
              </div>
              <div className="text-left">
                <div className="font-fun text-sm font-bold text-white group-hover:text-[#53b3d4]">
                  Coinbase Wallet
                </div>
                <p className="text-[11px] text-[#7a7a8c]">Smart wallet or mobile scan</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-[#7a7a8c] transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </button>

          {/* Option 4: Browser Injected / Other */}
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => handleConnect('Browser Wallet')}
            className="group flex w-full items-center justify-between rounded-2xl border border-[#232332] bg-[#161622] p-3.5 transition-all hover:border-[#227c9d] hover:bg-[#1b1c2b] active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-lg">
                ⚡
              </div>
              <div className="text-left">
                <div className="font-fun text-sm font-bold text-white group-hover:text-[#53b3d4]">
                  Injected EVM Provider
                </div>
                <p className="text-[11px] text-[#7a7a8c]">Brave, OKX, Rainbow, or any web3 wallet</p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-[#7a7a8c] transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </button>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-[#21212e] bg-[#0c0c11] px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#8c8c9e]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Robinhood Chain Testnet • Chain ID: {ROBINHOOD_CHAIN_ID}</span>
          </div>
          <div className="mt-1">
            <a
              href={ROBINHOOD_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#227c9d] hover:underline"
            >
              <span>View Testnet Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

