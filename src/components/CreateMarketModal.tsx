import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Coins,
  Image as ImageIcon,
  AtSign,
  ShieldCheck,
  Target,
  Calendar,
  Clock,
  Link as LinkIcon,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { MarketCategory, MarketType } from '../lib/bondingCurve';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string | null;
  onRequireWallet?: (actionTitle?: string) => void;
  onCreateMarket: (data: {
    question: string;
    category: Exclude<MarketCategory, 'All'>;
    imageUri: string;
    sourceHandle: string;
    initialSideIsYes: boolean;
    initialBuyEth: number;
    marketType: MarketType;
    closingTime?: number;
    resolutionDeadline?: number;
    yesCondition?: string;
    noCondition?: string;
    evidenceSource?: string;
  }) => Promise<void>;
}

const PRESET_CATEGORIES: Exclude<MarketCategory, 'All'>[] = [
  'Crypto',
  'AI',
  'DeFi',
  'Culture',
  'Politics',
  'Sports',
  'Robinhood',
  'Other',
];

const PRESET_COVERS = [
  {
    label: 'Robinhood Chain',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'AI & Robots',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Crypto Bull',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Global Macro',
    url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=80',
  },
];

// Helper to format ISO string to local input format YYYY-MM-DDTHH:mm
function getIsoDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onCreateMarket,
  walletAddress,
  onRequireWallet,
}) => {
  // Market Type: Perpetual Opinion vs Resolvable Prediction
  const [marketType, setMarketType] = useState<MarketType>('PERPETUAL_OPINION');

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<Exclude<MarketCategory, 'All'>>('Robinhood');
  const [sourceHandle, setSourceHandle] = useState('@TheTiredFun');
  const [imageUri, setImageUri] = useState(PRESET_COVERS[0].url);
  const [initialSideIsYes, setInitialSideIsYes] = useState(true);
  const [initialBuyEth, setInitialBuyEth] = useState('0.001');

  // Prediction market specific governance states
  const now = new Date();
  const defaultClose = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const defaultResolve = new Date(defaultClose.getTime() + 24 * 60 * 60 * 1000); // +24 hours

  const [closingDateTimeStr, setClosingDateTimeStr] = useState<string>(
    getIsoDateTimeLocal(defaultClose)
  );
  const [resolutionDeadlineStr, setResolutionDeadlineStr] = useState<string>(
    getIsoDateTimeLocal(defaultResolve)
  );
  const [yesCondition, setYesCondition] = useState('');
  const [noCondition, setNoCondition] = useState('');
  const [evidenceSource, setEvidenceSource] = useState('https://defillama.com');

  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!walletAddress) {
      if (onRequireWallet) {
        onRequireWallet(
          marketType === 'RESOLVABLE_PREDICTION'
            ? 'Spawning a Prediction Market'
            : 'Spawning an Opinion Market'
        );
      }
      return;
    }

    if (!question.trim()) {
      setFormError('Please enter a clear market debate question.');
      return;
    }

    let closingTimeSec: number | undefined = undefined;
    let resolutionDeadlineSec: number | undefined = undefined;

    if (marketType === 'RESOLVABLE_PREDICTION') {
      const closeDate = new Date(closingDateTimeStr);
      const resolveDate = new Date(resolutionDeadlineStr);
      const nowSec = Math.floor(Date.now() / 1000);

      closingTimeSec = Math.floor(closeDate.getTime() / 1000);
      resolutionDeadlineSec = Math.floor(resolveDate.getTime() / 1000);

      if (isNaN(closingTimeSec) || isNaN(resolutionDeadlineSec)) {
        setFormError('Please select valid closing and resolution dates.');
        return;
      }

      // Min 24 hours governance rule
      if (closingTimeSec < nowSec + 86400 - 60) {
        setFormError('Trading closing time must be at least 24 hours into the future.');
        return;
      }

      // Max 90 days governance rule
      if (closingTimeSec > nowSec + 90 * 86400) {
        setFormError('Trading closing time cannot exceed 90 days from creation.');
        return;
      }

      // Resolution deadline must be >= closing time
      if (resolutionDeadlineSec < closingTimeSec) {
        setFormError('Resolution deadline must be on or after the trading closing date.');
        return;
      }

      if (!yesCondition.trim()) {
        setFormError('Please specify an objective YES condition for verification.');
        return;
      }

      if (!noCondition.trim()) {
        setFormError('Please specify an objective NO condition for verification.');
        return;
      }

      if (!evidenceSource.trim()) {
        setFormError('Please provide an approved evidence source URL or publication.');
        return;
      }
    }

    setIsCreating(true);
    try {
      await onCreateMarket({
        question: question.trim(),
        category,
        imageUri: imageUri.trim() || PRESET_COVERS[0].url,
        sourceHandle: sourceHandle.trim() || '@TheTiredFun',
        initialSideIsYes,
        initialBuyEth: parseFloat(initialBuyEth) || 0,
        marketType,
        closingTime: closingTimeSec,
        resolutionDeadline: resolutionDeadlineSec,
        yesCondition: yesCondition.trim(),
        noCondition: noCondition.trim(),
        evidenceSource: evidenceSource.trim(),
      });
      setQuestion('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Market creation failed';
      setFormError(msg.slice(0, 120));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-2 sm:my-8 w-full max-w-xl overflow-hidden rounded-[24px] sm:rounded-[28px] border border-[#232330] bg-[#121218] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232330] bg-[#161620] px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl text-white shadow-md transition-colors ${
                marketType === 'RESOLVABLE_PREDICTION'
                  ? 'bg-[#FF6B00] shadow-[#FF6B00]/30'
                  : 'bg-[#227c9d] shadow-[#227c9d]/30'
              }`}
            >
              {marketType === 'RESOLVABLE_PREDICTION' ? (
                <Target className="h-4 w-4 sm:h-5 sm:w-5 fill-white/20 text-white" />
              ) : (
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
              )}
            </div>
            <div>
              <h2 className="font-fun text-base sm:text-lg font-black text-white">
                {marketType === 'RESOLVABLE_PREDICTION'
                  ? 'Spawn Prediction Market'
                  : 'Spawn Opinion Market'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#8c8c9e] line-clamp-1">
                {marketType === 'RESOLVABLE_PREDICTION'
                  ? 'Closing date & Pari-Mutuel settlement rewards'
                  : 'Earn 1.00% ETH fees on continuous conviction'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-[#232330] bg-[#1a1a24] p-1.5 sm:p-2 text-[#8c8c9e] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* Phase 2: Market Type Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Market Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setMarketType('PERPETUAL_OPINION')}
                className={`flex flex-col items-start rounded-2xl border p-3 sm:p-3.5 text-left transition ${
                  marketType === 'PERPETUAL_OPINION'
                    ? 'border-[#227c9d] bg-[#227c9d]/15 shadow-md shadow-[#227c9d]/10'
                    : 'border-[#232330] bg-[#0c0c11] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-fun text-xs sm:text-sm font-black text-white">
                  <Flame className="h-4 w-4 text-[#53b3d4]" />
                  <span>Perpetual Opinion</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8c8c9e]">
                  Continuous 24/7 conviction trading. No expiry, no settlement.
                </p>
                <span className="mt-2 rounded-full bg-[#227c9d]/20 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-[#53b3d4]">
                  Type 0 • Endless Curves
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMarketType('RESOLVABLE_PREDICTION')}
                className={`flex flex-col items-start rounded-2xl border p-3 sm:p-3.5 text-left transition ${
                  marketType === 'RESOLVABLE_PREDICTION'
                    ? 'border-[#FF6B00] bg-[#FF6B00]/15 shadow-md shadow-[#FF6B00]/10'
                    : 'border-[#232330] bg-[#0c0c11] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-fun text-xs sm:text-sm font-black text-white">
                  <Target className="h-4 w-4 text-[#FF6B00]" />
                  <span>Resolvable Prediction</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8c8c9e]">
                  Fixed closing date, outcome resolution & Pari-Mutuel payouts.
                </p>
                <span className="mt-2 rounded-full bg-[#FF6B00]/20 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-[#FF8A33]">
                  Type 1 • Settlement Pool
                </span>
              </button>
            </div>
          </div>

          {/* Market Question */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
              {marketType === 'RESOLVABLE_PREDICTION'
                ? 'Prediction Resolution Question'
                : 'Debate Question'}
            </label>
            <textarea
              rows={2}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                marketType === 'RESOLVABLE_PREDICTION'
                  ? 'e.g., Will Robinhood Chain mainnet TVL surpass $500M before November 2026?'
                  : 'e.g., Will Robinhood Chain become the top consumer L2 this cycle?'
              }
              className="w-full rounded-2xl border border-[#232330] bg-[#0c0c11] px-4 py-3 text-sm font-semibold text-white placeholder-[#7a7a8c] focus:border-[#227c9d] focus:outline-none transition"
            />
          </div>

          {/* Category + Source Handle */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<MarketCategory, 'All'>)}
                className="w-full rounded-2xl border border-[#232330] bg-[#0c0c11] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#227c9d] focus:outline-none transition"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#121218]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                X / Source Handle
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7a7a8c]" />
                <input
                  type="text"
                  value={sourceHandle}
                  onChange={(e) => setSourceHandle(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-2xl border border-[#232330] bg-[#0c0c11] pl-9 pr-3 py-2.5 font-mono text-xs text-white focus:border-[#227c9d] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* PHASE 3: Prediction Market Date & Resolution Governance Fields */}
          {marketType === 'RESOLVABLE_PREDICTION' && (
            <div className="space-y-4 rounded-2xl border border-[#FF6B00]/30 bg-[#FF6B00]/5 p-4">
              <div className="flex items-center gap-2 border-b border-[#FF6B00]/20 pb-2">
                <Target className="h-4 w-4 text-[#FF6B00]" />
                <span className="font-fun text-xs font-bold uppercase tracking-wider text-orange-200">
                  Prediction Date & Criteria Governance
                </span>
              </div>

              {/* Trading Closing Date & Resolution Deadline */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-[#FF6B00]" />
                    <span>Trading Closes (UTC)</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={closingDateTimeStr}
                    onChange={(e) => setClosingDateTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-3 py-2 font-mono text-xs text-white focus:border-[#FF6B00] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#8c8c9e]">
                    Trading automatically stops at this exact timestamp (Min: 24h, Max: 90d).
                  </p>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-[#53b3d4]" />
                    <span>Resolution Deadline (UTC)</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={resolutionDeadlineStr}
                    onChange={(e) => setResolutionDeadlineStr(e.target.value)}
                    className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-3 py-2 font-mono text-xs text-white focus:border-[#227c9d] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#8c8c9e]">
                    Expected date by which outcome evidence will be proposed.
                  </p>
                </div>
              </div>

              {/* Objective YES Condition */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">
                  Objective YES Criteria
                </label>
                <input
                  type="text"
                  required
                  value={yesCondition}
                  onChange={(e) => setYesCondition(e.target.value)}
                  placeholder="e.g., DefiLlama TVL report >= $500,000,000 USD before close."
                  className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-3 py-2 text-xs text-white placeholder-[#7a7a8c] focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* Objective NO Condition */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">
                  Objective NO Criteria
                </label>
                <input
                  type="text"
                  required
                  value={noCondition}
                  onChange={(e) => setNoCondition(e.target.value)}
                  placeholder="e.g., DefiLlama TVL remains strictly below $500M at closing time."
                  className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-3 py-2 text-xs text-white placeholder-[#FF6B00] focus:outline-none"
                />
              </div>

              {/* Approved Evidence Source */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <LinkIcon className="h-3.5 w-3.5 text-[#53b3d4]" />
                  <span>Approved Evidence Source URL</span>
                </label>
                <input
                  type="url"
                  required
                  value={evidenceSource}
                  onChange={(e) => setEvidenceSource(e.target.value)}
                  placeholder="https://defillama.com/chain/Robinhood or official source"
                  className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-3 py-2 font-mono text-xs text-white focus:border-[#227c9d] focus:outline-none"
                />
              </div>

              {/* Anti-manipulation Notice */}
              <div className="flex items-start gap-2 rounded-xl bg-orange-950/40 p-2.5 text-[11px] text-orange-200 border border-orange-500/20">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#FF6B00] mt-0.5" />
                <span>
                  <strong>Anti-Manipulation Rule:</strong> As market creator, you can never resolve or finalize your own market. An authorized resolver proposes with verifiable evidence, subject to a 24-hour dispute window.
                </span>
              </div>
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span>Thumbnail URL</span>
              <span className="font-mono text-[10px] text-[#8c8c9e]">Or choose preset</span>
            </label>
            <div className="relative mb-2">
              <ImageIcon className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7a7a8c]" />
              <input
                type="url"
                value={imageUri}
                onChange={(e) => setImageUri(e.target.value)}
                className="w-full rounded-2xl border border-[#232330] bg-[#0c0c11] pl-9 pr-3 py-2 font-mono text-xs text-white focus:border-[#227c9d] focus:outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COVERS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUri(preset.url)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                    imageUri === preset.url
                      ? 'border-[#227c9d] bg-[#227c9d]/20 text-[#53b3d4]'
                      : 'border-[#232330] bg-[#0c0c11] text-[#8c8c9e] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Seed Position */}
          <div className="rounded-2xl border border-[#232330] bg-[#161620] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Initial Seed Position (Early-Bird Entry)
              </span>
              <span className="font-mono text-[11px] text-[#53b3d4]">Optional</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => setInitialSideIsYes(true)}
                className={`rounded-xl border py-2.5 text-xs font-black transition ${
                  initialSideIsYes
                    ? 'border-[#227c9d] bg-[#227c9d] text-white shadow-sm'
                    : 'border-[#232330] bg-[#0c0c11] text-[#8c8c9e]'
                }`}
              >
                SEED YES
              </button>
              <button
                type="button"
                onClick={() => setInitialSideIsYes(false)}
                className={`rounded-xl border py-2.5 text-xs font-black transition ${
                  !initialSideIsYes
                    ? 'border-[#FF6B00] bg-[#FF6B00] text-black shadow-sm'
                    : 'border-[#232330] bg-[#0c0c11] text-[#8c8c9e]'
                }`}
              >
                SEED NO
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={initialBuyEth}
                onChange={(e) => setInitialBuyEth(e.target.value)}
                className="w-full rounded-xl border border-[#232330] bg-[#0c0c11] px-4 py-2 font-mono text-sm font-bold text-white focus:border-[#227c9d] focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#8c8c9e]">
                ETH
              </span>
            </div>
          </div>

          {/* Creator Reward Note */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 p-3 text-xs text-orange-300">
            <Coins className="h-4 w-4 shrink-0 text-[#FF6B00]" />
            <span>
              You earn <strong>1.00% ETH</strong> on every buy/sell trade across both curves.
              Settlement payouts have 0% fee so winner payouts are 100% backed.
            </span>
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-fun text-base font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 disabled:opacity-50 ${
              marketType === 'RESOLVABLE_PREDICTION'
                ? 'bg-[#FF6B00] hover:bg-[#EA580C] text-black'
                : 'bg-[#227c9d] hover:bg-[#1a647f]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {!walletAddress
                ? 'Connect Wallet to Launch'
                : isCreating
                ? 'Broadcasting to Robinhood Chain...'
                : marketType === 'RESOLVABLE_PREDICTION'
                ? 'Launch Prediction Market'
                : 'Launch Opinion Market'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
