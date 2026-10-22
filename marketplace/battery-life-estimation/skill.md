# Battery Life Estimation

Compute the final battery life estimate from measured current profiles, incorporating temperature effects, aging, and manufacturing variation.

## Inputs

- `current-waveform`: Time-resolved current measurements
- `optimization-targets`: Planned optimizations with expected savings

## Outputs

- `battery-life-estimate`: Expected battery life in days under nominal, best-case, and worst-case conditions, with the assumptions behind each
- `power-management-document`: Complete power design: modes, wake sources, clock gating, DVFS, measured profiles, battery life calculation, and design margins

## Process

1. Calculate average current from the measured profile: integrate the current over one complete duty cycle and divide by the cycle duration. For complex profiles with variable cycle times, use the per-day energy consumption in mWh.
2. Apply temperature derating: battery capacity decreases at cold temperatures. A typical LiPo delivers 80% of rated capacity at 0 degrees C and 60% at -20 degrees C. Use the battery manufacturer's temperature-capacity curve for the expected operating range.
3. Apply aging derating: lithium cells lose capacity over charge cycles. After 500 cycles, expect 80% of initial capacity. If the product's required lifetime includes many charge cycles, use the end-of-life capacity, not the fresh-battery capacity.
4. Apply manufacturing variation: add 10% to the average current to account for component tolerance (regulator quiescent current, leakage through GPIO pins, crystal oscillator current). Use worst-case datasheet values, not typical.
5. Compute three estimates: best-case (nominal current, rated capacity, room temperature), nominal (measured average current + 10% margin, rated capacity derated for mid-life aging), worst-case (max current, min capacity at coldest operating temperature, end-of-life). The worst-case must meet the product requirement. Document all assumptions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
