# Bias Point Analysis

Set the DC operating point of every transistor so that all devices are in saturation (or the correct region), the output sits at the target common-mode voltage, and the circuit draws the specified quiescent current.

## Inputs

- `selected-topology`: The amplifier topology with device roles identified
- `performance-spec`: Supply voltage, quiescent current, output common-mode target

## Outputs

- `bias-conditions`: Vgs, Vds, Id for every transistor, plus W/L ratios and operating region confirmation (saturation for gain devices, triode for switches if any)
- `bias-circuit`: The current mirror or resistor biasing network that sets the operating point, with its reference current and mirror ratios

## Process

1. Start from the output node and work back toward the input. Set the output DC voltage to the target common-mode (typically Vdd/2 for maximum symmetric swing). This fixes Vds of the output device and its current source.
2. Use the square-law equation Id = (mu*Cox/2)*(W/L)*(Vgs - Vth)^2 for hand calculation in saturation, but verify against the process gm/Id curve to account for velocity saturation in short-channel devices. The gm/Id methodology picks the inversion level first (weak, moderate, or strong) based on the gain-bandwidth vs power tradeoff, then reads off W/L from lookup tables.
3. For a differential pair, set the tail current to 2*Id_branch. Each branch gets Id_branch = gm_required / (gm/Id_chosen). For example, if the spec needs gm = 1 mA/V and the chosen inversion level gives gm/Id = 15 V^-1, then Id_branch = 67 uA.
4. Design the bias current mirror. A simple current mirror has output resistance ro = VA/Id (Early voltage divided by drain current), which may not be enough for cascode topologies. Use a cascode current mirror if the bias current accuracy must be better than 5 percent across process corners.
5. Verify every device is in saturation: Vds > Vgs - Vth (MOSFET) or Vce > 0.3V (BJT). List any device operating close to the edge of saturation (Vds within 100mV of Vdsat) as a risk that process variation could push into triode.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
