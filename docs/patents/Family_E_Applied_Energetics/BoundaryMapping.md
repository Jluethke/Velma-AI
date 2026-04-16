# IP BOUNDARY MAPPING — FAMILY E: APPLIED ENERGETICS

**Applicant:** The Wayfinder Trust

**Inventor:** Jonathan Luethke

**Date:** 2026-03-31

---

## What IS Covered

1. **E-R-I analytical framework**: Three-axis coupling model (Energy, Resonance, Information) for heterogeneous domain pairs with configurable aggregation
2. **Coupled oscillator model for computing governance**: Representation of computational domains as oscillators with natural frequencies proportional to update rates
3. **Trust-modulated coupling**: Coupling strength between domain oscillators as a function of mutual trust levels
4. **Order parameter computation**: Synchronization metric measuring system-wide phase coherence
5. **Order parameter to trust conversion**: Exponential decay conversion producing governance-compatible trust signals
6. **Phase classification from order parameter**: Mapping to discrete phases via configurable thresholds
7. **Entropy computation**: Detection of transitional states between synchronization and incoherence
8. **Anti-fragile resource allocation**: Selective exposure increase for convex-payoff instruments during uncertainty, gated by governance trust
9. **Dual-governance integration**: Most-restrictive-wins merging of constraints from two independent governance subsystems
10. **Signal confidence modifier**: Order-parameter-derived confidence multiplier for downstream systems

## What is NOT Covered

1. The underlying Kuramoto equations as pure mathematics (public domain physics)
2. The specific trust computation (exp(-gain * divergence) with EMA) -- belongs to Families A and B
3. Specific instrument classification criteria (which instruments are "convex" vs "linear")
4. Specific trading strategies or signal generation logic
5. The governance mesh that consumes resonance signals -- belongs to Family D
6. Specific financial market data sources or data pipeline implementations
7. The specific numerical values of coupling constants, decay gains, or threshold parameters used in production

## Adjacent IP (Other Families)

- **Family A (NeuroPRIN)**: Subsystem governors that produce trust levels consumed as coupling inputs. NeuroPRIN claims the runtime trust evaluation; Family E claims the resonance analysis that uses those trust levels.
- **Family B (ALG)**: Provides the exponential decay trust formula. Family B claims the formula for governance; Family E claims the adaptation of that formula for order-parameter-to-trust conversion.
- **Family D (Bridges)**: Consumes resonance reports and trust signals. Family D claims the governance mesh architecture; Family E claims the resonance provider that feeds it.
- **Family F (SkillChain)**: No direct overlap. SkillChain's trust computation is independent.
- **Family G (Terra Unita)**: The monetary policy engine in Family G may use resonance-based business cycle detection from Family E. Family G claims the monetary system; Family E claims the resonance detection.

## Trade Secret Boundaries

The following are maintained as trade secrets and NOT included in patent claims:
- Specific coupling constants (K_base values) used in production
- Specific EMA alpha values for trust smoothing
- Specific phase classification threshold values
- Anti-fragile boost cap values and minimum trust gates used in production
- Calibration methodology for E-R-I weights across different domain types
- Performance optimization techniques for oscillator model advancement

## Open Source Boundaries

- The E-R-I framework concept and coupling axes may be described in academic publications
- The coupled oscillator model application to computing governance is patent-protected
- The anti-fragile resource allocation engine is patent-protected and should NOT be open-sourced
- Reference implementations of the order parameter computation may be published with attribution and under patent license

---

*Classification: CONFIDENTIAL -- DRAFT -- NOT FILED*
*Applicant: The Wayfinder Trust*
