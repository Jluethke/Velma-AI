# TRUST/ETH Liquidity Setup Guide

## Overview

This guide walks through setting up the initial TRUST/ETH liquidity pool on Aerodrome, the primary DEX on Base. This creates a public trading pair so anyone can swap ETH for TRUST and vice versa.

**Liquidity allocation:** 5% of total supply (50M TRUST) paired with ETH.

---

## Prerequisites

- SkillToken deployed to Base mainnet
- Deployer wallet with sufficient ETH for gas + liquidity pairing
- Foundry installed (`forge`, `cast`)
- Base RPC URL configured

## Aerodrome Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |
| Factory | `0x420DD381b31aEf6683db6B902084cB0FFECe40Da` |
| WETH | `0x4200000000000000000000000000000000000006` |

---

## Step 1: Deploy SkillToken to Base Mainnet

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

Record the deployed SkillToken address from the console output.

## Step 2: Mint Liquidity Allocation

The deployer (who has MINTER_ROLE) mints 50M TRUST for the liquidity pool:

```bash
cast send $SKILL_TOKEN \
  "mint(address,uint256)" \
  $DEPLOYER_WALLET \
  50000000000000000000000000 \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY
```

## Step 3: Approve Aerodrome Router

```bash
AERODROME_ROUTER=0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43

cast send $SKILL_TOKEN \
  "approve(address,uint256)" \
  $AERODROME_ROUTER \
  50000000000000000000000000 \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY
```

## Step 4: Add Liquidity

Call `addLiquidityETH` on the Aerodrome router. This creates the pool if it does not exist.

```bash
# Parameters:
#   token:           SKILL_TOKEN address
#   stable:          false (volatile pair)
#   amountTokenDesired: 5,000,000 TRUST (5M for initial pool)
#   amountTokenMin:  4,950,000 TRUST (1% slippage)
#   amountETHMin:    1.98 ETH (1% slippage on 2 ETH)
#   to:              deployer wallet (receives LP tokens)
#   deadline:        current time + 1 hour

cast send $AERODROME_ROUTER \
  "addLiquidityETH(address,bool,uint256,uint256,uint256,address,uint256)" \
  $SKILL_TOKEN \
  false \
  5000000000000000000000000 \
  4950000000000000000000000 \
  1980000000000000000 \
  $DEPLOYER_WALLET \
  $(( $(date +%s) + 3600 )) \
  --value 2ether \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY
```

## Step 5: Price Discovery

The initial price is determined by the ratio of tokens deposited:

| TRUST in Pool | ETH in Pool | ETH Price | TRUST Price |
|--------------|-------------|-----------|-------------|
| 5,000,000 | 2 ETH | $2,500 | $0.001 |
| 5,000,000 | 1 ETH | $2,500 | $0.0005 |
| 10,000,000 | 2 ETH | $2,500 | $0.0005 |

**Recommended starting price:** $0.001 per TRUST.

With 5M TRUST + 2 ETH (~$5,000), the initial market cap would be $1M (1B supply x $0.001).

After launch, the market determines the price through supply and demand. Larger pools mean lower slippage for traders.

## Step 6: Lock LP Tokens

Lock LP tokens to prove the team will not remove liquidity (rug pull). Use one of these services:

### Option A: Team Finance

1. Go to https://www.team.finance/
2. Connect deployer wallet
3. Select "Lock Liquidity"
4. Choose the TRUST/ETH LP token
5. Set lock duration: minimum 6 months (12 months recommended)
6. Confirm transaction

### Option B: Uncx Network

1. Go to https://uncx.network/
2. Connect deployer wallet
3. Navigate to Liquidity Locker
4. Select Base network
5. Paste LP token address
6. Lock for 6-12 months

### Foundry Script (lock via Team Finance contract)

```solidity
// script/LockLP.s.sol
pragma solidity ^0.8.24;
import "forge-std/Script.sol";

interface ITeamFinanceLock {
    function lockTokens(
        address token,
        address withdrawer,
        uint256 amount,
        uint256 unlockTime
    ) external payable returns (uint256);
}

contract LockLP is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address lpToken = vm.envAddress("LP_TOKEN");
        address lockContract = 0x...;  // Team Finance lock on Base

        vm.startBroadcast(pk);

        IERC20(lpToken).approve(lockContract, type(uint256).max);
        ITeamFinanceLock(lockContract).lockTokens(
            lpToken,
            deployer,
            IERC20(lpToken).balanceOf(deployer),
            block.timestamp + 365 days  // 12-month lock
        );

        vm.stopBroadcast();
    }
}
```

---

## Anti-Dump Protections (Optional)

These can be implemented in SkillToken or as a separate transfer hook:

### Max Transaction Size

Limit individual transactions to 0.5% of total supply (5M TRUST):

```solidity
uint256 public maxTxAmount = 5_000_000 * 1e18;

function _update(address from, address to, uint256 amount) internal override {
    if (from != address(0) && to != address(0)) {
        require(amount <= maxTxAmount, "Exceeds max tx");
    }
    super._update(from, to, amount);
}
```

### Cooldown Between Sells

One sell per block per address:

```solidity
mapping(address => uint256) public lastSellBlock;

function _update(address from, address to, uint256 amount) internal override {
    if (to == pairAddress) {  // selling to pool
        require(block.number > lastSellBlock[from], "One sell per block");
        lastSellBlock[from] = block.number;
    }
    super._update(from, to, amount);
}
```

### Early Seller Tax

10% extra burn on sells within the first 7 days of listing:

```solidity
uint256 public listingTimestamp;
uint256 public constant EARLY_SELL_TAX_BPS = 1000;  // 10%
uint256 public constant EARLY_SELL_WINDOW = 7 days;

function _update(address from, address to, uint256 amount) internal override {
    if (to == pairAddress && block.timestamp < listingTimestamp + EARLY_SELL_WINDOW) {
        uint256 tax = (amount * EARLY_SELL_TAX_BPS) / 10000;
        super._update(from, address(0), tax);  // burn tax
        amount -= tax;
    }
    super._update(from, to, amount);
}
```

---

## Post-Launch Checklist

- [ ] Verify token contract on Basescan
- [ ] Verify pool creation on Aerodrome UI
- [ ] Confirm LP tokens are locked (share lock receipt URL)
- [ ] Add token to DEXScreener and DEXTools
- [ ] Update mission-control with pool address
- [ ] Announce liquidity launch to community
- [ ] Monitor pool health (TVL, volume, price) daily for first week

## Remaining Liquidity Plan

The initial pool uses 5M of the 50M liquidity allocation. The remaining 45M TRUST can be deployed as:

- Additional liquidity to deepen the pool as demand grows
- Incentive rewards for LP providers via Aerodrome gauges
- Cross-DEX liquidity (Uniswap V3 on Base, if needed)
- Paired with USDC for a stablecoin pair
