# Safety Case Argument in GSN with gsn2x

**One-line description:** Writes the safety argument for the item in Goal Structuring Notation (GSN Community Standard Version 3): a top goal bounded by context and assumptions, a strategy that argues over each safety goal, sub-goals per mechanism, and solutions that point at real evidence files, authored as YAML and rendered and checked with the open-source `gsn2x` tool.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_goals` (object[], required): Output of `fusa-safety-goals-safe-states`.
- `item_definition` (object, required): Output of `fusa-item-definition`.
- `evidence_index` (object[], required): List of evidence artifacts with `id`, `path`, `kind` (HARA table, FTA report, trace report, stop chain test record, watchdog test, fault injection results, SOTIF test results) and `date`.

---

## Outputs

- `gsn_yaml` (string): Path to the GSN YAML source.
- `gsn_diagram` (string): Path to the rendered SVG.

---

## Phase 1: Structure the Argument

### Entry Criteria
- Every safety goal has a safe state.
- `evidence_index` lists at least one artifact.

### Actions
1. Write the top goal G1 as a bounded claim: "The item `<item_id>` is acceptably safe to operate for closed-course testing within the ODD in C2". Never write "is safe" without context, and never claim conformance with a standard.
2. Attach context C1 (item definition document), C2 (ODD and operating restrictions), C3 (definition of "acceptably safe" agreed by the team, or an open question) and assumption A1 for each item assumption with an owner.
3. Strategy S1: "Argument over each safety goal from the HARA". Context for S1: the HARA table evidence id.
4. One sub-goal per safety goal: "SG-02 is met: unintended lateral motion is prevented or mitigated to the safe state within FTTI".
5. Under each, a strategy over mechanisms (detection, reaction, independent stop chain) and one goal per mechanism. Also add a goal "Hazards are complete" supported by the HARA review evidence; an argument over goals is only as good as the hazard list.

### Output
Argument outline with ids.

### Quality Gate
- G1 has at least one context element and the text contains no "certified" or "compliant".
- Every safety goal id appears in exactly one sub-goal.

---

## Phase 2: Write YAML and Render

### Entry Criteria
- Phase 1 gate passed.
- `gsn2x --version` prints a version (install with `cargo install gsn2x` or a release binary from the project's repository).

### Actions
1. Write `safety_case.yaml`. gsn2x infers the element type from the id prefix (G goal, S strategy, Sn solution, C context, A assumption, J justification); check the project README for the exact keys in your version:
   ```yaml
   G1:
     text: ITEM-DBW-01 is acceptably safe for closed-course testing within the ODD in C2
     inContextOf: [C1, C2, A1]
     supportedBy: [S1]
   C1:
     text: Item definition ITEM-DBW-01 rev 3
   C2:
     text: ODD and restrictions, closed course, speed bands per item definition
   A1:
     text: Hydraulic brake stays mechanically operable by the safety driver
   S1:
     text: Argument over each safety goal from the HARA
     supportedBy: [G2]
   G2:
     text: SG-02 is met within FTTI
     supportedBy: [Sn1, Sn2]
   Sn1:
     text: Stop chain bench record EV-014
   Sn2:
     text: Fault injection results EV-021
   ```
2. Mark goals without evidence yet with `undeveloped: true` instead of inventing a solution.
3. Render: `gsn2x safety_case.yaml`. It writes an SVG next to the YAML and prints validation warnings and errors.

### Output
`gsn_yaml` and `gsn_diagram`.

### Quality Gate
- `gsn2x safety_case.yaml` exits 0 and the SVG file exists.
- The command output contains no line with "Error".
- Every `Sn` element's text names an evidence id present in `evidence_index`.

---

## Phase 3: Read the Diagram for Gaps

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. List every undeveloped goal and every goal supported only by another goal chain ending without a solution. These are open items in the case.
2. Check each solution is evidence, not a claim: "test record EV-014" is evidence; "the stop chain works" is a claim that belongs in a goal.
3. Check every assumption has an owner from the item definition and that each context element points at a versioned document.
4. Report the open items alongside the paths.

### Output
Rendered case with an open item list.

### Quality Gate
- Number of `undeveloped: true` entries equals the number of open items reported (`grep -c "undeveloped: true" safety_case.yaml`).
- No `Sn` text contains "works", "is safe" or "is correct" (`grep -nE "^Sn" -A1 safety_case.yaml` reviewed).

---

## Worked Example

Illustrative only; message wording varies by gsn2x version.

```
$ gsn2x safety_case.yaml
(warning naming element G3 as undeveloped)
$ ls safety_case.svg
safety_case.svg
```
G3 ("Hazards are complete") has no review evidence yet; it stays undeveloped and appears in the open item list.

---

## Exit Criteria

DONE when the GSN YAML renders without errors, every safety goal has a sub-goal, every solution cites indexed evidence, and every undeveloped goal is listed as open.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team wants an unbounded "system is safe" goal | **Adjust**: add context for ODD, item and acceptance definition. |
| Phase 2 | gsn2x reports an unknown key | **Adjust**: use the key names from the README of the installed version. |
| Phase 2 | Evidence missing for a goal | **Adjust**: mark `undeveloped: true`; never invent a solution. |
| Phase 3 | Many open items | **Return**: hand the list to the owners; the case stays incomplete. |

**Do not:** use GSN to claim certification, add solutions that point at files that do not exist, or delete undeveloped goals to make the diagram look finished.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
