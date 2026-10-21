# Enclosure Board 3D Export

**One-line description:** Exports a finished board as a STEP model and extracts the geometry an enclosure must fit: outline, mounting holes, component heights per side, connector positions with mating faces, and the positions of LEDs and buttons.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kicad_pcb` (string, required): DRC-clean board file.
- `bom` (object[], required): BOM, for connector part numbers and their mating plug dimensions.
- `project_dir` (string, required): User project directory for the exported model.

---

## Outputs

- `board_step` (string): Path to the board STEP model with components.
- `board_envelope` (object): Outline polygon, board thickness, mounting hole centers and diameters, maximum component height on top and bottom, each connector's position, mating face direction, and mating plug envelope from its datasheet, and each LED, button, and switch position.

---

## Phase 1: Export the Model

### Entry Criteria
- `kicad_pcb` exists.

### Actions
1. Run `kicad-cli pcb export step --subst-models --output <project_dir>/mech/board.step <kicad_pcb>`.
2. Count footprints that have no 3D model in the export log. Each missing model hides a real height.
3. For each footprint without a model, record its height from the datasheet package drawing.

### Output
`board_step` and a missing-model list.

### Quality Gate
- STEP file exists and opens.
- Every footprint has a 3D model or a datasheet height recorded.

---

## Phase 2: Extract the Envelope

### Entry Criteria
- `board_step` exists.

### Actions
1. Read the outline and mounting holes from the board file with KiCad's `pcbnew` Python module (edge cuts layer and mounting hole footprints).
2. Compute maximum component height per side from the STEP bounding boxes, including datasheet heights for missing models.
3. For each connector, record its center position, the board edge or face it mates through, and the mating plug's outer envelope and insertion depth from the connector datasheet.
4. Record the position of every LED, button, switch, and display.

### Output
`board_envelope`.

### Quality Gate
- Every connector has a mating face and a datasheet plug envelope.
- Heights include every footprint.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Export a board as STEP and extract the geometry an enclosure must fit: outline, , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the STEP model exists and the envelope records every dimension the enclosure depends on, sourced from the board file or datasheets.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | STEP export fails | **Adjust**: rerun without `--subst-models`, record the failing footprint. |
| Phase 1 | KiCad missing | **Stop**: list install steps, wait for user approval. |
| Phase 2 | Connector datasheet lacks plug dimensions | **Adjust**: use the mating part's own datasheet, cited. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
