# Logic Path Delay Specification

Extract the critical path delay target from system clock frequency, setup time, clock skew, and clock-to-q delay. Compute the available combinational delay budget and identify the logic stages on the critical path.

## Inputs

- `target-clock-frequency`: System clock frequency in GHz
- `clock-uncertainty-budget`: Clock skew, jitter, and OCV derating in picoseconds
- `logic-netlist`: Gate-level netlist or RTL description of the critical path

## Outputs

- `combinational-delay-budget`: Available delay for combinational logic in picoseconds after subtracting setup, clk-to-q, and uncertainty
- `critical-path-stages`: Ordered list of logic gates on the critical path with their logical function

## Process

1. Calculate the clock period from target frequency. Subtract flip-flop setup time (from cell library at worst-case corner), clock-to-q delay, and the full clock uncertainty budget (skew + jitter + OCV derating).
2. The remainder is the combinational delay budget. If negative, the target frequency is infeasible without microarchitectural changes (pipeline insertion or logic restructuring).
3. Trace the critical path through the netlist. List each gate type (NAND2, NOR3, INV, AOI22, etc.) in order. Record the fanout of each gate (number of loads) and the wire load estimate.
4. For each gate, note its logical effort (g) from the standard table: INV=1, NAND2=4/3, NOR2=5/3, NAND3=5/3, NOR3=7/3. For complex gates (AOI, OAI), compute from the transistor stack.
5. Compute the path logical effort G as the product of all individual gate logical efforts. Compute the path electrical effort H as the ratio of the output capacitance of the last stage to the input capacitance of the first stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
