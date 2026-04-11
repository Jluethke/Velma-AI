// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PriceOracle
 * @notice Provides the TRUST/USD price to the Marketplace so subscription
 *         and flow prices can be denominated in dollars and paid in TRUST.
 *
 * Two modes — operator switches between them as the project matures:
 *
 *   MANUAL  (default at launch)
 *     Admin calls setManualPrice() after seeding the liquidity pool.
 *     Simple, no dependencies. Needs periodic updates when price moves.
 *
 *   UNISWAP_TWAP  (post-launch, once pool has sufficient history)
 *     Reads a 30-minute TWAP from the TRUST/USDC Uniswap V3 pool.
 *     Trustless and automatic. Switch via setMode(Mode.UNISWAP_TWAP).
 *
 * Price format: USD per TRUST, 18 decimals.
 *   e.g. $0.01/TRUST → 1e16
 *        $0.10/TRUST → 1e17
 *        $1.00/TRUST → 1e18
 */
contract PriceOracle is AccessControl {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    enum Mode { MANUAL, UNISWAP_TWAP }

    Mode public mode;

    /// @notice Manual price: USD per TRUST, 18 decimals.
    uint256 public manualPrice;

    /// @notice Uniswap V3 pool address (TRUST/USDC or TRUST/WETH).
    address public uniswapPool;

    /// @notice TWAP window in seconds (default 30 min).
    uint32  public twapWindow = 30 minutes;

    /// @notice Whether TRUST is token0 in the Uniswap pool.
    bool    public trustIsToken0;

    /// @notice Staleness threshold for manual price (default 7 days).
    uint256 public stalenessThreshold = 7 days;

    uint256 public lastUpdated;

    // ── Events ─────────────────────────────────────────────────────────

    event ManualPriceSet(uint256 price, address updater);
    event ModeChanged(Mode newMode);
    event UniswapPoolSet(address pool, bool trustIsToken0, uint32 twapWindow);

    // ── Constructor ────────────────────────────────────────────────────

    /**
     * @param admin        Default admin and initial updater.
     * @param initialPrice Starting manual price (USD per TRUST, 18 decimals).
     *                     Set this after seeding the liquidity pool.
     *                     e.g. $0.01 = 1e16
     */
    constructor(address admin, uint256 initialPrice) {
        require(admin != address(0), "PriceOracle: zero admin");
        require(initialPrice > 0,    "PriceOracle: zero price");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPDATER_ROLE, admin);

        manualPrice  = initialPrice;
        lastUpdated  = block.timestamp;
        mode         = Mode.MANUAL;

        emit ManualPriceSet(initialPrice, admin);
    }

    // ── Price read ─────────────────────────────────────────────────────

    /**
     * @notice Returns the current TRUST/USD price (18 decimals).
     * @dev Reverts if manual price is stale or TWAP pool is unset.
     */
    function getPrice() external view returns (uint256 price) {
        if (mode == Mode.MANUAL) {
            require(
                block.timestamp - lastUpdated <= stalenessThreshold,
                "PriceOracle: manual price stale"
            );
            return manualPrice;
        }

        // UNISWAP_TWAP mode
        require(uniswapPool != address(0), "PriceOracle: pool not set");
        return _getTwapPrice();
    }

    /**
     * @notice Convert a USD amount to TRUST tokens at the current price.
     * @param usdAmount  Dollar amount in 18-decimal WAD (e.g. $20 = 20e18).
     * @return trust     TRUST tokens required (18 decimals).
     */
    function usdToTrust(uint256 usdAmount) external view returns (uint256 trust) {
        uint256 price = this.getPrice(); // USD per TRUST, 18 dec
        // trust = usdAmount / price  (both 18 dec, so multiply by 1e18)
        return (usdAmount * 1e18) / price;
    }

    // ── Admin ──────────────────────────────────────────────────────────

    /**
     * @notice Set the manual TRUST/USD price.
     * @param price USD per TRUST, 18 decimals. e.g. $0.01 = 1e16.
     */
    function setManualPrice(uint256 price) external onlyRole(UPDATER_ROLE) {
        require(price > 0, "PriceOracle: zero price");
        manualPrice = price;
        lastUpdated = block.timestamp;
        emit ManualPriceSet(price, msg.sender);
    }

    /**
     * @notice Switch between MANUAL and UNISWAP_TWAP mode.
     */
    function setMode(Mode newMode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMode == Mode.UNISWAP_TWAP) {
            require(uniswapPool != address(0), "PriceOracle: set pool first");
        }
        mode = newMode;
        emit ModeChanged(newMode);
    }

    /**
     * @notice Set the Uniswap V3 pool to read TWAP from.
     * @param pool          Address of the TRUST/USDC (or TRUST/WETH) V3 pool.
     * @param _trustIsToken0 True if TRUST is token0 in the pool.
     * @param _twapWindow   TWAP window in seconds (min 5 min, max 1 hour).
     */
    function setUniswapPool(
        address pool,
        bool _trustIsToken0,
        uint32 _twapWindow
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(pool != address(0),  "PriceOracle: zero pool");
        require(_twapWindow >= 5 minutes && _twapWindow <= 1 hours, "PriceOracle: bad window");
        uniswapPool    = pool;
        trustIsToken0  = _trustIsToken0;
        twapWindow     = _twapWindow;
        emit UniswapPoolSet(pool, _trustIsToken0, _twapWindow);
    }

    /**
     * @notice Update the manual price staleness threshold.
     */
    function setStalenessThreshold(uint256 threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(threshold >= 1 hours, "PriceOracle: threshold too short");
        stalenessThreshold = threshold;
    }

    // ── Internal: Uniswap V3 TWAP ─────────────────────────────────────

    function _getTwapPrice() internal view returns (uint256) {
        IUniswapV3Pool pool = IUniswapV3Pool(uniswapPool);

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = twapWindow;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);

        int56 tickCumulativeDelta = tickCumulatives[1] - tickCumulatives[0];
        int24 meanTick = int24(tickCumulativeDelta / int56(int32(twapWindow)));

        // sqrtPriceX96 from tick
        // price = 1.0001^tick  (token1 per token0, both in native decimals)
        uint256 sqrtPriceX96 = _getSqrtRatioAtTick(meanTick);

        // price of token0 in terms of token1, normalized to 18 decimals
        // For TRUST/USDC: USDC has 6 decimals, TRUST has 18 decimals
        uint256 rawPrice = (sqrtPriceX96 * sqrtPriceX96 * 1e18) >> 192;

        if (trustIsToken0) {
            // rawPrice = USDC per TRUST (in USDC's 6 decimals)
            // normalize to 18 decimals: multiply by 1e12
            return rawPrice * 1e12;
        } else {
            // rawPrice = TRUST per USDC
            // invert: price = 1e18 / rawPrice, then normalize
            require(rawPrice > 0, "PriceOracle: zero rawPrice");
            return (1e18 * 1e12) / rawPrice;
        }
    }

    /// @dev Approximation of getSqrtRatioAtTick from TickMath.
    ///      Accurate enough for oracle pricing; avoids importing the full library.
    function _getSqrtRatioAtTick(int24 tick) internal pure returns (uint256 sqrtPriceX96) {
        // Use the Uniswap TickMath approach: 2^96 * 1.0001^(tick/2)
        // We approximate via bit-shifting the known constants.
        uint256 absTick = tick < 0 ? uint256(int256(-int256(tick))) : uint256(int256(tick));
        require(absTick <= 887272, "PriceOracle: tick out of range");

        uint256 ratio = absTick & 0x1 != 0
            ? 0xfffcb933bd6fad37aa2d162d1a594001
            : 0x100000000000000000000000000000000;

        if (absTick & 0x2  != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4  != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8  != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;

        if (tick > 0) ratio = type(uint256).max / ratio;

        sqrtPriceX96 = (ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1);
    }
}

// ── Minimal Uniswap V3 Pool Interface ────────────────────────────────────────

interface IUniswapV3Pool {
    function observe(uint32[] calldata secondsAgos)
        external view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
}
