# IP BOUNDARY MAPPING — FAMILY D: BRIDGES

**Applicant:** The Wayfinder Trust

**Inventor:** Jonathan Luethke

**Date:** 2026-03-31

---

## What IS Covered

1. **Phase translation architecture**: Bidirectional mapping between heterogeneous subsystem-local phase models and a canonical unified phase model via two-hop translation
2. **Trust temporal alignment**: Time-constant-preserving normalization of trust scores across different update rates using exact exponential memory preservation
3. **Critical override propagation**: Cascading protection mechanism that forces non-critical subsystems to configurable restriction levels when any subsystem enters a critical state
4. **Event propagation bus**: Publish-subscribe mechanism for governance events (phase transitions, overrides, synchronization cycles, resonance updates)
5. **Resonance-based health assessment**: Modeling subsystems as coupled oscillators with trust-modulated coupling to compute a synchronization order parameter
6. **Composite trust computation**: Weighted aggregation of temporally aligned trust scores with configurable per-subsystem weights
7. **Forced consensus mode**: Operator-initiated coordinated phase transition across all subsystems
8. **Synchronization cycle protocol**: Eight-step periodic cycle (read, translate, align, detect, override, resonate, composite, notify)

## What is NOT Covered

1. The internal governance logic of individual subsystem governors (covered by Families A and B)
2. The specific trust computation formula (exp(-gain * divergence) with EMA smoothing) -- this belongs to Families A and B; Family D consumes trust scores as inputs
3. The coupled oscillator equations and Kuramoto model mathematics -- the general physics belongs to Family E; Family D covers the application to governance coordination
4. Specific subsystem phase model definitions (e.g., what phases a particular governor uses)
5. Network transport protocols for event delivery
6. Authentication or authorization mechanisms for the forced consensus mode
7. The specific number of unified phases (the model is configurable)

## Adjacent IP (Other Families)

- **Family A (NeuroPRIN)**: Provides one of the subsystem governors coordinated by the mesh. Family A claims the 9-stage runtime trust evaluation pipeline; Family D claims the coordination between multiple such governors.
- **Family B (ALG)**: Provides the trust computation (exp-decay + EMA) consumed by the temporal alignment module. Family B claims the 5-stage governance pipeline; Family D claims the temporal alignment of trust scores from that pipeline.
- **Family C (NeurOS/NeuroFS)**: The cognitive OS is one of the subsystems governed. Family C claims the AI-native OS architecture; Family D claims the governance mesh that coordinates it with other subsystems.
- **Family E (Applied Energetics)**: Provides the coupled oscillator model and E-R-I framework. Family E claims the resonance analysis framework itself; Family D claims the integration of resonance-derived health assessment into governance coordination.
- **Family F (SkillChain)**: The decentralized network is a potential consumer of mesh governance events. No direct claim overlap.
- **Family G (Terra Unita)**: Federation governance in Family G is analogous but operates at an economic-zone level; Family D operates at a computing-subsystem level.

## Trade Secret Boundaries

The following are maintained as trade secrets and NOT included in patent claims:
- Specific EMA smoothing parameters (alpha values) used in production
- Specific severity level names and threshold values used in the canonical unified model
- Performance optimization techniques for the synchronization cycle
- Specific coupling constants and resonance parameters used in production
- Telemetry and monitoring implementation details

## Open Source Boundaries

- The governance mesh protocol specification may be published as an open standard
- Reference implementations of the phase translator and event bus may be open-sourced
- The trust temporal alignment algorithm is patent-protected and should NOT be open-sourced without licensing terms
- The critical override engine logic is patent-protected

---

*Classification: CONFIDENTIAL -- DRAFT -- NOT FILED*
*Applicant: The Wayfinder Trust*
