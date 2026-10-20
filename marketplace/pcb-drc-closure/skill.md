# PCB DRC Closure

**One-line description:** Runs KiCad's headless design rules check with schematic parity and fixes every violation at its cause until the board reports zero violations and zero unconnected items.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `routed_board` (string, required): Routed, zone-filled board from `pcb-autoroute`.
- `board_spec` (object, required): Fab rules, for any justified rule adjustment.

---

## Outputs

- `kicad_pcb` (string): Path to the DRC-clean board file.
- `drc_report` (object): Final JSON DRC report showing zero violations, zero unconnected items, and parity passing, plus a log of each fix made.

---

## Phase 1: Run DRC

### Entry Criteria
- `routed_board` exists.

### Actions
1. Run `kicad-cli pcb drc --format json --schematic-parity --exit-code-violations -o drc.json <board>`.
2. Parse the report into violations, unconnected items, and parity errors, each with location and rule.

### Output
Parsed DRC result.

### Quality Gate
- The report parses and lists every item with location and rule.

---

## Phase 2: Fix to Zero

### Entry Criteria
- Parsed result exists.

### Actions
1. Fix each item at its cause: move a part, reroute a segment, refill a zone. Never delete a locked critical net to clear a violation.
2. Adjust a rule only when the fab's capability page supports the new value; cite it in the fix log.
3. Refill zones and rerun DRC after each batch of fixes.
4. Repeat until zero violations, zero unconnected items, and parity passes. Save as `kicad_pcb`.

### Output
`kicad_pcb`, `drc_report`.

### Quality Gate
- DRC reports zero violations and zero unconnected items; parity passes.
- Every rule adjustment cites its fab capability.
- Locked critical nets are unchanged.

---

## Exit Criteria

DONE when the final DRC run exits with code 0 and the JSON report shows zero items.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Violation persists after 3 fix attempts | **Escalate**: report the violation, location, and rule in conflict. |
| Phase 2 | Parity error (board differs from schematic) | **Stop**: return to `pcb-erc-netlist`; never edit connectivity on the board alone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
