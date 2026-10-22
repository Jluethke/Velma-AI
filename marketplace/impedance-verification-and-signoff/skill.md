# Impedance Verification And Signoff

Verify the routed design meets impedance targets through simulation and prepare the impedance coupon specification for the fabricator.

## Inputs

- `routing-constraints`: Applied constraint set
- `length-matching-report`: Achieved length matching
- `routing-exceptions`: Any violations needing review
- `impedance-sensitivity`: Sensitivity data for manufacturing tolerance assessment

## Outputs

- `impedance-coupon-spec`: Test coupon definition for the fabricator: trace geometries, layer references, and target impedances with tolerances
- `tdr-measurement-plan`: Time domain reflectometry measurement points and expected waveforms for incoming board verification
- `signoff-checklist`: Complete impedance control signoff: targets met, margins documented, coupon spec issued, TDR plan ready

## Process

1. Define impedance test coupons for the fabricator. Each unique impedance class (50 ohm single-ended microstrip, 100 ohm differential stripline, etc.) needs its own coupon on the panel. Specify the exact geometry: trace width, spacing (for diff pairs), length (minimum 6 inches for TDR), and reference layer.
2. Specify the TDR measurement method: the fabricator will measure impedance using TDR per IPC-TM-650 2.5.5.7. Define the measurement window (ignore the first 0.5 ns for connector artifact) and the pass/fail criteria (nominal +/- tolerance from the protocol spec).
3. Review all routing exceptions. For each violation, document the engineering justification: a via stub that is 5 mils long when the budget allows 20 mils is acceptable, document the calculation. A length mismatch of 10 mils when the budget is 29 mils uses 34% of margin, document the remaining margin.
4. Issue the signoff: impedance targets, manufacturing tolerances, coupon spec, TDR measurement plan, and the list of exceptions with justifications. This document goes to the fabricator with the Gerber files.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
