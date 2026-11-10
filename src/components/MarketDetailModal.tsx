import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Send,
  Info,
  ExternalLink,
  Shield,
  AlertTriangle,
  Sliders,
  BarChart3,
  Users,
  CheckCircle2,
  Loader2,
  Scale,
  Heart,
  Flame,
} from 'lucide-react';
import {
  OpinionMarket,
  formatTimeAgo,
  formatExactDateTime,
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
import { Target, Clock, Award, ShieldAlert } from 'lucide-react';

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
  onClose,
  onExecuteTrade,
  onAddComment,
  onToggleCommentLike,
  onClaimSettlement,
  onClaimVoidRefund,
  hasClaimedSettlement = false,
}) => {
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>(initialSide);
  const [inputAmount, setInputAmount] = useState<string>('0.001');
  const [slippagePct, setSlippagePct] = useState<number>(1.0);
  const [showSlippageConfig, setShowSlippageConfig] = useState<boolean>(false);
  const [isClaimingReward, setIsClaimingReward] = useState<boolean>(false);

  const [chartTab, setChartTab] = useState<
    'bonding-curve' | 'sentiment' | 'dual-price' | 'intelligence'
  >('bonding-curve');

  const [commentText, setCommentText] = useState('');
  const [txStatus, setTxStatus] = useState<
    'IDLE' | 'SIMULATING' | 'SIGNING' | 'CONFIRMED' | 'FAILED'
  >('IDLE');
  const [txErrorExplanation, setTxErrorExplanation] = useState<string | null>(null);

  // Sync selectedSide when initialSide or market changes
  useEffect(() => {
    if (initialSide) {
      setSelectedSide(initialSide);
    }
  }, [initialSide, market?.id]);

  const isYes = selectedSide === 'YES';
  const numericAmount = parseFloat(inputAmount) || 0;

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

  const quote = useMemo(() => {
    if (!market) {
      return {
        sharesDelta: 0,
        netEthDelta: 0,
        creatorFeeEth: 0,
        protocolFeeEth: 0,
        totalFeeEth: 0,
        newPriceEth: 0.000001,
        priceImpactPct: 0,
        minimumReceived: 0,
      };
    }
    if (tradeMode === 'BUY') {
      return quoteBuyOrder(
        market,
        isYes,
        numericAmount,
        slippagePct,
        creatorFeeRate,
        protocolFeeRate
      );
    } else {
      return quoteSellOrder(
        market,
        isYes,
        numericAmount,
        slippagePct,
        creatorFeeRate,
        protocolFeeRate
      );
    }
  }, [market, tradeMode, isYes, numericAmount, slippagePct, creatorFeeRate, protocolFeeRate]);

  const userSideShares = isYes ? userYesShares : userNoShares;

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market) return;
    setTxErrorExplanation(null);

    if (numericAmount <= 0) {
      setTxStatus('FAILED');
      setTxErrorExplanation('Enter a positive trade amount.');
      return;
    }

    if (tradeMode === 'BUY' && numericAmount < MIN_TRADE_ETH) {
      setTxStatus('FAILED');
      setTxErrorExplanation(
        decodeContractErrorMessage('TradeBelowMinimum: minimum is 0.0001 ETH')
      );
      return;
    }

    if (tradeMode === 'SELL' && numericAmount > userSideShares) {
      setTxStatus('FAILED');
      setTxErrorExplanation(decodeContractErrorMessage('InsufficientShares'));
      return;
    }

    setTxStatus('SIMULATING');
    try {
      await new Promise((r) => setTimeout(r, 180));
      setTxStatus('SIGNING');
      await onExecuteTrade(market.id, isYes, tradeMode === 'BUY', numericAmount, slippagePct);
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

  // Generate mathematical bonding curve SVG path: SpotPrice(R) = (V_E + R)^2 / K
  const maxReserveAxis = Math.max(
    8,
    market?.yesCurve?.realEth ? market.yesCurve.realEth * 1.4 : 8,
    market?.noCurve?.realEth ? market.noCurve.realEth * 1.4 : 8
  );

  const curvePoints = useMemo(() => {
    const pts: { r: number; price: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const r = (maxReserveAxis * i) / steps;
      const vEth = INITIAL_VIRTUAL_ETH + r;
      const vShares = CURVE_K / vEth;
      const price = vEth / vShares;
      pts.push({ r, price });
    }
    return pts;
  }, [maxReserveAxis]);

  // If no market is selected, return null safely AFTER all hooks are called
  if (!market) return null;

  const maxCurvePrice = curvePoints[curvePoints.length - 1]?.price || 0.001;

  const toSvgX = (r: number) => 40 + (r / maxReserveAxis) * 500;
  const toSvgY = (price: number) => 190 - (price / maxCurvePrice) * 160;

  const curveSvgPath = curvePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.r).toFixed(1)} ${toSvgY(pt.price).toFixed(1)}`)
    .join(' ');

  const yesDotX = toSvgX(market.yesCurve.realEth);
  const yesDotY = toSvgY(metrics.yesPriceEth);
  const noDotX = toSvgX(market.noCurve.realEth);
  const noDotY = toSvgY(metrics.noPriceEth);

  // Market Intelligence: Buy vs Sell Pressure calculations
  const yesBuyVol = market.yesCurve.buyVolumeEth ?? market.yesCurve.volumeEth * 0.72;
  const yesSellVol = market.yesCurve.sellVolumeEth ?? market.yesCurve.volumeEth * 0.28;
  const noBuyVol = market.noCurve.buyVolumeEth ?? market.noCurve.volumeEth * 0.62;
  const noSellVol = market.noCurve.sellVolumeEth ?? market.noCurve.volumeEth * 0.38;

  const yesBuyPressurePct =
    yesBuyVol + yesSellVol > 0 ? (yesBuyVol / (yesBuyVol + yesSellVol)) * 100 : 50;
  const noBuyPressurePct =
    noBuyVol + noSellVol > 0 ? (noBuyVol / (noBuyVol + noSellVol)) * 100 : 50;

  const holdersList = market.holders && market.holders.length > 0 ? market.holders : [
    {
      address: market.creator,
      side: 'YES' as const,
      shares: Math.max(12000, market.yesCurve.totalShares * 0.18),
      shareOfSidePct: 18.0,
      avgEntryEth: 0.000009,
    },
  ];

  const history = market.history && market.history.length > 0 ? market.history : [];
  const maxHistPrice = history.length > 0
    ? Math.max(0.00005, ...history.map((h) => Math.max(h.yesPriceEth, h.noPriceEth)))
    : 0.00005;

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

  const LIFECYCLE_STEPS: { key: string; label: string }[] = [
    { key: 'ACTIVE', label: '1. Active Trading' },
    { key: 'CLOSED', label: '2. Closed' },
    { key: 'PROPOSED', label: '3. Proposed' },
    { key: 'DISPUTED', label: '4. Dispute Window' },
    { key: 'RESOLVED', label: '5. Resolved' },
  ];

  const getStepIndex = (st: string) => {
    if (st === 'ACTIVE') return tradingClosed ? 1 : 0;
    if (st === 'CLOSED') return 1;
    if (st === 'PROPOSED') return 2;
    if (st === 'DISPUTED') return 3;
    if (st === 'RESOLVED' || st === 'VOID') return 4;
    return 0;
  };

  const activeStepIdx = getStepIndex(currentStatus);

  const handleClaimRewardClick = async () => {
    if (isClaimingReward) return;
    setIsClaimingReward(true);
    try {
      if (currentStatus === 'VOID') {
        if (onClaimVoidRefund) await onClaimVoidRefund(market.id);
      } else {
        if (onClaimSettlement) await onClaimSettlement(market.id);
      }
    } finally {
      setIsClaimingReward(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-6">
      <div className="relative flex max-h-[96vh] sm:max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[22px] sm:rounded-[28px] border border-[#232330] bg-[#121218] shadow-2xl">
        {/* Top Modal Header */}
        <div className="border-b border-[#232330] bg-[#161620] px-3.5 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5 sm:gap-4 pr-2 sm:pr-4 min-w-0">
              {market.imageUri && (
                <img
                  src={market.imageUri}
                  alt=""
                  className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl border border-[#232330] object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {isPrediction ? (
                    <span className="flex items-center gap-1 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/15 px-2 sm:px-2.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-[#FF8A33]">
                      <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#FF6B00]" />
                      <span>Resolvable Prediction</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-[#227c9d]/40 bg-[#227c9d]/15 px-2 sm:px-2.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-[#53b3d4]">
                      <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#227c9d]" />
                      <span>Perpetual Opinion</span>
                    </span>
                  )}
                  <span className="rounded-full bg-[#20202c] px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-300">
                    {market.category}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-[#8c8c9e]">
                    Market #{market.id}
                  </span>
                  {market.sourceHandle && (
                    <span className="rounded-full bg-[#20202c] px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-slate-300">
                      {market.sourceHandle}
                    </span>
                  )}
                  <span className="hidden sm:inline-block rounded-full border border-[#227c9d]/40 bg-[#227c9d]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#53b3d4]">
                    ROBINHOOD CHAIN TESTNET (46630)
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-extrabold text-white font-fun line-clamp-2">
                  {market.question}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Market Details"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-[#2e2e40] bg-[#1a1a26] text-white hover:bg-[#252538] hover:border-white/40 active:scale-95 transition shadow-sm shrink-0 cursor-pointer"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Phase 4: Resolution Lifecycle Progress Stepper (Only for Prediction Markets) */}
          {isPrediction && (
            <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#232330]/80">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#FF6B00]" />
                  Lifecycle: <strong className="text-white">{currentStatus}</strong>
                  {timeRemaining && !timeRemaining.isExpired && ` (${timeRemaining.formatted})`}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] text-[#8c8c9e]">
                  Pari-Mutuel Model
                </span>
              </div>

              <div className="flex sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isPast = idx < activeStepIdx;
                  const isCurrent = idx === activeStepIdx;
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 text-center transition min-w-[105px] sm:min-w-0 flex-1 shrink-0 sm:shrink ${
                        isCurrent
                          ? 'border border-[#FF6B00] bg-[#FF6B00]/20 text-[#FF8A33] shadow-md shadow-[#FF6B00]/10 font-bold'
                          : isPast
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium'
                          : 'border border-[#232330] bg-[#0c0c11]/60 text-[#8c8c9e]'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs font-mono">{step.label}</span>
                      {isCurrent && (
                        <span className="mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-orange-200">
                          Active State
                        </span>
                      )}
                      {isPast && (
                        <span className="mt-0.5 text-[8px] sm:text-[9px] text-emerald-400">Completed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-6 overflow-y-auto p-3.5 sm:p-6 lg:grid-cols-12 items-start">
          {/* Top Left Section: Chart, Live Sentiment & Market Intelligence (7 cols on desktop, 1st on mobile) */}
          <div className="flex flex-col gap-5 order-1 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            {/* Live Sentiment Banner */}
            <div className="rounded-[22px] border border-[#232330] bg-[#161620] p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#227c9d]">
                    YES CONVICTION ({metrics.yesMultiplier.toFixed(1)}x)
                  </span>
                  <div className="font-mono text-2xl font-black text-[#227c9d]">
                    {metrics.yesSentimentPct.toFixed(1)}%
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-mono uppercase text-[#8c8c9e]">
                    REAL ETH RESERVES LOCKED
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-200">
                    {metrics.totalPoolEth.toFixed(3)} ETH (Withdrawable)
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-[#FF6B00]">
                    NO CONVICTION ({metrics.noMultiplier.toFixed(1)}x)
                  </span>
                  <div className="font-mono text-2xl font-black text-[#FF6B00]">
                    {metrics.noSentimentPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#252533] p-0.5">
                <div
                  style={{ width: `${metrics.yesSentimentPct}%` }}
                  className="h-full rounded-full bg-[#227c9d] transition-all duration-300"
                />
              </div>
            </div>

            {/* Interactive Chart & Market Intelligence Tabs */}
            <div className="rounded-[22px] border border-[#232330] bg-[#161620] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 rounded-2xl sm:rounded-full border border-[#232330] bg-[#0f0f15] p-1">
                  <button
                    onClick={() => setChartTab('bonding-curve')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      chartTab === 'bonding-curve'
                        ? 'bg-[#227c9d] text-white'
                        : 'text-[#8c8c9e] hover:text-white'
                    }`}
                  >
                    Bonding Curves
                  </button>
                  <button
                    onClick={() => setChartTab('dual-price')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      chartTab === 'dual-price'
                        ? 'bg-[#227c9d] text-white'
                        : 'text-[#8c8c9e] hover:text-white'
                    }`}
                  >
                    YES vs NO Price
                  </button>
                  <button
                    onClick={() => setChartTab('sentiment')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      chartTab === 'sentiment'
                        ? 'bg-[#227c9d] text-white'
                        : 'text-[#8c8c9e] hover:text-white'
                    }`}
                  >
                    Sentiment %
                  </button>
                  <button
                    onClick={() => setChartTab('intelligence')}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      chartTab === 'intelligence'
                        ? 'bg-[#227c9d] text-white'
                        : 'text-[#8c8c9e] hover:text-white'
                    }`}
                  >
                    <BarChart3 className="h-3 w-3" />
                    <span>Intelligence</span>
                  </button>
                </div>

                <span className="font-mono text-[10px] text-[#8c8c9e]">
                  K = 0.5 ETH × 500k
                </span>
              </div>

              {chartTab === 'bonding-curve' && (
                <div>
                  <svg
                    viewBox="0 0 570 220"
                    className="h-52 w-full overflow-visible rounded-xl bg-[#0d0d12] p-2"
                  >
                    {[40, 90, 140, 190].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        y1={y}
                        x2="540"
                        y2={y}
                        stroke="#22222d"
                        strokeDasharray="3 3"
                      />
                    ))}

                    <path
                      d={curveSvgPath}
                      fill="none"
                      stroke="#3b3b4f"
                      strokeWidth="2.5"
                    />

                    <circle
                      cx={yesDotX}
                      cy={yesDotY}
                      r="7"
                      fill="#227c9d"
                      stroke="#0d0d12"
                      strokeWidth="2"
                    />
                    <text
                      x={Math.min(440, yesDotX + 10)}
                      y={Math.max(20, yesDotY - 8)}
                      fill="#53b3d4"
                      fontSize="11"
                      fontFamily="Space Grotesk, monospace"
                      fontWeight="bold"
                    >
                      YES ({market.yesCurve.realEth.toFixed(2)}Ξ @ {metrics.yesPriceEth.toFixed(5)}Ξ)
                    </text>

                    <circle
                      cx={noDotX}
                      cy={noDotY}
                      r="7"
                      fill="#FF6B00"
                      stroke="#0d0d12"
                      strokeWidth="2"
                    />
                    <text
                      x={Math.min(440, noDotX + 10)}
                      y={Math.min(205, noDotY + 16)}
                      fill="#FF6B00"
                      fontSize="11"
                      fontFamily="Space Grotesk, monospace"
                      fontWeight="bold"
                    >
                      NO ({market.noCurve.realEth.toFixed(2)}Ξ @ {metrics.noPriceEth.toFixed(5)}Ξ)
                    </text>

                    <text x="220" y="214" fill="#8c8c9e" fontSize="10">
                      Real ETH Reserve Locked in Side Curve →
                    </text>
                  </svg>
                </div>
              )}

              {chartTab === 'dual-price' && (
                <div>
                  <svg
                    viewBox="0 0 570 210"
                    className="h-52 w-full overflow-visible rounded-xl bg-[#0d0d12] p-2"
                  >
                    {[30, 85, 140, 180].map((y) => (
                      <line
                        key={y}
                        x1="35"
                        y1={y}
                        x2="540"
                        y2={y}
                        stroke="#22222d"
                        strokeDasharray="3 3"
                      />
                    ))}
                    {history.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#227c9d"
                        strokeWidth="2.5"
                        points={history
                          .map((pt, idx) => {
                            const x =
                              40 + (idx / Math.max(1, history.length - 1)) * 490;
                            const y = 180 - (pt.yesPriceEth / maxHistPrice) * 145;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    )}
                    {history.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#FF6B00"
                        strokeWidth="2.5"
                        points={history
                          .map((pt, idx) => {
                            const x =
                              40 + (idx / Math.max(1, history.length - 1)) * 490;
                            const y = 180 - (pt.noPriceEth / maxHistPrice) * 145;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    )}
                    {history.map((pt, idx) => {
                      const x = 40 + (idx / Math.max(1, history.length - 1)) * 490;
                      const yYes = 180 - (pt.yesPriceEth / maxHistPrice) * 145;
                      const yNo = 180 - (pt.noPriceEth / maxHistPrice) * 145;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={yYes} r="4" fill="#227c9d" />
                          <circle cx={x} cy={yNo} r="4" fill="#FF6B00" />
                          <text
                            x={x - 14}
                            y={198}
                            fill="#8c8c9e"
                            fontSize="9"
                            fontFamily="Space Grotesk, monospace"
                          >
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#53b3d4]">
                      ● YES: {metrics.yesPriceEth.toFixed(6)} ETH ({metrics.yesMultiplier.toFixed(1)}x)
                    </span>
                    <span className="text-[#FF6B00]">
                      ● NO: {metrics.noPriceEth.toFixed(6)} ETH ({metrics.noMultiplier.toFixed(1)}x)
                    </span>
                  </div>
                </div>
              )}

              {chartTab === 'sentiment' && (
                <div>
                  <svg
                    viewBox="0 0 570 200"
                    className="h-52 w-full overflow-visible rounded-xl bg-[#0d0d12] p-2"
                  >
                    {[30, 100, 170].map((y) => (
                      <line
                        key={y}
                        x1="30"
                        y1={y}
                        x2="540"
                        y2={y}
                        stroke="#22222d"
                        strokeDasharray="3 3"
                      />
                    ))}
                    {history.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#227c9d"
                        strokeWidth="3"
                        points={history
                          .map((pt, idx) => {
                            const x =
                              40 +
                              (idx / Math.max(1, history.length - 1)) * 490;
                            const y = 180 - (pt.yesSentiment / 100) * 150;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    )}
                    {history.map((pt, idx) => {
                      const x =
                        40 + (idx / Math.max(1, history.length - 1)) * 490;
                      const y = 180 - (pt.yesSentiment / 100) * 150;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="4.5" fill="#227c9d" />
                          <text
                            x={x - 14}
                            y={196}
                            fill="#8c8c9e"
                            fontSize="9"
                            fontFamily="Space Grotesk, monospace"
                          >
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {chartTab === 'intelligence' && (
                <div className="space-y-4 pt-1">
                  {/* Buy / Sell Pressure Bars */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#232330] bg-[#0e0e14] p-3">
                      <div className="mb-1 flex justify-between font-mono text-[11px]">
                        <span className="font-bold text-[#53b3d4]">YES BUY/SELL PRESSURE</span>
                        <span className="text-white">{yesBuyPressurePct.toFixed(0)}% Buy</span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#252533]">
                        <div
                          style={{ width: `${yesBuyPressurePct}%` }}
                          className="bg-[#227c9d]"
                        />
                        <div
                          style={{ width: `${100 - yesBuyPressurePct}%` }}
                          className="bg-[#FF6B00]/60"
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#8c8c9e]">
                        <span>Buys: {yesBuyVol.toFixed(2)} ETH</span>
                        <span>Sells: {yesSellVol.toFixed(2)} ETH</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#232330] bg-[#0e0e14] p-3">
                      <div className="mb-1 flex justify-between font-mono text-[11px]">
                        <span className="font-bold text-[#FF6B00]">NO BUY/SELL PRESSURE</span>
                        <span className="text-white">{noBuyPressurePct.toFixed(0)}% Buy</span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#252533]">
                        <div
                          style={{ width: `${noBuyPressurePct}%` }}
                          className="bg-[#FF6B00]"
                        />
                        <div
                          style={{ width: `${100 - noBuyPressurePct}%` }}
                          className="bg-[#124254]/60"
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#8c8c9e]">
                        <span>Buys: {noBuyVol.toFixed(2)} ETH</span>
                        <span>Sells: {noSellVol.toFixed(2)} ETH</span>
                      </div>
                    </div>
                  </div>

                  {/* Holder Distribution Table */}
                  <div className="rounded-xl border border-[#232330] bg-[#0e0e14] p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#227c9d]" />
                        Top Curve Holders
                      </span>
                      <span className="font-mono text-[10px] text-[#8c8c9e]">
                        24h Shift: {metrics.sentimentChange24h >= 0 ? '+' : ''}
                        {metrics.sentimentChange24h.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {holdersList.map((h, i) => (
                        <div
                          key={`${h.address}-${h.side}-${i}`}
                          className="flex items-center justify-between rounded-lg bg-[#161620] px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white">{h.address}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                h.side === 'YES'
                                  ? 'bg-[#227c9d]/20 text-[#53b3d4]'
                                  : 'bg-[#FF6B00]/20 text-[#FF6B00]'
                              }`}
                            >
                              {h.side}
                            </span>
                          </div>
                          <div className="text-right text-slate-300">
                            {(h.shares / 1000).toFixed(1)}k ({h.shareOfSidePct.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Independent Curve Liquidity & Virtual Reserve Isolation Table */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#227c9d]/25 bg-[#227c9d]/5 p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#53b3d4]">YES CURVE</span>
                  <span className="font-mono text-xs font-bold text-[#53b3d4]">
                    {metrics.yesMultiplier.toFixed(1)}x
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-[#8c8c9e]">Spot Price:</span>
                    <span>{metrics.yesPriceEth.toFixed(6)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c9e]">Real Reserve:</span>
                    <span className="text-[#53b3d4]">{market.yesCurve.realEth.toFixed(3)} ETH</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#FF6B00]/25 bg-[#FF6B00]/5 p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF6B00]">NO CURVE</span>
                  <span className="font-mono text-xs font-bold text-[#FF6B00]">
                    {metrics.noMultiplier.toFixed(1)}x
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-[#8c8c9e]">Spot Price:</span>
                    <span>{metrics.noPriceEth.toFixed(6)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c9e]">Real Reserve:</span>
                    <span className="text-[#FF6B00]">{market.noCurve.realEth.toFixed(3)} ETH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 & 4: Prediction Specifications Card (Only for Prediction Markets) */}
            {isPrediction && market.prediction && (
              <div className="rounded-[22px] border border-[#FF6B00]/30 bg-[#FF6B00]/5 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#FF6B00]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#FF6B00]" />
                    <span className="font-fun text-xs font-bold uppercase tracking-wider text-orange-200">
                      Prediction Resolution Criteria & Verification
                    </span>
                  </div>
                  {market.prediction.evidenceSource && (
                    <a
                      href={market.prediction.evidenceSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[11px] text-[#53b3d4] hover:underline"
                    >
                      <span>Evidence Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 font-mono text-xs">
                  <div className="rounded-xl border border-[#232330] bg-[#0c0c11] p-2.5">
                    <span className="block text-[10px] text-[#8c8c9e] uppercase font-bold">Trading Closes (UTC)</span>
                    <span className="text-white font-bold">
                      {formatExactDateTime(market.prediction.closingTime * 1000)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#232330] bg-[#0c0c11] p-2.5">
                    <span className="block text-[10px] text-[#8c8c9e] uppercase font-bold">Resolution Deadline</span>
                    <span className="text-white font-bold">
                      {formatExactDateTime(market.prediction.resolutionDeadline * 1000)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                    <strong className="text-emerald-300 font-bold block mb-0.5">YES Condition:</strong>
                    <p className="text-slate-300 leading-relaxed font-sans">{market.prediction.yesCondition}</p>
                  </div>
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5">
                    <strong className="text-orange-300 font-bold block mb-0.5">NO Condition:</strong>
                    <p className="text-slate-300 leading-relaxed font-sans">{market.prediction.noCondition}</p>
                  </div>
                </div>

                {/* If Proposed or Disputed details exist */}
                {market.prediction.proposedOutcome && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">Proposed Outcome:</span>
                      <span className="font-mono font-bold text-white uppercase px-2 py-0.5 rounded bg-purple-600/30">
                        {market.prediction.proposedOutcome}
                      </span>
                    </div>
                    {market.prediction.proposer && (
                      <div className="flex justify-between font-mono text-[10px] text-slate-400">
                        <span>Proposer:</span>
                        <span>{market.prediction.proposer}</span>
                      </div>
                    )}
                    {market.prediction.proposedEvidence && (
                      <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-purple-500/20">
                        <span className="text-slate-400">Adjudication Evidence:</span>
                        <a
                          href={market.prediction.proposedEvidence}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#53b3d4] flex items-center gap-1 hover:underline"
                        >
                          <span>Review Evidence</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Desktop) / 2nd Section (Mobile): Instant Bonding Curve Trading Terminal OR Settlement Claim Terminal (5 cols) */}
          <div className="flex flex-col justify-between rounded-[22px] sm:rounded-[24px] border border-[#232330] bg-[#161620] p-4 sm:p-5 order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2">
            {tradingClosed ? (
              /* Phase 5: Pari-Mutuel Settlement & Closed Market Terminal */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#232330] pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#FF6B00]" />
                    <h3 className="font-fun text-sm font-black uppercase tracking-wider text-white">
                      Settlement & Payouts
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                      currentStatus === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : currentStatus === 'VOID'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : currentStatus === 'DISPUTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-[#FF6B00]/20 text-[#FF8A33] border border-[#FF6B00]/30'
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>

                {/* If Resolved or Void: Full Pari-Mutuel Claim Interface */}
                {currentStatus === 'RESOLVED' || currentStatus === 'VOID' ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-emerald-300">
                          Winning Outcome
                        </span>
                        <span className="font-fun text-base font-black text-white px-3 py-0.5 rounded-full bg-emerald-600/40 border border-emerald-400/40">
                          {currentStatus === 'VOID' ? 'VOID (ALL REFUNDED)' : market.prediction?.finalOutcome || 'YES'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {currentStatus === 'VOID'
                          ? 'This market was voided. All YES and NO share holders can claim proportional refunds from actual ETH reserves.'
                          : `The objective condition was verified. Winning ${market.prediction?.finalOutcome} share holders receive 100% of the distributable Pari-Mutuel pool.`}
                      </p>
                    </div>

                    {/* Settlement Numbers */}
                    <div className="rounded-2xl border border-[#232330] bg-[#0c0c11] p-3.5 space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8c8c9e]">Distributable Pool:</span>
                        <span className="font-bold text-white">
                          {metrics.totalPoolEth.toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8c8c9e]">Winning Total Shares:</span>
                        <span className="text-slate-300">
                          {(market.prediction?.winningTotalShares || (market.prediction?.finalOutcome === 'NO' ? market.noCurve.totalShares : market.yesCurve.totalShares) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#232330] pt-2">
                        <span className="text-[#8c8c9e]">Your Eligible Position:</span>
                        <span className="font-bold text-[#53b3d4]">
                          {market.prediction?.finalOutcome === 'NO'
                            ? `${userNoShares.toLocaleString()} NO Shares`
                            : `${userYesShares.toLocaleString()} YES Shares`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-[#8c8c9e]">Your Claimable Reward:</span>
                        <span className="font-black text-[#FF6B00]">
                          {settlementQuote.claimableEth.toFixed(5)} ETH
                        </span>
                      </div>
                    </div>

                    {/* Claim Action Button */}
                    {hasClaimedSettlement ? (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 py-3.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Settlement Reward Claimed Successfully</span>
                      </div>
                    ) : settlementQuote.isEligible ? (
                      <button
                        type="button"
                        onClick={handleClaimRewardClick}
                        disabled={isClaimingReward}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] py-3.5 text-sm font-extrabold uppercase tracking-wider text-black shadow-lg shadow-[#FF6B00]/25 transition hover:bg-[#EA580C] active:scale-[0.99] disabled:opacity-50"
                      >
                        {isClaimingReward ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Claiming on Robinhood Chain...</span>
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            <span>
                              Claim {settlementQuote.claimableEth.toFixed(5)} ETH{' '}
                              {currentStatus === 'VOID' ? 'Refund' : 'Payout'}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-[#232330] bg-[#0c0c11] p-3 text-center text-xs text-[#8c8c9e]">
                        {settlementQuote.reason || 'You do not hold eligible winning shares in this settled market.'}
                      </div>
                    )}

                    {/* Pari-Mutuel Financial Invariant Note */}
                    <div className="flex items-start gap-2 rounded-xl bg-[#0c0c11] p-3 text-[11px] text-slate-400 border border-[#232330]">
                      <Shield className="h-4 w-4 shrink-0 text-[#227c9d] mt-0.5" />
                      <span>
                        <strong>Mathematical Solvency Guarantee:</strong> Payout is calculated exclusively from real ETH reserves ({metrics.totalPoolEth.toFixed(3)} ETH). Virtual reserves never count as collateral. Zero protocol fees deducted from claims.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Awaiting proposal or dispute */
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 p-4">
                      <div className="flex items-center gap-2 text-[#FF8A33] font-bold text-xs mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Trading Automatically Closed</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {currentStatus === 'PROPOSED'
                          ? `An outcome of ${market.prediction?.proposedOutcome} has been proposed with evidence. The 24-hour dispute window is active.`
                          : currentStatus === 'DISPUTED'
                          ? 'This market outcome was disputed with counter-evidence. Awaiting authorized resolver final adjudication.'
                          : 'Trading closed at the defined UTC timestamp. Awaiting verifiable outcome proposal by an authorized resolver.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#232330] bg-[#0c0c11] p-3.5 space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8c8c9e]">Total Pari-Mutuel Pool:</span>
                        <span className="font-bold text-white">{metrics.totalPoolEth.toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8c8c9e]">Your YES Balance:</span>
                        <span className="text-[#53b3d4]">{userYesShares.toLocaleString()} shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8c8c9e]">Your NO Balance:</span>
                        <span className="text-[#FF6B00]">{userNoShares.toLocaleString()} shares</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#232330] bg-[#0c0c11] p-3 text-center text-xs text-[#8c8c9e]">
                      Trading is disabled during outcome proposal and adjudication. Once resolved, winning shareholders can claim rewards here.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Normal Active Trading Terminal */
              <div>
                {/* BUY / SELL Tabs + Slippage */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid flex-1 grid-cols-2 gap-1 rounded-full border border-[#232330] bg-[#0e0e14] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTradeMode('BUY');
                        setInputAmount('0.001');
                        setTxErrorExplanation(null);
                      }}
                      className={`rounded-full py-2 text-xs font-extrabold uppercase tracking-wider transition ${
                        tradeMode === 'BUY'
                          ? 'bg-[#227c9d] text-white shadow-sm'
                          : 'text-[#8c8c9e] hover:text-white'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTradeMode('SELL');
                        setInputAmount(
                          userSideShares > 0 ? Math.floor(userSideShares / 2).toString() : '1000'
                        );
                        setTxErrorExplanation(null);
                      }}
                      className={`rounded-full py-2 text-xs font-extrabold uppercase tracking-wider transition ${
                        tradeMode === 'SELL'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-[#8c8c9e] hover:text-white'
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSlippageConfig((s) => !s)}
                    className="flex items-center gap-1 rounded-full border border-[#232330] bg-[#0e0e14] px-3 py-2 text-xs text-[#8c8c9e] hover:text-white"
                  >
                    <Sliders className="h-3.5 w-3.5 text-[#227c9d]" />
                    <span>{slippagePct}%</span>
                  </button>
                </div>

                {/* Slippage Drawer */}
                {showSlippageConfig && (
                  <div className="mb-3 rounded-xl border border-[#232330] bg-[#0e0e14] p-2.5">
                    <div className="flex gap-1.5">
                      {[0.5, 1.0, 2.5, 5.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSlippagePct(val)}
                          className={`flex-1 rounded-full py-1 text-xs font-bold transition ${
                            slippagePct === val
                              ? 'bg-[#227c9d] text-white'
                              : 'bg-[#161620] text-[#8c8c9e]'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chunky YES vs NO Selector */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSide('YES')}
                      className={`flex flex-col rounded-2xl border p-3.5 text-left transition ${
                        selectedSide === 'YES'
                          ? 'border-[#227c9d] bg-[#227c9d]/20 shadow-md'
                          : 'border-[#232330] bg-[#0e0e14] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-[#53b3d4]">Yes</span>
                        <span className="font-mono text-xs font-bold text-[#53b3d4]">
                          {metrics.yesSentimentPct.toFixed(1)}%
                        </span>
                      </div>
                      <span className="mt-1 font-mono text-xs text-white">
                        {metrics.yesPriceEth.toFixed(6)} ETH
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSide('NO')}
                      className={`flex flex-col rounded-2xl border p-3.5 text-left transition ${
                        selectedSide === 'NO'
                          ? 'border-[#FF6B00] bg-[#FF6B00]/20 shadow-md'
                          : 'border-[#232330] bg-[#0e0e14] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-[#FF6B00]">No</span>
                        <span className="font-mono text-xs font-bold text-[#FF6B00]">
                          {metrics.noSentimentPct.toFixed(1)}%
                        </span>
                      </div>
                      <span className="mt-1 font-mono text-xs text-white">
                        {metrics.noPriceEth.toFixed(6)} ETH
                      </span>
                    </button>
                  </div>
                </div>

                {/* User Position */}
                <div className="mb-3 flex items-center justify-between rounded-xl border border-[#232330] bg-[#0e0e14] px-3.5 py-2 text-xs">
                  <span className="text-[#8c8c9e]">Your {selectedSide} Balance:</span>
                  <span className="font-mono font-bold text-white">
                    {userSideShares.toLocaleString(undefined, { maximumFractionDigits: 0 })} shares
                  </span>
                </div>

                {/* Amount Input */}
                <form onSubmit={handleSubmitTrade}>
                  <div className="mb-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={inputAmount}
                        onChange={(e) => {
                          setInputAmount(e.target.value);
                          setTxErrorExplanation(null);
                        }}
                        className="w-full rounded-2xl border border-[#232330] bg-[#0e0e14] px-4 py-3 font-mono text-base font-bold text-white focus:border-[#227c9d] focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-[#1e1e2b] px-2.5 py-1 font-mono text-xs font-bold text-[#8c8c9e]">
                        {tradeMode === 'BUY' ? 'ETH' : 'SHARES'}
                      </span>
                    </div>

                    {/* Preset chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tradeMode === 'BUY' ? (
                        [0.001, 0.005, 0.01, 0.05, 0.1].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setInputAmount(amt.toString())}
                            className="rounded-full border border-[#232330] bg-[#0e0e14] px-3 py-1 font-mono text-[11px] text-slate-300 hover:border-[#227c9d] hover:text-[#53b3d4] transition"
                          >
                            {amt} ETH
                          </button>
                        ))
                      ) : (
                        [0.25, 0.5, 0.75, 1].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              setInputAmount(
                                Math.max(100, Math.floor(userSideShares * pct)).toString()
                              )
                            }
                            className="rounded-full border border-[#232330] bg-[#0e0e14] px-3 py-1 font-mono text-[11px] text-slate-300 hover:border-[#227c9d] hover:text-[#53b3d4] transition"
                          >
                            {pct * 100}%
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Live Quote Breakdown */}
                  <div className="mb-4 space-y-1.5 rounded-2xl border border-[#232330] bg-[#0e0e14] p-3.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8c8c9e]">
                        {tradeMode === 'BUY' ? 'Estimated Shares:' : 'Net ETH Out:'}
                      </span>
                      <span className="font-bold text-white">
                        {tradeMode === 'BUY'
                          ? `+${quote.sharesDelta.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })} ${selectedSide}`
                          : `${quote.netEthDelta.toFixed(5)} ETH`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#8c8c9e]">New Price:</span>
                      <span className="text-slate-300">
                        {quote.newPriceEth.toFixed(6)} ETH
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#8c8c9e]">Impact:</span>
                      <span
                        className={
                          quote.priceImpactPct >= 0 ? 'text-[#53b3d4]' : 'text-[#FF6B00]'
                        }
                      >
                        {quote.priceImpactPct >= 0 ? '+' : ''}
                        {quote.priceImpactPct.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-[#232330] pt-1.5 text-[11px]">
                      <span className="text-[#8c8c9e]">Fee (1% Creator / 1% Protocol):</span>
                      <span className="text-orange-300">{quote.totalFeeEth.toFixed(5)} ETH</span>
                    </div>
                  </div>

                  {/* Error */}
                  {txErrorExplanation && (
                    <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">
                      {txErrorExplanation}
                    </div>
                  )}

                  {/* Chunky rounded execute button */}
                  <button
                    type="submit"
                    disabled={
                      txStatus === 'SIMULATING' ||
                      txStatus === 'SIGNING' ||
                      numericAmount <= 0
                    }
                    className={`w-full rounded-2xl py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 ${
                      selectedSide === 'YES'
                        ? 'bg-[#227c9d] hover:bg-[#1a647f]'
                        : 'bg-[#FF6B00] hover:bg-[#EA580C] text-black'
                    }`}
                  >
                    {txStatus === 'SIMULATING' || txStatus === 'SIGNING'
                      ? 'Processing...'
                      : `${tradeMode} ${selectedSide}`}
                  </button>
                </form>
              </div>
            )}

            {/* Bottom info note */}
            <div className="mt-3 text-center text-[11px] text-[#8c8c9e]">
              Instant liquidity backed by continuous on-chain bonding curves on Robinhood Chain.
            </div>
          </div>

          {/* Conviction Feed: Positioned under Buy YES / Buy NO on mobile (order-3), and under Chart on desktop (lg:col-span-7 lg:row-start-2) */}
          <div className="rounded-[22px] border border-[#232330] bg-[#161620] p-4 order-3 lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <MessageSquare className="h-4 w-4 text-[#227c9d]" />
              Conviction Feed ({market.comments.length})
            </h4>

            <form onSubmit={handlePostComment} className="mb-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Share your ${selectedSide} take...`}
                className="flex-1 rounded-full border border-[#232330] bg-[#0e0e14] px-4 py-2 text-xs text-white placeholder-[#8c8c9e] focus:border-[#227c9d] focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full bg-[#227c9d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a647f]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </button>
            </form>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {market.comments.length === 0 ? (
                <p className="py-2 text-center text-xs text-[#8c8c9e]">
                  No comments yet. Post your thesis and lead the debate!
                </p>
              ) : (
                market.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[#232330] bg-[#0e0e14] p-3 text-xs"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full overflow-hidden shrink-0">
                          {c.authorAvatar ? (
                            <img
                              src={c.authorAvatar}
                              alt={c.author}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-tr from-[#227c9d] to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                              {c.author.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-white">
                          {c.author}
                        </span>
                        {c.authorHandle && (
                          <span className="text-[10px] text-[#7a7a8c]">
                            {c.authorHandle}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.side === 'YES'
                              ? 'bg-[#227c9d]/20 text-[#53b3d4]'
                              : 'bg-[#FF6B00]/20 text-orange-300'
                          }`}
                        >
                          {c.side} ({(c.sharesHeld / 1000).toFixed(1)}k)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8c8c9e]" title={formatExactDateTime(c.createdAt || c.timestamp)}>{formatTimeAgo(c.createdAt || c.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 pl-8">{c.text}</p>
                    <div className="mt-2 flex items-center pl-8 text-[11px] text-[#7a7a8c]">
                      <button
                        type="button"
                        onClick={() => onToggleCommentLike && onToggleCommentLike(market.id, c.id)}
                        className={`flex items-center gap-1 hover:text-rose-400 transition ${
                          c.hasLiked ? 'text-rose-500' : ''
                        }`}
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            c.hasLiked ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                        <span>{c.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
