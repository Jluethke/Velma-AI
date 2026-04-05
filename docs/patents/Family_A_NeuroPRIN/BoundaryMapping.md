# IP BOUNDARY MAP

**Project:** NeuroPRIN Runtime Governance System
**Patent Family:** A -- Runtime Trust-Based Authority Governor for Autonomous Systems
**Owner:** The Wayfinder Trust
**Date:** 2026-02-13 (updated 2026-03-31)
**Classification:** Confidential -- Internal / NDA Use Only

---

## 1. PURPOSE

Define boundaries between patent-protected inventions, trade secrets, copyrighted works, and openly disclosed assets within the NeuroPRIN project.

- (a) Prevent accidental disclosure of protected IP
- (b) Preserve enforceable patent scope
- (c) Preserve trade secret status for calibration and implementation
- (d) Clarify product-to-IP relationships
- (e) Guide publication, partnerships, and licensing decisions

All personnel with NeuroPRIN access must consult this map before disclosure.

---

## 2. PATENT-COVERED ASSETS

Coverage extends to functional behavior, not code or numeric values.

### 2.1 Runtime Governance Architecture

**Covered by:** Patent Family A (Claims 1, 23, 24, 25)

Includes:
- Runtime comparison of expected vs observed behavior
- Model-reality divergence computation
- Trust derivation from divergence
- Runtime safety supervision
- Independent supervisory layer between controller and actuators
- Deterministic governance path
- System does not generate autonomous control commands

**Legal Status:** Patent-protected functional behavior

### 2.2 Multi-Stage Trust Evaluation Pipeline

**Covered by:** Patent Family A (Claims 1d-e, 4, 5, 6, 7)

Includes:
- Instantaneous trust from bounded decay function
- Temporal smoothing via exponential moving average
- Neural trust inference through multi-head network
- Trust modulation (combining smoothed and neural trust)
- Feature vector construction from divergence and context
- Multi-head output: trust score + degraded classification + unsafe classification

**Legal Status:** Patent-protected trust computation method

### 2.3 Trust to Authority Mapping

**Covered by:** Patent Family A (Claims 1f, 8, 9)

Includes:
- Mapping trust to actuation limits via monotonic non-increasing function
- Authority scaling based on trust
- State-based authority modulation (Nominal, Degraded, Failsafe)
- Pre-instability intervention

**Legal Status:** Patent-protected control relationship

### 2.4 Enforcement Adapter

**Covered by:** Patent Family A (Claims 1g, 10, 11, 12)

Includes:
- Non-bypassable enforcement path for all commands
- Controller-agnostic constraint application
- Declarative constraint enforcement without interpreting governance logic
- Constraint severity hierarchy (advisory, bounded scaling, strict clamping, failsafe override)
- Anti-amplification invariant (enforced never exceeds requested)
- Multiple constraint resolution (highest severity wins)
- Independence from controller internal logic, state, and execution semantics

**Legal Status:** Patent-protected system architecture

### 2.5 Formal Safety Envelope

**Covered by:** Patent Family A (Claims 13, 14, 15, 16)

Includes:
- Configurable bounds on allowable system behavior
- Enforced independently of trust value
- Declared outside of learned model
- Immutable at runtime
- Cryptographically bound to audit chain
- Violation forces failsafe regardless of trust
- Recovery state machine (inactive, unsafe, recovering)

**Legal Status:** Patent-protected safety contract

### 2.6 Recovery Hysteresis

**Covered by:** Patent Family A (Claims 16, 17)

Includes:
- Configurable dwell period for failsafe-to-nominal recovery
- Authority-weighted recovery rate modulation
- Recovery abort on recurrence of unsafe conditions
- Prevention of oscillation at safety boundaries

**Legal Status:** Patent-protected recovery mechanism

### 2.7 Operational Design Domain (ODD)

**Covered by:** Patent Family A (Claims 18, 19)

Includes:
- Explicit configurable operational boundaries
- ODD violation forces trust to unsafe
- Mode transition to degraded or failsafe on violation
- Bounds on velocity, environmental conditions, sensor agreement, operational parameters

