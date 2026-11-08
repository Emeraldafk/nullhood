// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NullhoodMarkets (v2 — Audited & Hardened)
 * @notice Perpetual Opinion & Sentiment Markets on Robinhood Chain (Chain ID 46630).
 *         - Markets never resolve via an external oracle; they measure real-time collective conviction.
 *         - YES and NO sides trade on independent continuous constant-product bonding curves.
 *         - Virtual reserves (0.5 ETH per side) bootstrap pricing and can NEVER be withdrawn as real ETH.
 *         - O(1) global solvency invariant enforced on every buy, sell, and fee withdrawal.
 *         - Configurable fee split between Market Creators and Protocol Treasury (capped at 5% total).
 *         - Emergency pause circuit breaker, two-step ownership transfer, and paginated views.
 */
contract NullhoodMarkets {
    // -------------------------------------------------------------------------
    // Constants & Curve Parameters
    // -------------------------------------------------------------------------
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant CREATOR_FEE_BPS = 100; // Default 1.00% creator fee
    uint256 public constant PROTOCOL_FEE_BPS = 100; // Default 1.00% protocol fee
    uint256 public constant TOTAL_FEE_BPS = 200; // Default 2.00% total fee
    uint256 public constant MAX_TOTAL_FEE_BPS = 500; // Hard cap: 5.00% maximum total fee

    // Minimum trade size prevents dust-splitting fee-evasion attacks (< 100 wei)
    uint256 public constant MIN_TRADE_ETH = 0.0001 ether; // 1e14 wei (100,000 gwei)
    uint256 public constant MAX_STRING_LENGTH = 512;
    uint256 public constant CREATOR_SEED_LOCK_PERIOD = 30 minutes; // Anti-manipulation: creator initial seed locked 30 mins

    // Each side (YES and NO) independently initializes with virtual reserves:
    // Virtual ETH = 0.5 ETH, Virtual Shares = 500,000 shares (1e18 decimals)
    // Initial spot price per share = 0.5 / 500,000 = 0.000001 ETH
    uint256 public constant INITIAL_VIRTUAL_ETH = 0.5 ether;
    uint256 public constant INITIAL_VIRTUAL_SHARES = 500_000 * 1e18;
    uint256 public constant CURVE_INVARIANT_K = INITIAL_VIRTUAL_ETH * INITIAL_VIRTUAL_SHARES;

    // -------------------------------------------------------------------------
    // Data Structures
    // -------------------------------------------------------------------------
    struct SideCurve {
        uint256 virtualEth;     // Virtual ETH reserve (strictly INITIAL_VIRTUAL_ETH + realEth)
        uint256 virtualShares;  // Virtual share pool (strictly INITIAL_VIRTUAL_SHARES - totalShares)
        uint256 realEth;        // Actual withdrawable ETH collateral locked in this side's curve
        uint256 totalShares;    // Circulating shares held by traders on this side
        uint256 volumeEth;      // Cumulative ETH volume traded on this side
    }

    struct Market {
        uint256 id;
        address creator;
        string question;
        string category;
        string imageUri;
        string sourceHandle;    // Optional X/social handle or context link
        uint256 createdAt;
        uint256 totalTrades;
        uint256 creatorFeesEarned;
        SideCurve yesCurve;
        SideCurve noCurve;
    }

    struct MarketAnalytics {
        uint256 yesBuyVolumeEth;
        uint256 yesSellVolumeEth;
        uint256 noBuyVolumeEth;
        uint256 noSellVolumeEth;
        uint256 yesTrades;
        uint256 noTrades;
        uint256 uniqueTraders;
        uint256 peakYesPriceWei;
        uint256 peakNoPriceWei;
        uint256 lastTradeAt;
    }

    struct MarketSummary {
        uint256 id;
        address creator;
        string question;
        string category;
        string imageUri;
        string sourceHandle;
        uint256 createdAt;
        uint256 totalTrades;
        uint256 creatorFeesEarned;
        uint256 yesRealEth;
        uint256 noRealEth;
        uint256 yesTotalShares;
        uint256 noTotalShares;
        uint256 yesVolumeEth;
        uint256 noVolumeEth;
        uint256 yesPriceWei;
        uint256 noPriceWei;
        uint256 yesSentimentBps; // 0 to 10000 (5000 = 50.00% YES)
    }

    struct UserPosition {
        uint256 marketId;
        uint256 yesShares;
        uint256 noShares;
        uint256 yesValueEth;
        uint256 noValueEth;
    }

    struct UserOnChainStats {
        uint256 marketsCreated;
        uint256 totalTrades;
        uint256 totalVolumeWei;
        uint256 uniqueMarketsTraded;
        uint256 creatorVolumeGeneratedWei;
        uint256 claimableCreatorFeesWei;
        uint256 lifetimeCreatorFeesWei;
        uint256 totalCreatorFeesClaimedWei;
        uint256 creatorClaimCount;
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------
    address public owner;
    address public pendingOwner;
    bool public paused;

    uint256 public creatorFeeBps = CREATOR_FEE_BPS;
    uint256 public protocolFeeBps = PROTOCOL_FEE_BPS;

    uint256 public marketCount;
    uint256 public totalRealEthLocked;
    uint256 public totalClaimableCreatorFees;
    uint256 public protocolFeesAccrued;

    mapping(uint256 => Market) internal _markets;
    mapping(uint256 => MarketAnalytics) internal _analytics;
    mapping(uint256 => mapping(address => bool)) public hasTradedMarket;

    // marketId => user => yesShares
    mapping(uint256 => mapping(address => uint256)) public yesBalances;
    // marketId => user => noShares
    mapping(uint256 => mapping(address => uint256)) public noBalances;

    // creator => claimable ETH fees
    mapping(address => uint256) public claimableCreatorFees;
    // creator => lifetime ETH fees earned
    mapping(address => uint256) public lifetimeCreatorFees;
    // creator => lifetime ETH fees claimed
    mapping(address => uint256) public claimedCreatorFees;
    // creator => number of fee claim transactions
    mapping(address => uint256) public creatorClaimCount;
    // marketId => creator seed liquidation lock expiration timestamp
    mapping(uint256 => uint256) public creatorSeedLockUntil;

    // On-chain reputation & participation counters
    mapping(address => uint256) public userMarketsCreated;
    mapping(address => uint256) public userTotalTrades;
    mapping(address => uint256) public userTotalVolumeWei;
    mapping(address => uint256) public userUniqueMarketsTraded;
    mapping(address => uint256) public creatorVolumeGeneratedWei;

    uint256 private _unlocked = 1;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        string category,
        string imageUri,
        string sourceHandle,
        uint256 timestamp
    );

    event OpinionTraded(
        uint256 indexed marketId,
        address indexed trader,
        bool isYes,
        bool isBuy,
        uint256 ethAmount,
        uint256 shareAmount,
        uint256 newYesPriceWei,
        uint256 newNoPriceWei,
        uint256 yesSentimentBps,
        uint256 timestamp
    );

    event CreatorFeesClaimed(address indexed creator, uint256 amount, uint256 claimIndex, uint256 timestamp);
    event ProtocolFeesClaimed(address indexed recipient, uint256 amount, uint256 timestamp);
    event FeeConfigurationUpdated(uint256 creatorFeeBps, uint256 protocolFeeBps);
    event PausedStateChanged(bool isPaused, address indexed triggeredBy);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // -------------------------------------------------------------------------
    // Modifiers & Errors
    // -------------------------------------------------------------------------
    error ReentrancyGuard();
    error ContractPaused();
    error InvalidMarket();
    error EmptyQuestion();
    error StringTooLong();
    error ZeroAmount();
    error TradeBelowMinimum(uint256 provided, uint256 minimum);
    error InsufficientShares();
    error CreatorSeedLocked(uint256 unlockTimestamp);
    error SlippageExceeded();
    error InvalidFeeConfiguration();
    error SolvencyInvariantViolated();
    error TransferFailed();
    error Unauthorized();
    error ZeroAddress();

    modifier nonReentrant() {
        if (_unlocked != 1) revert ReentrancyGuard();
        _unlocked = 2;
        _;
        _unlocked = 1;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier validMarket(uint256 marketId) {
        if (marketId == 0 || marketId > marketCount) revert InvalidMarket();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Governance & Security Controls
    // -------------------------------------------------------------------------

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused, msg.sender);
    }

    function setFeeConfiguration(uint256 _creatorFeeBps, uint256 _protocolFeeBps) external onlyOwner {
        if (_creatorFeeBps + _protocolFeeBps > MAX_TOTAL_FEE_BPS) {
            revert InvalidFeeConfiguration();
        }
        creatorFeeBps = _creatorFeeBps;
        protocolFeeBps = _protocolFeeBps;
        emit FeeConfigurationUpdated(_creatorFeeBps, _protocolFeeBps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(oldOwner, owner);
    }

    function totalFeeBps() public view returns (uint256) {
        return creatorFeeBps + protocolFeeBps;
    }

    // -------------------------------------------------------------------------
    // Market Creation
    // -------------------------------------------------------------------------

    /**
     * @notice Launch a new perpetual opinion market on Robinhood Chain.
     *         If msg.value > 0, automatically executes an initial seed buy on `initialSideIsYes`.
     */
    function createMarket(
        string calldata question,
        string calldata category,
        string calldata imageUri,
        string calldata sourceHandle,
        bool initialSideIsYes
    ) external payable nonReentrant whenNotPaused returns (uint256 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (
            bytes(question).length > MAX_STRING_LENGTH ||
            bytes(category).length > 64 ||
            bytes(imageUri).length > MAX_STRING_LENGTH ||
            bytes(sourceHandle).length > 128
        ) revert StringTooLong();

        if (msg.value > 0 && msg.value < MIN_TRADE_ETH) {
            revert TradeBelowMinimum(msg.value, MIN_TRADE_ETH);
        }

        marketId = ++marketCount;
        Market storage m = _markets[marketId];
        m.id = marketId;
        m.creator = msg.sender;
        m.question = question;
        m.category = bytes(category).length == 0 ? "Trending" : category;
        m.imageUri = imageUri;
        m.sourceHandle = sourceHandle;
        m.createdAt = block.timestamp;

        uint256 genesisPriceWei = (INITIAL_VIRTUAL_ETH * 1e18) / INITIAL_VIRTUAL_SHARES;

        m.yesCurve = SideCurve({
            virtualEth: INITIAL_VIRTUAL_ETH,
            virtualShares: INITIAL_VIRTUAL_SHARES,
            realEth: 0,
            totalShares: 0,
            volumeEth: 0
        });

        m.noCurve = SideCurve({
            virtualEth: INITIAL_VIRTUAL_ETH,
            virtualShares: INITIAL_VIRTUAL_SHARES,
            realEth: 0,
            totalShares: 0,
            volumeEth: 0
        });

        _analytics[marketId] = MarketAnalytics({
            yesBuyVolumeEth: 0,
            yesSellVolumeEth: 0,
            noBuyVolumeEth: 0,
            noSellVolumeEth: 0,
            yesTrades: 0,
            noTrades: 0,
            uniqueTraders: 0,
            peakYesPriceWei: genesisPriceWei,
            peakNoPriceWei: genesisPriceWei,
            lastTradeAt: block.timestamp
        });

        userMarketsCreated[msg.sender] += 1;

        emit MarketCreated(
            marketId,
            msg.sender,
            question,
            m.category,
            imageUri,
            sourceHandle,
            block.timestamp
        );

        if (msg.value > 0) {
            creatorSeedLockUntil[marketId] = block.timestamp + CREATOR_SEED_LOCK_PERIOD;
            _buy(marketId, msg.sender, initialSideIsYes, msg.value, 0);
        }

        _assertSolvency();
    }

    // -------------------------------------------------------------------------
    // Trading (Independent YES and NO Bonding Curves)
    // -------------------------------------------------------------------------

    /**
     * @notice Buy YES or NO shares on an opinion market's independent bonding curve.
     * @param marketId Market ID
     * @param isYes True to buy YES shares, false to buy NO shares
     * @param minSharesOut Minimum shares expected (slippage protection)
     */
    function buyShares(
        uint256 marketId,
        bool isYes,
        uint256 minSharesOut
    ) external payable nonReentrant whenNotPaused validMarket(marketId) returns (uint256 sharesOut) {
        if (msg.value == 0) revert ZeroAmount();
        if (msg.value < MIN_TRADE_ETH) revert TradeBelowMinimum(msg.value, MIN_TRADE_ETH);
        sharesOut = _buy(marketId, msg.sender, isYes, msg.value, minSharesOut);
        _assertSolvency();
    }

    /**
     * @notice Sell YES or NO shares back into that side's independent bonding curve for instant ETH liquidity.
     *         Virtual reserves (INITIAL_VIRTUAL_ETH) can NEVER be withdrawn; grossEthOut is strictly bounded by realEth.
     * @param marketId Market ID
     * @param isYes True to sell YES shares, false to sell NO shares
     * @param sharesIn Exact number of shares (18 decimals) to sell
     * @param minEthOut Minimum net ETH expected (slippage protection)
     */
    function sellShares(
        uint256 marketId,
        bool isYes,
        uint256 sharesIn,
        uint256 minEthOut
    ) external nonReentrant whenNotPaused validMarket(marketId) returns (uint256 netEthOut) {
        if (sharesIn == 0) revert ZeroAmount();

        Market storage m = _markets[marketId];
        if (msg.sender == m.creator && block.timestamp < creatorSeedLockUntil[marketId]) {
            revert CreatorSeedLocked(creatorSeedLockUntil[marketId]);
        }
        uint256 userBal = isYes ? yesBalances[marketId][msg.sender] : noBalances[marketId][msg.sender];
        if (userBal < sharesIn) revert InsufficientShares();

        SideCurve storage curve = isYes ? m.yesCurve : m.noCurve;

        uint256 grossEthOut;
        {
            // Calculate new virtual shares and required virtual ETH to preserve K
            uint256 newVirtualShares = curve.virtualShares + sharesIn;
            if (newVirtualShares > INITIAL_VIRTUAL_SHARES) {
                newVirtualShares = INITIAL_VIRTUAL_SHARES;
            }

            // Round up newVirtualEth to preserve invariant K in favor of protocol solvency
            uint256 newVirtualEth = (CURVE_INVARIANT_K + newVirtualShares - 1) / newVirtualShares;
            if (newVirtualEth < INITIAL_VIRTUAL_ETH) {
                newVirtualEth = INITIAL_VIRTUAL_ETH;
            }

            grossEthOut = curve.virtualEth > newVirtualEth ? curve.virtualEth - newVirtualEth : 0;
            // Strict virtual reserve isolation: never allow withdrawing more than realEth locked on this side
            if (grossEthOut > curve.realEth) {
                grossEthOut = curve.realEth;
            }
            if (grossEthOut == 0) revert ZeroAmount();
        }

        {
            // Deduct fees (creator + protocol)
            uint256 creatorFee = (grossEthOut * creatorFeeBps) / BPS_DENOMINATOR;
            uint256 protocolFee = (grossEthOut * protocolFeeBps) / BPS_DENOMINATOR;
            netEthOut = grossEthOut - creatorFee - protocolFee;

            if (netEthOut < minEthOut) revert SlippageExceeded();

            // Accrue fees
            claimableCreatorFees[m.creator] += creatorFee;
            lifetimeCreatorFees[m.creator] += creatorFee;
            totalClaimableCreatorFees += creatorFee;
            m.creatorFeesEarned += creatorFee;
            protocolFeesAccrued += protocolFee;
            m.totalTrades += 1;
        }

        // Update curve & global reserve state
        curve.realEth -= grossEthOut;
        curve.virtualEth = INITIAL_VIRTUAL_ETH + curve.realEth;
        curve.totalShares -= sharesIn;
        curve.virtualShares = INITIAL_VIRTUAL_SHARES - curve.totalShares;
        curve.volumeEth += grossEthOut;

        totalRealEthLocked -= grossEthOut;

        // Verify curve invariant holds
        if (curve.virtualEth * curve.virtualShares < CURVE_INVARIANT_K) {
            revert SolvencyInvariantViolated();
        }

        if (isYes) {
            yesBalances[marketId][msg.sender] = userBal - sharesIn;
        } else {
            noBalances[marketId][msg.sender] = userBal - sharesIn;
        }

        // Update analytics & reputation stats
        _recordTradeAnalytics(marketId, m.creator, msg.sender, isYes, false, grossEthOut);

        // Transfer net ETH to seller
        (bool ok, ) = msg.sender.call{value: netEthOut}("");
        if (!ok) revert TransferFailed();

        _assertSolvency();
        _emitOpinionTraded(marketId, msg.sender, isYes, false, grossEthOut, sharesIn);
    }

    function _buy(
        uint256 marketId,
        address buyer,
        bool isYes,
        uint256 ethIn,
        uint256 minSharesOut
    ) internal returns (uint256 sharesOut) {
        Market storage m = _markets[marketId];
        SideCurve storage curve = isYes ? m.yesCurve : m.noCurve;

        uint256 creatorFee = (ethIn * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 protocolFee = (ethIn * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 netEth = ethIn - creatorFee - protocolFee;

        uint256 newRealEth = curve.realEth + netEth;
        uint256 newVirtualEth = INITIAL_VIRTUAL_ETH + newRealEth;
        // Round up newVirtualShares to preserve invariant K
        uint256 newVirtualShares = (CURVE_INVARIANT_K + newVirtualEth - 1) / newVirtualEth;
        sharesOut = curve.virtualShares > newVirtualShares ? curve.virtualShares - newVirtualShares : 0;

        if (sharesOut == 0 || sharesOut < minSharesOut) revert SlippageExceeded();

        curve.realEth = newRealEth;
        curve.virtualEth = newVirtualEth;
        curve.totalShares += sharesOut;
        curve.virtualShares = INITIAL_VIRTUAL_SHARES - curve.totalShares;
        curve.volumeEth += ethIn;

        totalRealEthLocked += netEth;

        if (curve.virtualEth * curve.virtualShares < CURVE_INVARIANT_K) {
            revert SolvencyInvariantViolated();
        }

        if (isYes) {
            yesBalances[marketId][buyer] += sharesOut;
        } else {
            noBalances[marketId][buyer] += sharesOut;
        }

        claimableCreatorFees[m.creator] += creatorFee;
        lifetimeCreatorFees[m.creator] += creatorFee;
        totalClaimableCreatorFees += creatorFee;
        m.creatorFeesEarned += creatorFee;
        protocolFeesAccrued += protocolFee;
        m.totalTrades += 1;

        _recordTradeAnalytics(marketId, m.creator, buyer, isYes, true, ethIn);
        _emitOpinionTraded(marketId, buyer, isYes, true, ethIn, sharesOut);
    }

    function _emitOpinionTraded(
        uint256 marketId,
        address trader,
        bool isYes,
        bool isBuy,
        uint256 ethAmount,
        uint256 shareAmount
    ) internal {
        Market storage m = _markets[marketId];
        (uint256 yesPrice, uint256 noPrice, uint256 sentimentBps) = _getMarketMetrics(m);
        if (isBuy) {
            MarketAnalytics storage ma = _analytics[marketId];
            if (yesPrice > ma.peakYesPriceWei) ma.peakYesPriceWei = yesPrice;
            if (noPrice > ma.peakNoPriceWei) ma.peakNoPriceWei = noPrice;
        }
        emit OpinionTraded(
            marketId,
            trader,
            isYes,
            isBuy,
            ethAmount,
            shareAmount,
            yesPrice,
            noPrice,
            sentimentBps,
            block.timestamp
        );
    }

    function _recordTradeAnalytics(
        uint256 marketId,
        address creator,
        address trader,
        bool isYes,
        bool isBuy,
        uint256 volumeWei
    ) internal {
        MarketAnalytics storage ma = _analytics[marketId];
        if (!hasTradedMarket[marketId][trader]) {
            hasTradedMarket[marketId][trader] = true;
            ma.uniqueTraders += 1;
            userUniqueMarketsTraded[trader] += 1;
        }
        if (isYes) {
            ma.yesTrades += 1;
            if (isBuy) ma.yesBuyVolumeEth += volumeWei;
            else ma.yesSellVolumeEth += volumeWei;
        } else {
            ma.noTrades += 1;
            if (isBuy) ma.noBuyVolumeEth += volumeWei;
            else ma.noSellVolumeEth += volumeWei;
        }
        ma.lastTradeAt = block.timestamp;

        userTotalTrades[trader] += 1;
        userTotalVolumeWei[trader] += volumeWei;
        creatorVolumeGeneratedWei[creator] += volumeWei;
    }

    // -------------------------------------------------------------------------
    // Fee Claiming
    // -------------------------------------------------------------------------

    /**
     * @notice Withdraw accrued creator fees across all created opinion markets.
     */
    function claimCreatorFees() external nonReentrant returns (uint256 amount) {
        amount = claimableCreatorFees[msg.sender];
        if (amount == 0) revert ZeroAmount();

        claimableCreatorFees[msg.sender] = 0;
        totalClaimableCreatorFees -= amount;
        claimedCreatorFees[msg.sender] += amount;
        uint256 claimIdx = ++creatorClaimCount[msg.sender];

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        _assertSolvency();

        emit CreatorFeesClaimed(msg.sender, amount, claimIdx, block.timestamp);
    }

    /**
     * @notice Withdraw protocol fees (owner only).
     */
    function claimProtocolFees(address recipient) external nonReentrant onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 amount = protocolFeesAccrued;
        if (amount == 0) revert ZeroAmount();
        protocolFeesAccrued = 0;

        (bool ok, ) = recipient.call{value: amount}("");
        if (!ok) revert TransferFailed();

        _assertSolvency();

        emit ProtocolFeesClaimed(recipient, amount, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Solvency Verification
    // -------------------------------------------------------------------------

    function _assertSolvency() internal view {
        uint256 requiredBacking = totalRealEthLocked + totalClaimableCreatorFees + protocolFeesAccrued;
        if (address(this).balance < requiredBacking) {
            revert SolvencyInvariantViolated();
        }
    }

    /**
     * @notice Public audit function verifying that actual ETH held by the contract
     *         covers 100% of real curve reserves, creator fees, and protocol fees.
     */
    function verifyProtocolSolvency()
        external
        view
        returns (
            bool isSolvent,
            uint256 contractEthBalance,
            uint256 realEthReserves,
            uint256 pendingCreatorFees,
            uint256 pendingProtocolFees,
            uint256 surplusWei
        )
    {
        contractEthBalance = address(this).balance;
        realEthReserves = totalRealEthLocked;
        pendingCreatorFees = totalClaimableCreatorFees;
        pendingProtocolFees = protocolFeesAccrued;
        uint256 required = realEthReserves + pendingCreatorFees + pendingProtocolFees;
        isSolvent = contractEthBalance >= required;
        surplusWei = isSolvent ? contractEthBalance - required : 0;
    }

    // -------------------------------------------------------------------------
    // Quotes & View Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Preview how many shares a buyer receives for `ethIn` wei on `isYes`.
     */
    function quoteBuy(
        uint256 marketId,
        bool isYes,
        uint256 ethIn
    ) external view validMarket(marketId) returns (uint256 sharesOut, uint256 feeEth, uint256 newPriceWei) {
        if (ethIn == 0) return (0, 0, 0);
        Market storage m = _markets[marketId];
        SideCurve storage curve = isYes ? m.yesCurve : m.noCurve;

        uint256 cFee = (ethIn * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 pFee = (ethIn * protocolFeeBps) / BPS_DENOMINATOR;
        feeEth = cFee + pFee;

        uint256 netEth = ethIn - feeEth;
        uint256 newVirtualEth = curve.virtualEth + netEth;
        uint256 newVirtualShares = (CURVE_INVARIANT_K + newVirtualEth - 1) / newVirtualEth;
        sharesOut = curve.virtualShares > newVirtualShares ? curve.virtualShares - newVirtualShares : 0;
        newPriceWei = (newVirtualEth * 1e18) / newVirtualShares;
    }

    /**
     * @notice Preview how much net ETH a seller receives for `sharesIn` on `isYes`.
     */
    function quoteSell(
        uint256 marketId,
        bool isYes,
        uint256 sharesIn
    ) external view validMarket(marketId) returns (uint256 netEthOut, uint256 feeEth, uint256 newPriceWei) {
        if (sharesIn == 0) return (0, 0, 0);
        Market storage m = _markets[marketId];
        SideCurve storage curve = isYes ? m.yesCurve : m.noCurve;

        uint256 newVirtualShares = curve.virtualShares + sharesIn;
        if (newVirtualShares > INITIAL_VIRTUAL_SHARES) {
            newVirtualShares = INITIAL_VIRTUAL_SHARES;
        }
        uint256 newVirtualEth = (CURVE_INVARIANT_K + newVirtualShares - 1) / newVirtualShares;
        if (newVirtualEth < INITIAL_VIRTUAL_ETH) {
            newVirtualEth = INITIAL_VIRTUAL_ETH;
        }
        uint256 grossEthOut = curve.virtualEth > newVirtualEth ? curve.virtualEth - newVirtualEth : 0;
        if (grossEthOut > curve.realEth) {
            grossEthOut = curve.realEth;
        }
        uint256 cFee = (grossEthOut * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 pFee = (grossEthOut * protocolFeeBps) / BPS_DENOMINATOR;
        feeEth = cFee + pFee;
        netEthOut = grossEthOut - feeEth;
        newPriceWei = ((curve.virtualEth - grossEthOut) * 1e18) / newVirtualShares;
    }

    /**
     * @notice Fetch full summary for a single market.
     */
    function getMarket(uint256 marketId) public view validMarket(marketId) returns (MarketSummary memory summary) {
        Market storage m = _markets[marketId];
        (uint256 yesPrice, uint256 noPrice, uint256 sentimentBps) = _getMarketMetrics(m);

        summary = MarketSummary({
            id: m.id,
            creator: m.creator,
            question: m.question,
            category: m.category,
            imageUri: m.imageUri,
            sourceHandle: m.sourceHandle,
            createdAt: m.createdAt,
            totalTrades: m.totalTrades,
            creatorFeesEarned: m.creatorFeesEarned,
            yesRealEth: m.yesCurve.realEth,
            noRealEth: m.noCurve.realEth,
            yesTotalShares: m.yesCurve.totalShares,
            noTotalShares: m.noCurve.totalShares,
            yesVolumeEth: m.yesCurve.volumeEth,
            noVolumeEth: m.noCurve.volumeEth,
            yesPriceWei: yesPrice,
            noPriceWei: noPrice,
            yesSentimentBps: sentimentBps
        });
    }

    /**
     * @notice Fetch detailed analytics for a single market (buy/sell pressure, trade counts, peak prices).
     */
    function getMarketAnalytics(uint256 marketId) external view validMarket(marketId) returns (MarketAnalytics memory) {
        return _analytics[marketId];
    }

    /**
     * @notice Fetch on-chain reputation & creator stats for any user address.
     */ru
    function getUserStats(address user) external view returns (UserOnChainStats memory) {
        return UserOnChainStats({
            marketsCreated: userMarketsCreated[user],
            totalTrades: userTotalTrades[user],
            totalVolumeWei: userTotalVolumeWei[user],
            uniqueMarketsTraded: userUniqueMarketsTraded[user],
            creatorVolumeGeneratedWei: creatorVolumeGeneratedWei[user],
            claimableCreatorFeesWei: claimableCreatorFees[user],
            lifetimeCreatorFeesWei: lifetimeCreatorFees[user],
            totalCreatorFeesClaimedWei: claimedCreatorFees[user],
            creatorClaimCount: creatorClaimCount[user]
        });
    }

    /**
     * @notice Fetch all markets in a single RPC call for the live feed.
     */
    function getAllMarkets() external view returns (MarketSummary[] memory list) {
        list = new MarketSummary[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            list[i - 1] = getMarket(i);
        }
    }

    /**
     * @notice Paginated market fetch to prevent RPC gas exhaustion at scale.
     */
    function getMarketsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (MarketSummary[] memory list, uint256 total) {
        total = marketCount;
        if (offset >= total || limit == 0) {
            return (new MarketSummary[](0), total);
        }
        uint256 count = total - offset;
        if (count > limit) count = limit;
        list = new MarketSummary[](count);
        for (uint256 i = 0; i < count; i++) {
            list[i] = getMarket(offset + i + 1);
        }
    }

    /**
     * @notice Fetch a user's positions and instant liquidation values across all markets.
     */
    function getUserPositions(address user) external view returns (UserPosition[] memory positions) {
        positions = new UserPosition[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            uint256 yShares = yesBalances[i][user];
            uint256 nShares = noBalances[i][user];
            uint256 yVal = 0;
            uint256 nVal = 0;
            if (yShares > 0) {
                (yVal, , ) = this.quoteSell(i, true, yShares);
            }
            if (nShares > 0) {
                (nVal, , ) = this.quoteSell(i, false, nShares);
            }
            positions[i - 1] = UserPosition({
                marketId: i,
                yesShares: yShares,
                noShares: nShares,
                yesValueEth: yVal,
                noValueEth: nVal
            });
        }
    }

    function _getMarketMetrics(
        Market storage m
    ) internal view returns (uint256 yesPriceWei, uint256 noPriceWei, uint256 yesSentimentBps) {
        yesPriceWei = (m.yesCurve.virtualEth * 1e18) / m.yesCurve.virtualShares;
        noPriceWei = (m.noCurve.virtualEth * 1e18) / m.noCurve.virtualShares;
        uint256 total = yesPriceWei + noPriceWei;
        if (total == 0) {
            yesSentimentBps = 5000;
        } else {
            yesSentimentBps = (yesPriceWei * BPS_DENOMINATOR) / total;
        }
    }
}
