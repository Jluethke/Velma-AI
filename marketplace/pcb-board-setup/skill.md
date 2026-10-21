# PCB Board Setup

**One-line description:** Generates the starting KiCad 9 board from a reviewed SKiDL design and sets its outline, stackup, mounting holes, fab design rules, current-sized power net classes, differential pair classes, and isolation keepouts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skidl_source` (string, required): SKiDL design file, used to generate the starting board.
- `netlist` (string, required): KiCad netlist, used to verify footprint count and nets.
- `bom` (object[], required): BOM, for the footprint count check.
- `board_spec` (object, required): Outline, layer count, mounting holes, fixed connector positions, fab rules, power tree currents.
- `creepage_constraints` (object[], required): Barrier nets and distances from the isolation review.
- `review_verdict` (string, required): Must be "PASS".
- `project_dir` (string, required): User project directory for the board file and the layout script.

---

## Outputs

- `setup_board` (string): Path to the unplaced board file with outline, stackup, rules, net classes, and keepouts set.
- `net_classes` (object[]): Each net class with member nets, trace width, clearance, and for power classes the IPC-2221 computation behind the width.

---

## Phase 1: Generate and Verify the Starting Board

### Entry Criteria
- `review_verdict` is "PASS".

### Actions
1. Run the SKiDL design's PCB generation step to produce a `.kicad_pcb` in `project_dir` with every footprint and its nets.
2. Load it with KiCad's `pcbnew` Python module and count footprints.
3. Confirm the footprint count equals the BOM quantity total and every netlist net exists on the board.

### Output
Unplaced board file.

### Quality Gate
- Review verdict is PASS.
- Footprint count equals BOM quantity total; zero netlist nets missing.

---

## Phase 2: Outline, Stackup, and Rules

### Entry Criteria
- Starting board verified.

### Actions
1. Write a layout script in `project_dir` that draws the board outline on the edge cuts layer, sets the layer count from `board_spec`, and places mounting holes at their specified coordinates.
2. Set design rules from the fab's published minimums plus margin: minimum trace and space at the fab minimum plus 0.025 mm; via drill and annular ring at the fab's standard (non-premium) sizes. Cite the capability page.
3. Record the copper weight per layer; the trace width and loss computations downstream depend on it.

### Output
Board with outline, stackup, and rules.

### Quality Gate
- Every rule cites the fab capability it derives from.
- Outline and holes match `board_spec` coordinates.

---

## Phase 3: Net Classes and Keepouts

### Entry Criteria
- Rules set.

### Actions
1. For each power net, compute the external trace width for the rail's worst-case current at a 10 C rise with the IPC-2221 formula (I = k x dT^0.44 x A^0.725, k = 0.048 external, 0.024 internal; A in square mils), convert to millimeters for the copper weight, and record the computation in `net_classes`.
2. Create differential pair classes for every differential bus net pair with width and gap from the transceiver or interface guidance.
3. Assign remaining nets to the default signal class.
4. For each entry in `creepage_constraints`, add a keepout band across the barrier at the stated distance so no copper on either side encroaches.
5. Save the board as `setup_board`.

### Output
`setup_board`, `net_classes`.

### Quality Gate
- Every power net class width has its IPC-2221 computation recorded.
- Every barrier in `creepage_constraints` has a keepout at its distance.
- Every differential bus net is in a pair class.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Generate the starting KiCad 9 board from a reviewed SKiDL design and set outline, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the board file carries the correct outline, stackup, cited fab rules, current-derived power widths, pair classes, and isolation keepouts, with every footprint present and unplaced.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Verdict not PASS | **Stop**: return to `pcb-review-verdict`. |
| Phase 1 | Footprint count mismatch | **Stop**: return to `pcb-erc-netlist` with the missing references. |
| Phase 1 | KiCad or SKiDL PCB generation unavailable | **Stop**: list install steps and wait for user approval. |
| Phase 3 | Computed power width exceeds space available | **Adjust**: move the rail to an inner plane or heavier copper and record the change. |

---

## Reference Section

### IPC-2221 External Width (1 oz, 10 C rise, approximate)
1 A about 0.3 mm; 2 A about 0.75 mm; 3 A about 1.25 mm; 5 A about 2.5 mm. Always compute for the exact current and record it.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
