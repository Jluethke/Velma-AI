# INVENTION SPECIFICATION

**Title:** Runtime Trust-Based Governance System for Safety-Critical Adaptive Systems

**Applicant:** The Wayfinder Trust
**Inventor:** Jonathan Luethke
**Status:** READY FOR FILING

---

## Field of the Invention

The present invention relates to safety systems for adaptive and learning-enabled systems, and more particularly to runtime supervision of adaptive processes by enforcing bounded operational modifications based on measured divergence between validated and current system behavior. The invention further relates to predictive trust projection, asymmetric trust dynamics, linear interpolation of authority constraints, two-layer rollback, domain-agnostic governance via an abstract adapter interface, and cryptographically auditable enforcement.

---

## Background / Problem Statement

Adaptive and AI-controlled systems are increasingly deployed in safety-critical domains such as autonomous vehicles, robotics, aerospace, and industrial automation. These systems employ online or periodic learning to modify internal parameters based on operational experience. When deployed in environments where failure has severe consequences, uncontrolled adaptation may cause system behavior to diverge from validated expectations, resulting in unsafe states.

Existing approaches rely on:
- Offline validation of models before deployment
- Static safety envelopes that do not account for adaptation dynamics
- Manual review of parameter updates by human engineers
- Post-hoc testing of updated models after deployment

However, there is no general runtime mechanism that:
- Measures divergence between pre-modification and post-modification system behavior across multiple configurable axes
- Quantifies trust in the adaptive process based on observed behavioral change
- Projects trust forward in time to anticipate degradation before it occurs
- Matches current divergence patterns against historical crisis records
- Limits authority proportionally to measured divergence with smooth interpolation
- Enforces hard bounds on modification magnitude and rate
- Triggers automatic two-layer rollback when trust degrades below safe levels
- Produces tamper-evident records of all governance decisions

This creates a gap between adaptation freedom and adaptation safety. The gap is not addressed by actuation-level governance (such as the system described in the related Patent Family A), which monitors model-reality divergence at the control output level. An actuation governor can detect bad behavior, but cannot prevent the adaptive process from making the governed system worse. A distinct governance layer is required: one that monitors and constrains the adaptive process itself.

### Distinction from Prior Art

The present invention governs LEARNING -- what a system is allowed to BECOME -- as opposed to all identified prior art which governs ACTIONS -- what a system is allowed to DO. This is a fundamental distinction. Existing runtime governance systems (Neural Simplex Architecture, Aegis, Sovereign-OS, TrustBench) monitor and constrain system outputs, but none monitor or constrain the adaptive process that modifies system parameters. An actuation governor can detect that a system is behaving badly, but cannot prevent the learning process from making the system worse. The present invention interposes between the adaptive process and the system state it seeks to modify, constraining the rate and magnitude of parameter changes proportionally to measured behavioral divergence.

The ATOM OS system (ATOM Labs, 2024-2025) provides probabilistic trust scoring with decay functions for governed machine reasoning. However, ATOM OS appears to govern reasoning and inference decisions, not the learning process that modifies model parameters. ATOM OS does not disclose multi-axis divergence monitoring, crisis memory banks with vector similarity matching, two-layer rollback of both governance and domain state, or the domain adapter interface enabling algorithm-agnostic governance.

While exponential decay functions are known in probabilistic trust models (El Salamouny et al., 2009), the present invention applies exponential decay specifically to governance of adaptation authority -- computing trust from multi-axis divergence between current and validated system behavior, projecting trust forward via divergence trend extrapolation, matching against crisis memory records, and enforcing graduated authority constraints on parameter modifications through a domain-agnostic adapter interface. The mathematical decay function is a known building block; the application to learning governance with crisis memory, predictive trust projection, and two-layer rollback is novel.

The AuditableLLM framework (2025) provides hash-chain-backed audit trails for LLM training operations, but audits operations post-hoc rather than governing them at runtime. AuditableLLM has no trust computation, no authority modulation, and no rollback mechanism.

