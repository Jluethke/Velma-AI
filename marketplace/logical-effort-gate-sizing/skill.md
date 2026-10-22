# Logical Effort Gate Sizing

Apply the method of logical effort to size each gate on the critical path for minimum delay, then adjust for power constraints.

## Inputs

- `combinational-delay-budget`: Available delay budget in picoseconds
- `critical-path-stages`: Ordered list of logic gates with logical effort values

## Outputs

- `gate-sizes`: Width multiplier for each gate on the critical path relative to minimum-size
- `estimated-path-delay`: Calculated path delay after sizing in picoseconds

## Process

1. Compute the path effort F = G * H * B, where G is path logical effort, H is path electrical effort, and B is branching effort (product of branching factors at each stage where the signal fans out to other paths).
2. The minimum delay is achieved when each stage has the same stage effort f_hat = F^(1/N), where N is the number of stages. If f_hat is far from 4 (the optimal stage effort for a typical process), consider adding or removing inverter stages.
3. For each gate i, compute its electrical effort h_i = C_out_i / C_in_i = f_hat / g_i. From h_i and the known output load, calculate the required input capacitance, which sets the transistor widths.
4. Convert input capacitance to PMOS and NMOS widths. For NAND gates, the NMOS stack transistors must each be wider by the stack height factor to equalize rise and fall times. For NOR gates, the PMOS stack transistors are wider.
5. Verify the path delay: D = sum of (p_i + f_hat) * tau for each stage, where p_i is parasitic delay and tau is the process-dependent time constant (typically 10-20 ps in modern nodes). Compare to the delay budget.
6. If the delay meets budget with margin, reduce transistor sizes on non-critical stages to save power and area. Apply a 10-20% derating for wire delay not captured in the logical effort model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
