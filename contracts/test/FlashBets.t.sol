// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FlashBets} from "../src/FlashBets.sol";

/// @dev Minimal mock — returns a fixed price, owner can update it.
contract MockPriceFeed {
    int256 public price;

    constructor(int256 _price) { price = _price; }

    function setPrice(int256 _price) external { price = _price; }

    function latestRoundData() external view returns (
        uint80, int256, uint256, uint256, uint80
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }

    function decimals() external pure returns (uint8) { return 8; }
}

contract FlashBetsTest is Test {
    FlashBets  public flashBets;
    MockPriceFeed public feed;

    address alice = address(0xA);
    address bob   = address(0xB);

    function setUp() public {
        feed = new MockPriceFeed(10_000_000_000_000); // $100,000 * 1e8
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
        // Deposit
        vm.prank(alice);
        flashBets.deposit{value: 0.1 ether}();
        vm.prank(bob);
        flashBets.deposit{value: 0.1 ether}();

        // Start round
        flashBets.startNewMarket();

        // Alice bets UP, Bob bets DOWN
        vm.prank(alice);
        flashBets.placeBetAmount(true, 0.05 ether);
        vm.prank(bob);
        flashBets.placeBetAmount(false, 0.05 ether);

        // Warp to lock time
        vm.warp(block.timestamp + 50);
        flashBets.lockMarket();

        // Price goes up — UP wins
        feed.setPrice(10_100_000_000_000); // $101,000
        vm.warp(block.timestamp + 10);
        flashBets.resolveMarket();

        uint256 roundId = flashBets.currentRoundId();

        // Alice claims
        uint256 balBefore = flashBets.balances(alice);
        vm.prank(alice);
        flashBets.claimWinnings(roundId);

        uint256 balAfter = flashBets.balances(alice);
        assertGt(balAfter, balBefore, "Alice should profit");

        // Bob can't claim — he lost
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
}
