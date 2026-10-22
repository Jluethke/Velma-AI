# Dfm Rule Check And Acid Trap Elimination

Run DFM checks specific to PCB fabrication: acid traps, copper balance, annular ring, and minimum feature sizes, fixing issues before Gerber release.

## Inputs

- `design-rules-for-clearance`: Clearance rules already applied
- `fabricator-capabilities`: Minimum feature sizes the chosen fabricator can produce
- `ipc-class-selection`: Selected IPC class for acceptance criteria

## Outputs

- `dfm-violation-list`: All DFM violations found, categorized by severity (fatal, major, minor)
- `acid-trap-locations`: Acute-angle intersections where etchant can pool, with fix instructions
- `copper-balance-analysis`: Copper coverage percentage on each layer, identifying layers with significant imbalance that could cause warping or uneven etching

## Process

1. Check minimum annular ring: the annular ring is the copper remaining around a drilled hole after drilling tolerance is applied. IPC-6012 Class 2 requires minimum 50 um (2 mil); Class 3 requires 50 um external and 25 um internal. The EDA tool calculates annular ring from pad size, drill size, and drill registration tolerance. If any via or through-hole pad has insufficient annular ring, increase the pad size or decrease the drill size.
2. Find acid traps: acute-angle intersections (< 90 degrees) between traces, or between traces and pads, trap etchant during the etching process. The trapped etchant continues etching after the rest of the board is clean, potentially opening the conductor. Check all trace intersections and pad connections. Fix by adding teardrops to pad connections (most EDA tools automate this) and rounding acute trace junctions.
3. Check copper balance: calculate the copper coverage percentage on each layer. If one side of the board has 80% copper and the other has 20%, the board will bow toward the low-copper side during lamination and reflow. Target copper coverage within 20% between the top and bottom halves of the stackup. Add copper thieving (non-functional copper fill) to sparse layers to improve balance.
4. Verify all feature sizes against the fabricator's capability: minimum trace width and space, minimum drill diameter, minimum pad size, maximum aspect ratio. Features below the fabricator's standard capability incur premium pricing or may be refused. Get the fabricator's capability document before starting the design, not after.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
