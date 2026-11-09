// Exact client-side mirror of contracts/Tired.FunMarkets.sol (v2 Audited) independent YES/NO bonding curve math
// plus seed markets, holder distributions, and historical sentiment/price series on Robinhood Chain.

export const INITIAL_VIRTUAL_ETH = 0.5; // 0.5 ETH virtual reserve per side (non-withdrawable)
export const INITIAL_VIRTUAL_SHARES = 500_000; // 500,000 virtual shares per side
export const CURVE_K = INITIAL_VIRTUAL_ETH * INITIAL_VIRTUAL_SHARES; // 250,000
export const MIN_TRADE_ETH = 0.0001; // Anti-dust minimum trade threshold
export const DEFAULT_CREATOR_FEE_RATE = 0.01; // 1.0% to Market Creator
export const DEFAULT_PROTOCOL_FEE_RATE = 0.01; // 1.0% to Tired.Fun Protocol
export const CREATOR_FEE_RATE = DEFAULT_CREATOR_FEE_RATE;
export const PROTOCOL_FEE_RATE = DEFAULT_PROTOCOL_FEE_RATE;
export const TOTAL_FEE_RATE = CREATOR_FEE_RATE + PROTOCOL_FEE_RATE; // 2.0% total

export type MarketCategory =
  | 'All'
  | 'Trending'
  | 'AI'
  | 'Crypto'
  | 'Culture'
  | 'DeFi'
  | 'Other'
  | 'Politics'
  | 'Sports'
  | 'Robinhood'
  | 'AI & Tech'
  | 'Markets';

export interface SideCurveState {
  virtualEth: number;
  virtualShares: number;
  realEth: number;
  totalShares: number;
  volumeEth: number;
  buyVolumeEth?: number;
  sellVolumeEth?: number;
  tradeCount?: number;
}

export type PulseEventType =
  | 'WHALE_TRADE'
  | 'STANDARD_TRADE'
  | 'SENTIMENT_SURGE'
  | 'NEW_MARKET'
  | 'DISCUSSION'
  | 'FEE_CLAIM';

export interface TradeActivity {
  id: string;
  marketId: number;
  marketQuestion: string;
  category?: Exclude<MarketCategory, 'All'>;
  trader: string;
  isYes: boolean;
  isBuy: boolean;
  ethAmount: number;
  sharesAmount: number;
  yesSentimentAfter: number;
  sentimentDeltaPct?: number;
  eventType?: PulseEventType;
  timestamp: number;
  isOnChain?: boolean;
  txHash?: string;
}

export interface SentimentHistoryPoint {
  timestamp: number;
  label: string;
  yesSentiment: number; // 0 - 100
  yesPriceEth: number;
  noPriceEth: number;
  volumeSnapshotEth?: number;
}

export interface MarketHolderEntry {
  address: string;
  side: 'YES' | 'NO';
  shares: number;
  shareOfSidePct: number;
  avgEntryEth: number;
}

export interface MarketComment {
  id: string;
  author: string;
  authorHandle?: string;
  authorAvatar?: string;
  side: 'YES' | 'NO';
  sharesHeld: number;
  text: string;
  createdAt?: number;
  timestamp: string;
  likes?: number;
  hasLiked?: boolean;
}

export type MarketType = 'PERPETUAL_OPINION' | 'RESOLVABLE_PREDICTION';
export type MarketStatus = 'ACTIVE' | 'CLOSED' | 'PROPOSED' | 'DISPUTED' | 'RESOLVED' | 'VOID';
export type MarketOutcome = 'UNRESOLVED' | 'YES' | 'NO' | 'VOID';

export interface PredictionDetails {
  closingTime: number; // Unix timestamp in seconds (UTC)
  resolutionDeadline: number; // Unix timestamp in seconds
  disputeDeadline?: number;
  yesCondition: string;
  noCondition: string;
  evidenceSource: string;
  proposedEvidence?: string;
  disputeEvidence?: string;
  proposer?: string;
  disputer?: string;
  proposedAt?: number;
  disputedAt?: number;
  resolvedAt?: number;
  proposedOutcome?: MarketOutcome;
  finalOutcome?: MarketOutcome;
  distributablePoolEth?: number;
  winningTotalShares?: number;
  totalClaimedSettlementEth?: number;
}

