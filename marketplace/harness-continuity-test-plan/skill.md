# Harness Continuity Test Plan

**One-line description:** Writes the test plan that proves a built harness matches its wiring table: per-wire continuity, isolation between every adjacent and every power pair, and shield continuity, each with its expected reading.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `wiring_table` (object[], required): Pin-to-pin wiring with gauges, lengths, pairs, and shields.

---

## Outputs

- `continuity_test_plan` (object[]): Ordered tests, each with the meter setup, the two probe points, the expected reading with tolerance, and the pass condition.

---

## Phase 1: Continuity Tests

### Entry Criteria
- `wiring_table` present.

### Actions
1. For each wire, add a resistance test from its from-pin to its to-pin.
2. Compute the expected resistance from gauge and length (R = rho x L / A, copper rho = 0.0172 ohm mm2/m) plus contact resistance; pass when the reading is under 1 ohm and within 0.5 ohm of the computed value plus meter lead offset.
3. Note: null the meter leads before the series.

### Output
Continuity tests.

### Quality Gate
- Every wire has a continuity test with a computed expected value.

---

## Phase 2: Isolation and Shield Tests

### Entry Criteria
- Continuity tests written.

### Actions
1. For each connector, add an isolation test between every pair of physically adjacent pins and between every power pin and every other pin; pass at over 10 megohm on the meter's highest range (or at the insulation tester's rated voltage when one is used).
2. For each shield, add a test from the drain at the terminated end to the shield at the open end (continuity) and from the shield to every conductor (isolation).
3. Order the plan: continuity first, then isolation, then shields, so a miswire shows up before isolation readings are trusted.

### Output
`continuity_test_plan`.

### Quality Gate
- Every adjacent pin pair and every power pin has an isolation test.
- Every shield has continuity and isolation tests.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Write the harness test plan: per-wire continuity with computed resistance, isola, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when executing the plan proves every wire lands on its correct pin, no two conductors short, and every shield is continuous and isolated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Wiring table row missing length | **Adjust**: use the cable's length, record the assumption. |
| Phase 2 | Connector geometry unknown for adjacency | **Adjust**: test every pin pair in that connector. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