**Legal Status:** Patent-protected boundary mechanism

### 2.8 Cryptographic Audit Chain

**Covered by:** Patent Family A (Claims 1h, 20, 21, 22)

Includes:
- Per-timestep safety state records
- Cryptographic hash of each record
- Sequential chain linking (each record hashes prior record)
- Root hash per session
- Tamper evidence: modification breaks all subsequent hashes
- Post-event reconstruction for certification and forensic analysis

**Legal Status:** Patent-protected audit mechanism

---

## 3. TRADE SECRET ASSETS

The following are designated as trade secrets and shall not be disclosed in patents, publications, or external documentation.

### 3.1 Tuning and Calibration
- Trust decay gain values
- Smoothing alpha values
- Threshold values (degraded, unsafe, recovery)
- Authority scaling curve parameters
- ODD boundary values
- Recovery dwell counts
- Noise floor values

**Legal Status:** Trade Secret -- Safety Calibration

### 3.2 Neural Network Architecture Internals
- Specific layer dimensions and parameter counts
- Activation function choices per layer
- Weight initialization schemes
- Binary weight format internal structure and scaling factors
- Feature vector element ordering

**Legal Status:** Trade Secret -- Architecture

### 3.3 Datasets and Data Engineering
- Dataset selection and cleaning logic
- Labeling rules
- Governance dataset construction
- Corner case amplification

**Legal Status:** Trade Secret -- Data Engineering

### 3.4 Training Procedures
- Loss construction
- Training schedules
- Curriculum strategies
- Multi-task weighting

**Legal Status:** Trade Secret -- Training Methodology

---

## 4. COPYRIGHTED ASSETS

### 4.1 Source Code
- NeuroPRIN runtime code (governance_net.py, monitor.py, contracts.py, constraint_adapter.py)
- QNX C++ port

**Legal Status:** Copyright -- Software

### 4.2 Documentation
- White papers and technical documents
- This IP Boundary Map

**Legal Status:** Copyright -- Literary and Technical Works

---

## 5. PRODUCT MAPPING

### NeuroPRIN
**Product Role:** Runtime autonomy governance layer.

| IP Type | Coverage |
|---------|----------|
| Patent | Family A -- Runtime Governance, Multi-Stage Trust Pipeline, Neural Inference, Enforcement Adapter, Safety Envelope, Recovery Hysteresis, Audit Chain |
| Trade Secret | Trust tuning, Architecture internals, Datasets, Training procedures |
| Copyright | Code, White papers, Diagrams |

---

## 6. CROSS-FAMILY RELATIONSHIPS

- **Family B (ALG):** NeuroPRIN governs actuation; ALG governs learning. Complementary layers in a dual governance architecture. Each family maintains independent trust, authority, and audit systems.
- **Family C (NeurOS):** NeurOS embeds NeuroPRIN's governance model via DomainAdapter interface.
- **Family D (Bridges):** Bridges coordination layer transmits NeuroPRIN trust signals across subsystems. Governance mesh, phase translation, and trust temporal alignment are covered by Family D.
- **Family E (Applied Energetics):** Resonance-derived trust signals from coupled oscillator models may serve as inputs to NeuroPRIN's trust inference module. Kuramoto model and resonance computation are covered by Family E.

---

## 7. DISCLOSURE RULES

**Allowed:**
- Patent-covered system behavior (multi-stage pipeline, neural multi-head inference, enforcement adapter pattern, severity hierarchy, recovery hysteresis)
- Safety invariants (anti-amplification, non-bypass, determinism)
- Trust/authority relationships (monotonic mapping, mode transitions)
- High-level architecture (stages, components, data flow)
- Example embodiments (vehicle, robot, industrial, algorithmic)

**Prohibited:**
- Exact decay functions and parameters
- Threshold values
- Architecture internals (layer dimensions, parameter counts, weight formats)
- Training pipelines and loss functions
- Dataset composition
- Feature vector ordering

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Owner: The Wayfinder Trust*
