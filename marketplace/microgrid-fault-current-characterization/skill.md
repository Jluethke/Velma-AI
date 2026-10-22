# Microgrid Fault Current Characterization

Characterize fault currents in the microgrid for both grid-connected and island modes, accounting for the different fault current contributions of inverter-based and rotating DERs.

## Inputs

- `microgrid-configuration`: Single-line diagram with all DER sources, their fault current characteristics, and the PCC configuration
- `protection-requirements`: Reliability targets, selectivity requirements, and regulatory obligations

## Outputs

- `fault-current-analysis`: Maximum and minimum fault currents at each bus in grid-connected and island mode, with the contributing sources identified
- `protection-challenges`: Identified challenges: reduced fault current in island mode, bidirectional flow, and variable source impedance

## Process

1. Calculate fault currents in grid-connected mode. The utility source provides the dominant fault current contribution (typically 5-20 kA at the medium-voltage PCC). Inverter-based DERs contribute 1.1-1.2 times rated current. Diesel generators contribute 3-5 times rated current (subtransient). Sum contributions at each bus using superposition.
2. Calculate fault currents in island mode. Without the utility source, fault current drops dramatically. If the microgrid has only inverter-based DERs, the maximum fault current may be only 1.2 times the total rated current of all online inverters. This is often insufficient to operate conventional overcurrent relays. If diesel generators are the grid-forming sources, fault current is 3-5 times generator rating, providing more margin for conventional protection.
3. Identify the fault current ratio. The ratio of grid-connected to island mode fault current at each bus determines the protection challenge. Ratios of 5:1 to 20:1 are common. Conventional overcurrent relays set for grid-connected faults may not pick up island mode faults. Conversely, relays set for island mode faults may trip on normal load current in grid-connected mode.
4. Characterize the time-varying nature. In island mode, as DERs trip on fault detection, the fault current decreases further. Inverters may limit current to 1.1 pu after 1-2 cycles. Diesel generators provide decaying fault current (subtransient to transient to steady-state) over 0.1-5 seconds. The protection system must be coordinated with these time-varying contributions.
5. Map the bidirectional flow paths. Unlike radial distribution, a microgrid may have loop topology or multiple sources feeding a bus from different directions. Faults can be fed from multiple directions simultaneously. This requires directional protection elements to determine which section is faulted and avoid tripping healthy sections.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
