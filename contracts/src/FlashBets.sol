// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashBets
 * @notice 60-second BTC UP/DOWN prediction market on Base.
 *         Anyone can start, lock, and resolve rounds once time thresholds pass.
 *         Price settlement uses Chainlink BTC/USD. Fees go to owner.
 *
 *  Round lifecycle:
 *    1. startNewMarket()  — open, takes Chainlink snapshot as start price
 *    2. placeBet()        — open for first LOCK_THRESHOLD seconds (50s)
 *    3. lockMarket()      — callable after LOCK_THRESHOLD
 *    4. resolveMarket()   — callable after ROUND_DURATION (60s), settles via Chainlink
 *    5. claimWinnings()   — winners pull their payout
 */
contract FlashBets is Ownable, ReentrancyGuard {
    // ============ Constants ============

    AggregatorV3Interface public immutable priceFeed;

    uint256 public constant ROUND_DURATION  = 60 seconds;
    uint256 public constant LOCK_THRESHOLD  = 50 seconds;
    uint256 public constant MIN_BET         = 0.0001 ether;  // ~$0.03 at $300 ETH
    uint256 public constant PROTOCOL_FEE_BPS = 250;          // 2.5%

    // ============ Types ============

    enum MarketStatus { Inactive, Active, Locked, Resolved }

    struct Market {
        uint256 roundId;
        int256  startPrice;   // Chainlink price at round open (8 decimals)
        int256  endPrice;     // Chainlink price at round close
        uint256 startTime;
        MarketStatus status;
        uint256 upPool;       // ETH in UP side (wei)
        uint256 downPool;     // ETH in DOWN side (wei)
        bool    outcome;      // true = UP won
        bool    outcomeSet;
    }

    struct Bet {
        bool    direction;  // true = UP
        uint256 amount;     // wei
        bool    exists;
    }

    // ============ State ============

    uint256 public currentRoundId;
    Market  public currentMarket;

    mapping(address => uint256) public balances;

    /// @dev bets[roundId][player]
    mapping(uint256 => mapping(address => Bet)) public bets;

    /// @dev archived resolved markets
    mapping(uint256 => Market) public pastMarkets;

    uint256 public nextRoundId = 1;
    uint256 public totalVolume;
    uint256 public accruedFees;

    // ============ Events ============

    event MarketStarted(uint256 indexed roundId, int256 startPrice, uint256 startTime);
    event BetPlaced(uint256 indexed roundId, address indexed player, bool direction, uint256 amount);
    event MarketLocked(uint256 indexed roundId);
    event MarketResolved(uint256 indexed roundId, int256 endPrice, bool outcome);
    event WinningsClaimed(uint256 indexed roundId, address indexed player, uint256 payout);
    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount);

    // ============ Constructor ============

    /// @param _priceFeed Chainlink BTC/USD aggregator address
    ///   Base mainnet:  0x64c911996d3c6aC71F9B455b1e8E7266BcFbf528
    ///   Base Sepolia:  0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
    constructor(address _priceFeed) Ownable(msg.sender) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // ============ Deposits / Withdrawals ============

    /// @notice Deposit ETH to play with. Can also just send ETH directly.
    function deposit() external payable {
        require(msg.value > 0, "Send ETH to deposit");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw available balance.
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    // ============ Market Lifecycle (permissionless with time guards) ============

    /// @notice Start a new 60-second round. Previous round must be Resolved or Inactive.
    function startNewMarket() external {
        require(
            currentMarket.status == MarketStatus.Inactive ||
            currentMarket.status == MarketStatus.Resolved,
            "Previous round not resolved"
        );

        // Archive previous resolved market
        if (currentMarket.status == MarketStatus.Resolved) {
            pastMarkets[currentMarket.roundId] = currentMarket;
        }

        (, int256 price,,,) = priceFeed.latestRoundData();

        uint256 roundId = nextRoundId++;
        currentRoundId = roundId;

        currentMarket = Market({
            roundId:    roundId,
            startPrice: price,
            endPrice:   0,
            startTime:  block.timestamp,
            status:     MarketStatus.Active,
            upPool:     0,
            downPool:   0,
            outcome:    false,
            outcomeSet: false
        });

        emit MarketStarted(roundId, price, block.timestamp);
    }

    /// @notice Lock the market — callable by anyone after LOCK_THRESHOLD seconds.
    function lockMarket() external {
        require(currentMarket.status == MarketStatus.Active, "Not active");
        require(
            block.timestamp >= currentMarket.startTime + LOCK_THRESHOLD,
            "Too early to lock"
        );
        currentMarket.status = MarketStatus.Locked;
        emit MarketLocked(currentMarket.roundId);
    }

    /// @notice Resolve the round — callable by anyone after ROUND_DURATION seconds.
    ///         Fetches current Chainlink price and compares to start price.
    function resolveMarket() external {
        require(currentMarket.status == MarketStatus.Locked, "Not locked");
        require(
            block.timestamp >= currentMarket.startTime + ROUND_DURATION,
            "Round not complete"
        );

        (, int256 endPrice,,,) = priceFeed.latestRoundData();

        bool outcome = endPrice >= currentMarket.startPrice;

        currentMarket.endPrice  = endPrice;
        currentMarket.outcome   = outcome;
        currentMarket.outcomeSet = true;
        currentMarket.status    = MarketStatus.Resolved;

        emit MarketResolved(currentMarket.roundId, endPrice, outcome);
    }

    // ============ Betting ============

    /// @notice Place a bet on the current active round.
    /// @param direction true = UP, false = DOWN
    function placeBet(bool direction) external nonReentrant {
        require(currentMarket.status == MarketStatus.Active, "Market not active");
        require(
            block.timestamp < currentMarket.startTime + LOCK_THRESHOLD,
            "Betting is locked"
        );
        require(!bets[currentRoundId][msg.sender].exists, "Already bet this round");
        require(balances[msg.sender] >= MIN_BET, "Deposit ETH first");

        uint256 amount = balances[msg.sender]; // all-in per round (simplest UX)

        bets[currentRoundId][msg.sender] = Bet({
            direction: direction,
            amount:    amount,
            exists:    true
        });

        if (direction) {
            currentMarket.upPool   += amount;
        } else {
            currentMarket.downPool += amount;
        }

        balances[msg.sender] = 0;
        totalVolume += amount;

        emit BetPlaced(currentRoundId, msg.sender, direction, amount);
    }

    /// @notice Place a specific ETH amount as a bet (drawn from balance).
    /// @param direction true = UP, false = DOWN
    /// @param amount    wei amount to bet
    function placeBetAmount(bool direction, uint256 amount) external nonReentrant {
        require(currentMarket.status == MarketStatus.Active, "Market not active");
        require(
            block.timestamp < currentMarket.startTime + LOCK_THRESHOLD,
            "Betting is locked"
        );
        require(!bets[currentRoundId][msg.sender].exists, "Already bet this round");
        require(amount >= MIN_BET, "Bet below minimum");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        bets[currentRoundId][msg.sender] = Bet({
            direction: direction,
            amount:    amount,
            exists:    true
        });

        if (direction) {
            currentMarket.upPool   += amount;
        } else {
            currentMarket.downPool += amount;
        }

        balances[msg.sender] -= amount;
        totalVolume += amount;

        emit BetPlaced(currentRoundId, msg.sender, direction, amount);
    }

    /// @notice Claim winnings for a resolved round.
    function claimWinnings(uint256 roundId) external nonReentrant {
        Bet storage bet = bets[roundId][msg.sender];
        require(bet.exists, "No bet found for this round");

        Market memory market = (roundId == currentRoundId)
            ? currentMarket
            : pastMarkets[roundId];

        require(market.status    == MarketStatus.Resolved, "Round not resolved");
        require(market.outcomeSet,                          "Outcome not set");
        require(bet.direction    == market.outcome,         "Not a winner");

        // Mark claimed before transfer (reentrancy safe via flag + nonReentrant)
        bet.exists = false;

        uint256 winnerPool = market.outcome ? market.upPool   : market.downPool;
        uint256 loserPool  = market.outcome ? market.downPool : market.upPool;

        // Winner gets back their bet + proportional share of loser pool minus fee
        uint256 loserShare = (bet.amount * loserPool) / winnerPool;
        uint256 fee        = (loserShare * PROTOCOL_FEE_BPS) / 10_000;
        uint256 payout     = bet.amount + loserShare - fee;

        accruedFees += fee;

        balances[msg.sender] += payout;

        emit WinningsClaimed(roundId, msg.sender, payout);
    }

    // ============ Owner ============

    function withdrawFees() external onlyOwner {
        uint256 amount = accruedFees;
        accruedFees = 0;
        (bool ok,) = payable(owner()).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    // ============ Views ============

    function getMarketInfo() external view returns (
        uint256 roundId,
        int256  startPrice,
        uint256 startTime,
        MarketStatus status,
        uint256 upPool,
        uint256 downPool,
        uint256 secondsRemaining
    ) {
        uint256 elapsed = block.timestamp > currentMarket.startTime
            ? block.timestamp - currentMarket.startTime
            : 0;
        uint256 remaining = elapsed >= ROUND_DURATION ? 0 : ROUND_DURATION - elapsed;

        return (
            currentMarket.roundId,
            currentMarket.startPrice,
            currentMarket.startTime,
            currentMarket.status,
            currentMarket.upPool,
            currentMarket.downPool,
            remaining
        );
    }

    /// @notice Current odds as fixed-point (195 = 1.95x). Pass 0 for current pool.
    function getOdds(bool direction, uint256 extraAmount) external view returns (uint256) {
        uint256 upPool   = currentMarket.upPool   + (direction ? extraAmount : 0);
        uint256 downPool = currentMarket.downPool  + (direction ? 0 : extraAmount);
        uint256 total    = upPool + downPool;
        uint256 myPool   = direction ? upPool : downPool;

        if (myPool == 0 || total == 0) return 200;

        uint256 odds = (total * 975) / (myPool * 10); // 2.5% rake
        return odds < 101 ? 101 : odds;
    }

    function getBtcPrice() external view returns (int256 price, uint256 updatedAt) {
        (, price,, updatedAt,) = priceFeed.latestRoundData();
    }

    function getUserBet(uint256 roundId, address player) external view returns (
        bool direction,
        uint256 amount,
        bool exists
    ) {
        Bet memory b = bets[roundId][player];
        return (b.direction, b.amount, b.exists);
    }
}
