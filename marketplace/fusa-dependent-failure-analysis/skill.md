# Dependent Failure Analysis for Redundant Elements

**One-line description:** Checks every claimed independence (ASIL decomposition pairs, redundant channels, monitor and monitored function, order 2 or higher cut sets) for common cause and cascading failures by walking a coupling factor checklist in the spirit of ISO 26262-9 clause 7 and its annex examples, recording each shared resource with the measure that controls it or the claim it breaks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cut_set_report` (object, required): Output of `fusa-fta-scram-cut-sets`.
- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; decomposed pairs carry `independence_argument`.
- `architecture_description` (string, required): Element list with power, clock, harness, location and software build information.

---

## Outputs

- `dfa_report` (object[]): `pair_id`, `element_a`, `element_b`, `source` (decomposition, cut set, monitor), `coupling_factor`, `shared_item`, `failure_type` (common cause or cascading), `control_measure`, `status` (controlled, open, breaks independence).

---

## Phase 1: List Pairs That Claim Independence

### Entry Criteria
- At least one decomposed pair, redundant channel or cut set of order 2 or more exists.

### Actions
1. From `safety_requirements`, take every pair with a decomposed ASIL notation such as `A(B)`.
2. From `cut_set_report`, take every cut set with two or more events; the events must be independent for the cut set to need all of them.
3. Add every monitor and monitored pair (watchdog and CPU, heartbeat monitor and publisher, stop chain and the software it protects).
4. Give each pair an id `DFA-nn`.

### Output
Pair list with sources.

### Quality Gate
- Every decomposed requirement pair and every order 2+ cut set appears once.

---

## Phase 2: Walk the Coupling Factors

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each pair, answer every row of this checklist with yes, no or unknown, citing the architecture document for each answer:

   | Coupling factor | Question |
   |---|---|
   | Shared power | same regulator, fuse, battery rail or ground return? |
   | Shared clock | same oscillator or PLL source? |
   | Shared information | same sensor, same message, same timestamp source? |
   | Shared software | same source code, compiler, OS, library or configuration file? |
   | Shared hardware type | same part number and lot, same failure mode under stress? |
   | Environment | same location exposed to the same heat, vibration, water, EMI? |
   | Installation | same connector, harness bundle or PCB? |
   | Development | same team, same requirement text, same test that could miss the same error? |
   | Cascading | can a failure of A drive B to fail (short on a shared bus, babbling CAN node, memory overwrite)? |

2. Every yes is a row in `dfa_report` with the shared item named.
3. Every unknown is a row with `status = open` and a question for the hardware or software owner.

### Output
Coupling factor rows per pair.

### Quality Gate
- Every pair has nine answered checklist rows.
- Every yes and unknown answer appears as a `dfa_report` row.

---

## Phase 3: Control Measures and Verdict

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each shared item, record the control measure if one exists: separate fuses, voltage monitoring with a reset supervisor on an independent reference, diverse software implementations, physical separation, CAN bus guardian or transceiver with dominant timeout, memory protection unit.
2. A shared item with no control measure on a decomposed pair sets `status = breaks independence`, and the pair's decomposition is invalid until fixed. Send that back to `fusa-requirements-decomposition`.
3. For cut sets, a shared cause turns the cut set into an effective order 1 cut set; note it in the fault tree report.
4. Emit `dfa_report` as JSON.

### Output
`dfa_report`.

### Quality Gate
- `jq '[.[]|select(.status=="controlled" and (.control_measure|length)==0)]|length' dfa_report.json` prints 0.
- Every `breaks independence` row names the decomposed requirement it invalidates.

---

## Worked Example

Illustrative only. `DFA-03`: steering MCU check (`A(B)`) and external window watchdog IC (`A(B)`).

- Shared power: yes, both fed from the 5 V regulator U3. Control: none. Status `breaks independence`.
- Shared clock: no, the watchdog IC has its own oscillator.
- Fix proposed: feed the watchdog IC from a separate LDO off the 12 V input with its own fuse, plus a reset supervisor on U3's output. After the change, the row becomes `controlled`.

---

## Exit Criteria

DONE when every independence claim has all coupling factors answered, every shared item has a control measure or a status that invalidates the claim, and invalid decompositions are returned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No pairs to analyze | **Return**: emit an empty report with a note that no independence is claimed. |
| Phase 2 | Architecture lacks power or clock detail | **Adjust**: mark unknown, open questions to the hardware owner. |
| Phase 3 | Team wants to accept a shared supply without a measure | **Stop**: the decomposition is invalid; keep the original ASIL. |

**Do not:** answer "no" without citing the architecture, treat same-code redundancy as independent, or skip the cascading row.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
