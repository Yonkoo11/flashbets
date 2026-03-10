// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {FlashBets} from "../src/FlashBets.sol";

contract DeployFlashBets is Script {
    // Chainlink BTC/USD on Base
    address constant BASE_MAINNET_FEED  = 0x64c911996d3c6aC71F9B455b1e8E7266BcFbf528;
    address constant BASE_SEPOLIA_FEED  = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;

    function run() external {
        address feed = block.chainid == 8453
            ? BASE_MAINNET_FEED
            : BASE_SEPOLIA_FEED;

        vm.startBroadcast();
        FlashBets flashBets = new FlashBets(feed);
        console.log("FlashBets deployed:", address(flashBets));
        console.log("Chain ID:", block.chainid);
        console.log("Price feed:", feed);
        vm.stopBroadcast();
    }
}
