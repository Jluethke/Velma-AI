# IP BOUNDARY MAP

**Project:** Assured Learning Governor (ALG)
**Patent Family:** B -- Runtime Governance of Adaptive Systems
**Owner:** The Wayfinder Trust
**Date:** 2026-02-13 (updated 2026-03-31)
**Classification:** Confidential -- Internal / NDA Use Only

---

## 1. PURPOSE

Define boundaries between patent-protected inventions, trade secrets, copyrighted works, and openly disclosed assets within the ALG project.

- (a) Prevent accidental disclosure of protected IP
- (b) Preserve patent scope
- (c) Preserve trade secret status for calibration and implementation
- (d) Clarify product-to-IP relationships
- (e) Guide publication, partnerships, and licensing decisions

All personnel with ALG access must consult this map before disclosure.

---

## 2. PATENT-COVERED ASSETS

Coverage extends to functional behavior, not code or numeric values.

### 2.1 Six-Stage Governance Architecture

**Covered by:** Patent Family B (Claims 1, 2, 3, 19)

Includes:
- Six-stage pipeline: OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT
- N-axis divergence computation from domain adapter
- Trust derivation (exponential decay + EMA smoothing)
- Predictive trust projection via divergence trend extrapolation
- Runtime supervision independent of the adaptive process
- Independent supervisory layer between adaptive process and governed state
- Deterministic governance path (identical outputs for identical inputs)
- Algorithm-agnostic design via domain adapter interface

**Legal Status:** Patent-protected functional behavior

### 2.2 Trust Computation and Asymmetric Dynamics

**Covered by:** Patent Family B (Claims 1b, 2c, 3c, 7, 8, 9)

Includes:
- Trust via exponential decay of combined divergence with EMA smoothing
- Asymmetric decay-to-recovery ratio (trust decays faster than it recovers)
- EMA time constant preservation across different observation intervals
- Post-trust callback for domain-specific adjustments
- Trust bounded within [0, 1] at all times

**Legal Status:** Patent-protected computation

### 2.3 Trust-to-Authority Mapping with Linear Interpolation

**Covered by:** Patent Family B (Claims 1d, 14, 15, 16)

Includes:
- Trust-to-authority scaling factor for operational modifications
- Linear interpolation within each phase (smooth transitions, no discontinuities)
- Factor is zero at/below freeze, one at max trust, monotonic between
- Phase-based modulation via configurable phases (nominal, constrained, frozen, rollback)
- Deterministic phase transitions from trust and thresholds

**Legal Status:** Patent-protected control relationship

### 2.4 Trust Horizon and Predictive Governance

**Covered by:** Patent Family B (Claims 1c, 10, 11, 12, 13)

Includes:
- Divergence trend extrapolation for forward trust projection
- Crisis memory bank with cosine similarity matching
- Bayesian crisis pattern recognition
- Adaptive recovery rate based on severity and recurrence
- Post-crisis probation with configurable duration
- Authority multiplier from horizon predictions
- Crisis ledger with cryptographic hash chain

**Legal Status:** Patent-protected predictive mechanism

### 2.5 Non-Bypassable Enforcement

**Covered by:** Patent Family B (Claims 1d, 1e, 14)

Includes:
- Authority gate: all modifications must pass before reaching governed state
- No bypass regardless of modification source or type
- Enforced modification magnitude at most proposed modification magnitude
- System can only attenuate or block; never amplify

**Legal Status:** Patent-protected system architecture

### 2.6 Two-Layer Rollback Mechanism

**Covered by:** Patent Family B (Claims 1e, 17, 18)

Includes:
- Layer 1: governance internal state snapshots (divergence history, trust EMA, step count)
- Layer 2: domain-specific external state snapshots via domain adapter
- Independent restore paths for both layers
- Trust-triggered and consecutive-frozen-steps-triggered rollback
- Bounded snapshot stack with immutable deep copies

**Legal Status:** Patent-protected safety mechanism

### 2.7 Domain Adapter Pattern

**Covered by:** Patent Family B (Claims 1, 19)

Includes:
- Abstract adapter interface for domain-agnostic governance
- Divergence computation, state capture, state restoration methods
- Governance logic unchanged across different domains
- Concrete adapter substitution without governance modification

**Legal Status:** Patent-protected architectural pattern

### 2.8 Audit Chain

**Covered by:** Patent Family B (Claims 1f, 20, 21, 22, 23)

Includes:
- Per-step governance records: divergence, trust, authority, action, timestamp
- Collision-resistant cryptographic hash per record
- Sequential chain linking (each record hashes preceding record)
- Session root hash identifying complete decision sequence
- Tamper evidence: modification breaks all subsequent hashes
- Deterministic replay and post-event forensic reconstruction

**Legal Status:** Patent-protected audit mechanism

### 2.9 N-axis Divergence Monitoring

**Covered by:** Patent Family B (Claims 4, 5, 6)

Includes:
- Configurable number of measurement axes (N >= 2)
- Temporal axis computed from combined divergence history
- Exponentially-weighted first differences for temporal computation
- Configurable per-axis weights

**Legal Status:** Patent-protected measurement methods

### 2.10 Recovery and Emergency Mechanisms

**Covered by:** Patent Family B (Claims 24, 25)

Includes:
- Automatic trust recovery after consecutive low-stress evaluation steps
- Recovery rate modulated by crisis severity and recurrence
- Emergency override forcing minimum trust on extreme divergence

**Legal Status:** Patent-protected safety mechanisms

### 2.11 Cross-Reference to Actuation Governance

**Covered by:** Patent Family B (Claim 26)

Includes:
- Acknowledgment that the governance system operates alongside a separate actuation governance layer
- The two layers are independent but complementary: one governs adaptation, the other governs actuation

**Note:** This claim does not claim the combination. The actuation governance system is claimed in Family A.

**Legal Status:** Patent-protected cross-reference

---

## 3. TRADE SECRET ASSETS

### 3.1 Tuning and Calibration
- Specific threshold values (nominal, constrained, frozen, rollback)
- Decay gain parameter values
- EMA smoothing alpha values
- Divergence weight coefficients
- Asymmetric decay-to-recovery ratio values
- Crisis similarity threshold values

**Legal Status:** Trade Secret -- Safety Calibration

### 3.2 Implementation Details
- Specific data structures and serialization formats
- Performance optimization techniques
- Platform-specific adaptations
- Concrete domain adapter implementations

**Legal Status:** Trade Secret -- Implementation

---

## 4. COPYRIGHTED ASSETS

### 4.1 Source Code
- governor.py, trust_module.py, authority_gate.py, divergence_monitor.py, rollback_controller.py, audit_logger.py, trust_horizon.py, contracts.py

**Legal Status:** Copyright -- Software

---

## 5. CROSS-FAMILY RELATIONSHIPS

- **Family A (Runtime Actuation Governance):** Complementary layer. Family A governs actuation; Family B governs adaptation. Claim 26 cross-references Family A without claiming the combination.
- **Family D (Cross-Subsystem Coordination):** Bridges coordination layer transmits governance trust signals across subsystems, each of which may employ the governance system of Family B.
- **Family F (Cognitive Memory Governance):** Applies the governance architecture of Family B to memory formation and retrieval.
- **Family G (Agent Swarm Governance):** Applies the governance architecture of Family B to multi-agent coordination.

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Owner: The Wayfinder Trust*
