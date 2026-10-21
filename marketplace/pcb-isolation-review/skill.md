# PCB Isolation Review

**One-line description:** Reviews every galvanic isolation barrier on a board: isolated power on the far side, zero nets crossing outside the isolator, rated working voltage, and the creepage distance layout must hold.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skidl_source` (string, required): Path to the SKiDL design file.
- `bom` (object[], required): BOM with datasheet URLs.
- `board_spec` (object, required): Interfaces with isolation decisions and the environment profile.
- `critical_circuits` (object[], required): Critical circuits; this flow covers the isolation entries.

---

## Outputs

- `isolation_findings` (object[]): Per barrier: the requirement, the checks run, numbers, datasheet lines, and PASS or FAIL with the exact change for each FAIL.
- `creepage_constraints` (object[]): Per barrier: the nets on each side and the minimum creepage and clearance distance in millimeters the layout must hold, with the datasheet or standard it comes from.

---

## Phase 1: Partition the Domains

### Entry Criteria
- All inputs present; `board_spec` marks at least one interface as isolated. If none, return empty outputs with a note.

### Actions
1. For each isolated interface, list every net on the host side and every net on the isolated side of its isolator.
2. Identify the ground reference of each domain.
3. Search the SKiDL source for any net that connects parts in both domains other than through the isolator pins.

### Output
Domain partition per barrier.

### Quality Gate
- Every net on the board is assigned to exactly one domain or is an isolator pin net.
- Any net bridging domains outside the isolator is a FAIL.

---

## Phase 2: Power and Ratings

### Entry Criteria
- Domains partitioned.

### Actions
1. Confirm the isolated side draws power from an isolated DC-DC converter or an isolator with integrated isolated power. An isolated-side supply pin tied to host ground defeats the barrier: FAIL.
2. Record the isolator's rated working voltage and isolation rating from its datasheet; confirm the working voltage covers the environment's expected ground offset.
3. Confirm the isolated power source supplies the isolated side's worst-case current with margin of at least 1.25x, and record its efficiency at that load for the efficiency stages.

### Output
Power and rating entries in `isolation_findings`.

### Quality Gate
- Isolated side has its own isolated source, with its current rating compared to load.
- Working voltage is quoted from the datasheet.

---

## Phase 3: Creepage for Layout

### Entry Criteria
- Phase 2 complete.

### Actions
1. Read the isolator package's internal creepage and clearance from its datasheet.
2. Set the board-level creepage constraint at no less than the package's external creepage, so copper never sits closer across the barrier than the part itself allows.
3. Record nets on each side and the distance in `creepage_constraints` for `pcb-board-setup`.

### Output
`creepage_constraints`.

### Quality Gate
- Every barrier has a creepage distance in millimeters with its source cited.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Review every isolation barrier: isolated power on the far side, zero nets crossi, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every barrier has zero crossing nets outside its isolator, an isolated power source sized for its load, a quoted working voltage, and a creepage constraint handed to layout.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Net crosses barrier outside isolator | **FAIL**: name the net and both parts; required change removes the bridge. |
| Phase 2 | Working voltage not published | **FAIL**: require a part with a published rating. |
| Phase 3 | Package creepage not in datasheet | **Adjust**: use the package's body width across the barrier as the minimum and flag it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
