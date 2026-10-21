# Harness Pinout and Wiring

**One-line description:** Defines the pin-to-pin wiring for every cable, with wire gauge computed from current, length, and allowed voltage drop, colors, twisted pairs for differential buses, shield and drain termination, and lengths.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `harness_connectors` (object[], required): Connectors and terminals per cable end.
- `board_spec` (object, required): Signals, currents, and bus types per interface.
- `netlist` (string, required): Board netlist, for the board-side pin to net mapping.

---

## Outputs

- `wiring_table` (object[]): One row per wire: cable, from connector and pin, to connector and pin, net or signal name, wire gauge, color, pair or shield membership, length, and computed voltage drop.

---

## Phase 1: Map Pins

### Entry Criteria
- `harness_connectors` present.

### Actions
1. For each board-side connector, read each pin's net from the netlist.
2. For each far end, take its pinout from the cited far-device document.
3. Pair each board pin with its far pin by signal. Record any signal present on one end only.

### Output
Pin-to-pin map.

### Quality Gate
- Every row has both ends from cited sources (netlist or far-device document).
- Unmatched signals are listed.

---

## Phase 2: Size and Route Wires

### Entry Criteria
- Pin map complete.

### Actions
1. For each power wire, compute gauge from worst-case current, round-trip length, and allowed drop (default 3% of the rail): A = (2 x L x I x rho) / V_drop with copper rho = 0.0172 ohm mm2/m; round up to the next standard size and confirm it stays within the terminal's range.
2. Check the chosen gauge's ampacity at the bundle's temperature.
3. Run every differential bus (CAN, RS-485, Ethernet) as a twisted pair, about 33 to 50 twists per meter, and keep pair members adjacent in the connector where pinout allows.
4. For shielded cables, terminate the drain at one end only (the board's chassis or ground point) unless the bus standard requires both.
5. Assign colors by function (power red, ground black, bus pairs matched colors such as yellow/green for CAN H/L) and record length per cable.

### Output
`wiring_table`.

### Quality Gate
- Every power wire's voltage drop is computed and under the allowance.
- Every differential bus is a twisted pair.
- Every gauge fits its terminal's range.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Define pin-to-pin wiring for every cable with gauge computed from current, lengt, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every wire has both ends sourced, a computed gauge, a color, its pair or shield membership, and a length.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Far-end pinout undocumented | **Flag**: leave those rows open with the missing document named. |
| Phase 2 | Required gauge exceeds terminal range | **Return**: report to `harness-connector-selection` for a larger terminal. |
| Phase 2 | Pair members cannot sit adjacent | **Adjust**: keep them twisted to within 25 mm of the connector, record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
