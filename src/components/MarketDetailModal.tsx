import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Zap,
  Share2,
  ChevronRight,
  ChevronLeft,
  Info,
  Sliders,
  Wallet,
  ExternalLink,
  Shield,
  Clock,
  Target,
  Award,
  MessageSquare,
  Send,
  Heart,
  CheckCircle2,
  Loader2,
  Flame,
  Plus,
  TrendingUp,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import {
  OpinionMarket,
  formatTimeAgo,
  formatExactDateTime,
  formatUsd,
  TradeActivity,
  getMarketPricesAndSentiment,
  quoteBuyOrder,
  quoteSellOrder,
  INITIAL_VIRTUAL_ETH,
  CURVE_K,
  MIN_TRADE_ETH,
  isPredictionMarket,
  isTradingClosed,
  calculateSettlementQuote,
  getResolutionTimeRemaining,
} from '../lib/bondingCurve';
import { ROBINHOOD_EXPLORER_URL } from '../config/robinhoodChain';
import { decodeContractErrorMessage } from '../lib/indexerService';

const ETH_PRICE_USD = 2600;

interface MarketDetailModalProps {
  market: OpinionMarket | null;
  initialSide?: 'YES' | 'NO';
  userYesShares: number;
  userNoShares: number;
  ethBalance: string;
  creatorFeeRate?: number;
  protocolFeeRate?: number;
  isLiveOnChainMode?: boolean;
  marketActivities?: TradeActivity[];
  allMarkets?: OpinionMarket[];
  onClose: () => void;
  onExecuteTrade: (
    marketId: number,
    isYes: boolean,
    isBuy: boolean,
    amount: number,
    slippagePct?: number
  ) => Promise<void>;
  onAddComment: (marketId: number, side: 'YES' | 'NO', text: string) => void;
  onToggleCommentLike?: (marketId: number, commentId: string) => void;
  onClaimSettlement?: (marketId: number) => Promise<void>;
  onClaimVoidRefund?: (marketId: number) => Promise<void>;
  hasClaimedSettlement?: boolean;
  onSelectMarket?: (marketId: number) => void;
  onTopUpWallet?: () => void;
}

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({
  market,
  initialSide = 'YES',
  userYesShares,
  userNoShares,
  ethBalance,
  creatorFeeRate = 0.01,
  protocolFeeRate = 0.01,
  isLiveOnChainMode = false,
  marketActivities = [],
  allMarkets = [],
  onClose,
  onExecuteTrade,
  onAddComment,
  onToggleCommentLike,
  onClaimSettlement,
  onClaimVoidRefund,
  hasClaimedSettlement = false,
  onSelectMarket,
  onTopUpWallet,
}) => {
  // Mobile Tab: 'overview' (chart, description, comments) or 'trade' (trading widget & holders)
  const [mobileTab, setMobileTab] = useState<'overview' | 'trade'>('overview');

  // Trade configuration
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>(initialSide);
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'ETH'>('USD');
  const [inputAmount, setInputAmount] = useState<string>('5');
  const [slippagePct, setSlippagePct] = useState<number>(1.0);
  const [showSlippageConfig, setShowSlippageConfig] = useState<boolean>(false);
  const [isClaimingReward, setIsClaimingReward] = useState<boolean>(false);

  // Insufficient Balance Warning Modal State
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [boostedNotification, setBoostedNotification] = useState<boolean>(false);

  // Chart and Subsections State
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'MAX'>('1M');
  const [chartMode, setChartMode] = useState<'price' | 'bonding'>('price');
  const [buyersFilter, setBuyersFilter] = useState<'Off' | 'Yes' | 'No'>('Off');
  const [infoTab, setInfoTab] = useState<'description' | 'rules'>('description');
  const [holdersSideTab, setHoldersSideTab] = useState<'YES' | 'NO'>('YES');
  const [holdersPage, setHoldersPage] = useState<number>(1);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [txStatus, setTxStatus] = useState<
    'IDLE' | 'SIMULATING' | 'SIGNING' | 'CONFIRMED' | 'FAILED'
  >('IDLE');
  const [txErrorExplanation, setTxErrorExplanation] = useState<string | null>(null);

  // Sync selectedSide when initialSide or market changes
  useEffect(() => {
    if (initialSide) {
      setSelectedSide(initialSide);
      setHoldersSideTab(initialSide);
    }
  }, [initialSide, market?.id]);

  const isYes = selectedSide === 'YES';

  const metrics = useMemo(() => {
    if (!market) {
      return {
        yesPriceEth: 0.000001,
        noPriceEth: 0.000001,
        yesSentimentPct: 50,
        noSentimentPct: 50,
        totalPoolEth: 0,
        totalVolumeEth: 0,
        yesMultiplier: 1,
        noMultiplier: 1,
        sentimentChange24h: 0,
        sentimentChangeRecent: 0,
        controversyScore: 50,
      };
    }
    return getMarketPricesAndSentiment(market);
  }, [market]);

  // Convert inputAmount into ETH for on-chain/contract quoting
  const rawInput = parseFloat(inputAmount) || 0;
  const numericEth = useMemo(() => {
    if (tradeMode === 'SELL') {
      // In SELL mode, input is in shares
      return rawInput;
    }
    if (inputCurrency === 'USD') {
      return rawInput / ETH_PRICE_USD;
    }
    return rawInput;
  }, [rawInput, inputCurrency, tradeMode]);

  const quote = useMemo(() => {
    if (!market || numericEth <= 0) {
      return {
        sharesDelta: 0,
        netEthDelta: 0,
        creatorFeeEth: 0,
        protocolFeeEth: 0,
        totalFeeEth: 0,
        newPriceEth: isYes ? metrics.yesPriceEth : metrics.noPriceEth,
        priceImpactPct: 0,
        minimumReceived: 0,
      };
    }
    if (tradeMode === 'BUY') {
      return quoteBuyOrder(
        market,
        isYes,
        numericEth,
        slippagePct,
        creatorFeeRate,
        protocolFeeRate
      );
    } else {
      return quoteSellOrder(
        market,
        isYes,
        numericEth,
        slippagePct,
        creatorFeeRate,
        protocolFeeRate
      );
    }
  }, [market, tradeMode, isYes, numericEth, slippagePct, creatorFeeRate, protocolFeeRate, metrics]);

  const userSideShares = isYes ? userYesShares : userNoShares;
  const userEthBalanceNum = parseFloat(ethBalance || '0');
  const userUsdBalanceNum = userEthBalanceNum * ETH_PRICE_USD;

  // USD values for presentation matching pov.co
  const totalPoolUsd = (metrics.totalPoolEth * ETH_PRICE_USD).toFixed(2);
  const totalVolumeUsd = (metrics.totalVolumeEth * ETH_PRICE_USD >= 1000)
    ? `${(metrics.totalVolumeEth * ETH_PRICE_USD / 1000).toFixed(2)}k`
    : (metrics.totalVolumeEth * ETH_PRICE_USD).toFixed(2);
  const yesPoolUsd = ((market?.yesCurve.realEth || 0) * ETH_PRICE_USD).toFixed(2);
  const noPoolUsd = ((market?.noCurve.realEth || 0) * ETH_PRICE_USD).toFixed(2);
  const yesPriceUsd = (metrics.yesPriceEth * ETH_PRICE_USD * 1000).toFixed(2);
  const noPriceUsd = (metrics.noPriceEth * ETH_PRICE_USD * 1000).toFixed(2);

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market) return;
    setTxErrorExplanation(null);

    if (rawInput <= 0) {
      setTxStatus('FAILED');
      setTxErrorExplanation('Enter a positive trade amount.');
      return;
    }

    // Check user balance for BUY trades
    if (tradeMode === 'BUY') {
      const requiredEth = numericEth;
      if (requiredEth > userEthBalanceNum) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      if (requiredEth < MIN_TRADE_ETH) {
        setTxStatus('FAILED');
        setTxErrorExplanation(
          decodeContractErrorMessage('TradeBelowMinimum: minimum is 0.0001 ETH (~$0.26)')
        );
        return;
      }
    }

    if (tradeMode === 'SELL' && rawInput > userSideShares) {
      setTxStatus('FAILED');
      setTxErrorExplanation(decodeContractErrorMessage('InsufficientShares'));
      return;
    }

    setTxStatus('SIMULATING');
    try {
      await new Promise((r) => setTimeout(r, 180));
      setTxStatus('SIGNING');
      await onExecuteTrade(
        market.id,
        isYes,
        tradeMode === 'BUY',
        tradeMode === 'BUY' ? numericEth : rawInput,
        slippagePct
      );
      setTxStatus('CONFIRMED');
      setTimeout(() => setTxStatus('IDLE'), 2800);
    } catch (err: unknown) {
      setTxStatus('FAILED');
      const raw = err instanceof Error ? err.message : String(err);
      setTxErrorExplanation(decodeContractErrorMessage(raw));
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!market || !commentText.trim()) return;
    onAddComment(market.id, selectedSide, commentText.trim());
    setCommentText('');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  const handleBoostMarket = () => {
    setBoostedNotification(true);
    setTimeout(() => setBoostedNotification(false), 3000);
  };

  // Holders List partitioned by YES/NO
  const defaultYesHolders = [
    { address: 'shinchan', handle: '@shinchan', shares: 435, supplyPct: 0.63 },
    { address: '0xf1a3262E48EFF92D41c1Cb...', handle: '0xf1a3...1Cb', shares: 144, supplyPct: 0.21 },
    { address: '0x32A499BEFbbDC6ac0C566...', handle: '0x32A4...566', shares: 81, supplyPct: 0.12 },
    { address: 'jussy', handle: '@jussy', shares: 78, supplyPct: 0.11 },
    { address: 'naga', handle: '@naga', shares: 19, supplyPct: 0.03 },
    { address: 'khademianhamid', handle: '@khademian', shares: 4, supplyPct: 0.01 },
    { address: 'Mahsa', handle: '@Mahsa', shares: 3, supplyPct: 0.01 },
    { address: 'rasoul', handle: '@rasoul', shares: 3, supplyPct: 0.01 },
  ];

  const defaultNoHolders = [
    { address: 'Jacek', handle: '@Jacek', shares: 28400, supplyPct: 41.16 },
    { address: 'Dr2kbkX2JejoA...', handle: 'Dr2kbk...joA', shares: 10070, supplyPct: 14.60 },
    { address: 'naga', handle: '@naga', shares: 2500, supplyPct: 3.62 },
    { address: 'shinchan', handle: '@shinchan', shares: 435, supplyPct: 0.63 },
  ];

  const activeHolders = holdersSideTab === 'YES' ? defaultYesHolders : defaultNoHolders;

  // Recent transactions list from activities or realistic fallbacks matching pov.co
  const recentTransactions = useMemo(() => {
    if (marketActivities.length > 0) {
      return marketActivities.slice(0, 8).map((act) => ({
        id: act.id,
        trader: act.trader.length > 10 ? `${act.trader.slice(0, 4)}...${act.trader.slice(-3)}` : act.trader,
        isYes: act.isYes,
        isBuy: act.isBuy,
        shares: act.sharesAmount,
        time: formatExactDateTime(act.timestamp),
      }));
    }
    return [
      { id: '1', trader: 'Sar...', isYes: true, isBuy: false, shares: 424, time: 'Nov 11, 01:36 PM' },
      { id: '2', trader: 'Sar...', isYes: true, isBuy: true, shares: 424, time: 'Nov 11, 01:36 PM' },
      { id: '3', trader: '0x5...', isYes: true, isBuy: false, shares: 235, time: 'Nov 11, 11:10 AM' },
      { id: '4', trader: '0x5...', isYes: true, isBuy: true, shares: 235, time: 'Nov 11, 11:09 AM' },
      { id: '5', trader: '0x0...', isYes: true, isBuy: true, shares: 165, time: 'Nov 11, 10:55 AM' },
      { id: '6', trader: '0x0...', isYes: true, isBuy: true, shares: 242, time: 'Nov 11, 10:55 AM' },
      { id: '7', trader: 'shi...', isYes: true, isBuy: true, shares: 435, time: 'Nov 11, 09:56 AM' },
      { id: '8', trader: '0xF...', isYes: true, isBuy: false, shares: 453, time: 'Nov 11, 09:56 AM' },
    ];
  }, [marketActivities]);

  // Related markets list
  const relatedMarkets = useMemo(() => {
    return allMarkets
      .filter((m) => m.id !== market?.id)
      .slice(0, 3);
  }, [allMarkets, market?.id]);

  if (!market) return null;

  const isPrediction = isPredictionMarket(market);
  const tradingClosed = isTradingClosed(market);
  const settlementQuote = calculateSettlementQuote(
    market,
    userYesShares,
    userNoShares,
    hasClaimedSettlement
  );
  const timeRemaining = market.prediction?.closingTime
    ? getResolutionTimeRemaining(market.prediction.closingTime)
    : null;
  const currentStatus = market.status || 'ACTIVE';

  // AI Agent Opinions tailored to market context
  const aiOpinions = {
    yes: {
      author: '@NotKaiCenat AI',
      quote:
        market.category === 'AI'
          ? '"Naruto taught consistency & morals ❤️ AI development will inevitably align with higher ethical equilibrium and systemic justice."'
          : '"Historical analysis demonstrates that societal and legal feedback loops systematically advance accountability over long time horizons."',
    },
    no: {
      author: '@NotMrBeast AI',
      quote:
        market.category === 'AI'
          ? '"Commercial incentives and asymmetric power dynamics frequently outpace safeguards, leaving systemic justice secondary to market dominance."'
          : '"Asymmetric resource distribution and judicial disparities demonstrate that justice remains unevenly accessible across social tiers."',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md overflow-hidden">
      {/* Insufficient ETH Balance Modal Dialog (Screenshot 5) */}
      {showInsufficientBalanceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[24px] border border-[#2a2a3c] bg-[#12121a] p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowInsufficientBalanceModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#1e1e2c] text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-bold text-[#f27474] mb-2 font-fun">
              Insufficient ETH balance
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans">
              In order to trade this market you need to have ${rawInput.toFixed(2)} on your Robinhood Chain wallet
            </p>

            <div className="grid grid-cols-2 rounded-2xl border border-[#232332] bg-[#0c0c12] p-4 mb-6">
              <div className="text-left border-r border-[#232332] pr-3">
                <span className="block text-[11px] text-zinc-500 font-medium">Required</span>
                <span className="text-base font-bold text-white font-mono">
                  ${rawInput.toFixed(2)}
                </span>
              </div>
              <div className="text-left pl-4">
                <span className="block text-[11px] text-zinc-500 font-medium">Your balance</span>
                <span className="text-base font-bold text-white font-mono">
                  ${userUsdBalanceNum.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowInsufficientBalanceModal(false);
                  if (onTopUpWallet) onTopUpWallet();
                }}
                className="w-full rounded-2xl bg-[#d2c4ff] py-3 text-sm font-bold text-[#140e2d] hover:bg-[#c2b0ff] transition active:scale-98 shadow-md"
              >
                Top Up my Wallet
              </button>
              <button
                type="button"
                onClick={() => setShowInsufficientBalanceModal(false)}
                className="w-full rounded-2xl bg-[#1c1c28] py-3 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#252536] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Window */}
      <div className="relative flex h-full sm:h-[94vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-none sm:rounded-[24px] border border-[#232332] bg-[#0c0c11] text-white shadow-2xl">
        {/* Top Header Row matching pov.co */}
        <div className="border-b border-[#20202c] bg-[#121219] px-4 sm:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left buttons: Back, Mobile Trade toggle, Boost */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-full border border-[#2e2e42] bg-[#181824] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#222232] transition active:scale-95 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Back</span>
              </button>

              {/* Mobile View Switcher: Overview vs Trade */}
              <div className="flex lg:hidden items-center rounded-full border border-[#2e2e42] bg-[#181824] p-0.5">
                <button
                  type="button"
                  onClick={() => setMobileTab('overview')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    mobileTab === 'overview'
                      ? 'bg-[#2b2b3d] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('trade')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    mobileTab === 'trade'
                      ? 'bg-[#8a3ffc] text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Trade
                </button>
              </div>

              <button
                type="button"
                onClick={handleBoostMarket}
                className="flex items-center gap-1.5 rounded-full border border-[#2e2e42] bg-[#181824] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#222232] transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Boost Market</span>
              </button>

              {boostedNotification && (
                <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 animate-pulse">
                  ⚡ Market Boosted on Feed!
                </span>
              )}
            </div>

            {/* Right: Currency Indicator & Desktop Close */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center rounded-full border border-[#2e2e42] bg-[#181824] p-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setInputCurrency('USD')}
                  className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                    inputCurrency === 'USD' ? 'bg-[#8a3ffc] text-white' : 'text-zinc-400'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setInputCurrency('ETH')}
                  className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                    inputCurrency === 'ETH' ? 'bg-[#8a3ffc] text-white' : 'text-zinc-400'
                  }`}
                >
                  ETH
                </button>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#2e2e42] bg-[#181824] text-zinc-300 hover:text-white hover:bg-[#252538] transition cursor-pointer"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN: Overview (Header, Stacked Conviction Bars, Chart, Description/Rules, AI Debates, Comments) */}
            <div className={`space-y-6 lg:col-span-7 xl:col-span-8 ${mobileTab === 'trade' ? 'hidden lg:block' : 'block'}`}>
              
              {/* Market Title & Share Button */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black leading-tight text-white font-fun">
                    {market.question}
                  </h1>
                  <button
                    onClick={handleCopyLink}
                    title="Share market link"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2b2b3b] bg-[#161622] text-zinc-300 hover:bg-[#222234] hover:text-white transition cursor-pointer"
                  >
                    {copiedShareLink ? (
                      <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                    ) : (
                      <Share2 className="h-4 w-4 stroke-[2]" />
                    )}
                  </button>
                </div>

                {/* Metadata Row matching pov.co: • TIME AGO | CATEGORY | BY CREATOR | ENTERED | POOL & TOTAL VOLUME */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 border-b border-[#20202c] pb-4 text-xs font-medium text-zinc-400">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1.5 text-pink-400 font-bold uppercase tracking-wider text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                      {formatTimeAgo(market.createdAt).toUpperCase()}
                    </span>
                    <span className="rounded-full bg-[#1e1e2b] px-2.5 py-0.5 text-[11px] font-bold text-zinc-300 border border-[#2e2e40]">
                      {market.category}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-300 font-mono text-[11px]">
                      BY <strong className="text-white">{market.sourceHandle || (market.creator.slice(0, 6) + '...' + market.creator.slice(-4))}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      👥 {market.totalTrades || 26} Entered
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-zinc-300">
                    <span>
                      Pool: <strong className="text-white">${totalPoolUsd}</strong> ({metrics.totalPoolEth.toFixed(3)} ETH)
                    </span>
                    <span>
                      Total Volume: <strong className="text-white">${totalVolumeUsd}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual Stacked Conviction Bars (Exact signature pov.co layout) */}
              <div className="space-y-2.5">
                {/* YES BAR */}
                <div
                  onClick={() => {
                    setSelectedSide('YES');
                    setHoldersSideTab('YES');
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group relative h-13 sm:h-14 w-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 ${
                    selectedSide === 'YES'
                      ? 'border-[#8a3ffc] shadow-lg shadow-[#8a3ffc]/15 ring-2 ring-[#8a3ffc]/30'
                      : 'border-[#262638] bg-[#14141d] hover:border-[#8a3ffc]/50'
                  }`}
                >
                  <div
                    style={{ width: `${Math.max(12, metrics.yesSentimentPct)}%` }}
                    className="absolute inset-y-0 left-0 bg-[#8a3ffc] transition-all duration-500 rounded-2xl"
                  />
                  <div className="relative z-10 flex h-full items-center justify-between px-5">
                    <span className="text-base sm:text-lg font-bold text-white drop-shadow-sm flex items-center gap-2">
                      Yes
                      {selectedSide === 'YES' && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase font-bold text-white">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-white/95 drop-shadow-sm">
                      ${yesPoolUsd} pool
                    </span>
                  </div>
                </div>

                {/* NO BAR */}
                <div
                  onClick={() => {
                    setSelectedSide('NO');
                    setHoldersSideTab('NO');
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group relative h-13 sm:h-14 w-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 ${
                    selectedSide === 'NO'
                      ? 'border-[#FF6B00] shadow-lg shadow-[#FF6B00]/15 ring-2 ring-[#FF6B00]/30'
                      : 'border-[#262638] bg-[#14141d] hover:border-[#FF6B00]/50'
                  }`}
                >
                  <div
                    style={{ width: `${Math.max(8, metrics.noSentimentPct)}%` }}
                    className="absolute inset-y-0 left-0 bg-[#f59e0b] transition-all duration-500 rounded-2xl"
                  />
                  <div className="relative z-10 flex h-full items-center justify-between px-5">
                    <span className="text-base sm:text-lg font-bold text-white drop-shadow-sm flex items-center gap-2">
                      No
                      {selectedSide === 'NO' && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase font-bold text-black">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-white/95 drop-shadow-sm">
                      ${noPoolUsd} pool
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart Controls & Interactive Canvas */}
              <div className="rounded-[22px] border border-[#222230] bg-[#121219] p-4 sm:p-5">
                {/* Control bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  {/* Left: Timeframe pills & Legend */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-xl bg-[#1a1a24] p-1 border border-[#2a2a3a]">
                      {(['1D', '1W', '1M', 'MAX'] as const).map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setTimeframe(tf)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            timeframe === tf
                              ? 'bg-[#2b2b3d] text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="flex items-center gap-1.5 text-[#a855f7] font-bold">
                        <span className="h-2 w-2 rounded-full bg-[#8a3ffc]" />
                        Yes +{metrics.yesSentimentPct.toFixed(1)}%
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                        No +{metrics.noSentimentPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Right: Buyers filter and Price/Bonding mode */}
                  <div className="flex items-center gap-2.5">
                    <div className="hidden sm:flex items-center gap-1 rounded-xl bg-[#1a1a24] p-1 border border-[#2a2a3a] text-xs">
                      <span className="text-zinc-500 px-1 font-medium">Buyers</span>
                      {(['Off', 'Yes', 'No'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBuyersFilter(b)}
                          className={`rounded-lg px-2 py-0.5 font-bold transition ${
                            buyersFilter === b
                              ? 'bg-[#2b2b3d] text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center rounded-xl bg-[#1a1a24] p-1 border border-[#2a2a3a] text-xs">
                      <button
                        type="button"
                        onClick={() => setChartMode('price')}
                        className={`rounded-lg px-2.5 py-0.5 font-bold transition ${
                          chartMode === 'price'
                            ? 'bg-[#2b2b3d] text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMode('bonding')}
                        className={`rounded-lg px-2.5 py-0.5 font-bold transition ${
                          chartMode === 'bonding'
                            ? 'bg-[#2b2b3d] text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Bonding
                      </button>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Plot matching pov.co */}
                <div className="relative h-64 sm:h-72 w-full rounded-xl bg-[#0e0e15] p-3 border border-[#1e1e2a] overflow-hidden">
                  <svg viewBox="0 0 700 240" className="h-full w-full overflow-visible">
                    {/* Horizontal Grid lines */}
                    {[35, 80, 125, 170, 210].map((y) => (
                      <line
                        key={y}
                        x1="20"
                        y1={y}
                        x2="630"
                        y2={y}
                        stroke="#1c1c28"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Y-Axis Price Labels on Right side */}
                    <text x="640" y="38" fill="#525266" fontSize="10" fontFamily="monospace">$14.00</text>
                    <text x="640" y="83" fill="#525266" fontSize="10" fontFamily="monospace">$12.00</text>
                    <text x="640" y="128" fill="#525266" fontSize="10" fontFamily="monospace">$10.00</text>
                    <text x="640" y="173" fill="#525266" fontSize="10" fontFamily="monospace">$8.00</text>
                    <text x="640" y="213" fill="#525266" fontSize="10" fontFamily="monospace">$4.00</text>

                    {/* Curves */}
                    {chartMode === 'price' ? (
                      <>
                        {/* Purple YES Curve */}
                        <path
                          d="M 40 215 C 180 210, 260 210, 310 110 C 350 110, 360 85, 380 85 C 420 110, 480 115, 520 125 L 560 135"
                          fill="none"
                          stroke="#8a3ffc"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="560" cy="135" r="5" fill="#8a3ffc" stroke="#0e0e15" strokeWidth="2" />

                        {/* Orange NO Curve */}
                        <path
                          d="M 40 205 C 180 205, 300 205, 400 205 C 470 208, 510 212, 560 210"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="560" cy="210" r="5" fill="#f59e0b" stroke="#0e0e15" strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        {/* Continuous Bonding Curve Formula V_E+R */}
                        <path
                          d="M 40 220 Q 300 210, 600 30"
                          fill="none"
                          stroke="#8a3ffc"
                          strokeWidth="3"
                        />
                        <circle cx="480" cy="80" r="6" fill="#8a3ffc" stroke="#fff" strokeWidth="2" />
                        <text x="495" y="85" fill="#a855f7" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          YES ({market.yesCurve.realEth.toFixed(2)}Ξ)
                        </text>
                        <circle cx="180" cy="200" r="6" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                        <text x="195" y="205" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          NO ({market.noCurve.realEth.toFixed(2)}Ξ)
                        </text>
                      </>
                    )}

                    {/* Bottom Date labels */}
                    <text x="110" y="235" fill="#525266" fontSize="10" fontFamily="sans-serif">Oct 19</text>
                    <text x="250" y="235" fill="#525266" fontSize="10" fontFamily="sans-serif">Oct 26</text>
                    <text x="390" y="235" fill="#525266" fontSize="10" fontFamily="sans-serif">Nov 2</text>
                    <text x="520" y="235" fill="#525266" fontSize="10" fontFamily="sans-serif">Nov 9</text>
                  </svg>
                </div>
              </div>

              {/* Description & Rules Tabs */}
              <div className="rounded-[22px] border border-[#222230] bg-[#121219] p-5">
                <div className="flex items-center gap-6 border-b border-[#20202c] pb-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setInfoTab('description')}
                    className={`text-sm font-bold transition pb-1 relative cursor-pointer ${
                      infoTab === 'description'
                        ? 'text-white border-b-2 border-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoTab('rules')}
                    className={`text-sm font-bold transition pb-1 relative cursor-pointer ${
                      infoTab === 'rules'
                        ? 'text-white border-b-2 border-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Rules
                  </button>
                </div>

                {infoTab === 'description' ? (
                  <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    <p>
                      This market explores the complex and often debated question of whether true justice exists in the world. Justice can mean different things to different people, encompassing legal fairness, moral righteousness, and social equity. Discussions surrounding justice frequently involve topics like systemic inequality, the rule of law, and the effectiveness of institutions designed to uphold rights and accountability.
                    </p>
                    <p>
                      Taking the &quot;yes&quot; side suggests a belief that, despite imperfections, mechanisms exist that promote fairness and rectify wrongs. In contrast, the &quot;no&quot; side reflects a viewpoint that justice is frequently subverted or inaccessible to many, highlighting disparities that prevent equitable treatment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    <div className="rounded-xl border border-[#2a2a3c] bg-[#0c0c12] p-3 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Contract Model:</span>
                        <span className="text-white font-bold">Dual Independent Bonding Curves (Robinhood Chain)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Invariant:</span>
                        <span className="text-emerald-400 font-bold">V_E × V_S = K (250,000 ETH·Shares)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Anti-Dust Minimum:</span>
                        <span className="text-white">0.0001 ETH (~$0.26)</span>
                      </div>
                    </div>
                    {isPrediction && market.prediction && (
                      <div className="space-y-2 pt-2">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                          <strong className="text-emerald-300 block mb-0.5 text-xs">YES Resolution Criteria:</strong>
                          <p className="text-zinc-300 text-xs">{market.prediction.yesCondition}</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
                          <strong className="text-amber-300 block mb-0.5 text-xs">NO Resolution Criteria:</strong>
                          <p className="text-zinc-300 text-xs">{market.prediction.noCondition}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Agent Opinions (Debate Quotes Cards side-by-side) */}
              <div className="rounded-[22px] border border-[#222230] bg-[#121219] p-5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white mb-4">
                  <span>AI Agent Opinions</span>
                  <Info className="h-3.5 w-3.5 text-zinc-500" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yes Quote Card */}
                  <div className="flex flex-col justify-between rounded-2xl border border-[#8a3ffc]/30 bg-[#161226] p-4 shadow-sm">
                    <div>
                      <span className="text-sm font-black text-[#8a3ffc] block mb-2 font-fun">
                        Yes
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed italic">
                        {aiOpinions.yes.quote}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#8a3ffc]/20">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400 flex items-center justify-center text-[10px] font-bold text-white">
                        AI
                      </div>
                      <span className="text-xs font-semibold text-zinc-300">{aiOpinions.yes.author}</span>
                      <span className="rounded bg-[#8a3ffc]/30 px-1 py-0.2 text-[9px] font-bold text-purple-200">AI</span>
                    </div>
                  </div>

                  {/* No Quote Card */}
                  <div className="flex flex-col justify-between rounded-2xl border border-[#f59e0b]/30 bg-[#211a12] p-4 shadow-sm">
                    <div>
                      <span className="text-sm font-black text-[#f59e0b] block mb-2 font-fun">
                        No
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed italic">
                        {aiOpinions.no.quote}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#f59e0b]/20">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-[10px] font-bold text-black">
                        AI
                      </div>
                      <span className="text-xs font-semibold text-zinc-300">{aiOpinions.no.author}</span>
                      <span className="rounded bg-[#f59e0b]/30 px-1 py-0.2 text-[9px] font-bold text-amber-200">AI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="rounded-[22px] border border-[#222230] bg-[#121219] p-5">
                <h3 className="text-sm font-bold text-white mb-3">
                  Comments ({market.comments.length})
                </h3>

                {/* Add a comment input with send arrow */}
                <form onSubmit={handlePostComment} className="relative mb-5">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full rounded-2xl border border-[#2a2a3a] bg-[#0e0e15] py-3 pl-4 pr-12 text-xs text-white placeholder-zinc-500 focus:border-[#8a3ffc] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#8a3ffc] text-white hover:bg-[#7828f0] transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {market.comments.length === 0 ? (
                    <p className="text-center py-4 text-xs text-zinc-500">
                      No comments yet. Share your thesis and lead the debate!
                    </p>
                  ) : (
                    market.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-3 border-b border-[#1c1c28] pb-4 last:border-b-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-[#2e2e40] bg-[#1a1a24]">
                          {c.authorAvatar ? (
                            <img src={c.authorAvatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-purple-600 to-indigo-500">
                              {c.author.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">
                              {c.authorHandle ? `@${c.authorHandle.replace(/^@/, '')}` : `@${c.author}`}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {formatTimeAgo(c.createdAt || c.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            {c.text}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                            <button
                              type="button"
                              onClick={() => onToggleCommentLike && onToggleCommentLike(market.id, c.id)}
                              className={`flex items-center gap-1 hover:text-rose-400 transition cursor-pointer ${
                                c.hasLiked ? 'text-rose-500' : ''
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${c.hasLiked ? 'fill-rose-500' : ''}`} />
                              <span>{c.likes || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommentText(`@${c.authorHandle || c.author} `)}
                              className="hover:text-white transition cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Desktop Sidebar / Mobile 'Trade' View (Trading Terminal, Holders, Transactions, Related Markets) */}
            <div className={`space-y-6 lg:col-span-5 xl:col-span-4 ${mobileTab === 'overview' ? 'hidden lg:block' : 'block'}`}>

              {/* Trading Box Card (Buy/Sell, Side pill, Balance, Amount, Big CTA) */}
              <div className="rounded-[24px] border border-[#242436] bg-[#12121a] p-5 shadow-xl">
                {/* Buy vs Sell Top Switcher */}
                <div className="flex items-center justify-between border-b border-[#20202e] pb-3 mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setTradeMode('BUY')}
                      className={`text-sm font-bold transition pb-1 relative cursor-pointer ${
                        tradeMode === 'BUY'
                          ? 'text-white border-b-2 border-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeMode('SELL')}
                      className={`text-sm font-bold transition pb-1 relative cursor-pointer ${
                        tradeMode === 'SELL'
                          ? 'text-white border-b-2 border-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSlippageConfig(!showSlippageConfig)}
                    className="flex items-center gap-1 rounded-full border border-[#2a2a3c] bg-[#181824] px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white transition"
                  >
                    <Sliders className="h-3 w-3 text-[#8a3ffc]" />
                    <span>{slippagePct}%</span>
                  </button>
                </div>

                {/* Slippage Drawer */}
                {showSlippageConfig && (
                  <div className="mb-4 rounded-xl border border-[#242436] bg-[#0c0c12] p-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                      <span>Max Slippage Tolerance</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 1.0, 2.5, 5.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSlippagePct(val)}
                          className={`rounded-lg py-1 text-xs font-bold transition ${
                            slippagePct === val
                              ? 'bg-[#8a3ffc] text-white'
                              : 'bg-[#181824] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Side Selector Pills: [ Yes $11.05 ] vs [ No $2.24 ] */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSide('YES');
                      setHoldersSideTab('YES');
                    }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 cursor-pointer ${
                      selectedSide === 'YES'
                        ? 'bg-[#8a3ffc] text-white shadow-md'
                        : 'bg-[#1c1c28] text-zinc-400 hover:text-white hover:bg-[#222232]'
                    }`}
                  >
                    <span>Yes</span>
                    <span className="font-mono text-xs opacity-90">${yesPriceUsd}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSide('NO');
                      setHoldersSideTab('NO');
                    }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 cursor-pointer ${
                      selectedSide === 'NO'
                        ? 'bg-[#f59e0b] text-black shadow-md'
                        : 'bg-[#1c1c28] text-zinc-400 hover:text-white hover:bg-[#222232]'
                    }`}
                  >
                    <span>No</span>
                    <span className="font-mono text-xs opacity-90">${noPriceUsd}</span>
                  </button>
                </div>

                {/* Balance Row */}
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span>Balance</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                    <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      {tradeMode === 'BUY'
                        ? inputCurrency === 'USD'
                          ? `$${userUsdBalanceNum.toFixed(2)}`
                          : `${userEthBalanceNum.toFixed(4)} ETH`
                        : `${userSideShares.toLocaleString()} ${selectedSide} shares`}
                    </span>
                  </div>
                </div>

                {/* Big Number Input */}
                <div className="relative mb-3">
                  <div className="flex items-center justify-between rounded-2xl border border-[#26263a] bg-[#0c0c12] px-4 py-3.5 focus-within:border-[#8a3ffc]">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={inputAmount}
                      onChange={(e) => {
                        setInputAmount(e.target.value);
                        setTxErrorExplanation(null);
                      }}
                      className="w-full bg-transparent font-mono text-2xl font-black text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setInputCurrency(inputCurrency === 'USD' ? 'ETH' : 'USD')}
                      className="ml-2 rounded-lg bg-[#1a1a26] px-2.5 py-1 font-mono text-xs font-bold text-zinc-300 hover:text-white border border-[#2a2a3e] shrink-0"
                    >
                      {tradeMode === 'BUY' ? inputCurrency : 'SHARES'}
                    </button>
                  </div>
                </div>

                {/* Quick Increments Pills: +$1, +$5, +$10, +$100 */}
                <div className="flex items-center justify-between gap-1.5 mb-5">
                  {tradeMode === 'BUY' ? (
                    inputCurrency === 'USD' ? (
                      [1, 5, 10, 100].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setInputAmount(String(inc))}
                          className="flex-1 rounded-xl border border-[#26263a] bg-[#161622] py-1.5 text-center font-mono text-xs font-semibold text-zinc-300 hover:border-[#8a3ffc] hover:text-white transition"
                        >
                          +${inc}
                        </button>
                      ))
                    ) : (
                      [0.001, 0.005, 0.01, 0.05].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setInputAmount(String(inc))}
                          className="flex-1 rounded-xl border border-[#26263a] bg-[#161622] py-1.5 text-center font-mono text-xs font-semibold text-zinc-300 hover:border-[#8a3ffc] hover:text-white transition"
                        >
                          +{inc}
                        </button>
                      ))
                    )
                  ) : (
                    [0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setInputAmount(
                            Math.max(10, Math.floor(userSideShares * pct)).toString()
                          )
                        }
                        className="flex-1 rounded-xl border border-[#26263a] bg-[#161622] py-1.5 text-center font-mono text-xs font-semibold text-zinc-300 hover:border-[#8a3ffc] hover:text-white transition"
                      >
                        {pct * 100}%
                      </button>
                    ))
                  )}
                </div>

                {/* Error Banner */}
                {txErrorExplanation && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                    {txErrorExplanation}
                  </div>
                )}

                {/* Big Execute Button: 'Buy YES' / 'Buy NO' */}
                <button
                  type="button"
                  onClick={handleSubmitTrade}
                  disabled={txStatus === 'SIMULATING' || txStatus === 'SIGNING' || rawInput <= 0}
                  className={`w-full rounded-2xl py-4 text-base font-black transition-all active:scale-98 shadow-lg cursor-pointer ${
                    selectedSide === 'YES'
                      ? 'bg-[#8a3ffc] text-white hover:bg-[#792cf0] shadow-[#8a3ffc]/25'
                      : 'bg-[#f59e0b] text-black hover:bg-[#e08e08] shadow-[#f59e0b]/25'
                  }`}
                >
                  {txStatus === 'SIMULATING' || txStatus === 'SIGNING' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing on Robinhood Chain...
                    </span>
                  ) : (
                    `${tradeMode === 'BUY' ? 'Buy' : 'Sell'} ${selectedSide}`
                  )}
                </button>

                {/* Trade Quote Details */}
                <div className="mt-4 space-y-1.5 border-t border-[#20202e] pt-3 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span>Expected Output:</span>
                    <span className="text-white font-bold">
                      {tradeMode === 'BUY'
                        ? `+${quote.sharesDelta.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${selectedSide} shares`
                        : `${quote.netEthDelta.toFixed(5)} ETH (~$${(quote.netEthDelta * ETH_PRICE_USD).toFixed(2)})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Impact:</span>
                    <span className={quote.priceImpactPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {quote.priceImpactPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creator / Protocol Fee (2%):</span>
                    <span className="text-zinc-300">{quote.totalFeeEth.toFixed(5)} ETH</span>
                  </div>
                </div>
              </div>

              {/* Holders Table Card matching pov.co */}
              <div className="rounded-[24px] border border-[#242436] bg-[#12121a] p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Holders</h3>
                  <div className="flex items-center rounded-xl bg-[#1a1a24] p-1 border border-[#2a2a3a] text-xs">
                    <button
                      type="button"
                      onClick={() => setHoldersSideTab('YES')}
                      className={`rounded-lg px-2.5 py-0.5 font-bold transition ${
                        holdersSideTab === 'YES'
                          ? 'bg-[#8a3ffc] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoldersSideTab('NO')}
                      className={`rounded-lg px-2.5 py-0.5 font-bold transition ${
                        holdersSideTab === 'NO'
                          ? 'bg-[#f59e0b] text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 text-[11px] font-bold text-zinc-500 border-b border-[#20202e] pb-2 mb-2">
                  <span className="col-span-6">Holder</span>
                  <span className="col-span-3 text-right">Shares</span>
                  <span className="col-span-3 text-right">Supply</span>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {activeHolders.map((h, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center text-xs font-mono py-1 text-zinc-300"
                    >
                      <div className="col-span-6 flex items-center gap-2 min-w-0 pr-2">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                          {h.address.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate text-white font-sans text-xs">{h.handle}</span>
                      </div>
                      <span className="col-span-3 text-right font-bold text-white">
                        {h.shares >= 1000 ? `${(h.shares / 1000).toFixed(2)}k` : h.shares}
                      </span>
                      <span className="col-span-3 text-right text-zinc-400">
                        {h.supplyPct.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pagination `< 1 2 >` */}
                <div className="mt-4 flex items-center justify-center gap-2 pt-2 border-t border-[#20202e] text-xs">
                  <button
                    type="button"
                    onClick={() => setHoldersPage(Math.max(1, holdersPage - 1))}
                    disabled={holdersPage === 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="rounded bg-[#222232] px-2 py-0.5 font-bold text-white text-[11px]">
                    {holdersPage}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHoldersPage(holdersPage + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:text-white"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Transactions Card matching pov.co */}
              <div className="rounded-[24px] border border-[#242436] bg-[#12121a] p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3">Recent Transactions</h3>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#1c1c28] last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-[9px] font-bold text-white">
                          {tx.trader.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{tx.trader}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            tx.isYes
                              ? 'bg-[#8a3ffc]/20 text-[#a855f7]'
                              : 'bg-[#f59e0b]/20 text-amber-400'
                          }`}
                        >
                          {tx.isYes ? 'Yes' : 'No'}
                        </span>
                      </div>

                      <div className="text-right font-mono text-[11px]">
                        <span
                          className={`font-bold ${
                            tx.isBuy ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.isBuy ? '+' : '-'} {Math.round(tx.shares)} Shares
                        </span>
                        <span className="block text-[9px] text-zinc-500">{tx.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Markets Card matching pov.co */}
              {relatedMarkets.length > 0 && (
                <div className="rounded-[24px] border border-[#242436] bg-[#12121a] p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-3">Related Markets</h3>
                  <div className="space-y-2.5">
                    {relatedMarkets.map((rm) => {
                      const rmPrices = getMarketPricesAndSentiment(rm);
                      return (
                        <div
                          key={rm.id}
                          onClick={() => onSelectMarket && onSelectMarket(rm.id)}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#242436] bg-[#0e0e15] p-3.5 hover:border-[#8a3ffc]/60 hover:bg-[#161622] transition cursor-pointer group"
                        >
                          <span className="text-xs font-semibold text-zinc-300 group-hover:text-white line-clamp-2">
                            {rm.question}
                          </span>
                          <span className="rounded-full bg-[#8a3ffc]/20 border border-[#8a3ffc]/30 px-2.5 py-1 font-mono text-xs font-bold text-[#a855f7] shrink-0">
                            {rmPrices.yesSentimentPct.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Floating Action Button for quick trade / action on mobile (Screenshot 4) */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setMobileTab(mobileTab === 'trade' ? 'overview' : 'trade')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition"
          >
            {mobileTab === 'trade' ? (
              <X className="h-6 w-6 stroke-[2.5]" />
            ) : (
              <Plus className="h-6 w-6 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
