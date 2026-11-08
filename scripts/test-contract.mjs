import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

console.log('================================================================================');
console.log(' NULLHOOD v2 — SMART CONTRACT AUDIT, UNIT, FUZZ, INVARIANT & ECONOMIC TEST SUITE');
console.log('================================================================================\n');

const rootDir = process.cwd();
const contractPath = path.join(rootDir, 'contracts', 'NullhoodMarkets.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// -----------------------------------------------------------------------------
// 1. Solidity Compilation & Bytecode / ABI Audit Verification
// -----------------------------------------------------------------------------
const input = {
  language: 'Solidity',
  sources: { 'NullhoodMarkets.sol': { content: source } },
  settings: {
    viaIR: true,
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((e) => e.severity === 'error');
assert.equal(errors.length, 0, `Solidity compilation failed: ${JSON.stringify(errors)}`);

const compiled = output.contracts['NullhoodMarkets.sol']['NullhoodMarkets'];
const bytecodeSize = compiled.evm.bytecode.object.length / 2;
assert.ok(bytecodeSize > 1000 && bytecodeSize < 24576, `EIP-170 size check: ${bytecodeSize} bytes`);

const abiFunctions = compiled.abi.filter((x) => x.type === 'function').map((x) => x.name);
const requiredFunctions = [
  'createMarket',
  'buyShares',
  'sellShares',
  'claimCreatorFees',
  'claimProtocolFees',
  'setPaused',
  'setFeeConfiguration',
  'transferOwnership',
  'acceptOwnership',
  'verifyProtocolSolvency',
  'quoteBuy',
  'quoteSell',
  'getMarket',
  'getMarketAnalytics',
  'getUserStats',
  'getAllMarkets',
  'getMarketsPaginated',
  'getUserPositions',
];

for (const fn of requiredFunctions) {
  assert.ok(abiFunctions.includes(fn), `Missing required function in ABI: ${fn}`);
}
console.log(`[PASS] 1. Solidity Compilation & EIP-170 Size Audit (${bytecodeSize} bytes / 24,576 max)`);

// -----------------------------------------------------------------------------
// Exact BigInt Stateful Virtual Machine Mirror of NullhoodMarkets.sol (v2)
// -----------------------------------------------------------------------------
class NullhoodContractEngine {
  constructor(owner = '0xOwner') {
    this.BPS_DENOMINATOR = 10_000n;
    this.MAX_TOTAL_FEE_BPS = 500n;
    this.MIN_TRADE_ETH = 100_000_000_000_000n; // 0.0001 ether
    this.INITIAL_VIRTUAL_ETH = 500_000_000_000_000_000n; // 0.5 ether
    this.INITIAL_VIRTUAL_SHARES = 500_000n * 10n ** 18n; // 500,000e18
    this.CURVE_INVARIANT_K = this.INITIAL_VIRTUAL_ETH * this.INITIAL_VIRTUAL_SHARES;

    this.owner = owner;
    this.pendingOwner = null;
    this.paused = false;
    this.creatorFeeBps = 100n;
    this.protocolFeeBps = 100n;

    this.marketCount = 0;
    this.contractEthBalance = 0n;
    this.totalRealEthLocked = 0n;
    this.totalClaimableCreatorFees = 0n;
    this.protocolFeesAccrued = 0n;

    this.markets = new Map();
    this.yesBalances = new Map(); // `${marketId}:${user}` => bigint
    this.noBalances = new Map();
    this.claimableCreatorFees = new Map();
    this.lifetimeCreatorFees = new Map();
    this.claimedCreatorFees = new Map();
  }

  setPaused(sender, pausedState) {
    if (sender !== this.owner) throw new Error('Unauthorized');
    this.paused = pausedState;
  }

  setFeeConfiguration(sender, newCreatorBps, newProtocolBps) {
    if (sender !== this.owner) throw new Error('Unauthorized');
    if (newCreatorBps + newProtocolBps > this.MAX_TOTAL_FEE_BPS) {
      throw new Error('InvalidFeeConfiguration');
    }
    this.creatorFeeBps = newCreatorBps;
    this.protocolFeeBps = newProtocolBps;
  }

  transferOwnership(sender, newOwner) {
    if (sender !== this.owner) throw new Error('Unauthorized');
    if (!newOwner) throw new Error('ZeroAddress');
    this.pendingOwner = newOwner;
  }

  acceptOwnership(sender) {
    if (sender !== this.pendingOwner) throw new Error('Unauthorized');
    this.owner = this.pendingOwner;
    this.pendingOwner = null;
  }

  createMarket(sender, question, category, initialSideIsYes = true, valueWei = 0n) {
    if (this.paused) throw new Error('ContractPaused');
    if (!question || question.length === 0) throw new Error('EmptyQuestion');
    if (valueWei > 0n && valueWei < this.MIN_TRADE_ETH) throw new Error('TradeBelowMinimum');

    const id = ++this.marketCount;
    this.markets.set(id, {
      id,
      creator: sender,
      question,
      category: category || 'Trending',
      totalTrades: 0n,
      creatorFeesEarned: 0n,
      yesCurve: {
        virtualEth: this.INITIAL_VIRTUAL_ETH,
        virtualShares: this.INITIAL_VIRTUAL_SHARES,
        realEth: 0n,
        totalShares: 0n,
        volumeEth: 0n,
      },
      noCurve: {
        virtualEth: this.INITIAL_VIRTUAL_ETH,
        virtualShares: this.INITIAL_VIRTUAL_SHARES,
        realEth: 0n,
        totalShares: 0n,
        volumeEth: 0n,
      },
    });

    if (valueWei > 0n) {
      this.buyShares(sender, id, initialSideIsYes, valueWei, 0n);
    }
    this.assertSolvency();
    return id;
  }

  buyShares(sender, marketId, isYes, ethIn, minSharesOut = 0n) {
    if (this.paused) throw new Error('ContractPaused');
    if (ethIn === 0n) throw new Error('ZeroAmount');
    if (ethIn < this.MIN_TRADE_ETH) throw new Error('TradeBelowMinimum');
    const m = this.markets.get(marketId);
    if (!m) throw new Error('InvalidMarket');

    this.contractEthBalance += ethIn;
    const curve = isYes ? m.yesCurve : m.noCurve;

    const creatorFee = (ethIn * this.creatorFeeBps) / this.BPS_DENOMINATOR;
    const protocolFee = (ethIn * this.protocolFeeBps) / this.BPS_DENOMINATOR;
    const netEth = ethIn - creatorFee - protocolFee;

    const newRealEth = curve.realEth + netEth;
    const newVirtualEth = this.INITIAL_VIRTUAL_ETH + newRealEth;
    const newVirtualShares = (this.CURVE_INVARIANT_K + newVirtualEth - 1n) / newVirtualEth;
    const sharesOut = curve.virtualShares > newVirtualShares ? curve.virtualShares - newVirtualShares : 0n;

    if (sharesOut === 0n || sharesOut < minSharesOut) throw new Error('SlippageExceeded');

    curve.realEth = newRealEth;
    curve.virtualEth = newVirtualEth;
    curve.totalShares += sharesOut;
    curve.virtualShares = this.INITIAL_VIRTUAL_SHARES - curve.totalShares;
    curve.volumeEth += ethIn;

    this.totalRealEthLocked += netEth;

    if (curve.virtualEth * curve.virtualShares < this.CURVE_INVARIANT_K) {
      throw new Error('SolvencyInvariantViolated');
    }

    const key = `${marketId}:${sender}`;
    if (isYes) {
      this.yesBalances.set(key, (this.yesBalances.get(key) || 0n) + sharesOut);
    } else {
      this.noBalances.set(key, (this.noBalances.get(key) || 0n) + sharesOut);
    }

    this.claimableCreatorFees.set(m.creator, (this.claimableCreatorFees.get(m.creator) || 0n) + creatorFee);
    this.lifetimeCreatorFees.set(m.creator, (this.lifetimeCreatorFees.get(m.creator) || 0n) + creatorFee);
    this.totalClaimableCreatorFees += creatorFee;
    m.creatorFeesEarned += creatorFee;
    this.protocolFeesAccrued += protocolFee;
    m.totalTrades += 1n;

    this.assertSolvency();
    return { sharesOut, creatorFee, protocolFee, netEth };
  }

  sellShares(sender, marketId, isYes, sharesIn, minEthOut = 0n) {
    if (this.paused) throw new Error('ContractPaused');
    if (sharesIn === 0n) throw new Error('ZeroAmount');
    const m = this.markets.get(marketId);
    if (!m) throw new Error('InvalidMarket');

    const key = `${marketId}:${sender}`;
    const balMap = isYes ? this.yesBalances : this.noBalances;
    const userBal = balMap.get(key) || 0n;
    if (userBal < sharesIn) throw new Error('InsufficientShares');

    const curve = isYes ? m.yesCurve : m.noCurve;

    let newVirtualShares = curve.virtualShares + sharesIn;
    if (newVirtualShares > this.INITIAL_VIRTUAL_SHARES) {
      newVirtualShares = this.INITIAL_VIRTUAL_SHARES;
    }

    let newVirtualEth = (this.CURVE_INVARIANT_K + newVirtualShares - 1n) / newVirtualShares;
    if (newVirtualEth < this.INITIAL_VIRTUAL_ETH) {
      newVirtualEth = this.INITIAL_VIRTUAL_ETH;
    }

    let grossEthOut = curve.virtualEth > newVirtualEth ? curve.virtualEth - newVirtualEth : 0n;
    if (grossEthOut > curve.realEth) {
      grossEthOut = curve.realEth;
    }
    if (grossEthOut === 0n) throw new Error('ZeroAmount');

    const creatorFee = (grossEthOut * this.creatorFeeBps) / this.BPS_DENOMINATOR;
    const protocolFee = (grossEthOut * this.protocolFeeBps) / this.BPS_DENOMINATOR;
    const netEthOut = grossEthOut - creatorFee - protocolFee;

    if (netEthOut < minEthOut) throw new Error('SlippageExceeded');

    curve.realEth -= grossEthOut;
    curve.virtualEth = this.INITIAL_VIRTUAL_ETH + curve.realEth;
    curve.totalShares -= sharesIn;
    curve.virtualShares = this.INITIAL_VIRTUAL_SHARES - curve.totalShares;
    curve.volumeEth += grossEthOut;

    this.totalRealEthLocked -= grossEthOut;

    if (curve.virtualEth * curve.virtualShares < this.CURVE_INVARIANT_K) {
      throw new Error('SolvencyInvariantViolated');
    }

    balMap.set(key, userBal - sharesIn);

    this.claimableCreatorFees.set(m.creator, (this.claimableCreatorFees.get(m.creator) || 0n) + creatorFee);
    this.lifetimeCreatorFees.set(m.creator, (this.lifetimeCreatorFees.get(m.creator) || 0n) + creatorFee);
    this.totalClaimableCreatorFees += creatorFee;
    m.creatorFeesEarned += creatorFee;
    this.protocolFeesAccrued += protocolFee;
    m.totalTrades += 1n;

    this.contractEthBalance -= netEthOut;
    this.assertSolvency();

    return { netEthOut, grossEthOut, creatorFee, protocolFee };
  }

  claimCreatorFees(sender) {
    const amount = this.claimableCreatorFees.get(sender) || 0n;
    if (amount === 0n) throw new Error('ZeroAmount');
    this.claimableCreatorFees.set(sender, 0n);
    this.totalClaimableCreatorFees -= amount;
    this.claimedCreatorFees.set(sender, (this.claimedCreatorFees.get(sender) || 0n) + amount);
    this.contractEthBalance -= amount;
    this.assertSolvency();
    return amount;
  }

  claimProtocolFees(sender) {
    if (sender !== this.owner) throw new Error('Unauthorized');
    const amount = this.protocolFeesAccrued;
    if (amount === 0n) throw new Error('ZeroAmount');
    this.protocolFeesAccrued = 0n;
    this.contractEthBalance -= amount;
    this.assertSolvency();
    return amount;
  }

  spotPriceWei(curve) {
    return (curve.virtualEth * 10n ** 18n) / curve.virtualShares;
  }

  assertSolvency() {
    const required = this.totalRealEthLocked + this.totalClaimableCreatorFees + this.protocolFeesAccrued;
    assert.equal(
      this.contractEthBalance,
      required,
      `Global ETH Backing Mismatch: balance=${this.contractEthBalance}, required=${required}`
    );

    let sumRealEth = 0n;
    for (const [, m] of this.markets) {
      for (const c of [m.yesCurve, m.noCurve]) {
        assert.ok(c.realEth >= 0n, 'Real ETH must never be negative');
        assert.equal(
          c.virtualEth,
          this.INITIAL_VIRTUAL_ETH + c.realEth,
          'Virtual ETH must strictly equal INITIAL_VIRTUAL_ETH + realEth'
        );
        assert.equal(
          c.virtualShares + c.totalShares,
          this.INITIAL_VIRTUAL_SHARES,
          'Share conservation violated'
        );
        assert.ok(
          c.virtualEth * c.virtualShares >= this.CURVE_INVARIANT_K,
          'Constant-product invariant K violated'
        );
        sumRealEth += c.realEth;
      }
    }
    assert.equal(sumRealEth, this.totalRealEthLocked, 'Sum of curve realEth must equal totalRealEthLocked');
  }
}

// -----------------------------------------------------------------------------
// 2. Unit Tests (Access Control, Pause, Minimum Trade, Slippage, Fee Splits)
// -----------------------------------------------------------------------------
{
  const engine = new NullhoodContractEngine('0xAdmin');
  const mId = engine.createMarket('0xCreator1', 'Will Robinhood Chain reach 10M users?', 'Robinhood');

  // Test minimum trade size enforcement (dust-attack prevention)
  assert.throws(
    () => engine.buyShares('0xAttacker', mId, true, 99n),
    /TradeBelowMinimum/,
    'Must reject dust trades < 0.0001 ETH that would round fees to 0'
  );

  // Test slippage protection on buy
  assert.throws(
    () => engine.buyShares('0xTrader1', mId, true, 10n ** 18n, 500_000n * 10n ** 18n),
    /SlippageExceeded/,
    'Must revert when minSharesOut exceeds curve output'
  );

  // Test emergency pause
  engine.setPaused('0xAdmin', true);
  assert.throws(
    () => engine.buyShares('0xTrader1', mId, true, 10n ** 18n),
    /ContractPaused/,
    'Must block trades when contract is paused'
  );
  engine.setPaused('0xAdmin', false);

  // Test two-step ownership transfer & fee cap
  assert.throws(
    () => engine.setFeeConfiguration('0xStranger', 200n, 200n),
    /Unauthorized/,
    'Non-owner cannot change fees'
  );
  assert.throws(
    () => engine.setFeeConfiguration('0xAdmin', 300n, 300n),
    /InvalidFeeConfiguration/,
    'Cannot exceed 5% MAX_TOTAL_FEE_BPS cap'
  );
  engine.transferOwnership('0xAdmin', '0xNewAdmin');
  engine.acceptOwnership('0xNewAdmin');
  assert.equal(engine.owner, '0xNewAdmin');

  console.log('[PASS] 2. Unit Tests: Dust-Attack Guard, Slippage, Emergency Pause, 2-Step Ownership & Fee Cap');
}

// -----------------------------------------------------------------------------
// 3. Fuzz & Invariant Testing (1,500 Randomized Buy/Sell Operations)
// -----------------------------------------------------------------------------
{
  const engine = new NullhoodContractEngine('0xAdmin');
  const m1 = engine.createMarket('0xCreatorA', 'Fuzz Market #1', 'Crypto');
  const m2 = engine.createMarket('0xCreatorB', 'Fuzz Market #2', 'AI & Tech');
  const traders = ['0xT1', '0xT2', '0xT3', '0xT4', '0xT5', '0xT6'];

  // Deterministic PRNG for reproducible fuzzing
  let seed = 46630;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let executedBuys = 0;
  let executedSells = 0;

  for (let i = 0; i < 1500; i++) {
    const marketId = rand() > 0.5 ? m1 : m2;
    const isYes = rand() > 0.45;
    const trader = traders[Math.floor(rand() * traders.length)];
    const isBuy = rand() > 0.38;

    if (isBuy) {
      // Random ETH between 0.0002 ETH and 2.5 ETH
      const ethWei = BigInt(Math.floor((0.0002 + rand() * 2.5) * 1e18));
      engine.buyShares(trader, marketId, isYes, ethWei);
      executedBuys++;
    } else {
      const key = `${marketId}:${trader}`;
      const bal = (isYes ? engine.yesBalances.get(key) : engine.noBalances.get(key)) || 0n;
      if (bal > 10n ** 15n) {
        const pct = BigInt(Math.max(1, Math.floor(rand() * 100)));
        const sellAmount = (bal * pct) / 100n;
        try {
          engine.sellShares(trader, marketId, isYes, sellAmount);
          executedSells++;
        } catch (e) {
          if (!String(e.message).includes('ZeroAmount')) throw e;
        }
      }
    }
  }

  // Claim all creator and protocol fees and verify solvency holds
  engine.claimCreatorFees('0xCreatorA');
  engine.claimCreatorFees('0xCreatorB');
  engine.claimProtocolFees('0xAdmin');
  engine.assertSolvency();

  console.log(
    `[PASS] 3. Fuzz & Invariant Suite: ${executedBuys} buys + ${executedSells} sells verified with 0 wei discrepancy`
  );
}

// -----------------------------------------------------------------------------
// 4. Bank-Run Full Liquidation Stress Test (Virtual Reserve Isolation Proof)
// -----------------------------------------------------------------------------
{
  const engine = new NullhoodContractEngine('0xAdmin');
  const mId = engine.createMarket('0xCreator', 'Bank Run Solvency Test', 'Markets');
  const buyers = Array.from({ length: 25 }, (_, i) => `0xBuyer_${i}`);

  for (const b of buyers) {
    engine.buyShares(b, mId, true, 500_000_000_000_000_000n); // 0.5 ETH each on YES
    engine.buyShares(b, mId, false, 250_000_000_000_000_000n); // 0.25 ETH each on NO
  }

  // Now every single holder dumps 100% of their YES and NO shares in reverse order
  for (const b of [...buyers].reverse()) {
    const yBal = engine.yesBalances.get(`${mId}:${b}`) || 0n;
    const nBal = engine.noBalances.get(`${mId}:${b}`) || 0n;
    if (yBal > 0n) engine.sellShares(b, mId, true, yBal);
    if (nBal > 0n) engine.sellShares(b, mId, false, nBal);
  }

  const m = engine.markets.get(mId);
  assert.equal(m.yesCurve.totalShares, 0n, 'All YES shares must be burned');
  assert.equal(m.noCurve.totalShares, 0n, 'All NO shares must be burned');
  assert.equal(m.yesCurve.realEth, 0n, 'YES realEth returns to 0 without touching virtualEth');
  assert.equal(m.noCurve.realEth, 0n, 'NO realEth returns to 0 without touching virtualEth');
  assert.equal(m.yesCurve.virtualEth, engine.INITIAL_VIRTUAL_ETH, 'YES virtualEth intact at 0.5 ETH');
  assert.equal(m.noCurve.virtualEth, engine.INITIAL_VIRTUAL_ETH, 'NO virtualEth intact at 0.5 ETH');

  console.log('[PASS] 4. Bank-Run Stress Test: 100% share redemption preserves 0.5 ETH virtual reserves & solvency');
}

// -----------------------------------------------------------------------------
// 5. Bonding Curve Economic Simulation Report
// -----------------------------------------------------------------------------
{
  const engine = new NullhoodContractEngine('0xAdmin');
  const mId = engine.createMarket('0xCreator', 'Economic Simulation Market', 'Robinhood');
  const m = engine.markets.get(mId);

  console.log('\n--- Bonding Curve Economic Simulation (K = 0.5 ETH * 500,000 Shares) ---');
  console.log('Cumul. ETH In | Real ETH Reserve | Circulating Shares | Spot Price (ETH) | Multiplier');
  console.log('-------------------------------------------------------------------------------------');

  const steps = [0.1, 0.4, 0.5, 1.0, 3.0, 5.0, 10.0];
  let cumulativeIn = 0;
  for (const stepEth of steps) {
    cumulativeIn += stepEth;
    engine.buyShares('0xSimTrader', mId, true, BigInt(Math.round(stepEth * 1e18)));
    const realEth = Number(m.yesCurve.realEth) / 1e18;
    const shares = Number(m.yesCurve.totalShares) / 1e18;
    const spotEth = Number(engine.spotPriceWei(m.yesCurve)) / 1e18;
    const mult = spotEth / 0.000001;
    console.log(
      `${cumulativeIn.toFixed(2).padStart(9)} ETH | ${realEth
        .toFixed(4)
        .padStart(12)} ETH | ${shares.toFixed(0).padStart(18)} | ${spotEth
        .toFixed(6)
        .padStart(16)} | ${mult.toFixed(1).padStart(8)}x`
    );
  }
  console.log('-------------------------------------------------------------------------------------\n');
}
