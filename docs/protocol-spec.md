# SkillChain Protocol Specification — Trust, Governance, and Consensus

> PROPRIETARY AND CONFIDENTIAL — The Wayfinder Trust / Northstar Systems Group

This document defines the SkillChain governance protocol, combining the philosophical foundation, the Assured Learning Governor (ALG, Patent Family B), and NeuroPRIN (Patent Family A) into a single specification.

---

## 1. Core Principle

**Trust is EARNED, never assumed.**

Every autonomous system starts with full authority locked down. Authority is granted gradually as the system demonstrates reliability through measurable divergence metrics. Trust decays fast when things go wrong (7.5x decay gain) but recovers slowly through consistent good behavior. This asymmetry is intentional — it is always safer to over-constrain than to over-trust.

---

## 2. Patent Family B — Assured Learning Governor (ALG)

The ALG is a domain-agnostic runtime governor that monitors, assesses, and controls adaptive/learning systems. It does NOT own domain state — it governs it through a DomainAdapter interface. Every decision is deterministic given identical inputs and recorded in a SHA-256 tamper-evident audit chain.

### 2.1 Pipeline: OBSERVE -> ASSESS -> ANTICIPATE -> CHECK -> MODULATE -> ENFORCE -> AUDIT

#### Stage 1: OBSERVE (DivergenceMonitor)

Compute N-axis divergence between current state and validated baseline.

- Domain adapter provides pre-computed axis values (e.g., portfolio_drift, signal_drift)
- "temporal" axis is computed internally from combined-divergence history
- Combined divergence = weighted sum of all axes (weights must sum to 1.0)
- Temporal divergence only penalizes increasing trends (max(val, 0.0))

**Temporal Divergence Formula:**
```
diffs[i] = history[i] - history[i-1]   (first differences)
weights[i] = alpha^(n-1-i)             (alpha=0.5, exponential recency bias)
temporal_div = sum(w * d) / sum(w)      (weighted average of diffs)
```

**Combined Divergence:**
```
combined = sum(weight[axis] * value[axis])   for non-temporal axes
         + weight["temporal"] * max(temporal_div, 0.0)
```

**Default Configuration:**
- Axes: ("primary", "secondary", "temporal")
- Weights: primary=0.5, secondary=0.3, temporal=0.2
- Thresholds: primary=0.15, secondary=0.20, temporal=0.10
- History window: 20 samples

**False Positive Detection:**
- Transient spike: current reading far above last 2 readings (>0.6x threshold)
- Calibration window: context["calibrating"] == True
- Noise jump: low-variance history (var < 0.001) + sudden outlier (>5x std AND >2x mean)

**Trend Analysis:**
- "rising": >60% positive diffs
- "falling": >60% negative diffs
- "volatile": >=50% direction changes in window
- "stable": otherwise

#### Stage 2: ASSESS (TrustModule)

Compute trust score from divergence using exponential decay + EMA smoothing.

**Core Trust Formula:**
```python
raw_trust = exp(-trust_decay_gain * combined_divergence)
```

Properties:
- trust = 1.0 when combined_divergence = 0.0
- Monotonically non-increasing with divergence
- Asymptotically approaches 0.0

**EMA Smoothing:**
```python
smoothed = alpha * raw_trust + (1 - alpha) * prev_ema
# Initial EMA = 1.0 (healthy baseline)
```

**Phase Classification:**
Walk phase_thresholds in descending order; first phase where trust >= threshold wins.

**Default Phase Thresholds:**

| Phase | Threshold | Action |
|-------|-----------|--------|
| nominal | >= 0.55 | ALLOW |
| constrained | >= 0.35 | CONSTRAIN |
| _below_all | < 0.35 | ROLLBACK |

**Default Parameters:**
- ema_alpha: 0.3
- trust_decay_gain: 3.0
- Trust history buffer: 200 samples

**GovernanceAction Enum:**
- ALLOW: Permit without modification
- CONSTRAIN: Permit with bounds applied
- FREEZE: Block entirely, hold current state
- ROLLBACK: Block and revert to last validated snapshot

**is_divergent Flag:**
```python
is_divergent = (combined_divergence > 0.0) and (trust_score < first_phase_threshold)
```

#### Stage 3: ANTICIPATE (TrustHorizon — optional overlay)

