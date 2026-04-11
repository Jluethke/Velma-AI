// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TrustToken.sol";

/**
 * @notice Mints 1,000,000 TRUST to each beta wallet.
 * Run with:
 *   PRIVATE_KEY=0x... forge script script/MintBeta.s.sol \
 *     --rpc-url https://mainnet.base.org --broadcast
 */
contract MintBeta is Script {
    address constant TRUST_TOKEN = 0x61d6a2Ce3D89B509eD1Cf2323B609512584De247;
    uint256 constant AMOUNT = 1_000_000 * 1e18;

    address[] public recipients = [
        // TODO: replace with actual wallet addresses
        0x0000000000000000000000000000000000000001,
        0x0000000000000000000000000000000000000002,
        0x0000000000000000000000000000000000000003,
        0x0000000000000000000000000000000000000004,
        0x0000000000000000000000000000000000000005
    ];

    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPk);

        TrustToken token = TrustToken(TRUST_TOKEN);

        for (uint256 i = 0; i < recipients.length; i++) {
            token.mint(recipients[i], AMOUNT);
            console.log("Minted 1M TRUST to:", recipients[i]);
        }

        vm.stopBroadcast();

        console.log("Done. Total minted:", AMOUNT * recipients.length / 1e18, "TRUST");
    }
}
