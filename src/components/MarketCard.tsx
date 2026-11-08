import React from 'react';
import { Play } from 'lucide-react';
import {
  OpinionMarket,
  getMarketPricesAndSentiment,
  formatTimeAgo,
  formatExactDateTime,
  formatUsd,
} from '../lib/bondingCurve';

interface MarketCardProps {
  market: OpinionMarket;
  userYesShares?: number;
  userNoShares?: number;
  onSelect: (market: OpinionMarket, defaultSide?: 'YES' | 'NO') => void;
  onQuickTrade?: (marketId: number, isYes: boolean, ethAmount: number) => void;
  variant?: 'vertical' | 'horizontal' | 'highlight';
}



function getAvatarGradient(name: string): string {
  const gradients = [
    'from-[#FF6B00] to-orange-500',
    'from-teal-400 to-emerald-600',
    'from-sky-400 to-blue-600',
    'from-rose-400 to-pink-600',
    'from-violet-400 to-purple-600',
    'from-emerald-400 to-teal-700',
    'from-fuchsia-400 to-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onSelect,
  variant = 'vertical',
}) => {
  const {
    yesSentimentPct,
    noSentimentPct,
    totalPoolEth,
    totalVolumeEth,
  } = getMarketPricesAndSentiment(market);

  // Approximate $2,800/ETH conversion matching POV USD toggle
  const poolUsdVal = totalPoolEth * 2800;
  const volumeUsdVal = totalVolumeEth * 2800;

  // Format creator handle/address
  const creatorDisplay = market.sourceHandle
    ? market.sourceHandle.replace('@', '')
    : market.creator;

  const timeAgo = formatTimeAgo(market.createdAt);

  // HIGHLIGHT VARIANT (Spans 2 columns, prominent image with play button & badge, the centerpiece of Trending)
  if (variant === 'highlight') {
    return (
      <div
        onClick={() => onSelect(market)}
        className="group relative flex cursor-pointer flex-col md:flex-row overflow-hidden rounded-[24px] border border-[#262838] bg-gradient-to-br from-[#161622] via-[#14141c] to-[#0f0f15] transition-all duration-200 hover:-translate-y-1 hover:border-[#38384f] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] h-full"
      >
        {/* Left Media Section with Video/Image & Badge */}
        <div className="relative h-56 sm:h-64 md:h-auto md:w-[45%] shrink-0 overflow-hidden bg-[#0c0c11]">
          {market.imageUri ? (
            <img
              src={market.imageUri}
              alt={market.question}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1c1c27] text-4xl font-black text-[#227c9d]">
              POV
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/50" />

          {/* Highlight Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#FF6B00] backdrop-blur-md border border-[#FF6B00]/30 shadow-md">
            <span>🔥</span>
            <span>Trending Highlight</span>
          </div>

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
            </div>
          </div>

          {/* Creator Chip on Image */}
          {market.sourceHandle && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
              {market.sourceHandle}
            </div>
          )}
        </div>

        {/* Right Content Section */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            {/* Top Row: Creator & Meta */}
            <div className="flex items-center justify-between text-xs text-[#8c8c9e] mb-2.5">
              <div className="flex items-center gap-2 max-w-[65%] truncate">
                <div
                  className={`h-6 w-6 shrink-0 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    creatorDisplay
                  )} flex items-center justify-center text-[10px] font-black text-white shadow-inner`}
                >
                  {creatorDisplay.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-xs font-bold text-white">
                  {creatorDisplay}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8c8c9e]">
                <span className="rounded-full bg-[#20202c] px-2.5 py-0.5 text-slate-300 font-semibold text-[11px]">
                  {market.category}
                </span>
                <span>•</span>
                <span title={formatExactDateTime(market.createdAt)}>{timeAgo}</span>
              </div>
            </div>

            {/* Question Title */}
            <h3 className="text-base sm:text-lg font-black leading-snug text-white transition-colors group-hover:text-[#53b3d4] line-clamp-3">
              {market.question}
            </h3>
          </div>

          {/* Bottom Area: Metrics, Buttons, Sentiment */}
          <div className="mt-5">
            <div className="mb-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="block text-[11px] font-medium text-[#7a7a8c]">Pool</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">
                  {formatUsd(poolUsdVal)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-medium text-[#7a7a8c]">Volume</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">
                  {formatUsd(volumeUsdVal)}
                </span>
              </div>
            </div>

            {/* Chunky Yes & No Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market, 'YES');
                }}
                className="flex items-center justify-center rounded-[14px] bg-[#227c9d] py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1a647f] active:scale-[0.98]"
              >
                Yes
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market, 'NO');
                }}
                className="flex items-center justify-center rounded-[14px] bg-[#FF6B00] py-3 text-sm font-extrabold text-[#111116] shadow-sm transition hover:bg-[#EA580C] active:scale-[0.98]"
              >
                No
              </button>
            </div>

            {/* Full Width Sentiment Bar with % */}
            <div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#252533]">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, yesSentimentPct))}%` }}
                  className="h-full rounded-full bg-[#227c9d] transition-all duration-300"
                />
              </div>

              <div className="mt-1 flex items-center justify-between font-mono text-[11px] font-semibold text-[#8c8c9e]">
                <span className="text-[#53b3d4]">{yesSentimentPct.toFixed(1)}% YES</span>
                <span className="text-[#FF6B00]">{noSentimentPct.toFixed(1)}% NO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VERTICAL VARIANT (Exact match for pov.co/categories and subcategories)
  if (variant === 'vertical') {
    return (
      <div
        onClick={() => onSelect(market)}
        className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[22px] border border-[#222230] bg-[#14141c] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#353548] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] h-full"
      >
        {/* Top Header Row: Creator Avatar & Handle on left, Category & Time on right */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#8c8c9e]">
            <div className="flex items-center gap-2 max-w-[62%] truncate">
              <div
                className={`h-6 w-6 shrink-0 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                  creatorDisplay
                )} flex items-center justify-center text-[10px] font-black text-white shadow-inner`}
              >
                {creatorDisplay.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs font-bold text-white/95">
                {creatorDisplay}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8c8c9e]">
              <span>{market.category}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Market Question Title */}
          <h3 className="mt-3.5 line-clamp-2 min-h-[44px] text-[15px] sm:text-base font-bold leading-snug text-white transition-colors group-hover:text-[#53b3d4]">
            {market.question}
          </h3>
        </div>

        {/* Bottom Area: Pool/Volume Row, Yes/No Buttons, Sentiment Bar */}
        <div className="mt-4">
          {/* Pool vs Volume */}
          <div className="mb-3 flex items-center justify-between text-xs">
            <div>
              <span className="block text-[11px] font-medium text-[#7a7a8c]">Pool</span>
              <span className="font-mono text-sm font-bold text-white">
                {formatUsd(poolUsdVal)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-medium text-[#7a7a8c]">Volume</span>
              <span className="font-mono text-sm font-bold text-white">
                {formatUsd(volumeUsdVal)}
              </span>
            </div>
          </div>

          {/* Yes and No Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(market, 'YES');
              }}
              className="flex items-center justify-center rounded-[14px] bg-[#227c9d] py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1a647f] active:scale-[0.98]"
            >
              Yes
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(market, 'NO');
              }}
              className="flex items-center justify-center rounded-[14px] bg-[#FF6B00] py-2.5 text-sm font-extrabold text-[#111116] shadow-sm transition hover:bg-[#EA580C] active:scale-[0.98]"
            >
              No
            </button>
          </div>

          {/* Sentiment Bar and % Labels */}
          <div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#252533]">
              <div
                style={{ width: `${Math.max(0, Math.min(100, yesSentimentPct))}%` }}
                className="h-full rounded-full bg-[#227c9d] transition-all duration-300"
              />
            </div>

            <div className="mt-1 flex items-center justify-between font-mono text-[11px] font-semibold text-[#8c8c9e]">
              <span className="text-[#53b3d4]">{yesSentimentPct.toFixed(1)}% YES</span>
              <span className="text-[#FF6B00]">{noSentimentPct.toFixed(1)}% NO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HORIZONTAL / LIST VARIANT (Left thumbnail with play button)
  return (
    <div
      onClick={() => onSelect(market)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[#22222d] bg-[#15151c] transition-all duration-200 hover:-translate-y-1 hover:border-[#333344] hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col sm:flex-row h-full">
        {/* Left Video / Image Thumbnail with Play Overlay */}
        <div className="relative h-48 sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-[#0c0c11]">
          {market.imageUri ? (
            <img
              src={market.imageUri}
              alt={market.question}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1c1c27] text-3xl font-black text-[#227c9d]">
              POV
            </div>
          )}

          {/* Semi-transparent gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Central Translucent Play Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
            </div>
          </div>

          {/* Creator handle chip on bottom of image if present */}
          {market.sourceHandle && (
            <div className="absolute bottom-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
              {market.sourceHandle}
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          {/* Header Row: Creator pill + Category + Time */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-[#8c8c9e]">
              <div className="flex items-center gap-1.5 font-medium truncate max-w-[160px]">
                <div
                  className={`h-4 w-4 shrink-0 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    creatorDisplay
                  )} flex items-center justify-center text-[8px] font-bold text-white`}
                >
                  {creatorDisplay.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-white font-semibold">
                  {creatorDisplay}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium text-[11px]">
                <span className="rounded-full bg-[#20202c] px-2 py-0.5 text-slate-300 font-semibold">
                  {market.category}
                </span>
                <span>• {timeAgo}</span>
              </div>
            </div>

            {/* Title / Question */}
            <h3 className="line-clamp-2 text-[15px] sm:text-base font-bold leading-snug text-white transition-colors group-hover:text-[#53b3d4]">
              {market.question}
            </h3>
          </div>

          {/* Bottom Area: Pool / Volume & Yes / No Buttons */}
          <div className="mt-4">
            {/* Pool vs Volume row */}
            <div className="mb-3 flex items-center justify-between text-xs">
              <div>
                <span className="block text-[11px] font-medium text-[#7a7a8c]">Pool</span>
                <span className="font-mono text-xs font-bold text-white">
                  {formatUsd(poolUsdVal)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-medium text-[#7a7a8c]">Volume</span>
                <span className="font-mono text-xs font-bold text-white">
                  {formatUsd(volumeUsdVal)}
                </span>
              </div>
            </div>

            {/* Yes and No Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market, 'YES');
                }}
                className="flex items-center justify-center rounded-[14px] bg-[#227c9d] py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1a647f] active:scale-[0.98]"
              >
                Yes
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market, 'NO');
                }}
                className="flex items-center justify-center rounded-[14px] bg-[#FF6B00] py-2.5 text-sm font-extrabold text-[#111116] shadow-sm transition hover:bg-[#EA580C] active:scale-[0.98]"
              >
                No
              </button>
            </div>

            {/* Progress Bar + % */}
            <div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#252533]">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, yesSentimentPct))}%` }}
                  className="h-full rounded-full bg-[#227c9d] transition-all duration-300"
                />
              </div>

              <div className="mt-1 flex items-center justify-between font-mono text-[11px] font-semibold text-[#8c8c9e]">
                <span className="text-[#53b3d4]">{yesSentimentPct.toFixed(1)}% YES</span>
                <span className="text-[#FF6B00]">{noSentimentPct.toFixed(1)}% NO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
