# PCB Gerber Export

**One-line description:** Exports a DRC-clean KiCad 9 board to Gerbers and Excellon drill files, zips them for the fab, verifies layer and hole counts in a Gerber viewer, and renders top and bottom views for a polarity and orientation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kicad_pcb` (string, required): DRC-clean board.
- `drc_report` (object, required): Must show zero violations and zero unconnected items.
- `board_spec` (object, required): Fab target and its required layers and drill options.

---

## Outputs

- `fab_package` (string): Path to the zip of Gerber and drill files.
- `board_renders` (string[]): Paths to top and bottom 3D renders.

---

## Phase 1: Export and Package

### Entry Criteria
- `drc_report` shows zero violations and zero unconnected items.

### Actions
1. Run `kicad-cli pcb export gerbers` for every copper layer plus mask, silkscreen, paste, and edge cuts, with the fab's required options (for JLCPCB, follow its KiCad export guide; cite it).
2. Run `kicad-cli pcb export drill` in Excellon format with the fab's required units and zero format.
3. Zip the Gerbers and drill files into `fab_package`.

### Output
`fab_package`.

### Quality Gate
- The zip contains copper layers equal to the board's layer count plus mask, silk, paste, and edge.
- A drill file is present.

---

## Phase 2: Verify and Render

### Entry Criteria
- `fab_package` exists.

### Actions
1. Open the Gerbers in KiCad's Gerber viewer or the fab's online viewer and confirm layer count, outline, and drill hit count match the board.
2. Render top and bottom with `kicad-cli pcb render`.
3. Check renders for connector orientation, polarity markings on every polarized part, pin 1 marks, and silkscreen legibility.

### Output
`board_renders`.

### Quality Gate
- Drill hit count in the viewer equals the board's hole count.
- Every polarized part and connector shows an orientation mark.

---

## Exit Criteria

DONE when the fab zip is complete, verified in a viewer, and renders confirm orientation markings.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | DRC not clean | **Stop**: return to `pcb-drc-closure`. |
| Phase 2 | Viewer shows a missing or extra layer | **Adjust**: correct the export layer list and re-export. |
| Phase 2 | Missing polarity mark | **Adjust**: add silkscreen on the board, rerun DRC, re-export. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
