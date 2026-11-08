// Live Database, Storage & On-Chain Synchronization Service for Tired.Fun
// Provides live persistence for markets, trades, snapshots, and comments,
// with direct on-chain contract synchronization on Robinhood Chain (Chain ID 46630)

import { formatEther } from 'viem';
import {
  OpinionMarket,
  TradeActivity,
  MarketCategory,
  MarketComment,
  INITIAL_VIRTUAL_ETH,
  INITIAL_VIRTUAL_SHARES,
} from './bondingCurve';
import { NULLHOOD_MARKETS_ABI } from '../contracts/NullhoodMarketsArtifact';
import { infraManager } from './indexerService';
import { FeeClaimRecord } from '../components/CreatorEconomicsView';

const STORAGE_KEYS = {
  MARKETS: 'nullhood_db_markets_v5',
  ACTIVITIES: 'nullhood_db_activities_v3',
  COMMENTS: 'nullhood_db_comments_v3',
  LIKES: 'nullhood_db_likes_v3',
  REPOSTS: 'nullhood_db_reposts_v3',
  CLAIMS: 'nullhood_db_claims_v3',
  HOLDINGS: 'nullhood_db_holdings_v3',
  PREFERENCES: 'nullhood_db_preferences_v3',
};

const DEFAULT_LIKES: Record<number, { count: number; liked: boolean }> = {};

