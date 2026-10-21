# Harness Diagram and BOM

**One-line description:** Writes the harness as WireViz YAML in the user's project, renders the wiring diagram, and emits the harness BOM with wire lengths, terminal counts, and every housing, seal, and sleeve.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `wiring_table` (object[], required): Pin-to-pin wiring with gauges, colors, pairs, and lengths.
- `harness_connectors` (object[], required): Housings, terminals, seals, tools.
- `project_dir` (string, required): User project directory for harness source.

---

## Outputs

- `harness_yaml` (string): Path to the WireViz YAML file.
- `harness_diagram` (string): Path to the rendered diagram (SVG and PNG).
- `harness_bom` (object[]): Housings, terminals (count plus 10% spares), seals, cavity plugs, wire by gauge and color with total length plus 5%, twisted pair and shielded cable lengths, sleeving, and labels.

---

## Phase 1: Write the YAML

### Entry Criteria
- `wiring_table` has no open rows, or open rows are explicitly excluded.

### Actions
1. Confirm WireViz is installed (`wireviz --version`). If missing, list install steps and stop for approval.
2. Write `project_dir/harness/<name>.yml`: one `connectors` entry per housing with part number, pin count, and pin labels; one `cables` entry per cable or twisted pair with gauge, colors, length, and shield; `connections` from the wiring table.
3. Put manufacturer part numbers on every connector and cable so the generated BOM carries them.

### Output
`harness_yaml`.

### Quality Gate
- Every wiring table row appears as exactly one connection.
- Every connector and cable carries a part number.

---

## Phase 2: Render and Total

### Entry Criteria
- YAML written.

### Actions
1. Run `wireviz <name>.yml` to produce the diagram and WireViz's BOM.
2. Open the rendered diagram and compare each connection against the wiring table.
3. Build `harness_bom` from the WireViz BOM, adding terminal counts with 10% spares, wire length plus 5% for service loops, and seals, plugs, sleeving, and labels.

### Output
`harness_diagram`, `harness_bom`.

### Quality Gate
- Rendered connections match the wiring table row for row.
- Terminal count equals populated positions plus 10%.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Write the harness as WireViz YAML, render the wiring diagram, and emit a build-r, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the YAML regenerates the diagram, the diagram matches the wiring table, and the BOM covers every part needed to build the harness.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | WireViz or Graphviz missing | **Stop**: list install steps, wait for user approval. |
| Phase 2 | Render fails | **Adjust**: fix the YAML at the reported line and rerun. |
| Phase 2 | Diagram mismatch | **Adjust**: fix the YAML to the wiring table, never the reverse. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