Predictive trust projection with Bayesian crisis memory. Composable — governor works identically without it.

**Three capabilities:**

**3a. Trust Projection:**
```python
projected_div = current_div + trend_slope * horizon_steps    # only if slope > 0
projected_trust = exp(-trust_decay_gain * projected_div)
```

Trend slope is EMA-smoothed:
```python
raw_slope = divergence_history[-1] - divergence_history[-2]
trend_slope = alpha * raw_slope + (1-alpha) * prev_slope    # alpha=0.3
```

**3b. Preemptive Authority Constraint:**
```python
trigger = rollback_threshold * preemptive_threshold    # default: 0.20 * 1.5 = 0.30
is_constraining = projected_trust < trigger
```

Authority Multiplier (applied on top of normal authority):
```python
if projected >= trigger:
    multiplier = 1.0                          # horizon clear
else:
    t = (projected - rollback_threshold) / (trigger - rollback_threshold)
    t = clamp(t, 0.0, 1.0)
    multiplier = 0.3 + 0.7 * t               # range [0.3, 1.0]
```

During probation: hard cap at 0.6 (max 60% authority). Horizon only constrains, NEVER amplifies authority.

**3c. Crisis Memory (Bayesian Ledger):**
Append-only SHA-256 chained ledger of trust failure events.

Crisis Similarity (cosine):
```python
sim = dot(a, b) / (|a| * |b|)    # handles mismatched keys as 0
similar = count of past crises with sim >= similarity_threshold (0.7)
```

Adaptive Recovery Rate:
```python
severity_factor = exp(-severity_gain * trust_drop)    # gain=2.0
recurrence_factor = 1 / (1 + n_similar)
probation_factor = 0.5 if in_probation else 1.0
effective = base_rate * severity * recurrence * probation
effective = clamp(effective, 0.001, base_rate)         # floor 0.1%/tick
```

**Default TrustHorizon Config:**
- horizon_steps: 5, preemptive_threshold: 1.5, max_crisis_records: 50
- similarity_threshold: 0.7, base_recovery_rate: 0.05, severity_gain: 2.0
- probation_ticks: 10, trend_ema_alpha: 0.3

#### Stage 4: CHECK (RollbackController)

Two-layer rollback management: governor internal state + domain external state.

**Rollback Triggers:**
1. trust_score < rollback_trust_threshold (default: 0.20)
2. consecutive FREEZE steps >= consecutive_frozen_steps_for_rollback (default: 10)

AND at least one validated snapshot exists.

**Snapshot Stack:**
- Max snapshots: 5 (oldest evicted when exceeded)
- Deep-copied for immutability
- Two layers: governor_state (divergence history, trust EMA, step count) + domain_state (via adapter)

**Staged Rollback:** Can roll back through intermediate phases (frozen -> constrained -> nominal).

#### Stage 5: MODULATE (AuthorityGate)

Map trust to concrete authority bounds with linear interpolation within phases — the key feature preventing hard discontinuities at phase boundaries.

```python
t = (trust_score - lo) / (hi - lo)    # clamped [0, 1]
bound = lo_val * (1-t) + hi_val * t   # linear interpolation
```

**Default Phase Authority:**

| Phase | authority_scale | allow_operations | allow_structural_changes |
|-------|-----------------|-------------------|--------------------------|
| nominal | 1.0 | 1.0 | 1.0 |
| constrained | 0.5 | 1.0 | 0.0 |
| frozen | 0.0 | 0.0 | 0.0 |

**Subsystem-Specific Phase Actions (7 subsystems):** neuros, value_engine, neurofs, neurovis, streamshark, wayfinder, bridges. Each with 4 phases (nominal, degraded, maintenance, critical).

**Phase Deadlock Detection:** Monitors oscillation within 10-entry window. Flags at 5+ transitions. Phase lockout: minimum 30s between phase changes.

#### Stage 6: ENFORCE (DomainAdapter)

**DomainAdapter ABC (5 methods):**
```python
compute_divergence_axes(**kwargs) -> Dict[str, float]
capture_domain_state() -> Dict[str, Any]
restore_domain_state(state: Dict[str, Any])
apply_authority(authority, action)
get_version() -> str
```

#### Stage 7: AUDIT (AuditLogger)

