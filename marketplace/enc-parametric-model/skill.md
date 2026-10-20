# Enclosure Parametric Model

**One-line description:** Writes a parametric enclosure as build123d code in the user's project, driven entirely by the board envelope: shell and lid, wall thickness for the manufacturing process, standoffs on the mounting holes, connector cutouts with mating clearance, and vents sized from the board's dissipation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_envelope` (object, required): From `enc-board-3d-export`.
- `board_spec` (object, required): Environment and power tree (for dissipation and sealing needs).
- `enclosure_process` (string, optional): "fdm", "sla", "cnc", or "injection". Default: "fdm".
- `project_dir` (string, required): User project directory for the model source.

---

## Outputs

- `enclosure_source` (string): Path to the build123d model file, with every dimension a named parameter derived from `board_envelope` and the process rules.

---

## Phase 1: Set Process Rules

### Entry Criteria
- `board_envelope` present.

### Actions
1. Set minimum wall thickness and feature size from the process: FDM wall 2.0 mm, minimum feature 0.8 mm; SLA wall 1.5 mm; CNC aluminum wall 2.0 mm with internal corner radius at least the tool radius; injection wall 1.5 to 3.0 mm uniform with 1 degree draft.
2. Set clearances: 1.0 mm board edge to wall, 2.0 mm above the tallest top component, 1.0 mm below the tallest bottom component.
3. Confirm build123d is installed. If missing, list install steps and stop for approval.

### Output
Process parameter set.

### Quality Gate
- Every process rule is a named parameter in one block.

---

## Phase 2: Model the Shell

### Entry Criteria
- Process rules set.

### Actions
1. Write the model in `project_dir/mech/enclosure.py`. Derive the inner cavity from the outline plus edge clearance and the heights plus clearances.
2. Add standoffs at every mounting hole center, with holes sized for the chosen fastener (heat-set insert bore for FDM, tapped hole for CNC).
3. Split into base and lid along a plane that leaves every connector cutout in one part where possible.
4. Add a lid retention feature: screws into the standoffs, or snap fits for FDM.

### Output
Shell model.

### Quality Gate
- No dimension is a literal outside the parameter block.
- Every mounting hole has a standoff.

---

## Phase 3: Cutouts and Vents

### Entry Criteria
- Shell modeled.

### Actions
1. Cut an opening at each connector's mating face sized to the plug envelope plus 0.5 mm per side, so the plug seats fully.
2. Add light pipes or windows at LEDs and openings or plungers at buttons.
3. Compute vent area from the total dissipation in the power tree: for natural convection, provide inlet and outlet vents low and high, sized so the internal rise stays under 15 C (record the calculation). If `board_spec` requires sealing, replace vents with a conduction path to the wall instead.

### Output
`enclosure_source`.

### Quality Gate
- Every connector has a cutout from its datasheet plug envelope.
- Vent or conduction sizing is computed from dissipation, with the calculation recorded.

---

## Exit Criteria

DONE when the model regenerates from the board envelope alone, meets the process's wall and feature rules, and provides access to every connector and indicator.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | build123d missing | **Stop**: list install steps, wait for user approval. |
| Phase 2 | Connectors on opposite faces force cutouts in both parts | **Adjust**: accept the split and record it. |
| Phase 3 | Dissipation needs more vent area than the walls allow | **Escalate**: report the shortfall and propose a fan or a metal enclosure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
