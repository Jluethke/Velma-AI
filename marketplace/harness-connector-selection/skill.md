# Harness Connector Selection

**One-line description:** For every cable a product must supply, selects the mating housing, terminals, seals, and crimp tool for both ends from manufacturer datasheets, with the far-end connector confirmed from the far device's own documentation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_spec` (object, required): Interfaces that leave the board on a cable, with the far-end device for each.
- `bom` (object[], required): BOM, for the board-side connector part numbers.
- `review_verdict` (string, required): Verdict from `pcb-review-verdict`. Must be "PASS", so connectors are chosen against the reviewed schematic and never go stale when the review changes it.

---

## Outputs

- `harness_connectors` (object[]): Per cable end: device, connector series, mating housing part number, terminal part number and wire gauge range, seals or cavity plugs, the applicator or hand crimp tool part number, datasheet URLs, and the source document that identifies the far-end connector.

---

## Phase 1: List the Cables

### Entry Criteria
- `review_verdict` == "PASS".
- `board_spec` names at least one off-board interface.

### Actions
1. List each cable: board-side connector (from the BOM), far-end device, and the signals it carries.
2. For each far end, find the far device's documentation (manufacturer manual, service manual, or connector drawing) that names its connector. Cite it.
3. If no document names the far-end connector, record it as unidentified. Never guess a housing from a photo or a forum post.

### Output
Cable list with cited far-end identities.

### Quality Gate
- Every far end has a cited source document or is marked unidentified.

---

## Phase 2: Select Mating Parts

### Entry Criteria
- Cable list exists.

### Actions
1. For each board-side connector, open its datasheet and take the mating housing part number from the manufacturer's mating parts table.
2. For each end, pick terminals whose wire gauge range covers the wire chosen later (start with the range that covers 0.35 to 1.0 mm2 unless current demands more) and whose plating matches the mating header (tin to tin, gold to gold).
3. For sealed connectors, add the wire seals sized to insulation diameter and cavity plugs for unused positions.
4. Record the crimp tool the terminal datasheet specifies. A generic crimper produces unreliable crimps on precision terminals.
5. Confirm each part's stock at a major distributor and record it.

### Output
`harness_connectors`.

### Quality Gate
- Every housing comes from the mating parts table of the other half's datasheet.
- Terminal plating matches the mating contact plating.
- Every end has a specified crimp tool.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Select mating housings, terminals, seals, and crimp tools for both ends of every, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every cable end has a datasheet-sourced housing, terminals, seals where needed, and crimp tool, and every far-end connector identity is cited or flagged unidentified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `review_verdict` is not PASS | **Stop**: wait for the review loop to pass. |
| Phase 1 | Far-end connector undocumented | **Flag**: mark unidentified, list what document would resolve it, continue with the other cables. |
| Phase 2 | Mating housing out of stock | **Adjust**: use the manufacturer's listed alternate in the same mating table. |
| Phase 2 | Only an OEM-restricted part mates | **Adjust**: record the restriction and any licensed equivalent; never substitute a non-mating part. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
