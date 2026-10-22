# Fault Injection Setup

Configure the fault injection platform: select injection method, characterize the target device's fault sensitivity, and define the parameter search space for repeatable fault induction.

## Inputs

- `target-device-description`: Device under test: IC type, package, supply voltage, clock frequency, decapping status
- `fault-objectives`: Fault goals: instruction skip, data corruption, algorithm bypass, key recovery via DFA

## Outputs

- `injection-platform`: Configured fault injection setup: equipment, parameters, trigger synchronization
- `fault-sensitivity-map`: Parameter ranges that produce faults vs. crashes vs. no effect, mapped by timing offset and intensity

## Process

1. Voltage glitching: use a crowbar MOSFET or FPGA-driven voltage glitch generator. Parameters: glitch voltage (drop to X% of Vdd), glitch width (1-100 ns typical), glitch timing relative to trigger (clock cycle precision). Wider glitches affect more instructions but increase crash probability.
2. Clock glitching: insert a short clock period that violates setup time of flip-flops. Parameters: shortened period (fraction of nominal), number of glitch cycles, timing within the target operation. Requires access to external clock input or the ability to override internal oscillator.
3. Laser fault injection (requires decapped device): select wavelength (typically 1064 nm for backside through silicon, 532 nm or 808 nm for frontside on older nodes). Spot size determines spatial resolution (1-5 um for single-register targeting). Power determines single-bit vs multi-bit upset. Map the die to locate cryptographic registers.
4. Electromagnetic fault injection: use a needle probe (sharp tip EM pulse) coupled to the die surface or package. Advantage: non-invasive (no decapping). Disadvantage: lower spatial resolution and less repeatable. Characterize coupling by sweeping probe position over a grid.
5. For all methods: build a parameter sweep that classifies each trial into categories: no effect, correct fault (targeted corruption without crash), crash/reset, and mute (device locks up). Produce a sensitivity map plotting fault success rate vs. timing offset and intensity. Identify the sweet spot with highest correct-fault rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