export interface OpinionMarket {
  id: number;
  creator: string;
  creatorAvatar?: string;
  question: string;
  category: Exclude<MarketCategory, 'All'>;
  imageUri: string;
  sourceHandle: string;
  createdAt: number;
  totalTrades: number;
  creatorFeesEarned: number;
  yesCurve: SideCurveState;
  noCurve: SideCurveState;
  history: SentimentHistoryPoint[];
  holders?: MarketHolderEntry[];
  txHash?: string;
  isOnChain?: boolean;
  comments: MarketComment[];
  marketType?: MarketType;
  status?: MarketStatus;
  prediction?: PredictionDetails;
}

export interface TradeQuote {
  sharesDelta: number;
  netEthDelta: number;
  grossEthDelta: number;
  creatorFeeEth: number;
  protocolFeeEth: number;
  totalFeeEth: number;
  currentPriceEth: number;
  newPriceEth: number;
  priceImpactPct: number;
  newSentimentPct: number;
  minReceivedShares: number;
  minReceivedEth: number;
  belowMinimumTrade: boolean;
}


export function formatUsd(amount: number): string {
  if (!amount || isNaN(amount) || amount < 0.01) {
    return '$0.00';
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}k`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatTimeAgo(timestamp?: number | string): string {
  if (!timestamp) return 'Just now';
  let ts: number;
  if (typeof timestamp === 'string') {
    const parsedNum = Number(timestamp);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      ts = parsedNum;
    } else {
      const parsedDate = Date.parse(timestamp);
      if (!isNaN(parsedDate) && parsedDate > 0) {
        ts = parsedDate;
      } else {
        return timestamp;
      }
    }
  } else {
    ts = timestamp;
  }

  // Handle Unix seconds (Solidity block.timestamp is in seconds)
  if (ts < 10_000_000_000) {
    ts = ts * 1000;
  }

  const diff = Math.max(0, Date.now() - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function formatExactDateTime(timestamp?: number | string): string {
  if (!timestamp) return '';
  let ts = typeof timestamp === 'string' ? Number(timestamp) || Date.parse(timestamp) : timestamp;
  if (!ts || isNaN(ts)) return '';
  if (ts < 10_000_000_000) ts = ts * 1000;
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function isPredictionMarket(market: OpinionMarket): boolean {
  return market.marketType === 'RESOLVABLE_PREDICTION' || Boolean(market.prediction?.closingTime);
}

export function isTradingClosed(market: OpinionMarket): boolean {
  if (!isPredictionMarket(market)) return false;
  if (market.status && market.status !== 'ACTIVE') return true;
  if (!market.prediction?.closingTime) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= market.prediction.closingTime;
}

export function getResolutionTimeRemaining(targetTimestampSec: number): {
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = targetTimestampSec - nowSec;
  if (diffSec <= 0) {
    return { isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: 'Closed' };
  }
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  let formatted = '';
  if (days > 0) formatted = `${days}d ${hours}h left`;
  else if (hours > 0) formatted = `${hours}h ${minutes}m left`;
  else formatted = `${minutes}m ${seconds}s left`;
  return { isExpired: false, days, hours, minutes, seconds, formatted };
}

export function calculateSettlementQuote(
  market: OpinionMarket,
  userYesShares: number,
  userNoShares: number,
  alreadyClaimed = false
): {
  isEligible: boolean;
  claimableEth: number;
  winningOutcome: MarketOutcome;
  poolEth: number;
  winningShares: number;
  reason: string;
} {
  const outcome = market.prediction?.finalOutcome || 'UNRESOLVED';
  const poolEth = (market.yesCurve.realEth || 0) + (market.noCurve.realEth || 0);

  if (alreadyClaimed) {
    return {
      isEligible: false,
      claimableEth: 0,
      winningOutcome: outcome,
      poolEth,
      winningShares: 0,
      reason: 'Reward already claimed',
    };
  }

  if (market.status === 'RESOLVED') {
    if (outcome === 'YES') {
      const winShares = market.prediction?.winningTotalShares || market.yesCurve.totalShares || 0;
      if (userYesShares > 0 && winShares > 0) {
        const claimableEth = (poolEth * userYesShares) / winShares;
        return {
          isEligible: claimableEth > 0,
          claimableEth,
          winningOutcome: outcome,
          poolEth,
          winningShares: winShares,
          reason: 'Winning YES Shares Entitlement',
        };
      }
    } else if (outcome === 'NO') {
      const winShares = market.prediction?.winningTotalShares || market.noCurve.totalShares || 0;
      if (userNoShares > 0 && winShares > 0) {
        const claimableEth = (poolEth * userNoShares) / winShares;
        return {
          isEligible: claimableEth > 0,
          claimableEth,
          winningOutcome: outcome,
          poolEth,
          winningShares: winShares,
          reason: 'Winning NO Shares Entitlement',
        };
      }
    }
  } else if (market.status === 'VOID') {
    const yesRefund = market.yesCurve.totalShares > 0 ? (market.yesCurve.realEth * userYesShares) / market.yesCurve.totalShares : 0;
    const noRefund = market.noCurve.totalShares > 0 ? (market.noCurve.realEth * userNoShares) / market.noCurve.totalShares : 0;
    const totalRefund = yesRefund + noRefund;
    return {
      isEligible: totalRefund > 0,
      claimableEth: totalRefund,
      winningOutcome: 'VOID',
      poolEth,
      winningShares: 0,
      reason: 'Proportional VOID Market Refund',
    };
  }

  return {
    isEligible: false,
    claimableEth: 0,
    winningOutcome: outcome,
    poolEth,
    winningShares: 0,
    reason: market.status === 'ACTIVE' ? 'Trading still active' : 'Awaiting resolution',
  };
}

export function getSpotPriceEth(curve: SideCurveState): number {
  return curve.virtualEth / curve.virtualShares;
}

export function getMarketPricesAndSentiment(market: OpinionMarket) {
  const yesPriceEth = getSpotPriceEth(market.yesCurve);
  const noPriceEth = getSpotPriceEth(market.noCurve);
  const sum = yesPriceEth + noPriceEth;

  const rawPoolEth = market.yesCurve.realEth + market.noCurve.realEth;
  const rawVolumeEth = market.yesCurve.volumeEth + market.noCurve.volumeEth;

  // Determine if this opinion has real external trades / votes
  const hasBeenVotedOn =
    (market.totalTrades > 1) ||
    (market.totalTrades === 1 && (market.creatorFeesEarned || 0) > 0) ||
    (market.id === 1) ||
    (rawVolumeEth > 0.002);

  const totalPoolEth = hasBeenVotedOn ? rawPoolEth : 0;
  const totalVolumeEth = hasBeenVotedOn ? rawVolumeEth : 0;

  // Conviction percentage: exact calculation for voted opinions; pristine 50.0% / 50.0% for unvoted
  let yesSentimentPct = 50.0;
  let noSentimentPct = 50.0;

  if (hasBeenVotedOn && sum > 0) {
    yesSentimentPct = (yesPriceEth / sum) * 100;
    noSentimentPct = 100 - yesSentimentPct;
  }

  // Multiplier vs genesis price (0.000001 ETH)
  const genesisPrice = INITIAL_VIRTUAL_ETH / INITIAL_VIRTUAL_SHARES;
  const yesMultiplier = hasBeenVotedOn ? yesPriceEth / genesisPrice : 1.0;
  const noMultiplier = hasBeenVotedOn ? noPriceEth / genesisPrice : 1.0;

  // 24h sentiment & price changes derived from history
  const firstPt = market.history[0];
  const prevPt = market.history[Math.max(0, market.history.length - 2)] || firstPt;
  const sentimentChange24h = (hasBeenVotedOn && firstPt) ? yesSentimentPct - firstPt.yesSentiment : 0;
  const sentimentChangeRecent = (hasBeenVotedOn && prevPt) ? yesSentimentPct - prevPt.yesSentiment : 0;

  // Controversiality score (0 to 100): highest when sentiment is near 50/50 AND both sides have high volume
  const balanceFactor = 1 - Math.abs(50 - yesSentimentPct) / 50; // 1.0 at 50/50, 0.0 at 100/0
  const volumeFactor = Math.min(1, Math.log10(1 + totalVolumeEth) / 2);
  const controversyScore = hasBeenVotedOn ? Math.round(balanceFactor * (0.5 + 0.5 * volumeFactor) * 100) : 0;

  return {
    yesPriceEth,
    noPriceEth,
    yesSentimentPct,
    noSentimentPct,
    totalPoolEth,
    totalVolumeEth,
    yesMultiplier,
    noMultiplier,
    sentimentChange24h,
    sentimentChangeRecent,
    controversyScore,
  };
}

export function quoteBuyOrder(
  market: OpinionMarket,
  isYes: boolean,
  ethIn: number,
  slippagePct = 1.0,
  creatorFeeRate = DEFAULT_CREATOR_FEE_RATE,
  protocolFeeRate = DEFAULT_PROTOCOL_FEE_RATE
): TradeQuote {
  const targetCurve = isYes ? market.yesCurve : market.noCurve;
  const otherCurve = isYes ? market.noCurve : market.yesCurve;
  const currentPriceEth = getSpotPriceEth(targetCurve);

  if (!ethIn || ethIn <= 0) {
    const metrics = getMarketPricesAndSentiment(market);
    return {
      sharesDelta: 0,
      netEthDelta: 0,
      grossEthDelta: 0,
      creatorFeeEth: 0,
      protocolFeeEth: 0,
      totalFeeEth: 0,
      currentPriceEth,
      newPriceEth: currentPriceEth,
      priceImpactPct: 0,
      newSentimentPct: metrics.yesSentimentPct,
      minReceivedShares: 0,
      minReceivedEth: 0,
      belowMinimumTrade: false,
    };
  }

  const creatorFeeEth = ethIn * creatorFeeRate;
  const protocolFeeEth = ethIn * protocolFeeRate;
  const totalFeeEth = creatorFeeEth + protocolFeeEth;
  const netEth = ethIn - totalFeeEth;

  const newRealEth = targetCurve.realEth + netEth;
  const newVirtualEth = INITIAL_VIRTUAL_ETH + newRealEth;
  const newVirtualShares = CURVE_K / newVirtualEth;
  const sharesOut = Math.max(0, targetCurve.virtualShares - newVirtualShares);
  const newPriceEth = newVirtualEth / newVirtualShares;
  const priceImpactPct = ((newPriceEth - currentPriceEth) / currentPriceEth) * 100;

  const otherPriceEth = getSpotPriceEth(otherCurve);
  const newYesPrice = isYes ? newPriceEth : otherPriceEth;
  const newNoPrice = isYes ? otherPriceEth : newPriceEth;
  const newSentimentPct = (newYesPrice / (newYesPrice + newNoPrice)) * 100;

  const minReceivedShares = sharesOut * Math.max(0, 1 - slippagePct / 100);

  return {
    sharesDelta: sharesOut,
    netEthDelta: netEth,
    grossEthDelta: ethIn,
    creatorFeeEth,
    protocolFeeEth,
    totalFeeEth,
    currentPriceEth,
    newPriceEth,
    priceImpactPct,
    newSentimentPct,
    minReceivedShares,
    minReceivedEth: 0,
    belowMinimumTrade: ethIn > 0 && ethIn < MIN_TRADE_ETH,
  };
}

export function quoteSellOrder(
  market: OpinionMarket,
  isYes: boolean,
  sharesIn: number,
  slippagePct = 1.0,
  creatorFeeRate = DEFAULT_CREATOR_FEE_RATE,
  protocolFeeRate = DEFAULT_PROTOCOL_FEE_RATE
): TradeQuote {
  const targetCurve = isYes ? market.yesCurve : market.noCurve;
  const otherCurve = isYes ? market.noCurve : market.yesCurve;
  const currentPriceEth = getSpotPriceEth(targetCurve);

  if (!sharesIn || sharesIn <= 0) {
    const metrics = getMarketPricesAndSentiment(market);
    return {
      sharesDelta: 0,
      netEthDelta: 0,
      grossEthDelta: 0,
      creatorFeeEth: 0,
      protocolFeeEth: 0,
      totalFeeEth: 0,
      currentPriceEth,
      newPriceEth: currentPriceEth,
      priceImpactPct: 0,
      newSentimentPct: metrics.yesSentimentPct,
      minReceivedShares: 0,
      minReceivedEth: 0,
      belowMinimumTrade: false,
    };
  }

  const newVirtualShares = Math.min(
    INITIAL_VIRTUAL_SHARES,
    targetCurve.virtualShares + sharesIn
  );
  const newVirtualEth = Math.max(INITIAL_VIRTUAL_ETH, CURVE_K / newVirtualShares);
  // Strict virtual reserve isolation: never exceed targetCurve.realEth
  const grossEthOut = Math.min(
    targetCurve.realEth,
    Math.max(0, targetCurve.virtualEth - newVirtualEth)
  );

  const creatorFeeEth = grossEthOut * creatorFeeRate;
  const protocolFeeEth = grossEthOut * protocolFeeRate;
  const totalFeeEth = creatorFeeEth + protocolFeeEth;
  const netEthOut = Math.max(0, grossEthOut - totalFeeEth);

  const updatedVirtualEth = INITIAL_VIRTUAL_ETH + (targetCurve.realEth - grossEthOut);
  const newPriceEth = updatedVirtualEth / newVirtualShares;
  const priceImpactPct = ((newPriceEth - currentPriceEth) / currentPriceEth) * 100;

  const otherPriceEth = getSpotPriceEth(otherCurve);
  const newYesPrice = isYes ? newPriceEth : otherPriceEth;
  const newNoPrice = isYes ? otherPriceEth : newPriceEth;
  const newSentimentPct = (newYesPrice / (newYesPrice + newNoPrice)) * 100;

  const minReceivedEth = netEthOut * Math.max(0, 1 - slippagePct / 100);

  return {
    sharesDelta: sharesIn,
    netEthDelta: netEthOut,
    grossEthDelta: grossEthOut,
    creatorFeeEth,
    protocolFeeEth,
    totalFeeEth,
    currentPriceEth,
    newPriceEth,
    priceImpactPct,
    newSentimentPct,
    minReceivedShares: 0,
    minReceivedEth,
    belowMinimumTrade: false,
  };
}

export function makeCurveStateFromReserve(
  realEth: number,
  volumeEth: number,
  buyRatio = 0.68
): SideCurveState {
  const virtualEth = INITIAL_VIRTUAL_ETH + realEth;
  const virtualShares = CURVE_K / virtualEth;
  const totalShares = INITIAL_VIRTUAL_SHARES - virtualShares;
  return {
    virtualEth,
    virtualShares,
    realEth,
    totalShares,
    volumeEth,
    buyVolumeEth: Number((volumeEth * buyRatio).toFixed(3)),
    sellVolumeEth: Number((volumeEth * (1 - buyRatio)).toFixed(3)),
    tradeCount: volumeEth > 0 ? Math.max(1, Math.round(volumeEth * 7)) : 0,
  };
}

export const INITIAL_OPINION_MARKETS: OpinionMarket[] = [
  {
    id: 1,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Will Robinhood Chain flip Base in daily retail opinion & socialFi transactions this cycle?',
    category: 'Robinhood',
    imageUri: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    totalTrades: 4,
    creatorFeesEarned: 0.00003,
    yesCurve: makeCurveStateFromReserve(0.00049, 0.00049, 0.50),
    noCurve: makeCurveStateFromReserve(0.002058, 0.002058, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 12, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 },
      { timestamp: Date.now(), label: 'Now', yesSentiment: 49.7, yesPriceEth: 0.0000010005, noPriceEth: 0.0000010021, volumeSnapshotEth: 0.002548 }
    ],
    holders: [],
    comments: [],
    marketType: 'PERPETUAL_OPINION',
    status: 'ACTIVE',
  },
  {
    id: 2,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Are autonomous AI trading agents better capital allocators than human CT influencers?',
    category: 'AI',
    imageUri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    totalTrades: 0,
    creatorFeesEarned: 0,
    yesCurve: makeCurveStateFromReserve(0, 0, 0.50),
    noCurve: makeCurveStateFromReserve(0, 0, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 10, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 }
    ],
    holders: [],
    comments: [],
    marketType: 'PERPETUAL_OPINION',
    status: 'ACTIVE',
  },
  {
    id: 3,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Should tokenized equities (NVDA, TSLA, HOOD) trade 24/7 on-chain without circuit breakers?',
    category: 'Markets',
    imageUri: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    totalTrades: 0,
    creatorFeesEarned: 0,
    yesCurve: makeCurveStateFromReserve(0, 0, 0.50),
    noCurve: makeCurveStateFromReserve(0, 0, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 8, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 }
    ],
    holders: [],
    comments: [],
    marketType: 'PERPETUAL_OPINION',
    status: 'ACTIVE',
  },
  {
    id: 4,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Will Robinhood Chain mainnet TVL surpass $500,000,000 USD before November 2026?',
    category: 'Robinhood',
    imageUri: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    totalTrades: 3,
    creatorFeesEarned: 0.00004,
    yesCurve: makeCurveStateFromReserve(0.0022, 0.0022, 0.65),
    noCurve: makeCurveStateFromReserve(0.0018, 0.0018, 0.35),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 6, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 },
      { timestamp: Date.now(), label: 'Now', yesSentiment: 55.0, yesPriceEth: 0.000001004, noPriceEth: 0.000001003, volumeSnapshotEth: 0.004 }
    ],
    holders: [],
    comments: [],
    marketType: 'RESOLVABLE_PREDICTION',
    status: 'ACTIVE',
    prediction: {
      closingTime: Math.floor(Date.now() / 1000) + 14 * 86400, // 14 days from now
      resolutionDeadline: Math.floor(Date.now() / 1000) + 15 * 86400,
      yesCondition: 'Robinhood Chain TVL on DefiLlama reaches or exceeds $500,000,000 USD prior to closing timestamp.',
      noCondition: 'Robinhood Chain TVL remains below $500,000,000 USD at closing timestamp.',
      evidenceSource: 'https://defillama.com/chain/Robinhood',
    },
  },
  {
    id: 5,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Will Ethereum L1 finalize the Pectra upgrade before December 31, 2026?',
    category: 'Crypto',
    imageUri: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    totalTrades: 0,
    creatorFeesEarned: 0,
    yesCurve: makeCurveStateFromReserve(0, 0, 0.50),
    noCurve: makeCurveStateFromReserve(0, 0, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 4, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 }
    ],
    holders: [],
    comments: [],
    marketType: 'RESOLVABLE_PREDICTION',
    status: 'ACTIVE',
    prediction: {
      closingTime: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days
      resolutionDeadline: Math.floor(Date.now() / 1000) + 31 * 86400,
      yesCondition: 'Ethereum consensus clients successfully activate Pectra on mainnet beacon chain.',
      noCondition: 'Pectra mainnet activation has not occurred by closing deadline.',
      evidenceSource: 'https://ethereum.org and Etherscan',
    },
  },
  {
    id: 6,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Will an AI agent hold an autonomous multi-million dollar on-chain treasury audited by a top firm?',
    category: 'AI',
    imageUri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    totalTrades: 0,
    creatorFeesEarned: 0,
    yesCurve: makeCurveStateFromReserve(0, 0, 0.50),
    noCurve: makeCurveStateFromReserve(0, 0, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 2, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 }
    ],
    holders: [],
    comments: [],
    marketType: 'RESOLVABLE_PREDICTION',
    status: 'ACTIVE',
    prediction: {
      closingTime: Math.floor(Date.now() / 1000) + 45 * 86400,
      resolutionDeadline: Math.floor(Date.now() / 1000) + 46 * 86400,
      yesCondition: 'A publicly verified smart contract owned strictly by an autonomous agent key holds >= $2M USD with published audit.',
      noCondition: 'No verifiable agent treasury meets all criteria before resolution date.',
      evidenceSource: 'https://etherscan.io and official audit report',
    },
  },
  {
    id: 7,
    creator: '0xa58dc16645b481D8AF2f095613944C2254311972',
    question: 'Will Manchester United score 3 or more goals in their next Premier League match?',
    category: 'Sports',
    imageUri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    sourceHandle: '@creator',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    totalTrades: 5,
    creatorFeesEarned: 0.00008,
    yesCurve: makeCurveStateFromReserve(0.0035, 0.0035, 0.50),
    noCurve: makeCurveStateFromReserve(0.0045, 0.0045, 0.50),
    history: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 24, label: 'Genesis', yesSentiment: 50, yesPriceEth: 0.000001, noPriceEth: 0.000001, volumeSnapshotEth: 0 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 2, label: 'Proposed', yesSentiment: 44.0, yesPriceEth: 0.000001007, noPriceEth: 0.000001009, volumeSnapshotEth: 0.008 }
    ],
    holders: [],
    comments: [],
    marketType: 'RESOLVABLE_PREDICTION',
    status: 'PROPOSED',
    prediction: {
      closingTime: Math.floor(Date.now() / 1000) - 3600 * 4, // Closed 4 hours ago
      resolutionDeadline: Math.floor(Date.now() / 1000) + 3600 * 20,
      disputeDeadline: Math.floor(Date.now() / 1000) + 3600 * 20,
      yesCondition: 'Manchester United scores 3 or more official goals in full-time regulation play.',
      noCondition: 'Manchester United scores fewer than 3 goals.',
      evidenceSource: 'https://www.premierleague.com/match-results',
      proposedOutcome: 'YES',
      proposedEvidence: 'https://www.premierleague.com/match/11245 - Final score Man Utd 3 - 1',
      proposer: '0x3344556677889900112233445566778899001122',
      proposedAt: Math.floor(Date.now() / 1000) - 3600 * 2,
    },
  },
];