# Control Mode Selection

Choose between voltage mode control, peak current mode control, and average current mode control based on plant characteristics, transient requirements, and topology constraints.

## Inputs

- `control-to-output-tf`: Plant transfer function with pole/zero locations
- `line-to-output-tf`: Audiosusceptibility for feedforward assessment

## Outputs

- `selected-control-mode`: Chosen control mode with rationale: VMC for simplicity when no RHP zero, PCM for fast line rejection and single-pole plant, ACM for PFC or high-current applications
- `modified-plant-tf`: Effective plant transfer function seen by the outer voltage loop after inner current loop closure (for current mode), or same as input for voltage mode

## Process

1. Evaluate voltage mode control (VMC). Advantages: simple, single feedback loop, no current sensor needed. Disadvantages: LC double pole requires Type III compensation, poor inherent line rejection. Best for: buck converters where bandwidth is not critical, or when digital control provides computational compensation.
2. Evaluate peak current mode control (PCM). The inner current loop forces inductor current to follow the control voltage, converting the LC double pole to a single pole at fload = 1/(2*pi*R*C). This simplifies compensation to Type II. PCM provides cycle-by-cycle overcurrent protection. Disadvantage: subharmonic oscillation at D > 0.5 requires slope compensation with Se >= Sf/2 where Sf = (Vout - Vin)*Rs/L (for buck).
3. Evaluate average current mode control (ACM). The inner loop regulates average (not peak) inductor current, eliminating the peak-to-average error. Required for PFC (power factor correction) where the current reference is a rectified sine. Also used for paralleled converters for current sharing. More complex: requires a current error amplifier with its own compensation.
4. For boost-derived topologies with RHP zero: PCM is strongly preferred because the modified plant sees the RHP zero at a higher frequency (due to the current loop pushing it), allowing wider bandwidth. For buck: VMC with Type III is adequate for most applications unless fast transient response (less than 10 switching cycles) is required.
5. Select the control mode and document the modified plant transfer function. For PCM, the voltage loop sees: Gvc(s) = Ri / (Rs * (1 + s/w_p)) where w_p = 1/(R*C) and Ri is the control-to-inductor-current gain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
