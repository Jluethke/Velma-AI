# Hardware Spec Consolidate

**One-line description:** Merges interface, power, critical circuit, mechanical, and fab requirements into one board spec, sets which downstream deliverables the product needs, and lists every open question with the default in force.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `interface_table` (object[], required): From `hw-interface-spec`.
- `environment_profile` (object, required): From `hw-interface-spec`.
- `power_tree` (object, required): From `hw-power-tree`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.
- `mechanical_envelope` (object, required): From `hw-mechanical-fab-constraints`.
- `fab_rules` (object, required): From `hw-mechanical-fab-constraints`.
- `layer_count` (integer, required): From `hw-mechanical-fab-constraints`.

---

## Outputs

- `board_spec` (object): The single source of requirements for every downstream flow: function, interfaces, environment, power tree, mechanical envelope, layer count, fab rules, and references to critical circuits.
- `product_scope` (object): `has_firmware`, `needs_enclosure`, `needs_harness`, each a boolean with its reason.
- `open_questions` (string[]): Each unsettled fact with the default assumed until answered.

---

## Phase 1: Merge and Cross-Check

### Entry Criteria
- All inputs present.

### Actions
1. Assemble `board_spec` from the inputs without changing any value.
2. Cross-check: every interface has a rail in `power_tree`; every connector has a position in `mechanical_envelope`; every isolated interface has an isolation entry in `critical_circuits`; total dissipation is compatible with the outline (flag above 1 W per 10 cm2 with no airflow).
3. Record each mismatch as an open question with a proposed default.

### Output
`board_spec`.

### Quality Gate
- Zero unflagged mismatches between the inputs.

---

## Phase 2: Set Product Scope and Open Questions

### Entry Criteria
- `board_spec` assembled.

### Actions
1. Set `has_firmware` true when any part needs a program (microcontroller, FPGA, programmable power controller).
2. Set `needs_enclosure` true unless the ask says bare board or the host enclosure houses the board.
3. Set `needs_harness` true when any interface reaches its far end through a cable this product must supply.
4. Give each flag a reason tied to a `board_spec` entry.
5. Collect every assumption carried from upstream flows plus Phase 1 mismatches into `open_questions`, each with its default.

### Output
`product_scope`, `open_questions`.

### Quality Gate
- Every flag has a reason tied to the spec.
- Every open question names a default so downstream work is never blocked.

---

## Exit Criteria

DONE when `board_spec` is internally consistent, `product_scope` decides which branches run, and no assumption is hidden.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Interface without a supply rail | **Adjust**: add an open question and route back to `hw-power-tree`. |
| Phase 2 | Scope ambiguous | **Adjust**: default to true (build the deliverable) and record the question. |
| Any | User rejects output | **Targeted revision**: rerun the affected phase. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
