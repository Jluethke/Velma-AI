# Power Loop Identification

Identify all critical current loops in the converter topology and calculate the inductance requirement for each, establishing the layout priority hierarchy.

## Inputs

- `converter-schematic`: Complete schematic with all power stage components, gate drivers, and control circuitry
- `target-performance`: Maximum allowable voltage overshoot, EMI class target, and switching frequency that determine how critical loop inductance is

## Outputs

- `critical-loops-ranked`: Each current commutation loop identified and ranked by priority: hot loop (switching transition current), gate drive loop, bootstrap loop, output ripple loop, with target inductance for each
- `loop-inductance-budget`: Maximum allowable loop inductance for each critical loop, calculated from Vspike = L * di/dt with the acceptable overshoot and the switching di/dt

## Process

1. Identify the hot loop. This is the path through which current commutates during switching transitions. For a synchronous buck: high-side MOSFET drain -> input capacitor -> low-side MOSFET source -> low-side drain (= high-side source). During the dead time and switching transition, current changes at rates of 1-10 A/ns. Every nanohenry in this loop produces 1-10V of spike.
2. Calculate the inductance budget. For a 12V-to-1.2V buck at 20A with 400V/us switching and 2V allowable spike: L_max = 2V / (20A / 20ns) = 2nH. This is extremely tight and requires careful layout with the input capacitor immediately adjacent to the MOSFETs.
3. Identify the gate drive loop. From the driver IC output, through the gate resistor, to the MOSFET gate pin, return through the source pin to the driver ground, and through the driver bypass capacitor. Inductance here slows switching and causes gate ringing. Target: less than 5nH.
4. Identify the output loop. From the inductor output, through the output capacitor, to the load and return. This loop carries the AC ripple current at the switching frequency. Inductance here increases output ripple (Vnoise = L_loop * di/dt). Less critical than the hot loop but still important.
5. Rank the loops by priority: hot loop first (highest di/dt, highest overshoot impact), gate loop second (affects switching speed and EMI), output loop third. This ranking determines the component placement priority.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
