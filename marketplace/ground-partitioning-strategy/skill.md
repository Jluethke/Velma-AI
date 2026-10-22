# Ground Partitioning Strategy

Resolve the analog/digital ground split vs single ground plane debate using the actual physics of return current flow and current density.

## Inputs

- `circuit-topology`: Schematic showing analog and digital sections, their interconnections, and the ADC/DAC bridge points
- `signal-frequencies`: Analog signal bandwidth and digital clock frequencies
- `noise-budget`: Allowable noise on the analog signals in LSBs or microvolts

## Outputs

- `ground-strategy`: Single ground plane with controlled current flow, or split ground with defined bridge point, with the engineering rationale
- `current-flow-map`: Map showing where digital return currents flow and where analog signals are sensitive, identifying any overlap
- `partition-implementation`: Physical implementation: moat location (if split), bridge point location, stitching via placement

## Process

1. Start with the principle: a solid, unbroken ground plane has the lowest impedance and is the default correct answer. A split ground plane is only correct when digital return currents would flow through the analog measurement area AND you can guarantee that no signal trace crosses the split.
2. Map the digital return current paths: for each digital signal, the return current flows on the nearest ground plane directly under the trace (at high frequency, return current follows the signal trace path, not the shortest DC path). Identify where these return current paths overlap with the analog signal area.
3. If digital return currents do not flow through the analog area (the digital section is physically separated), a single ground plane is correct. Connect analog and digital ground at a single point (the ADC/DAC ground pin). This is not a split; it is a star connection on a single plane.
4. If digital return currents must flow through the analog area (compact layout, cannot separate sections), consider a moat: a slot in the ground plane that forces digital return currents to flow around the analog section. The moat must not be crossed by any trace (signal or power). Connect the two sides of the moat at one point, directly under the ADC/DAC. This is the classic split-ground approach and is only correct when the moat can be kept inviolate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