---

## Summary of the Invention

The invention provides a runtime supervisory governance system that implements a six-stage pipeline: OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, and AUDIT (see FIG. 1). The system:

- Observes divergence across a configurable number of measurement axes via a domain adapter interface (see FIG. 2)
- Computes trust via an exponential decay function with exponential moving average smoothing, exhibiting asymmetric trust dynamics (see FIG. 2)
- Projects trust forward using divergence trend extrapolation and matches against crisis records in a Bayesian crisis memory bank (see FIG. 3)
- Maps trust to authority constraints via linear interpolation between phase-specific levels (see FIG. 4)
- Enforces authority constraints and triggers two-layer rollback when trust degrades (see FIG. 5)
- Records all decisions in a tamper-evident cryptographic hash chain (see FIG. 6)
- Manages phase transitions via a deterministic state machine with hysteresis (see FIG. 7)

The invention operates independently of the upstream adaptive process. It does not generate operational modifications of its own. It constrains, scales, or blocks modifications produced by an upstream adaptive system when unsafe divergence is detected. It achieves domain-agnostic operation through an abstract domain adapter interface.

---

## System Architecture

The system comprises six modules plus a domain adapter interface:

### Observation Module (Divergence Monitor) -- see FIG. 2

Monitors divergence across N configurable named axes. The domain adapter provides pre-computed axis values for domain-specific axes, while the temporal axis is computed internally from the combined divergence history.

**Divergence metrics:**
- Domain-specific axes: provided by the domain adapter (e.g., resource utilization drift, performance drift, signal deviation).
- Temporal axis: rate of change of combined divergence, computed using exponentially-weighted first differences of the combined divergence history.
- Combined divergence: configurable weighted aggregate of all axis values, where each axis has an associated configurable weight.

The observation module includes false positive detection to filter transient spikes and noise jumps, and divergence trend analysis to classify the recent divergence trajectory as rising, falling, stable, or volatile.

### Assessment Module (Trust Module) -- see FIG. 2

Transforms combined divergence into a bounded trust score using exponential decay with temporal smoothing.

**Trust computation:**
```
raw_trust = f(exp(-gain * combined_divergence))
smoothed_trust = alpha * raw_trust + (1 - alpha) * prev_smoothed_trust
```

The trust function guarantees:
- Trust equals 1.0 when combined divergence equals 0.
- Trust is monotonically non-increasing with divergence.
- Trust asymptotically approaches 0 as divergence grows.
- Trust exhibits asymmetric dynamics: trust decays at a faster effective rate than it recovers, with a configurable decay-to-recovery ratio.

The raw trust is smoothed with an exponential moving average. The EMA coefficient is selected to preserve a consistent effective time constant across different observation intervals. An optional post-trust callback allows domain-specific adjustments.

### Anticipation Module (Trust Horizon) -- see FIG. 3

Provides predictive governance through three capabilities:

1. **Trust Projection:** Projects trust forward over a configurable number of evaluation steps using an exponentially-smoothed divergence trend slope. Only projects in the worsening direction.

2. **Crisis Memory Bank:** A bounded, append-only ledger of past trust crises. Each crisis record captures the divergence signature across all axes, combined divergence, minimum trust, trust drop magnitude, elapsed interval since prior crisis, action taken, and a cryptographic hash linking to the preceding crisis record. Crisis records are matched against current divergence using a vector similarity function such as cosine similarity.

3. **Adaptive Recovery Rate:** A function of crisis severity (depth of trust drop) and recurrence (number of similar past crises). Includes post-crisis probation with a configurable duration that further constrains authority.

The anticipation module exposes an authority multiplier in [0, 1] that the modulation module applies. The multiplier only constrains and never amplifies authority.

### Modulation Module (Authority Gate) -- see FIG. 4

Maps trust to concrete authority bounds using linear interpolation within each phase. Within each phase, authority interpolates linearly between the adjacent lower phase bounds and the current phase bounds. This eliminates discontinuous jumps at phase boundaries.

