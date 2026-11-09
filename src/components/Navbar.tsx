import React, { useState } from 'react';
import {
  Plus,
  Wallet,
  Sparkles,
  Flame,
  Award,
  Coins,
  Scale,
  Layers,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
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
  | 'resolution'
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

const NAV_ITEMS: {
  id: TiredFunNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { id: 'feed', label: 'Markets', icon: Sparkles, description: 'Perpetual opinions & predictions' },
  { id: 'pulse', label: 'Feed', icon: Flame, description: 'Live conviction posts & debaters' },
  { id: 'reputation', label: 'Reputation', icon: Award, description: 'Trader ranking & track records' },
  { id: 'portfolio', label: 'Portfolio & Fees', icon: Coins, description: 'Holdings & 1% creator earnings' },
  { id: 'resolution', label: 'Resolutions', icon: Scale, description: 'Adjudication & Pari-Mutuel payouts' },
  { id: 'how-it-works', label: 'Architecture', icon: Layers, description: 'Bonding curve mathematical model' },
];

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isRobinhoodChain = chainId === ROBINHOOD_CHAIN_ID;
  const balanceUsd = walletAddress ? (Number(ethBalance) * 2800).toFixed(2) : '0.00';

  const handleSelectTab = (tab: TiredFunNavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21212c] bg-[#0c0c11]/95 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-3 sm:px-6 lg:px-10 xl:px-12 py-2.5 sm:py-3.5">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={() => handleSelectTab('feed')}
            className="flex items-center gap-2 text-left focus:outline-none group shrink-0"
          >
            {/* Tired.Fun flame icon in signature Orange */}
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 transition-transform group-hover:scale-105">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-fun text-xl sm:text-2xl font-black tracking-tight text-white">
                  Tired<span className="text-[#FF6B00]">.Fun</span>
                </span>
                <span className="hidden rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-[#FF8A33] xl:inline-block">
                  ROBINHOOD CHAIN • 46630
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden items-center gap-1 lg:gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-sm shadow-[#FF6B00]/25'
                      : 'text-[#8c8c9e] hover:text-white hover:bg-[#1a1a24]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side controls: Create, Connect/Wallet, Profile, Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Create Market Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold text-[#0e0e13] shadow-sm transition hover:bg-slate-200 active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Create</span>
          </button>

          {/* Connect / Wallet Balance pill */}
          {!walletAddress ? (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#FF6B00] px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#FF6B00]/25 transition hover:bg-[#EA580C] active:scale-95 shrink-0"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Connect</span>
            </button>
          ) : !isRobinhoodChain ? (
            <button
              onClick={onSwitchNetwork}
              className="rounded-full bg-[#FF6B00] px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#EA580C] transition shadow-sm shrink-0"
            >
              Switch 46630
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-[#232330] bg-[#171722] py-1 px-2.5 sm:px-3 shrink-0">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {parseFloat(ethBalance || '0').toFixed(3)} ETH
              </span>
              <span className="hidden sm:inline text-[11px] text-[#7a7a8c] font-mono">
                (${balanceUsd})
              </span>
            </div>
          )}

          {/* User Profile Avatar */}
          {userProfile && (
            <button
              onClick={() => handleSelectTab('portfolio')}
              className="flex items-center gap-1.5 rounded-full border border-[#232330] bg-[#14141c] p-0.5 sm:p-1 sm:pr-3 hover:border-[#38384d] transition shrink-0"
              title="View Profile & Settings"
            >
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden shrink-0">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-tr ${userProfile.avatarGradient} flex items-center justify-center text-[10px] sm:text-xs font-bold text-white`}
                  >
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-white max-w-[85px] truncate hidden md:inline-block">
                {userProfile.displayName}
              </span>
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#232330] bg-[#14141c] text-[#8c8c9e] hover:text-white transition md:hidden shrink-0"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-[#21212c] bg-[#0c0c11]/98 px-3 py-3 md:hidden shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 transition text-left ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 font-bold'
                      : 'text-[#8c8c9e] hover:text-white hover:bg-[#151520]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-black/25 text-white'
                          : 'bg-[#181824] text-[#FF6B00]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] leading-tight mt-0.5 ${
                          isActive ? 'text-white/80' : 'text-[#7a7a8c]'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#555566]'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Mobile Footer Status & Quick Actions */}
          <div className="mt-3 pt-3 border-t border-[#1f1f2c] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300">Robinhood Chain (46630)</span>
            </div>
            {walletAddress && (
              <span className="text-[11px] text-[#53b3d4]">
                {shortenAddress(walletAddress)}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
