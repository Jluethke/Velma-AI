# Constraint Definition

Write timing constraints (SDC format) that fully describe the design intent: clock definitions, input/output delays, false paths, multicycle paths, and clock group relationships.

## Inputs

- `clock-tree-specification`: Clock architecture with all clock sources and domains
- `clock-domain-crossing-map`: All CDC points and their synchronization methods

## Outputs

- `timing-constraints-file`: Complete SDC file with: create_clock for all clocks, create_generated_clock for derived clocks, set_input_delay and set_output_delay for all I/O, set_false_path for asynchronous CDC, set_multicycle_path where applicable
- `constraint-coverage-report`: Percentage of paths constrained: unconstrained paths are potential bugs. Target 100% constraint coverage with explicit false paths or multicycle paths for all exceptions

## Process

1. Define primary clocks. create_clock for every clock input pin, with the exact period and waveform. For a 100MHz clock: create_clock -period 10.0 -waveform {0 5.0} [get_ports clk_100m]. Use the actual period, not a rounded value.
2. Define generated clocks. For PLL outputs: create_generated_clock -source [get_pins pll/clkin] -multiply_by 2 [get_pins pll/clkout_200m]. For divided clocks in logic: create_generated_clock -source [get_pins clk_reg/Q] -divide_by 4 [get_pins clk_div4_reg/Q]. The tool must know the relationship between clocks to analyze inter-domain paths.
3. Set I/O delays. For every input pin: set_input_delay -clock <source_clock> -max <Tco_max + Tpd_max> [get_ports data_in]. For outputs: set_output_delay -clock <dest_clock> -max <Tsetup_dest> [get_ports data_out]. These tell the tool what timing the outside world expects. Unconstrained I/O is a common source of timing failures in the lab.
4. Set false paths for asynchronous CDCs. Signals crossing between unrelated clock domains through proper synchronizers: set_false_path -from [get_clocks clk_a] -to [get_clocks clk_b]. This removes these paths from timing analysis (they are handled by the synchronizer design, not by meeting setup time). Only set false paths where a synchronizer is actually present.
5. Set multicycle paths. For paths that have multiple clock cycles to settle (e.g., a result that is valid every 2 cycles): set_multicycle_path -setup 2 -from [get_pins src_reg/Q] -to [get_pins dst_reg/D]. This relaxes the setup requirement by one cycle. Also set the hold multicycle: set_multicycle_path -hold 1 -from ... -to ... to maintain the correct hold check edge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
