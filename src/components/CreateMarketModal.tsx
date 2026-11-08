import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Coins,
  Image as ImageIcon,
  AtSign,
  ShieldCheck,
} from 'lucide-react';
import { MarketCategory } from '../lib/bondingCurve';
import { pinMarketMetadataToIpfs } from '../lib/ipfsService';

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

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onCreateMarket,
  walletAddress,
  onRequireWallet,
}) => {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<Exclude<MarketCategory, 'All'>>('Robinhood');
  const [sourceHandle, setSourceHandle] = useState('@TheTiredFun');
  const [imageUri, setImageUri] = useState(PRESET_COVERS[0].url);
  const [initialSideIsYes, setInitialSideIsYes] = useState(true);
  const [initialBuyEth, setInitialBuyEth] = useState('0.001');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      if (onRequireWallet) {
        onRequireWallet('Spawning an Opinion Market');
      }
      return;
    }
    if (!question.trim()) return;
    setIsCreating(true);
    try {
      await onCreateMarket({
        question: question.trim(),
        category,
        imageUri: imageUri.trim() || PRESET_COVERS[0].url,
        sourceHandle: sourceHandle.trim() || '@TheTiredFun',
        initialSideIsYes,
        initialBuyEth: parseFloat(initialBuyEth) || 0,
      });
      setQuestion('');
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-[#232330] bg-[#121218] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232330] bg-[#161620] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#227c9d] text-white">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h2 className="font-fun text-lg font-black text-white">
                Spawn Opinion Market
              </h2>
              <p className="text-xs text-[#8c8c9e]">
                Earn 1.00% ETH fees on all volume forever on Robinhood Chain
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-[#232330] bg-[#1a1a24] p-2 text-[#8c8c9e] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Opinion Question */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Debate Question
            </label>
            <textarea
              rows={2}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will Robinhood Chain become the top consumer L2 this cycle?"
              className="w-full rounded-2xl border border-[#232330] bg-[#0c0c11] px-4 py-3 text-sm font-semibold text-white placeholder-[#7a7a8c] focus:border-[#227c9d] focus:outline-none transition"
            />
          </div>

          {/* Category + Source */}
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
              You earn <strong>1.00% ETH</strong> on every trade across both curves for the
              lifetime of this market.
            </span>
          </div>

          {/* Anti-Manipulation Creator Seed Lock Note */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#227c9d]/30 bg-[#227c9d]/10 p-3 text-xs text-[#53b3d4]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#227c9d]" />
            <span>
              <strong>30-Min Anti-Rug Lock:</strong> Initial creator seed positions are locked in <code className="font-mono text-white">Tired.FunMarkets.sol</code> for 30 minutes to prevent frontrunning.
            </span>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#227c9d] py-3.5 font-fun text-base font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#1a647f] active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {!walletAddress ? 'Connect Wallet to Launch' : isCreating ? 'Launching on Robinhood Chain...' : 'Launch Opinion Market'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
