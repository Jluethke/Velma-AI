# Family A - NeuroPRIN: Reference Numeral Cross-Reference

Every reference numeral mapped to its claim term and figure.

## FIG. 1 — System Block Diagram

| Ref # | Label | Claim |
|-------|-------|-------|
| 100 | Expectation Interface | 1a |
| 102 | Observation Interface | 1b |
| 104 | Divergence Computation Module | 1c |
| 106 | Trust Inference Module | 1d |
| 108 | Neural Trust Inference Component | 1e |
| 110 | Authority Mapping Module | 1f |
| 112 | Mode Management Module | 8 |
| 114 | Enforcement Adapter | 1g |
| 116 | Audit Artifact Generator | 1h |
| 118 | Tamper-Evident Audit Chain | 1h |
| 120 | Controller / Predictive Model | context |
| 122 | Sensor / Estimator / Physical Plant | context |
| 124 | Actuator | 1g |

## FIG. 2 — Multi-Stage Trust Evaluation Pipeline

| Ref # | Label | Claim |
|-------|-------|-------|
| 200 | Divergence Metric Input | 1c |
| 202 | Instantaneous Trust Value (Bounded Decay Function) | 2d, 4, 5 |
| 204 | Smoothed Trust Value (Exponential Moving Average) | 2e, 4 |
| 206 | Neural Trust Score (Neural Trust Inference Component) | 1e, 2f |
| 208 | Composite Trust Value | 2g |
| 210 | Safety Envelope Check | 13 |
| 212 | Physics Threshold Checks | context |
| 214 | Operational Design Domain Checks | 18 |
| 216 | Recovery Hysteresis (Dwell Counter) | 17 |
| 218 | Final Trust Signal Assembly | context |
| 220 | Trust Value Output | 1d |
| 222 | Operating Mode Flags (Degraded / Unsafe) | 8 |

## FIG. 3 — Neural Trust Inference Component

| Ref # | Label | Claim |
|-------|-------|-------|
| 300 | Feature Vector | 7 |
| 302 | Shared Encoder (Multi-Layer Network) | 1e |
| 304 | Latent Representation | context |
| 306 | Output Head - Trust Score | 1e |
| 308 | Output Head - Degraded Classification Signal | 1e |
| 310 | Output Head - Unsafe Classification Signal | 1e |
| 312 | Trust Score Output | 1e |
| 314 | Classification Signal - Degraded Operating Condition | 1e |
| 316 | Classification Signal - Unsafe Operating Condition | 1e |

## FIG. 4 — Operating Mode State Machine

| Ref # | Label | Claim |
|-------|-------|-------|
| 400 | Nominal Mode | 8 |
| 402 | Degraded Mode | 8, 9 |
| 404 | Failsafe Mode | 8, 9 |
| 406 | Recovery Dwell Period | 17 |

## FIG. 5 — Authority Mapping

| Ref # | Label | Claim |
|-------|-------|-------|
| 500 | Trust Value Axis | 1d |
| 502 | Permitted Control Authority Axis | 1f |
| 504 | Monotonic Non-Increasing Function | 1f |
| 506 | Failsafe Zone (Failsafe Override) | 10 |
| 508 | Degraded Zone (Bounded Scaling) | 10 |
| 510 | Nominal Zone (Full Authority) | context |
| 512 | Failsafe Threshold | context |
| 514 | Degradation Threshold | context |

## FIG. 6 — Enforcement Adapter

| Ref # | Label | Claim |
|-------|-------|-------|
| 600 | Control Command from Upstream Controller | 1g, 12 |
| 602 | Enforcement Adapter (Non-Bypassable) | 1g |
| 604 | Constraint Severity Level - Advisory (No Modification) | 10 |
| 606 | Constraint Severity Level - Bounded Scaling | 10 |
| 608 | Constraint Severity Level - Strict Clamping | 10 |
| 610 | Constraint Severity Level - Failsafe Override | 10 |
| 612 | Anti-Amplification Invariant Check | 1g |
| 614 | Enforced Control Command | 1g |
| 616 | Safety State Record to Audit Artifact Generator | 1h |

## FIG. 7 — Envelope Recovery State Machine

| Ref # | Label | Claim |
|-------|-------|-------|
| 700 | Inactive State | 16 |
| 702 | Unsafe State (Authority Forced to Failsafe Value) | 14, 16 |
| 704 | Recovering State (Consecutive Safe Time Steps Required) | 16 |
| 706 | Configurable Consecutive Safe Steps Threshold | 16 |

## FIG. 8 — Operational Design Domain Boundary Module

| Ref # | Label | Claim |
|-------|-------|-------|
| 800 | Operational Design Domain Boundary Module | 18 |
| 802 | Configurable Bounds - System Velocity | 18 |
| 804 | Configurable Bounds - Environmental Conditions | 18 |
| 806 | Configurable Bounds - Sensor Agreement | 18 |
| 808 | Configurable Bounds - Operational Parameters | 18 |
| 810 | ODD Boundary Evaluation | context |
| 812 | Within Declared Operating Domain | 18 |
| 814 | ODD Violation Detected | 19 |
| 816 | Trust Value Forced to Unsafe | 19 |
| 818 | Mode Transition Triggered | 19 |

## FIG. 9 — Tamper-Evident Audit Chain

| Ref # | Label | Claim |
|-------|-------|-------|
| 900 | Safety State Record (t=0) | 1h |
| 902 | Safety State Record (t=1) | 1h |
| 904 | Safety State Record (t=N) | 1h |
| 906 | Cryptographic Hash of Safety State Record | 1h |
| 908 | Prior Safety State Record Hash (Link) | 1h |
| 910 | Root Hash (Terminal Session Hash) | 20 |
| 912 | Divergence Metric (Record Contents) | 1h |
| 914 | Trust Value (Record Contents) | 1h |
| 916 | Permitted Control Authority (Record Contents) | 1h |
| 918 | Control Command + Enforced Control Command (Record Contents) | 1h |

## Consistency Status

- **Total reference numerals:** 79
- **Mapped to claims:** 66 (84%)
- **Context only (no direct claim):** 13 (16%)
- **CRITICAL violations:** 0
- **All independent claim elements (1a-1h) have corresponding numerals:** YES
- **All dependent claim elements (4-25) with drawable components have numerals:** YES
