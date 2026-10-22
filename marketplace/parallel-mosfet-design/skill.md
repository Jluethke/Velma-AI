# Parallel Mosfet Design

Design parallel MOSFET configurations for high-current applications, addressing current sharing during static and dynamic operation, gate drive distribution, and layout symmetry.

## Inputs

- `wbg-assessment`: Technology selection (Si, GaN, or SiC)
- `technology-recommendation`: Selected device and its ratings vs application requirements

## Outputs

- `parallel-configuration`: Number of parallel MOSFETs, gate drive distribution method, and current derating factor for the paralleled group
- `layout-symmetry-requirements`: PCB layout rules for balanced current sharing: matched trace lengths, symmetric gate resistor placement, thermal coupling between devices

## Process

1. Determine the number of parallel devices. The total Rds(on) of N parallel MOSFETs: Rds(on)_total = Rds(on)_single / N. Size N so that conduction loss and thermal dissipation per device are within the single-device rating with derating. Apply a 10-20% current derating to account for mismatch.
2. Static current sharing. Si MOSFETs share current well in steady state because Rds(on) has a positive temperature coefficient: the hotter device has higher resistance and carries less current, creating a self-balancing mechanism. Mismatch from Rds(on) tolerance (typically +/-20% for production parts) causes the worst-case device to carry 1.2x the average current.
3. Dynamic current sharing. During switching transitions, current imbalance is caused by: unequal gate drive impedance (different trace lengths = different L), unequal source inductance (current sense effect), and device parameter spread (Vth, Qg). The device that turns on first carries the full current briefly, causing localized heating.
4. Gate drive for parallel MOSFETs. Option 1: individual gate resistors from a single driver. Each MOSFET gets its own Rg (typically 1-10 ohms) to prevent oscillation between the parallel gates. The driver must source N times the gate charge. Option 2: dedicated driver per MOSFET (for 4+ parallel devices). This isolates the gate loops and gives better control.
5. Layout for parallel MOSFETs. Matched trace lengths from driver to each gate within 10%. Symmetric placement of drain and source connections so each device sees the same commutation loop inductance. Place devices close together on the same heat sink for thermal coupling. Common-source inductance (current sensing): if each MOSFET has its own Kelvin source, connect them individually to the driver return; if not, use a common source connection with minimal inductance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
