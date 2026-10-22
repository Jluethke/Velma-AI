# Extraction And Timing Signoff

Extract parasitic RC from the routed layout, run multi-corner static timing analysis for signoff, and verify timing closure with OCV and CRPR.

## Inputs

- `routed-design`: DRC-clean routed layout
- `synthesis-constraints-sdc`: Timing constraints

## Outputs

- `parasitic-extraction-spef`: SPEF files for each extraction corner
- `timing-signoff-report`: Setup and hold slack at all corners with worst negative slack and total negative slack

## Process

1. Parasitic extraction: the extraction tool reads the GDSII layout and the process technology file (ITF/QRC tech file). It builds an RC network model for each net: resistance from wire length, width, and sheet resistance; capacitance from wire-to-wire coupling and wire-to-ground. Output is SPEF (Standard Parasitic Exchange Format).
2. Extract at multiple RC corners: typical (Ctyp), minimum (Cmin: best-case capacitance, worst for hold), maximum (Cmax: worst-case capacitance, worst for setup). The RC corners capture manufacturing variation in metal thickness and dielectric properties.
3. Static timing analysis (STA): read the gate-level netlist, SDC constraints, cell library timing models (.lib), and SPEF. The STA tool computes arrival times and required times at every pin in the design. Slack = required_time - arrival_time (positive is good).
4. Multi-corner multi-mode (MCMM) signoff: run STA at all PVT corners simultaneously. Setup check: slow process, high temperature, Cmax, low voltage. Hold check: fast process, low temperature, Cmin, high voltage. Apply OCV derating to launch and capture paths.
5. CRPR (Clock Reconvergence Pessimism Removal): when the launch and capture clocks share common tree segments, OCV is applied to both, creating artificial pessimism. CRPR removes the extra derating on the shared portion. Always enable CRPR for signoff to avoid over-design.
6. Signoff criteria: zero negative slack on setup and hold at all signoff corners. Report worst negative slack (WNS) and total negative slack (TNS). If violations remain, fix with ECO (engineering change order): resize cells, insert buffers, swap cells to different Vt flavors, or reroute critical nets. Re-extract and re-time after each ECO.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
