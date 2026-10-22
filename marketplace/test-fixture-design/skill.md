# Test Fixture Design

Design the test fixture (bed-of-nails or guided probe) including probe selection, actuation mechanism, and signal routing for reliable contact with production throughput.

## Inputs

- `test-point-list`: Required test point locations and measurement types
- `test-strategy-document`: Test approach defining stimulus and measurement routing requirements

## Outputs

- `fixture-design`: Mechanical design: probe positions from board Gerber data, actuation method, guide pin locations, vacuum hold-down if needed
- `probe-selection`: Probe type for each test point (spring-loaded pogo pin, crown tip for solder pads, chisel tip for vias, Kelvin probe for low-resistance measurements)
- `wiring-diagram`: Signal routing from probes to test instrument interface, with shielding for sensitive analog measurements and separation of power and signal paths

## Process

1. Extract test point coordinates from the board Gerber files. Align to the fixture plate coordinate system using board tooling holes as alignment references. Verify that no probe falls on a component body, solder mask, or silkscreen.
2. Select probe type for each test point. For standard test pads (1mm or larger), use a crown-tip pogo pin (good contact on flat pads). For vias, use a chisel-tip that fits the via annular ring. For fine-pitch pads (less than 0.5mm), use a pointed or serrated tip with higher spring force. For power connections carrying current, use double-ended probes (two springs in parallel) or Kelvin (4-wire) probes.
3. Design the probe plate from the probe layout. Minimum probe-to-probe spacing is limited by the probe housing diameter (typically 0.95mm for miniature probes, 1.27mm for standard). If test points are closer than the minimum probe spacing, use staggered-height probes or a multi-level probe plate.
4. Design the actuation mechanism. For manual fixtures (low volume): lever-actuated with an over-center lock. For semi-automatic (medium volume): pneumatic cylinder press with safety interlocks. For inline automation (high volume): vacuum-actuated fixture with conveyor integration. Include guide pins (2 minimum, 3 preferred) for board alignment with less than 0.1mm positioning error.
5. Route signals from probes to the test instrument interface. Keep analog measurement lines shielded (coaxial routing from probe to measurement instrument) and separate from digital stimulus lines. Route power supply probes with adequate wire gauge for the expected current. Include a bed-of-nails ground connection to the board ground plane for measurement reference.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
