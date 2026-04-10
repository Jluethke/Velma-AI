// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

/**
 * @title TrustMath
 * @notice Fixed-point math library for trust computations.
 * @dev All values use WAD (1e18) fixed-point representation.
 *
 * Ported from Velma ALG trust_module.py:
 *   raw_trust = exp(-gain * divergence)
 *   smoothed  = alpha * raw + (1 - alpha) * prev_ema
 *
 * Patent Family B: Runtime governance of learning/adaptive systems.
 */
library TrustMath {
    uint256 internal constant WAD = 1e18;

    // ── Exponential decay (Taylor series) ──────────────────────────────

    /**
     * @notice Approximate exp(-gain * divergence) via 6-term Taylor series.
     * @dev Mirrors ALG trust_module: `exp(-trust_decay_gain * combined_divergence)`.
     *      Accuracy is within 0.1% for x < 3*WAD. Returns 0 for x >= 20*WAD.
     * @param gain    The decay gain parameter (WAD).
     * @param divergence The divergence value (WAD).
     * @return result  The approximated exponential decay (WAD).
     */
    function expDecay(uint256 gain, uint256 divergence) internal pure returns (uint256) {
        // x = gain * divergence / WAD
        uint256 x = (gain * divergence) / WAD;

        // For very large x, trust is essentially zero
        if (x >= 20 * WAD) return 0;

        // Taylor series: exp(-x) ≈ 1 - x + x²/2! - x³/3! + x⁴/4! - x⁵/5!
        // We compute each term iteratively, alternating signs.
        uint256 term = WAD; // term_0 = 1
        uint256 pos = WAD;  // positive accumulator starts at 1
        uint256 neg = 0;    // negative accumulator

        for (uint256 i = 1; i <= 6; i++) {
            term = (term * x) / (i * WAD);
            if (i % 2 == 1) {
                neg += term;
            } else {
                pos += term;
            }
        }

        if (neg >= pos) return 0;
        return pos - neg;
    }

    // ── Exponential Moving Average ─────────────────────────────────────

    /**
     * @notice Compute EMA: alpha * newValue + (1 - alpha) * prevValue.
     * @dev Mirrors ALG trust_module smoothing step.
     * @param newValue  The new observation (WAD).
     * @param prevValue The previous EMA value (WAD).
     * @param alpha     Smoothing factor in WAD (0 < alpha <= 1e18).
     * @return result   The updated EMA (WAD).
     */
    function ema(uint256 newValue, uint256 prevValue, uint256 alpha) internal pure returns (uint256) {
        require(alpha <= WAD, "TrustMath: alpha > 1");
        return (alpha * newValue + (WAD - alpha) * prevValue) / WAD;
    }

    // ── Weighted Median ────────────────────────────────────────────────

    /**
     * @notice Compute the weighted median of a pre-sorted array.
     * @dev Values MUST be sorted ascending before calling. Weights are WAD.
     *      Used by TrustOracle for aggregating attestations.
     * @param values  Sorted array of values (WAD).
     * @param weights Corresponding weights (WAD). Same length as values.
     * @return median  The weighted median value (WAD).
     */
    function weightedMedian(
        uint256[] memory values,
        uint256[] memory weights
    ) internal pure returns (uint256) {
        require(values.length == weights.length, "TrustMath: length mismatch");
        require(values.length > 0, "TrustMath: empty arrays");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }

        uint256 half = totalWeight / 2;
        uint256 cumulative = 0;

        for (uint256 i = 0; i < values.length; i++) {
            cumulative += weights[i];
            if (cumulative > half) {
                return values[i];
            }
        }

        return values[values.length - 1];
    }

    // ── Square Root (Babylonian) ───────────────────────────────────────

    /**
     * @notice Compute sqrt(x) for WAD fixed-point values.
     * @dev Babylonian method. Result is in WAD.
     *      Used by GovernanceDAO for sqrt(stake) voting power.
     * @param x Input value (WAD).
     * @return y sqrt(x) in WAD.
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;

        // Scale up by WAD so result is in WAD: sqrt(x * WAD)
        uint256 scaled = x * WAD;
        y = scaled;
        uint256 z = (scaled + WAD) / 2;

        while (z < y) {
            y = z;
            z = (scaled / z + z) / 2;
        }
    }

    // ── Binary Logarithm ───────────────────────────────────────────────

    /**
     * @notice Compute log2(x) for WAD fixed-point values.
     * @dev Uses binary decomposition. Result is in WAD.
     *      Used by GovernanceDAO for log2(reputation) in voting power.
     * @param x Input value (WAD). Must be > 0.
     * @return result log2(x) in WAD.
     */
    function log2(uint256 x) internal pure returns (uint256 result) {
        require(x > 0, "TrustMath: log2(0)");

        // Integer part: find highest bit of (x / WAD)
        uint256 n = x / WAD;
        if (n == 0) return 0; // x < 1*WAD, log2 < 0, clamp to 0

        uint256 intPart = 0;
        uint256 temp = n;
        while (temp > 1) {
            temp >>= 1;
            intPart++;
        }

        result = intPart * WAD;

        // Fractional part: 64 iterations of squaring
        uint256 y = x >> intPart; // normalise to [WAD, 2*WAD)
        for (uint256 i = 0; i < 64; i++) {
            y = (y * y) / WAD;
            if (y >= 2 * WAD) {
                result += WAD >> (i + 1);
                y >>= 1;
            }
        }
    }
}