SHA-256 chained audit trail. Every governance decision recorded with: timestamp, domain, version, divergence, trust, authority, action_taken, notes, prev_record_hash.

### 2.2 Data Contracts (all frozen dataclasses)

- **DivergenceResult:** axes (Dict[str, float]), combined_divergence (float)
- **TrustResult:** trust_score (float), phase (str), action (GovernanceAction), is_divergent (bool)
- **AuthorityResult:** authority_scale (float), bounds (Dict[str, float]), allow_operations (bool), allow_structural_changes (bool)
- **AuditRecord:** SHA-256 chain with prev_record_hash linking records

### 2.3 Usage Pattern

```python
adapter = TradingDomainAdapter(config)
governor = AssuredGovernor.create(
    adapter=adapter,
    domain="trading",
    trust_config=TrustModuleConfig(
        trust_decay_gain=7.5,
        ema_alpha=0.3,
        phase_thresholds=(("nominal", 0.55), ("constrained", 0.35)),
    ),
    horizon_config=TrustHorizonConfig(),  # optional predictive trust
)

# Evaluation loop:
trust, authority, action = governor.evaluate(drawdown_pct=0.05, recent_win_rate=0.55)

# Mark current state as safe baseline:
governor.validate_state("v1.0")

# Verify audit integrity:
assert governor.verify_audit_chain()
```

---

## 3. Patent Family A — NeuroPRIN (Neural Predictive Runtime Integrity Network)

NeuroPRIN is a runtime governor for autonomous system outputs. Unlike ALG which governs learning/adaptive systems, NeuroPRIN governs system outputs — it sits between a controller and its actuators, evaluating trust and applying constraints in real-time.

### 3.1 GovernanceNet Architecture

Pure-numpy inference-only MLP. Training happens externally (PyTorch).

```
Input (11D) -> Linear(11, 128) + ReLU -> Linear(128, 128) + ReLU -> 3 heads
```

**Three output heads:**
- trust_head: Linear(128, 1) -> sigmoid -> [0, 1] trust score
- degraded_head: Linear(128, 1) -> raw logit (>0 means degraded)
- unsafe_head: Linear(128, 1) -> raw logit (>0 means unsafe)

**Total parameters: 18,435**

**11D Governance Feature Vector (AUTHORITATIVE ORDER):**
```
[0] expected_accel_m_s2       [6] traction_coeff
[1] observed_accel_m_s2       [7] vehicle_mass_kg
[2] accel_error               [8] sensor_disagreement
[3] slip_ratio                [9] actuator_limit_scale
[4] speed_error_m_s          [10] road_grade
[5] rolling_trust
```

**Weight Format: VELMAGNV Binary**
- 8-byte magic: `VELMAGNV`
- uint64 parameter count (18,435)
- float32 params in layout: enc0_w[128,11], enc0_b[128], enc1_w[128,128], enc1_b[128], out_w[3,128], out_b[3]
- Output layer stored with 0.5x scaling; 2.0x rescaling applied on load

### 3.2 NeuroPRINMonitor — 9-Stage Trust Pipeline

1. **Instant Trust** — exponential decay from prediction error
2. **Rolling Trust** — EMA smoothing (alpha=0.35, window=10)
3. **Governance Model Forward Pass** — 11D -> {trust_score, degraded_logit, unsafe_logit}
4. **Trust Modulation** — model_trust * rolling_trust
5. **Hard Envelope Check** — structural safety state machine (max_slip=0.45, max accel=4.0 m/s^2)
6. **Physics Threshold Checks** — unsafe/degraded thresholds for slip and accel error
7. **ODD Violations** — Operational Design Domain boundary checks
8. **Recovery Hysteresis** — dwell-based recovery with authority-limited fast path
9. **Final Signal Assembly** — clamp and classify

### 3.3 Constraint Derivation

| Priority | Condition | Severity | Scale |
|----------|-----------|----------|-------|
| 1 | unsafe | HARD_LIMIT | 0.50 (50%) |
| 2 | recovery release | None | release |
| 3 | degraded | SOFT_LIMIT | 0.75 (75%) |
| 4 | nominal | None | 1.0 (100%) |

### 3.4 ConstraintAdapter — Enforcement Layer