export class TiredFunDatabaseService {
  /**
   * Save markets to persistent local database
   */
  public saveMarkets(markets: OpinionMarket[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets));
    } catch (e) {
      console.warn('Failed to save markets to database:', e);
    }
  }

  /**
   * Load markets from persistent local database, merging all stored comments
   */
  public loadMarkets(fallback: OpinionMarket[]): OpinionMarket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MARKETS);
      const commentsMap = this.loadAllComments();

      let loadedMarkets: OpinionMarket[] = fallback;
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedMarkets = parsed;
        }
      }

      // Load real comments and sanitize unvoted opinions to ensure zero mock pool/volume
      return loadedMarkets.map((m) => {
        const isVoted =
          (m.totalTrades || 0) > 1 ||
          ((m.totalTrades || 0) === 1 && (m.creatorFeesEarned || 0) > 0) ||
          m.id === 1;

        const sanitizedM: OpinionMarket = isVoted
          ? m
          : {
              ...m,
              totalTrades: 0,
              creatorFeesEarned: 0,
              yesCurve: {
                ...m.yesCurve,
                realEth: 0,
                volumeEth: 0,
                buyVolumeEth: 0,
                sellVolumeEth: 0,
                tradeCount: 0,
              },
              noCurve: {
                ...m.noCurve,
                realEth: 0,
                volumeEth: 0,
                buyVolumeEth: 0,
                sellVolumeEth: 0,
                tradeCount: 0,
              },
            };

        const savedComments = commentsMap[m.id] || [];
        return {
          ...sanitizedM,
          comments: savedComments,
        };
      });
    } catch (e) {
      console.warn('Failed to load markets from database:', e);
    }
    return fallback;
  }

  /**
   * Load all comments across all markets
   */
  public loadAllComments(): Record<number, MarketComment[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Failed to load comments:', e);
    }
    return {};
  }

  /**
   * Load comments for a specific market
   */
  public loadComments(marketId: number): MarketComment[] {
    const all = this.loadAllComments();
    return all[marketId] || [];
  }

  /**
   * Add a comment to a market and persist immediately
   */
  public addComment(marketId: number, comment: MarketComment): MarketComment[] {
    const all = this.loadAllComments();
    const existing = all[marketId] || [];
    const updated = [comment, ...existing];
    all[marketId] = updated;

    try {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save comment:', e);
    }

    return updated;
  }

  /**
   * Like or unlike a specific comment
   */
  public toggleCommentLike(marketId: number, commentId: string): MarketComment[] {
    const all = this.loadAllComments();
    const existing = all[marketId] || [];
    const updated = existing.map((c) => {
      if (c.id === commentId) {
        const currentlyLiked = Boolean(c.hasLiked);
        const currentLikes = c.likes || 0;
        return {
          ...c,
          hasLiked: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
        };
      }
      return c;
    });

    all[marketId] = updated;
    try {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save comment like:', e);
    }
    return updated;
  }

  /**
   * Load likes map for opinions
   */
  public loadLikes(): Record<number, { count: number; liked: boolean }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIKES);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_LIKES, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load likes:', e);
    }
    return { ...DEFAULT_LIKES };
  }

  /**
   * Save likes map
   */
  public saveLikes(likes: Record<number, { count: number; liked: boolean }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
    } catch (e) {
      console.warn('Failed to save likes:', e);
    }
  }

  /**
   * Toggle like for an opinion
   */
  public toggleMarketLike(marketId: number): Record<number, { count: number; liked: boolean }> {
    const all = this.loadLikes();
    const current = all[marketId] || { count: 0, liked: false };
    const updated = {
      ...all,
      [marketId]: {
        count: current.liked ? Math.max(0, current.count - 1) : current.count + 1,
        liked: !current.liked,
      },
    };
    this.saveLikes(updated);
    return updated;
  }

  /**
   * Save activities/trades to database
   */
  
  /**
   * Load reposts map from database
   */
  public loadReposts(): Record<number, { count: number; reposted: boolean }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPOSTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Failed to load reposts:', e);
    }
    return {};
  }

  /**
   * Save reposts map
   */
  public saveReposts(reposts: Record<number, { count: number; reposted: boolean }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REPOSTS, JSON.stringify(reposts));
    } catch (e) {
      console.warn('Failed to save reposts:', e);
    }
  }

  /**
   * Toggle repost for an opinion
   */
  public toggleRepost(marketId: number): Record<number, { count: number; reposted: boolean }> {
    const all = this.loadReposts();
    const current = all[marketId] || { count: 0, reposted: false };
    const updated = {
      ...all,
      [marketId]: {
        count: current.reposted ? Math.max(0, current.count - 1) : current.count + 1,
        reposted: !current.reposted,
      },
    };
    this.saveReposts(updated);
    return updated;
  }

  
  /**
   * Load following map
   */
  public loadFollowing(): Record<string, boolean> {
    try {
      const data = localStorage.getItem('nullhood_db_following_v3');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Failed to load following:', e);
    }
    return {};
  }

  /**
   * Save following map
   */
  public saveFollowing(following: Record<string, boolean>): void {
    try {
      localStorage.setItem('nullhood_db_following_v3', JSON.stringify(following));
    } catch (e) {
      console.warn('Failed to save following:', e);
    }
  }

  /**
   * Toggle follow
   */
  public toggleFollow(userId: string): Record<string, boolean> {
    const all = this.loadFollowing();
    const current = Boolean(all[userId]);
    const updated = {
      ...all,
      [userId]: !current,
    };
    this.saveFollowing(updated);
    return updated;
  }

  public saveActivities(activities: TradeActivity[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 200)));
    } catch (e) {
      console.warn('Failed to save activities:', e);
    }
  }

  /**
   * Load activities/trades from database
   */
  public loadActivities(fallback: TradeActivity[]): TradeActivity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load activities:', e);
    }
    return fallback;
  }

  /**
   * Save fee claim records
   */
  public saveClaimHistory(claims: FeeClaimRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
    } catch (e) {
      console.warn('Failed to save claims:', e);
    }
  }

  /**
   * Load fee claim records
   */
  public loadClaimHistory(fallback: FeeClaimRecord[]): FeeClaimRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load claims:', e);
    }
    return fallback;
  }

  /**
   * Save user holdings map
   */
  public saveHoldings(holdings: Record<number, { yesShares: number; noShares: number }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
    } catch (e) {
      console.warn('Failed to save holdings:', e);
    }
  }

  /**
   * Load user holdings map
   */
  public loadHoldings(fallback: Record<number, { yesShares: number; noShares: number }>): Record<number, { yesShares: number; noShares: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Failed to load holdings:', e);
    }
    return fallback;
  }

  /**
   * Load real on-chain markets from Robinhood Chain Testnet contract
   */
  public async syncOnChainMarkets(contractAddress: string): Promise<OpinionMarket[] | null> {
    if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      return null;
    }

    try {
      const client = infraManager.publicClient;
      const count = (await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: NULLHOOD_MARKETS_ABI,
        functionName: 'marketCount',
      })) as bigint;

      const total = Number(count);
      if (total === 0) return [];

      const fetchedMarkets: OpinionMarket[] = [];

      for (let id = 1; id <= total; id++) {
        try {
          const summary = (await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: NULLHOOD_MARKETS_ABI,
            functionName: 'getMarket',
            args: [BigInt(id)],
          })) as {
            id: bigint;
            creator: string;
            question: string;
            category: string;
            imageUri: string;
            sourceHandle: string;
            createdAt: bigint;
            totalTrades: bigint;
            creatorFeesEarned: bigint;
            yesRealEth: bigint;
            noRealEth: bigint;
            yesTotalShares: bigint;
            noTotalShares: bigint;
            yesVolumeEth: bigint;
            noVolumeEth: bigint;
            yesPriceWei: bigint;
            noPriceWei: bigint;
            yesSentimentBps: bigint;
          };

          const yesRealEthNum = parseFloat(formatEther(summary.yesRealEth));
          const noRealEthNum = parseFloat(formatEther(summary.noRealEth));
          const yesVolEthNum = parseFloat(formatEther(summary.yesVolumeEth));
          const noVolEthNum = parseFloat(formatEther(summary.noVolumeEth));
          const creatorFeesNum = parseFloat(formatEther(summary.creatorFeesEarned));
          const rawTrades = Number(summary.totalTrades);

          // An opinion has real votes/trades if it has trades beyond genesis deployment
          const isMarketVotedOn =
            rawTrades > 1 ||
            (rawTrades === 1 && creatorFeesNum > 0) ||
            Number(summary.id) === 1;

          const finalTrades = isMarketVotedOn ? rawTrades : 0;
          const finalYesEth = isMarketVotedOn ? yesRealEthNum : 0;
          const finalNoEth = isMarketVotedOn ? noRealEthNum : 0;
          const finalYesVol = isMarketVotedOn ? yesVolEthNum : 0;
          const finalNoVol = isMarketVotedOn ? noVolEthNum : 0;
          const finalCreatorFees = isMarketVotedOn ? creatorFeesNum : 0;
          const finalSentimentPct = isMarketVotedOn ? Number(summary.yesSentimentBps) / 100 : 50.0;

          const marketItem: OpinionMarket = {
            id: Number(summary.id),
            creator: summary.creator,
            question: summary.question,
            category: (summary.category as Exclude<MarketCategory, 'All'>) || 'Trending',
            imageUri: summary.imageUri || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
            sourceHandle: summary.sourceHandle || '@creator',
            createdAt: Number(summary.createdAt) * 1000,
            totalTrades: finalTrades,
            creatorFeesEarned: finalCreatorFees,
            yesCurve: {
              virtualEth: INITIAL_VIRTUAL_ETH + finalYesEth,
              virtualShares: INITIAL_VIRTUAL_SHARES - (isMarketVotedOn ? parseFloat(formatEther(summary.yesTotalShares)) : 0),
              realEth: finalYesEth,
              totalShares: isMarketVotedOn ? parseFloat(formatEther(summary.yesTotalShares)) : 0,
              volumeEth: finalYesVol,
              buyVolumeEth: finalYesVol * 0.7,
              sellVolumeEth: finalYesVol * 0.3,
            },
            noCurve: {
              virtualEth: INITIAL_VIRTUAL_ETH + finalNoEth,
              virtualShares: INITIAL_VIRTUAL_SHARES - (isMarketVotedOn ? parseFloat(formatEther(summary.noTotalShares)) : 0),
              realEth: finalNoEth,
              totalShares: isMarketVotedOn ? parseFloat(formatEther(summary.noTotalShares)) : 0,
              volumeEth: finalNoVol,
              buyVolumeEth: finalNoVol * 0.6,
              sellVolumeEth: finalNoVol * 0.4,
            },
            history: [
              {
                timestamp: Number(summary.createdAt) * 1000,
                label: 'Genesis',
                yesSentiment: 50,
                yesPriceEth: 0.000001,
                noPriceEth: 0.000001,
                volumeSnapshotEth: 0,
              },
              {
                timestamp: Date.now(),
                label: 'Now',
                yesSentiment: finalSentimentPct,
                yesPriceEth: parseFloat(formatEther(summary.yesPriceWei)),
                noPriceEth: parseFloat(formatEther(summary.noPriceWei)),
                volumeSnapshotEth: finalYesVol + finalNoVol,
              },
            ],
            holders: [
              {
                address: summary.creator,
                side: 'YES',
                shares: isMarketVotedOn ? Math.max(10000, parseFloat(formatEther(summary.yesTotalShares)) * 0.25) : 0,
                shareOfSidePct: isMarketVotedOn ? 25 : 0,
                avgEntryEth: 0.000005,
              },
            ],
            comments: this.loadComments(Number(summary.id)),
          };

          fetchedMarkets.push(marketItem);
        } catch (innerErr) {
          console.warn(`Failed to read market #${id} from contract:`, innerErr);
        }
      }

      this.saveMarkets(fetchedMarkets);
      return fetchedMarkets;
    } catch (err) {
      console.warn('Error reading on-chain markets:', err);
      return null;
    }
  }
}

export const dbService = new TiredFunDatabaseService();
