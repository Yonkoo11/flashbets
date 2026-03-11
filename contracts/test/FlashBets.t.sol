// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FlashBets} from "../src/FlashBets.sol";

/// @dev Full mock — configurable price, updatedAt, and roundId fields.
contract MockPriceFeed {
    int256  public price;
    uint256 public updatedAt;
    uint80  public oracleRoundId;
    uint80  public answeredInRound;

    constructor(int256 _price) {
        price           = _price;
        updatedAt       = block.timestamp;
        oracleRoundId   = 1;
        answeredInRound = 1;
    }

    function setPrice(int256 _price) external {
        price     = _price;
        updatedAt = block.timestamp; // fresh by default when price changes
    }

    function setUpdatedAt(uint256 _updatedAt) external { updatedAt = _updatedAt; }

    function setRoundIds(uint80 _oracleRoundId, uint80 _answeredInRound) external {
        oracleRoundId   = _oracleRoundId;
        answeredInRound = _answeredInRound;
    }

    function latestRoundData() external view returns (
        uint80, int256, uint256, uint256, uint80
    ) {
        return (oracleRoundId, price, block.timestamp, updatedAt, answeredInRound);
    }

    function decimals() external pure returns (uint8) { return 8; }
}

contract FlashBetsTest is Test {
    FlashBets     public flashBets;
    MockPriceFeed public feed;

    address alice = address(0xA);
    address bob   = address(0xB);

    function setUp() public {
        // Foundry starts block.timestamp at 1; warp to a realistic value so
        // "block.timestamp - 2 hours" doesn't underflow in staleness checks.
        vm.warp(1 days);

        feed      = new MockPriceFeed(10_000_000_000_000); // $100,000 * 1e8
        flashBets = new FlashBets(address(feed));

        vm.deal(alice, 1 ether);
        vm.deal(bob,   1 ether);
    }

    // ============ Deposit ============

    function test_deposit() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();
        assertEq(flashBets.balances(alice), 0.1 ether);
    }

    // ============ Full round ============

    function test_full_round_up_wins() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();
        vm.prank(bob);
        flashBets.deposit{value: 0.1 ether}();

        flashBets.startNewMarket();

        vm.prank(alice);
        flashBets.placeBetAmount(true, 0.05 ether);
        vm.prank(bob);
        flashBets.placeBetAmount(false, 0.05 ether);

        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();

        // Price goes up — UP wins
        feed.setPrice(10_100_000_000_000); // $101,000
        vm.warp(block.timestamp + 10);
        flashBets.resolveMarket();

        uint256 roundId = flashBets.currentRoundId();

        uint256 balBefore = flashBets.balances(alice);
        vm.prank(alice);
        flashBets.claimWinnings(roundId);
        assertGt(flashBets.balances(alice), balBefore, "Alice should profit");

        // Bob lost — cannot claim
        vm.prank(bob);
        vm.expectRevert("Not a winner");
        flashBets.claimWinnings(roundId);
    }

    function test_cannot_bet_after_lock_threshold() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();

        flashBets.startNewMarket();
        vm.warp(block.timestamp + 51); // past LOCK_THRESHOLD

        vm.prank(alice);
        vm.expectRevert("Betting is locked");
        flashBets.placeBetAmount(true, 0.05 ether);
    }

    function test_cannot_double_bet() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.2 ether}();

        flashBets.startNewMarket();

        vm.prank(alice);
        flashBets.placeBetAmount(true, 0.05 ether);

        vm.prank(alice);
        vm.expectRevert("Already bet this round");
        flashBets.placeBetAmount(false, 0.05 ether);
    }

    function test_cannot_resolve_before_round_complete() public {
        flashBets.startNewMarket();
        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();

        vm.expectRevert("Round not complete");
        flashBets.resolveMarket();
    }

    function test_withdraw() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.5 ether}();

        uint256 before = alice.balance;
        vm.prank(alice);
        flashBets.withdraw(0.3 ether);

        assertEq(alice.balance, before + 0.3 ether);
        assertEq(flashBets.balances(alice), 0.2 ether);
    }

    // ============ Oracle security ============

    function test_rejects_stale_oracle_price() public {
        // Set updatedAt far in the past (beyond MAX_ORACLE_AGE = 1 hour)
        feed.setUpdatedAt(block.timestamp - 2 hours);

        vm.expectRevert("Oracle: stale price");
        flashBets.startNewMarket();
    }

    function test_rejects_zero_oracle_price() public {
        feed.setPrice(0);

        vm.expectRevert("Oracle: invalid price");
        flashBets.startNewMarket();
    }

    function test_rejects_incomplete_oracle_round() public {
        // answeredInRound < oracleRoundId = incomplete round
        feed.setRoundIds(5, 3);

        vm.expectRevert("Oracle: incomplete round");
        flashBets.startNewMarket();
    }

    function test_rejects_stale_price_at_resolve() public {
        flashBets.startNewMarket();

        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();
        vm.prank(alice);
        flashBets.placeBetAmount(true, 0.05 ether);

        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();
        vm.warp(block.timestamp + 10);

        // Oracle goes stale before resolve
        feed.setUpdatedAt(block.timestamp - 2 hours);

        vm.expectRevert("Oracle: stale price");
        flashBets.resolveMarket();
    }

    // ============ Stuck round / cancel ============

    function test_cancel_stale_round_refunds_bettors() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();
        vm.prank(bob);
        flashBets.deposit{value: 0.1 ether}();

        flashBets.startNewMarket();
        uint256 roundId = flashBets.currentRoundId();

        vm.prank(alice);
        flashBets.placeBetAmount(true, 0.05 ether);
        vm.prank(bob);
        flashBets.placeBetAmount(false, 0.05 ether);

        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();

        // Nobody resolves; warp past CANCEL_DEADLINE
        vm.warp(block.timestamp + flashBets.CANCEL_DEADLINE());
        flashBets.cancelStaleRound();

        // Both bettors get their original amount back
        vm.prank(alice);
        flashBets.claimWinnings(roundId);
        assertEq(flashBets.balances(alice), 0.1 ether, "Alice refunded");

        vm.prank(bob);
        flashBets.claimWinnings(roundId);
        assertEq(flashBets.balances(bob), 0.1 ether, "Bob refunded");
    }

    function test_cannot_cancel_too_early() public {
        flashBets.startNewMarket();
        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();

        vm.expectRevert("Too early to cancel");
        flashBets.cancelStaleRound();
    }

    // ============ Pause ============

    function test_pause_blocks_new_market() public {
        flashBets.pause();

        vm.expectRevert();
        flashBets.startNewMarket();
    }

    function test_pause_does_not_block_withdraw() public {
        vm.prank(alice);
        flashBets.deposit{value: 0.3 ether}();

        flashBets.pause();

        // withdraw still works
        uint256 before = alice.balance;
        vm.prank(alice);
        flashBets.withdraw(0.3 ether);
        assertEq(alice.balance, before + 0.3 ether);
    }

    function test_unpause_restores_market() public {
        flashBets.pause();
        flashBets.unpause();

        // Should work again
        flashBets.startNewMarket();
    }
}