**Severity semantics (EXPLICIT AND FROZEN):**
```
NONE       -> no modification
ADVISORY   -> no modification (audit only)
SOFT_LIMIT -> bounded scaling (output clamped to absolute_max * max_torque_scale)
HARD_LIMIT -> strict clamping (output clamped, or failsafe if no bounds specified)
FAILSAFE   -> deterministic override (output = failsafe_value, default 0.0)
```

Anti-amplification guard: enforced magnitude NEVER exceeds requested magnitude. Multiple constraints: highest severity wins. Default hardware bound: absolute_max = 400.0.

### 3.5 Runtime Configuration

```python
# Trust computation
trust_decay_gain = 0.6, smoothing_alpha = 0.35, noise_floor = 2.0, trust_window = 10

# Trust thresholds
degraded_trust = 0.55, unsafe_trust = 0.35

# Constraint scales
soft_torque_scale = 0.75, hard_torque_scale = 0.50

# Hard envelope limits
max_slip = 0.45, max_long_accel = 4.0, max_lat_accel = 4.0

# Recovery hysteresis
recovery_dwell = 8, recovery_trust_margin = 0.05, recovery_release_trust = 0.65

# ODD bounds
odd_speed: [0.0, 45.0], odd_traction: [0.20, 1.20], odd_grade: [-0.15, 0.15]
odd_sensor_disagree_max = 2.0, odd_actuator: [0.0, 1.25]
absolute_max_output = 400.0, failsafe_output = 0.0
```

---

## 4. AE Resonance Provider — Kuramoto Coupled Oscillators

Models subsystems as coupled oscillators using the E-R-I (Energy-Resonance-Information) framework.

### 4.1 Subsystem Natural Frequencies
```
NeurOS:             10 Hz   (100ms tick)
Value Engine:       0.1 Hz  (10s cycle)
NeuroFS:            1 Hz    (1s consolidation)
Applied Energetics: 0.1 Hz  (10s analysis)
Wayfinder Series:   0.05 Hz
```

### 4.2 Kuramoto Model
```python
coupling_sum = (1/N) * sum(K_ij * sin(theta_j - theta_i))
theta_i += dt * (omega_i + coupling_sum)
r = |1/N * sum(exp(i * theta_j))|    # order parameter, [0,1]
```

### 4.3 Trust-Modulated Coupling
```python
K_ij = coupling_base * sqrt(trust_i * trust_j)
# Default coupling_base = 2.0, dt = 0.01
```

### 4.4 Phase Mapping
```
r >= 0.8 -> OPTIMAL, r >= 0.5 -> FUNCTIONAL, r >= 0.2 -> RESTRICTED, r < 0.2 -> CRITICAL
```

---

## 5. Governance Mesh — Cross-Subsystem Coordination

NOT a super-governor. Each subsystem's ALG governor remains fully autonomous.

**Three Functions:**
1. Phase propagation: detects phase transitions, emits GovernanceEvents
2. Critical override: if ANY subsystem enters CRITICAL, force others to at least RESTRICTED
3. Trust synchronization: feeds trust/phase from each governor into TrustTemporalAligner

**Unified Phase System (5 levels):**
```
INITIALIZING (0) < OPTIMAL (1) < FUNCTIONAL (2) < RESTRICTED (3) < CRITICAL (4)
```

**Unified Audit Chain:** Cross-subsystem SHA-256 chained audit entries:
```python
entry_hash = SHA256(
    entry_id | sequence | timestamp | source | operation |
    phase | trust_score | details | source_record_hash | prev_entry_hash
)
```

---

## 6. Key Design Principles

1. **Governor does NOT own domain state** — it governs via adapter
2. **NeuroPRIN governs outputs** (Patent Family A) — ALG governs learning (Patent Family B)
3. **All decisions deterministic** given identical inputs
4. **Every decision audited** in tamper-evident chain
5. **Authority never amplifies** — only constrains
6. **Trust is monotonically non-increasing** with divergence
7. **Enforcement never amplifies** the domain request
8. **Anti-amplification**: enforced magnitude NEVER exceeds original request
9. **Mesh is NOT a super-governor** — each subsystem governor is autonomous
10. **All contracts are frozen dataclasses** — immutable, auditable
11. **Trust asymmetry is intentional** — fast decay, slow recovery