Invariants:
- Authority bounded within [0, 1].
- Monotonically non-increasing with trust loss.
- No amplification.
- Zero authority when frozen.

The modulation module includes phase deadlock detection to identify rapid oscillation between phases, and phase lockout to prevent phase changes faster than a configurable minimum hold period.

### Enforcement Module (Rollback Controller) -- see FIG. 5

Applies authority constraints to proposed modifications, clamps parameter changes, and manages two-layer rollback to known-good state snapshots.

**Two-layer snapshots:**
- Layer 1 (Governance State): Internal governor module state including divergence history, trust EMA, and step count.
- Layer 2 (Domain State): Domain-specific external state captured via the domain adapter.

Both layers are deep-copied at validation time for snapshot immutability. Both are restored independently during rollback. The number of retained snapshots is bounded by a configurable maximum.

**Rollback triggers:**
- Trust below rollback threshold.
- Trust has been in frozen state for more than a configurable number of consecutive steps.

The enforcement module includes rollback safety validation (checking for in-flight transactions and data corruption risk) and staged rollback capability for gradual recovery through intermediate phases.

### Audit Module (Audit Logger) -- see FIG. 6

Produces tamper-evident, hash-chained records of every governance decision. Each record is hashed using a collision-resistant cryptographic hash function applied to a canonical serialization. Each hash includes the preceding record's hash.

**Chain properties:**
- Append-only: records cannot be modified or deleted.
- Deterministic: identical inputs produce identical hashes.
- Tamper-evident: modification of any record breaks all subsequent hashes.
- Exportable for external verification and compliance.

### Domain Adapter Interface

An abstract interface that domain-specific implementations satisfy. Comprises:
- Divergence computation: accepts domain-specific parameters, returns axis values.
- State capture: returns serializable domain state snapshot.
- State restoration: restores domain state from snapshot.
- Version accessor: returns current version identifier.
- Authority application: applies authority bounds and governance action to the domain.

The governance system operates identically across different domains by substituting different concrete adapter implementations.

---

## Data Flow -- see FIG. 1

The governance pipeline executes the following fixed sequence at each evaluation step:

1. Domain adapter provides divergence measurements across configured axes.
2. Observation module computes temporal divergence from internal history and produces the combined divergence.
3. Assessment module computes raw trust via exponential decay, applies EMA smoothing, and classifies operational phase.
4. Anticipation module updates divergence trend, projects trust forward, checks for crisis pattern matches, and computes authority multiplier.
5. Enforcement module evaluates rollback conditions (trust below threshold or excessive consecutive frozen steps).
6. If rollback is triggered, crisis is recorded in the anticipation module's memory bank and two-layer rollback is executed.
7. Modulation module computes authority from trust via linear interpolation; anticipation module's multiplier is applied.
8. Enforcement module applies final authority constraint via domain adapter.
9. Audit module generates record, computes hash, and appends to chain.

---

## Trust Computation -- see FIG. 2

```
raw_trust = f(exp(-gain * combined_divergence))
smoothed_trust = alpha * raw_trust + (1 - alpha) * prev_smoothed_trust
```

- Trust bounded [0, 1].
- Responsive to large divergence.
- Stable under transient spikes due to EMA smoothing.
- Sustained divergence causes monotonic trust decay.
- Asymmetric dynamics: configurable decay-to-recovery ratio ensures trust decays faster than it recovers.
- May be overridden to unsafe by operational boundary violations.
- Post-trust callback allows domain-specific adjustments.

---

## Authority Mapping -- see FIG. 4

The modulation module implements linear interpolation within each phase:

Within the top phase: authority interpolates between second-phase bounds and top-phase bounds as trust varies from the second-phase threshold to 1.0.

Within middle phases: authority interpolates between the next-lower-phase bounds and the current-phase bounds as trust varies within the phase range.

At the lowest phase: authority is fixed at the lowest-phase bounds.

Below all phases: authority is fixed at zero (frozen bounds).

