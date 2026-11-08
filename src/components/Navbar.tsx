import React from 'react';
import {
  Plus,
  Wallet,
  Sparkles,
  Search,
  Bell,
  Flame,
  Activity,
  Award,
  Coins,
} from 'lucide-react';
import {
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_EXPLORER_URL,
  shortenAddress,
} from '../config/robinhoodChain';
import { UserProfile } from '../lib/userProfileService';

export type TiredFunNavTab =
  | 'feed'
  | 'pulse'
  | 'reputation'
  | 'portfolio'
  | 'how-it-works';

export type NullhoodNavTab = TiredFunNavTab;

interface NavbarProps {
  walletAddress: string | null;
  chainId: number | null;
  ethBalance: string;
  claimableCreatorFees: number;
  contractAddress: string;
  isLiveOnChainMode: boolean;
  activeTab: TiredFunNavTab;
  setActiveTab: (tab: TiredFunNavTab) => void;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
  onOpenCreateModal: () => void;
  onClaimCreatorFees: () => void;
  userProfile?: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletAddress,
  chainId,
  ethBalance,
  claimableCreatorFees,
  contractAddress,
  isLiveOnChainMode,
  activeTab,
  setActiveTab,
  onConnectWallet,
  onSwitchNetwork,
  onOpenCreateModal,
  userProfile,
}) => {
  const isRobinhoodChain = chainId === ROBINHOOD_CHAIN_ID;
  const balanceUsd = walletAddress ? (Number(ethBalance) * 2800).toFixed(2) : '0.00';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21212c] bg-[#0c0c11]/95 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-4 sm:px-8 lg:px-10 xl:px-14 py-3.5">
        {/* Left: Brand Logo + Primary Tired.Fun tabs */}
        <div className="flex items-center gap-8 lg:gap-12">
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            {/* Tired.Fun flame icon in signature #227c9d */}
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#227c9d] text-white shadow-md transition-transform group-hover:scale-105 font-fun text-xl">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-fun text-2xl font-black tracking-tight text-white">
                  null<span className="text-[#227c9d]">hood</span>
                </span>
                <span className="hidden rounded-full border border-[#227c9d]/30 bg-[#227c9d]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#53b3d4] lg:inline-block">
                  ROBINHOOD CHAIN • 46630
                </span>
              </div>
            </div>
          </button>

          {/* Primary Tired.Fun tabs */}
          <nav className="hidden items-center gap-2 lg:gap-2.5 md:flex">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs lg:text-sm font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-[#227c9d] text-white shadow-sm'
                  : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Markets</span>
            </button>

            <button
              onClick={() => setActiveTab('pulse')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs lg:text-sm font-bold transition-all ${
                activeTab === 'pulse'
                  ? 'bg-[#227c9d] text-white shadow-sm'
                  : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('reputation')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs lg:text-sm font-bold transition-all ${
                activeTab === 'reputation'
                  ? 'bg-[#227c9d] text-white shadow-sm'
                  : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Reputation</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs lg:text-sm font-bold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-[#227c9d] text-white shadow-sm'
                  : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Portfolio & Fees</span>
            </button>

            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'how-it-works'
                  ? 'bg-[#227c9d] text-white shadow-sm'
                  : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              Architecture
            </button>
          </nav>
        </div>

        {/* Right side: Search shortcut, Create, Network, Balance & Profile */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">

          {/* Create Button (Clean white rounded button with plus) */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs lg:text-sm font-extrabold text-[#0e0e13] shadow-sm transition hover:bg-slate-200 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Create</span>
          </button>

          {/* Connect / Wallet Balance pill */}
          {!walletAddress ? (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 rounded-full bg-[#227c9d] px-5 py-2 text-xs lg:text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1a647f] active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Connect</span>
            </button>
          ) : !isRobinhoodChain ? (
            <button
              onClick={onSwitchNetwork}
              className="rounded-full bg-[#FF6B00] px-3.5 py-1.5 text-xs font-bold text-black hover:bg-[#FF6B00]"
            >
              Switch to 46630
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-[#232330] bg-[#171722] py-1 px-3">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {parseFloat(ethBalance || '0').toFixed(3)} ETH
              </span>
              <span className="text-[11px] text-[#7a7a8c] font-mono">
                (${balanceUsd})
              </span>
            </div>
          )}

          {/* User Profile / PFP quick button */}
          {userProfile && (
            <button
              onClick={() => setActiveTab('portfolio')}
              className="flex items-center gap-2 rounded-full border border-[#232330] bg-[#14141c] p-1 pr-3 hover:border-[#38384d] transition"
              title="View Profile & Settings"
            >
              <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-tr ${userProfile.avatarGradient} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-white max-w-[90px] truncate hidden sm:inline-block">
                {userProfile.displayName}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex border-t border-[#21212c] bg-[#0c0c11] px-2 py-1.5 md:hidden">
        <div className="flex w-full items-center justify-between text-[11px] font-bold text-[#8c8c9e]">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-2 py-1 ${activeTab === 'feed' ? 'text-white' : ''}`}
          >
            All Markets
          </button>
          <button
            onClick={() => setActiveTab('pulse')}
            className={`px-2 py-1 ${activeTab === 'pulse' ? 'text-white' : ''}`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('reputation')}
            className={`px-2 py-1 ${activeTab === 'reputation' ? 'text-white' : ''}`}
          >
            Rep
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-2 py-1 ${activeTab === 'portfolio' ? 'text-white' : ''}`}
          >
            Pot & Fees
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`px-2 py-1 ${activeTab === 'how-it-works' ? 'text-white' : ''}`}
          >
            Info
          </button>
        </div>
      </div>
    </header>
  );
};
