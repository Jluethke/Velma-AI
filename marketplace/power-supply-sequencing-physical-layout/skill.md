# Power Supply Sequencing Physical Layout

Layout power supply circuits for correct sequencing, minimizing coupling between regulators, and ensuring each supply has a clean, isolated ground return.

## Inputs

- `power-tree`: Power supply tree showing all regulators, their inputs, outputs, and sequencing requirements
- `ground-strategy`: Ground partitioning approach
- `component-datasheets`: Regulator datasheets with layout recommendations

## Outputs

- `regulator-placement-plan`: Physical placement of each regulator optimized for thermal management and minimizing output-to-input coupling
- `sequencing-circuit-layout`: Layout of sequencing and enable circuits ensuring signal integrity on enable/power-good nets
- `supply-isolation-verification`: Verification that each supply's input and output decoupling are isolated from other supplies' noise

## Process

1. Place switching regulators away from sensitive analog circuits. The switching node (where the inductor connects to the FET) radiates at the switching frequency and harmonics. Maintain at least 10 mm between a switching regulator's inductor and any sensitive analog component. If closer placement is unavoidable, orient the inductor's magnetic axis perpendicular to the sensitive circuit.
2. For each switching regulator: place the input capacitor, boot capacitor, and output capacitor according to the datasheet's recommended layout. The input capacitor to high-side FET to low-side FET to ground loop must be minimized (this is the hot loop that radiates). The output capacitor placement is less critical for EMI but important for output ripple.
3. Route power-good and enable signals as controlled signals, not afterthoughts. These signals determine sequencing order and timing. A noisy enable signal can cause false startup or glitched sequencing. Route enable signals away from switching nodes and high-di/dt traces. Add a 100 nF bypass capacitor at the enable pin if the trace is longer than 25 mm.
4. Verify supply isolation: each regulator's input decoupling capacitor should sit between the input trace and the regulator, not shared with other regulators. If two regulators share an input rail, each must have its own local input capacitor. The return current from each regulator's output should flow back to its own output capacitor and then to its own input capacitor, not through another regulator's ground path.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