The anticipation module's authority multiplier further modulates the computed authority. Since both factors are in [0, 1], the result is always in [0, 1] and can only further constrain.

---

## Phase Management -- see FIG. 7

Phases are defined as a finite ordered set with configurable trust thresholds. Typical phases:

- **Nominal:** Trust at or above highest threshold. Full authority. All operational modifications permitted.
- **Constrained:** Trust between highest and intermediate threshold. Reduced authority.
- **Frozen:** Trust below frozen threshold. Zero authority. No modifications applied.

Transitions are deterministic functions of trust and thresholds. The phase state machine may include hysteresis and minimum hold periods to prevent oscillation at phase boundaries.

---

## Formal Safety Envelope

Fixed numeric bounds constraining operations independently of trust:
- Authority ceiling (fixed at 1.0)
- Modification magnitude ceiling
- Divergence ceiling (exceeding triggers immediate freeze)
- Rollback threshold floor

The envelope is defined outside the governed system, serialized, hashed, and included in the audit chain. It cannot be overridden by trust or any other component.

---

## BRIEF DESCRIPTION OF THE DRAWINGS

- **FIG. 1** is a system block diagram illustrating the six-stage governance pipeline (OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT) showing data flow from the domain adapter through each module to the governed system and audit trail. The diagram shows the domain adapter interface at the boundary between the governance system and the governed domain, with proposed modifications entering at the OBSERVE stage and enforced modifications exiting at the ENFORCE stage.

- **FIG. 2** is a data flow diagram illustrating the trust computation flow. Divergence inputs from N configurable measurement axes enter the observation module, which computes the combined divergence as a weighted aggregate. The combined divergence enters the assessment module, which applies the exponential decay function to produce raw trust, then applies exponential moving average smoothing to produce the smoothed trust score. The diagram shows the asymmetric decay-to-recovery ratio and the optional post-trust callback.

- **FIG. 3** is a diagram illustrating the trust horizon (anticipation) module. The diagram shows the divergence trend extrapolation projecting combined divergence forward over configurable steps, the resulting projected trust trajectory, the crisis memory bank with stored divergence signatures, the cosine similarity matching between current divergence and stored crisis patterns, and the computation of the authority multiplier and adaptive recovery rate.

- **FIG. 4** is a graph illustrating the authority gate mapping from trust to authority. The horizontal axis represents trust from 0 to 1, and the vertical axis represents authority from 0 to 1. The graph shows the phase boundaries (nominal, constrained, frozen, rollback) with linear interpolation within each phase providing smooth transitions. The graph demonstrates that authority is monotonically non-increasing with trust loss and that there are no discontinuities at phase boundaries.

- **FIG. 5** is a diagram illustrating the two-layer rollback mechanism. The diagram shows two independent storage paths: Layer 1 for governance state snapshots (divergence history, trust EMA, step count) and Layer 2 for domain state snapshots (captured via the domain adapter interface). The diagram shows the validation path (capturing snapshots at validation time), the rollback path (restoring both layers independently), and the bounded snapshot stack with oldest-first eviction.

- **FIG. 6** is a diagram illustrating the audit trail structure. The diagram shows a sequence of governance records, each containing divergence values, trust score, authority bounds, governance action, and metadata. Each record includes a collision-resistant cryptographic hash computed over its contents and the hash of the preceding record. The genesis hash anchors the start of the chain, and the session root hash at the end uniquely identifies the complete governance session. The diagram illustrates tamper detection: modification of any record causes a hash mismatch that propagates to all subsequent records.

- **FIG. 7** is a state machine diagram illustrating the operational phases and transitions. The diagram shows the nominal, constrained, frozen, and rollback states arranged in order of decreasing trust. Transitions between phases are governed by configurable trust thresholds. The diagram shows hysteresis at phase boundaries (the threshold for entering a degraded phase differs from the threshold for exiting it) and the deterministic nature of transitions.

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Applicant: The Wayfinder Trust*
