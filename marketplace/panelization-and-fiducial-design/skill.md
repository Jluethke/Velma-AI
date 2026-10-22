# Panelization And Fiducial Design

Design the PCB panel layout for efficient manufacturing: board arrangement, breakaway tabs, tooling holes, and fiducial placement for pick-and-place alignment.

## Inputs

- `board-outline`: Individual board dimensions and shape
- `panel-size`: Fabricator's standard panel size (typically 18x24 inches or 16x18 inches)
- `assembly-process`: Single-side or double-side SMT, wave solder, selective solder, or hand assembly

## Outputs

- `panel-layout`: Board arrangement in the panel with margins, rails, and breakaway tabs
- `fiducial-placement`: Global panel fiducials and local board fiducials with diameter, clearance, and position
- `tooling-features`: Tooling holes, bad-mark locations, and panel identification markings

## Process

1. Arrange boards to maximize panel utilization. Rotate boards 90 or 180 degrees to test which arrangement fits more boards per panel. Leave 5 mm minimum between boards for routing (V-score needs less but limits breakaway to straight lines). Add 10 mm rails on at least two sides for conveyor transport through the SMT line.
2. Place three global fiducials on the panel: two on diagonal corners and one on a third corner. These allow the pick-and-place machine to correct for panel offset, rotation, and scaling. Use 1 mm diameter copper circles with 2 mm solder-mask-free clearance around them. Do not place fiducials near edges where panel warpage distorts their position.
3. Add local fiducials to each individual board (two per board, diagonally opposite). These correct for stretch and rotation within the individual board that the global fiducials cannot capture. For fine-pitch components (< 0.5 mm pitch), add component-level fiducials on diagonally opposite corners of the component footprint.
4. Design breakaway tabs: 3 to 5 tabs per board edge, each 3 to 5 mm wide with perforations or mouse bites for clean separation. For boards with components near the edge, place tabs away from those components to prevent damage during depanelization. V-scoring is cleaner but only works for straight edges.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
